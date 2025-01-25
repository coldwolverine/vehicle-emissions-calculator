"use server";

import sqlite3 from "sqlite3";
import { getLifetimeMiles } from "@/utils/helpers.js";
import { runQuery } from "@/utils/helpers-sqlite.js";

export async function getEmissionsData(
  firstVehicle,
  firstPowertrain,
  secondVehicle,
  secondPowertrain,
  ufPHEV35 = 0.58,
  ufPHEV50 = 0.69,
  cityPercentage = 0.57,
  cargoWeight = 0
) {
  const dbPath = process.env.DATABASE_PATH;

  try {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        throw new Error("Error: failed to open database.");
      }
    });

    // Fetch interpolated data in bulk
    const emissionsDifference = await getEmissionsDifference(
      db,
      cargoWeight,
      firstVehicle,
      firstPowertrain,
      secondVehicle,
      secondPowertrain,
      ufPHEV35,
      ufPHEV50,
      cityPercentage
    );
    // console.log(emissionsDifference);

    let maxEmissionsDifference = -Infinity;
    let minEmissionsDifference = Infinity;

    // Convert emissionsDifference to an object with FIPS codes as keys
    const emissionsDataByFips = emissionsDifference.reduce((acc, item) => {
      acc[item.County] = {
        first_emissions: item.first_emissions,
        second_emissions: item.second_emissions,
        emissions_difference: item.emissions_difference,
      };

      // Update max and min emissions_difference
      if (item.emissions_difference > maxEmissionsDifference) {
        maxEmissionsDifference = item.emissions_difference;
      }
      if (item.emissions_difference < minEmissionsDifference) {
        minEmissionsDifference = item.emissions_difference;
      }

      return acc;
    }, {});
    // console.log("Max Emissions Difference:", maxEmissionsDifference);
    // console.log("Min Emissions Difference:", minEmissionsDifference);
    // console.log(emissionsDataByFips);

    db.close();

    return {
      emissionsDataByFips,
      maxEmissionsDifference,
      minEmissionsDifference,
    };
  } catch (error) {
    console.error("Error in getEmissionsData:", error);
    throw new Error("Error: failed to retrieve data.");
  }
}

async function getEmissionsDifference(
  db,
  cargoWeight,
  firstVehicle,
  firstPowertrain,
  secondVehicle,
  secondPowertrain,
  ufPhev35,
  ufPhev50,
  cityPercentage
) {
  const query = `
  WITH interpolated_data AS (
      SELECT
        fc.Vehicle_Type,
        fc.PowerTrain,
        fc.Utility_Factor,
        fc.County,
        CAST(fc.Production_phase_emissions_kgCO2e AS FLOAT) AS Production_phase_emissions_kgCO2e,
        (? * fc.Use_Phase_Emissions + (1 - ?) * fh.Use_Phase_Emissions) AS Use_Phase_Emissions,
        ROW_NUMBER() OVER (PARTITION BY fc.Vehicle_Type, fc.PowerTrain, fc.Utility_Factor, fc.County) AS row_num
      FROM
        city_data AS fc
      LEFT JOIN
        highway_data AS fh
      ON
        fc.Vehicle_Type = fh.Vehicle_Type
        AND fc.PowerTrain = fh.PowerTrain
        AND fc.County = fh.County
        AND fc.Utility_Factor = fh.Utility_Factor
      WHERE
        fc.Cargo = ? AND
        fh.Cargo = ? AND
        ((fc.Vehicle_Type = ? AND fc.PowerTrain = ?) OR (fc.Vehicle_Type = ? AND fc.PowerTrain = ?)) AND
        ((fh.Vehicle_Type = ? AND fh.PowerTrain = ?) OR (fh.Vehicle_Type = ? AND fh.PowerTrain = ?))
        AND fc.Utility_Factor IN (0, 1, 'NA')
    ),
  phev_data AS (
    SELECT
      id.*,
      CASE
        WHEN id.Utility_Factor = 1 THEN
          (CASE
            WHEN id.PowerTrain = 'Par PHEV35'
              THEN (? * id.Use_Phase_Emissions +
              (1 - ?) * LEAD(id.Use_Phase_Emissions) OVER (PARTITION BY id.Vehicle_Type, id.PowerTrain, id.County ORDER BY id.Utility_Factor DESC))
            WHEN id.PowerTrain = 'Par PHEV50'
              THEN (? * id.Use_Phase_Emissions +
              (1 - ?) * LEAD(id.Use_Phase_Emissions) OVER (PARTITION BY id.Vehicle_Type, id.PowerTrain, id.County ORDER BY id.Utility_Factor DESC))
          END)
        ELSE NULL
      END AS new_use_phase_emissions
    FROM
      interpolated_data AS id
    WHERE
      id.row_num = 1 AND 
      id.PowerTrain IN ('Par PHEV35', 'Par PHEV50')
      AND id.Utility_Factor IN (0, 1)
  ),
  non_phev_data AS (
    SELECT
      id.*,
      (id.Use_Phase_Emissions + id.Production_phase_emissions_kgCO2e) /
        CASE
          WHEN id.Vehicle_Type = 'Compact Sedan' OR id.Vehicle_Type = 'Midsize Sedan'
            THEN ?
          WHEN id.Vehicle_Type = 'Small SUV' OR id.Vehicle_Type = 'Midsize SUV'
            THEN ?
          WHEN id.Vehicle_Type = 'Pickup'
            THEN ?
          ELSE NULL
        END * 1000000 AS Total_Emissions_per_mile_gCO2e
    FROM
      interpolated_data as id
    WHERE
      id.PowerTrain NOT IN ('Par PHEV35', 'Par PHEV50')
  ),
  combined_data AS (
    SELECT
      Vehicle_Type,
      PowerTrain,
      County,
      (new_use_phase_emissions + Production_phase_emissions_kgCO2e) /
        CASE
          WHEN Vehicle_Type = 'Compact Sedan' OR Vehicle_Type = 'Midsize Sedan'
            THEN ?
          WHEN Vehicle_Type = 'Small SUV' OR Vehicle_Type = 'Midsize SUV'
            THEN ?
          WHEN Vehicle_Type = 'Pickup'
            THEN ?
          ELSE NULL
        END * 1000000 AS Total_Emissions_per_mile_gCO2e
    FROM phev_data
    WHERE new_use_phase_emissions IS NOT NULL
    UNION ALL
    SELECT
      Vehicle_Type,
      PowerTrain,
      County,
      Total_Emissions_per_mile_gCO2e
    FROM non_phev_data
    ORDER BY County
  ),
  emissions_difference AS (
    SELECT
      County,
      MAX(CASE WHEN Vehicle_Type = ? AND PowerTrain = ? THEN Total_Emissions_per_mile_gCO2e END) AS first_emissions,
      MAX(CASE WHEN Vehicle_Type = ? AND PowerTrain = ? THEN Total_Emissions_per_mile_gCO2e END) AS second_emissions
    FROM
      combined_data
    GROUP BY
      County
  )
  SELECT
    County,
    ROUND(first_emissions) AS first_emissions,
    ROUND(second_emissions) AS second_emissions,
    ROUND(first_emissions - second_emissions) AS emissions_difference
  FROM
    emissions_difference;
  `;

  const params = [
    cityPercentage,
    cityPercentage,
    cargoWeight,
    cargoWeight,
    firstVehicle,
    firstPowertrain,
    secondVehicle,
    secondPowertrain,
    firstVehicle,
    firstPowertrain,
    secondVehicle,
    secondPowertrain,
    ufPhev35,
    ufPhev35,
    ufPhev50,
    ufPhev50,
    getLifetimeMiles("Compact Sedan"),
    getLifetimeMiles("Small SUV"),
    getLifetimeMiles("Pickup"),
    getLifetimeMiles("Compact Sedan"),
    getLifetimeMiles("Small SUV"),
    getLifetimeMiles("Pickup"),
    firstVehicle,
    firstPowertrain,
    secondVehicle,
    secondPowertrain,
    ,
  ];

  return await runQuery(db, query, params);
}
