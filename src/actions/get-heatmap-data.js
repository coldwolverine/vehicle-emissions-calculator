// pages/api/generate-heatmap.js
"use server";

import { Client } from "pg";
import { getLifetimeMiles } from "@/utils/helpers.js";

const VEHICLES = [
  "Pickup",
  "Midsize SUV",
  "Small SUV",
  "Midsize Sedan",
  "Compact Sedan",
];

const POWERTRAINS = [
  "ICEV",
  "Par HEV SI",
  "Par PHEV35",
  "Par PHEV50",
  "BEV150",
  "BEV200",
  "BEV300",
  "BEV400",
];

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

    const fipsData = await client.query(
      'SELECT * FROM temp_data WHERE "State Abr." = $1 AND "County name" = $2 ',
      [state, county]
    );

    const fipsCode = fipsData.rows ? fipsData.rows[0]["FIPS code"] : null;

    if (fipsCode === null) {
      console.error("Error: FIPS code not found");
      throw new Error("Error: FIPS code not found");
    }

    const phevs = ["Par PHEV35", "Par PHEV50"];
    let phevData = [];

    for (const phev of phevs) {
      const data = await getPhevData(
        client,
        fipsCode,
        cargoWeight,
        phev,
        phev === "Par PHEV35" ? ufPHEV35 : ufPHEV50,
        cityDrivingPercentage
      );
      phevData = [...phevData, ...data];
      // console.log(`[API] Retreived ${phev} data.`);
    }

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

    const combinedDataDict = combinedData.reduce((acc, item) => {
      const key = `${item.Vehicle_Type}:${item.PowerTrain}`;
      acc[key] = {
        Total_Emissions_per_mile_gCO2e: item.Total_Emissions_per_mile_gCO2e,
        Production_phase_emissions_kgCO2e:
          +item.Production_phase_emissions_kgCO2e,
        // Add other properties if needed
      };
      return acc;
    }, {});
    // console.log(combinedDataDict);

    // Return the heatmap data
    return {
      percentage_change: percentageChange,
      vehicle_data: combinedDataDict,
    };
  } catch (error) {
    // console.error(error);
    throw new Error("Error: failed to retrieve data.");
  } finally {
    await client.end();
    // console.log("[API] Closed database connection.");
  }
}

function interpolateEmissions(
  cityEmissions,
  highwayEmissions,
  cityDrivingPercentage
) {
  return (
    cityDrivingPercentage * cityEmissions +
    (1 - cityDrivingPercentage) * highwayEmissions
  );
}

function calculatePhevEmissions(csEmissions, cdEmissions, uf) {
  return uf * cdEmissions + (1 - uf) * csEmissions;
}

// phev = "Par PHEV35", "Par PHEV50"
// uf = ufPHEV35 or ufPHEV50
async function getPhevData(
  client,
  fipsCode,
  cargoWeight,
  phev,
  uf,
  cityDrivingPercentage
) {
  let phevData = [];
  const result = await client.query(
    `SELECT
      "Vehicle_Type" , CAST("Use_Phase_Emissions" AS FLOAT),
      CAST("Production_phase_emissions_kgCO2e" AS FLOAT), "Utility_Factor"
    FROM city_data
    WHERE "County" = CAST($1 AS VARCHAR) AND "Cargo" = CAST($2 AS VARCHAR) AND "PowerTrain" = $3`,
    [fipsCode, cargoWeight, phev]
  );
  const cityPhevData = result.rows;
  // console.log(cityPhevData);

  const result2 = await client.query(
    `SELECT
      "Vehicle_Type", CAST("Use_Phase_Emissions" AS FLOAT),
      CAST("Production_phase_emissions_kgCO2e" AS FLOAT), "Utility_Factor"
    FROM highway_data
    WHERE "County" = CAST($1 AS VARCHAR) AND "Cargo" = CAST($2 AS VARCHAR) AND "PowerTrain" = $3`,
    [fipsCode, cargoWeight, phev]
  );
  const highwayPhevData = result2.rows;

  for (const vehicle of VEHICLES) {
    // Process city data
    // + converts string to int
    const cityCd = +cityPhevData.find(
      (v) => v.Vehicle_Type === vehicle && v.Utility_Factor === "1"
    )?.Use_Phase_Emissions;
    const cityCs = +cityPhevData.find(
      (v) => v.Vehicle_Type === vehicle && v.Utility_Factor === "0"
    )?.Use_Phase_Emissions;

    // Process highway data
    const highwayCd = +highwayPhevData.find(
      (v) => v.Vehicle_Type === vehicle && v.Utility_Factor === "1"
    )?.Use_Phase_Emissions;
    const highwayCs = +highwayPhevData.find(
      (v) => v.Vehicle_Type === vehicle && v.Utility_Factor === "0"
    )?.Use_Phase_Emissions;

    if (cityCd && cityCs && highwayCd && highwayCs) {
      // Apply UF interpolation separately for city and highway
      const cityUsePhase = calculatePhevEmissions(cityCs, cityCd, uf);
      const highwayUsePhase = calculatePhevEmissions(highwayCs, highwayCd, uf);

      // Interpolate between city and highway
      const finalUsePhase = interpolateEmissions(
        cityUsePhase,
        highwayUsePhase,
        cityDrivingPercentage
      );

      // Get production phase emissions
      const productionEmissions = +cityPhevData.find(
        (v) => v.Vehicle_Type === vehicle && v.Utility_Factor === "1"
      )?.Production_phase_emissions_kgCO2e;

      // Get lifetime miles
      const lifetimeMiles = getLifetimeMiles(vehicle);

      // Calculate final emissions in gCO2e/mile
      const totalEmissions =
        ((finalUsePhase + productionEmissions) / lifetimeMiles) * 1000000;
      // Store the result
      phevData.push({
        Vehicle_Type: vehicle,
        PowerTrain: phev,
        Total_Emissions_per_mile_gCO2e: totalEmissions,
        Production_phase_emissions_kgCO2e: productionEmissions,
      });
    }
  }
  return phevData;
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
