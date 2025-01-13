"use server";

import { Client } from "pg";
import { getLifetimeMiles } from "@/utils/helpers.js";

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
  // Connect to RDS database
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    // Fetch interpolated data in bulk
    const emissionsDifference = await getEmissionsDifference(
      client,
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
      acc[item.county] = {
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

    return {
      emissionsDataByFips,
      maxEmissionsDifference,
      minEmissionsDifference,
    };
  } catch (error) {
    // console.error("Error in getEmissionsData:", error);
    throw new Error("Error: failed to retrieve data.");
  } finally {
    await client.end();
    // console.log("[API] Closed database connection.");
  }
}

async function getEmissionsDifference(
  client,
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
        fc."Vehicle_Type" AS Vehicle_Type,
        fc."PowerTrain" AS PowerTrain,
        fc."Utility_Factor" AS Utility_Factor,
        fc."County" AS County,
        CAST(fc."Production_phase_emissions_kgCO2e" AS FLOAT) AS Production_phase_emissions_kgCO2e,
        ($1 * CAST(fc."Use_Phase_Emissions" AS FLOAT) + (1 - $1) * CAST(fh."Use_Phase_Emissions" AS FLOAT)) AS Use_Phase_Emissions,
        ROW_NUMBER() OVER (PARTITION BY fc."Vehicle_Type", fc."PowerTrain", fc."Utility_Factor", fc."County") AS row_num
    FROM
        "city_data" AS fc
    LEFT JOIN
        "highway_data" AS fh
    ON
        fc."Vehicle_Type" = fh."Vehicle_Type"
        AND fc."PowerTrain" = fh."PowerTrain"
        AND fc."County" = fh."County"
        AND fc."Utility_Factor" = fh."Utility_Factor"
    WHERE
        fc."Cargo" = CAST($2 AS VARCHAR)
        AND fh."Cargo" = CAST($2 AS VARCHAR)
        AND ((fc."Vehicle_Type" = $3 AND fc."PowerTrain" = $4) 
          OR (fc."Vehicle_Type" = $5 AND fc."PowerTrain" = $6))
        AND ((fh."Vehicle_Type" = $3 AND fh."PowerTrain" = $4) 
            OR (fh."Vehicle_Type" = $5 AND fh."PowerTrain" = $6))
        AND fc."Utility_Factor" IN ('0', '1', 'NA')
  ),
  phev_data AS (
    SELECT
      id.*,
      CASE
        WHEN id.Utility_Factor = '1' THEN
          (CASE
            WHEN id.PowerTrain = 'Par PHEV35'
              THEN (CAST($7 AS FLOAT) * id.Use_Phase_Emissions +
              (1 - CAST($7 AS FLOAT)) * LEAD(id.Use_Phase_Emissions) OVER (PARTITION BY id.Vehicle_Type, id.PowerTrain, id.County ORDER BY id.Utility_Factor DESC))
            WHEN id.PowerTrain = 'Par PHEV50'
              THEN (CAST($8 AS FLOAT) * id.Use_Phase_Emissions +
              (1 - CAST($8 AS FLOAT)) * LEAD(id.Use_Phase_Emissions) OVER (PARTITION BY id.Vehicle_Type, id.PowerTrain, id.County ORDER BY id.Utility_Factor DESC))
          END)
        ELSE NULL
      END AS new_use_phase_emissions
    FROM
      interpolated_data AS id
    WHERE
      id.row_num = 1 AND 
      id.PowerTrain IN ('Par PHEV35', 'Par PHEV50')
      AND id.Utility_Factor IN ('0', '1')
  ),
  non_phev_data AS (
    SELECT
      id.*,
      (id.Use_Phase_Emissions + id.Production_phase_emissions_kgCO2e) /
        CASE
          WHEN id.Vehicle_Type IN ('Compact Sedan', 'Midsize Sedan')
            THEN CAST($9 AS FLOAT)
          WHEN id.Vehicle_Type IN ('Small SUV', 'Midsize SUV')
            THEN CAST($10 AS FLOAT)
          WHEN id.Vehicle_Type = 'Pickup'
            THEN CAST($11 AS FLOAT)
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
          WHEN Vehicle_Type IN ('Compact Sedan', 'Midsize Sedan')
            THEN CAST($9 AS FLOAT)
          WHEN Vehicle_Type IN ('Small SUV', 'Midsize SUV')
            THEN CAST($10 AS FLOAT)
          WHEN Vehicle_Type = 'Pickup'
            THEN CAST($11 AS FLOAT)
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
  ),
  emissions_difference AS (
    SELECT
      County,
      MAX(CASE WHEN Vehicle_Type = $3 AND PowerTrain = $4 THEN Total_Emissions_per_mile_gCO2e END) AS first_emissions,
      MAX(CASE WHEN Vehicle_Type = $5 AND PowerTrain = $6 THEN Total_Emissions_per_mile_gCO2e END) AS second_emissions
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
    emissions_difference
  ORDER BY County;
  `;

  const params = [
    cityPercentage,
    cargoWeight,
    firstVehicle,
    firstPowertrain,
    secondVehicle,
    secondPowertrain,
    ufPhev35,
    ufPhev50,
    getLifetimeMiles("Compact Sedan"),
    getLifetimeMiles("Small SUV"),
    getLifetimeMiles("Pickup"),
  ];

  const result = await client.query(query, params);
  return result.rows;
}
