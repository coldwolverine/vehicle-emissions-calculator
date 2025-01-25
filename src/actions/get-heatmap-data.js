// pages/api/generate-heatmap.js
"use server";

import { Client } from "pg";
import {
  VEHICLE_DISPLAY_TO_DB,
  VEHICLE_DB_NAMES,
  POWERTRAIN_DISPLAY_TO_DB,
  POWERTRAIN_DB_NAMES,
  getLifetimeMiles,
} from "@/utils/helpers.js";

const VEHICLES = VEHICLE_DB_NAMES;
const POWERTRAINS = POWERTRAIN_DB_NAMES;

export async function getHeatmapData(
  state,
  county,
  firstVehicle,
  firstPowertrain,
  ufPHEV35,
  ufPHEV50,
  cityDrivingPercentage,
  cargoWeight = 0
) {
  // Convert firstVehicle and firstPowertrain to their database names
  firstVehicle = VEHICLE_DISPLAY_TO_DB[firstVehicle];
  firstPowertrain = POWERTRAIN_DISPLAY_TO_DB[firstPowertrain];

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
    // const client = await pool.connect();

    const fipsData = await client.query(
      'SELECT * FROM temp_data WHERE "State Abr." = $1 AND "County name" = $2 ',
      [state, county]
    );

    const fipsCode = fipsData.rows ? fipsData.rows[0]["FIPS code"] : null;

    if (fipsCode === null) {
      console.error("Error: FIPS code not found");
      throw new Error("Error: FIPS code not found");
    }

    const phevData = await getPhevData(
      client,
      fipsCode,
      cargoWeight,
      ufPHEV35,
      ufPHEV50,
      cityDrivingPercentage
    );

    const nonPhevData = await getNonPhevData(
      client,
      fipsCode,
      cargoWeight,
      cityDrivingPercentage
    );
    // console.log("[API] Retreived non-PHEV data");

    const combinedData = [...nonPhevData, ...phevData];
    // console.log(combinedData);

    const percentageChange = getPercentageChange(
      combinedData,
      firstVehicle,
      firstPowertrain
    );
    // console.log("[API] Computed percentage change data ");
    // console.log(percentageChange);

    let leastEmissionsVehicle = null;
    let leastTotalEmissionsPerMile = Infinity;

    let mostEmissionsVehicle = null;
    let mostTotalEmissionsPerMile = 0;

    const combinedDataDict = combinedData.reduce((acc, item) => {
      const key = `${item.Vehicle_Type}:${item.PowerTrain}`;

      // set the least emissions vehicle
      if (item.Total_Emissions_per_mile_gCO2e < leastTotalEmissionsPerMile) {
        leastEmissionsVehicle = `${item.Vehicle_Type} ${item.PowerTrain}`;
        leastTotalEmissionsPerMile = item.Total_Emissions_per_mile_gCO2e;
      }

      // set the most emissions vehicle
      if (item.Total_Emissions_per_mile_gCO2e > mostTotalEmissionsPerMile) {
        mostEmissionsVehicle = `${item.Vehicle_Type} ${item.PowerTrain}`;
        mostTotalEmissionsPerMile = item.Total_Emissions_per_mile_gCO2e;
      }

      // Add the vehicle data to the dictionary
      acc[key] = {
        Total_Emissions_per_mile_gCO2e: item.Total_Emissions_per_mile_gCO2e,
        Production_phase_emissions_kgCO2e:
          +item.Production_phase_emissions_kgCO2e,
      };
      return acc;
    }, {});

    // Return the heatmap data
    return {
      percentage_change: percentageChange,
      vehicle_data: combinedDataDict,
      least_emissions_vehicle: leastEmissionsVehicle,
      least_total_emissions_per_mile: leastTotalEmissionsPerMile,
      highest_total_emissions_per_mile: mostTotalEmissionsPerMile,
      highest_emissions_vehicle: mostEmissionsVehicle,
    };
  } catch {
    // console.error(error);
    throw new Error("Error: failed to retrieve data.");
  } finally {
    await client.end();
    // console.log("[API] Closed database connection.");
  }
}

async function getPhevData(
  client,
  fipsCode,
  cargoWeight,
  ufPhev35,
  ufPhev50,
  cityDrivingPercentage
) {
  const query = `
    WITH combined_data AS (
    SELECT
        fc."Vehicle_Type",
        fc."PowerTrain",
        fc."Utility_Factor",
        fc."County",
        CAST(fc."Production_phase_emissions_kgCO2e" AS FLOAT) "City_Production_phase_emissions_kgCO2e",
        CAST(fc."Use_Phase_Emissions" AS FLOAT) AS "City_Use_Phase_Emissions",
        CAST(fh."Production_phase_emissions_kgCO2e" AS FLOAT) AS "Highway_Production_phase_emissions_kgCO2e",
        CAST(fh."Use_Phase_Emissions" AS FLOAT) AS "Highway_Use_Phase_Emissions",
        ROW_NUMBER() OVER (PARTITION BY fc."Vehicle_Type", fc."PowerTrain", fc."Utility_Factor", fc."County") AS row_num
    FROM
        "city_data" AS fc
    LEFT JOIN
        "highway_data" AS fh
    ON
        fc."Vehicle_Type" = fh."Vehicle_Type"
        AND fc."PowerTrain" = fh."PowerTrain"
        AND fc."County" = fh."County"
        AND fc."Cargo" = fh."Cargo"
        AND fc."Utility_Factor" = fh."Utility_Factor"
    WHERE 
        fc."County" = CAST($1 AS VARCHAR)
        AND fc."Cargo" = CAST($2 AS VARCHAR)
        AND fc."PowerTrain" IN ('Par PHEV35', 'Par PHEV50')
        AND fc."Utility_Factor" IN ('0', '1')
  ),
  phev_data AS (
    SELECT
      id.*,
      CASE
        WHEN id."Utility_Factor" = '1' THEN
          (CASE
            WHEN id."PowerTrain" = 'Par PHEV35'
              THEN (CAST($3 AS FLOAT) * id."City_Use_Phase_Emissions" +
              (1 - CAST($3 AS FLOAT)) * LEAD(id."City_Use_Phase_Emissions") OVER (PARTITION BY id."Vehicle_Type", id."PowerTrain", id."County" ORDER BY id."Utility_Factor" DESC))
            WHEN id."PowerTrain" = 'Par PHEV50'
              THEN (CAST($4 AS FLOAT) * id."City_Use_Phase_Emissions" +
              (1 - CAST($4 AS FLOAT)) * LEAD(id."City_Use_Phase_Emissions") OVER (PARTITION BY id."Vehicle_Type", id."PowerTrain", id."County" ORDER BY id."Utility_Factor" DESC))
          END)
        ELSE NULL
      END AS new_city_use_phase_emissions,
      CASE
        WHEN id."Utility_Factor" = '1' THEN
          (CASE
            WHEN id."PowerTrain" = 'Par PHEV35'
              THEN (CAST($3 AS FLOAT) * id."Highway_Use_Phase_Emissions" +
              (1 - CAST($3 AS FLOAT)) * LEAD(id."Highway_Use_Phase_Emissions") OVER (PARTITION BY id."Vehicle_Type", id."PowerTrain", id."County" ORDER BY id."Utility_Factor" DESC))
            WHEN id."PowerTrain" = 'Par PHEV50'
              THEN (CAST($4 AS FLOAT) * id."Highway_Use_Phase_Emissions" +
              (1 - CAST($4 AS FLOAT)) * LEAD(id."Highway_Use_Phase_Emissions") OVER (PARTITION BY id."Vehicle_Type", id."PowerTrain", id."County" ORDER BY id."Utility_Factor" DESC))
          END)
        ELSE NULL
      END AS new_highway_use_phase_emissions
    FROM
      combined_data AS id
    WHERE
      id.row_num = 1 AND 
      id."PowerTrain" IN ('Par PHEV35', 'Par PHEV50')
      AND id."Utility_Factor" IN ('0', '1')
  ),
  interpolated_data AS (
    SELECT
      *,
      (CAST ($5 AS FLOAT) * new_city_use_phase_emissions + (1 - CAST($5 AS FLOAT)) * new_highway_use_phase_emissions) AS new_use_phase_emissions
    FROM phev_data
    WHERE
      new_city_use_phase_emissions IS NOT NULL
      OR new_highway_use_phase_emissions IS NOT NULL
  )
  SELECT
      "Vehicle_Type",
      "PowerTrain",
      "City_Production_phase_emissions_kgCO2e" as "Production_phase_emissions_kgCO2e",
      (new_use_phase_emissions + "City_Production_phase_emissions_kgCO2e") /
        CASE
          WHEN "Vehicle_Type" IN ('Compact Sedan', 'Midsize Sedan')
            THEN CAST($6 AS FLOAT)
          WHEN "Vehicle_Type" IN ('Small SUV', 'Midsize SUV')
            THEN CAST($7 AS FLOAT)
          WHEN "Vehicle_Type" = 'Pickup'
            THEN CAST($8 AS FLOAT)
          ELSE NULL
        END * 1000000 AS "Total_Emissions_per_mile_gCO2e"
    FROM interpolated_data;
  `;

  const phevData = await client.query(query, [
    fipsCode,
    cargoWeight,
    ufPhev35,
    ufPhev50,
    cityDrivingPercentage,
    getLifetimeMiles("Compact Sedan"),
    getLifetimeMiles("Small SUV"),
    getLifetimeMiles("Pickup"),
  ]);
  return phevData.rows;
}

async function getNonPhevData(
  client,
  fipsCode,
  cargoWeight,
  cityDrivingPercentage
) {
  const nonPhevData = await client.query(
    `
    WITH filtered_data AS (
    SELECT
      city."Vehicle_Type",
      city."PowerTrain",
      city."Production_phase_emissions_kgCO2e",
      (
        (CAST($1 AS FLOAT) * CAST(city."Use_Phase_Emissions" AS FLOAT) + (1 - CAST($1 AS FLOAT)) * CAST(hw."Use_Phase_Emissions" AS FLOAT))
        + CAST(city."Production_phase_emissions_kgCO2e" AS FLOAT)
      ) / CASE
          WHEN city."Vehicle_Type" IN ('Compact Sedan', 'Midsize Sedan')
            THEN CAST($2 AS FLOAT)
          WHEN city."Vehicle_Type" IN ('Small SUV', 'Midsize SUV')
            THEN CAST($3 AS FLOAT)
          WHEN city."Vehicle_Type" = 'Pickup'
            THEN CAST($4 AS FLOAT)
          ELSE NULL
        END * 1000000 AS "Total_Emissions_per_mile_gCO2e"
    FROM
      city_data AS city
    INNER JOIN
      highway_data AS hw
    ON
      city."Vehicle_Type" = hw."Vehicle_Type"
      AND city."PowerTrain" = hw."PowerTrain"
    WHERE
      city."County" = CAST($5 AS VARCHAR)
      AND city."Cargo" = CAST($6 AS VARCHAR)
      AND hw."County" = CAST($5 AS VARCHAR)
      AND hw."Cargo" = CAST($6 AS VARCHAR)
      AND city."PowerTrain" NOT IN ('Par PHEV35', 'Par PHEV50') 
      AND hw."PowerTrain" NOT IN ('Par PHEV35', 'Par PHEV50')
    ) 
    SELECT
      "Vehicle_Type",
      "PowerTrain",
      "Total_Emissions_per_mile_gCO2e",
      CAST("Production_phase_emissions_kgCO2e" AS FLOAT)
    FROM
      filtered_data;`,
    [
      cityDrivingPercentage,
      getLifetimeMiles("Compact Sedan"),
      getLifetimeMiles("Small SUV"),
      getLifetimeMiles("Pickup"),
      fipsCode,
      cargoWeight,
    ]
  );
  return nonPhevData.rows;
}

function getPercentageChange(combinedData, firstVehicle, firstPowertrain) {
  // Step 1: Create matrix by pivoting data based on PowerTrain and Vehicle_Type
  const matrixData = {};

  combinedData.forEach((row) => {
    const { Vehicle_Type, PowerTrain, Total_Emissions_per_mile_gCO2e } = row;
    if (!matrixData[Vehicle_Type]) {
      matrixData[Vehicle_Type] = {};
    }
    matrixData[Vehicle_Type][PowerTrain] = Total_Emissions_per_mile_gCO2e;
  });

  // Step 2: Arrange the matrix according to specific vehicle types and powertrains
  const orderedMatrixData = VEHICLES.map((vehicle) => {
    const row = {};
    POWERTRAINS.forEach((powertrain) => {
      row[powertrain] = matrixData[vehicle]?.[powertrain] || null;
    });
    return row;
  });

  // Convert ordered data to a 2D array format if needed
  const matrixArray = orderedMatrixData.map((row) =>
    POWERTRAINS.map((powertrain) => row[powertrain])
  );

  // Step 3: Replace undefined (missing values) with NaN
  const sanitizedMatrix = matrixArray.map((row) =>
    row.map((value) => (value === null ? NaN : value))
  );

  // Step 4: Calculate percentage change based on the first value
  const firstValue =
    sanitizedMatrix[VEHICLES.indexOf(firstVehicle)][
      POWERTRAINS.indexOf(firstPowertrain)
    ];

  const percentageChange = sanitizedMatrix.map((row) =>
    row.map((value) => Number(Math.round((value / firstValue) * 100)))
  );

  return percentageChange;
}
