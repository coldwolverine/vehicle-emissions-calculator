// pages/api/generate-heatmap.js
"use server";

import sqlite3 from "sqlite3";
import { runQuery } from "@/utils/helpers.js";

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

const VEHICLE_LIFETIME_MILES_SEDAN = 191386; // compact and midsize sedan
const VEHICLE_LIFETIME_MILES_SUV = 211197; // small and midsize suv
const VEHICLE_LIFETIME_MILES_PICKUP = 244179; // pickup

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
  // Load the database path from environment variables
  const dbPath = process.env.DATABASE_PATH;

  try {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database " + err.message);
        throw new Error("Error: failed to open database.");
      }
    });

    const fipsData = await runQuery(
      db,
      'SELECT * FROM temp_data WHERE "State Abr." = ? AND "County name" = ? ',
      [state, county],
      true
    );

    const fipsCode = fipsData ? fipsData["FIPS code"] : null;

    if (fipsCode === null) {
      console.error("Error: FIPS code not found");
      throw new Error("Error: FIPS code not found");
    }

    const phevs = ["Par PHEV35", "Par PHEV50"];
    let phevData = [];

    for (const phev of phevs) {
      const data = await getPhevData(
        db,
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
      db,
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

    // Close the database connection
    db.close();
    // console.log("[API] Closed database connection.");

    const combinedDataDict = combinedData.reduce((acc, item) => {
      const key = `${item.Vehicle_Type}:${item.PowerTrain}`;
      acc[key] = {
        Total_Emissions_per_mile_gCO2e: item.Total_Emissions_per_mile_gCO2e,
        Production_phase_emissions_kgCO2e:
          item.Production_phase_emissions_kgCO2e,
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
    console.error(error);
    throw new Error("Error: failed to retrieve data.");
  }
}

function getLifetimeMiles(vehicleType) {
  // Use fall-through switch statement to group cases
  switch (vehicleType) {
    case "Compact Sedan":
    case "Midsize Sedan":
      return VEHICLE_LIFETIME_MILES_SEDAN;

    case "Small SUV":
    case "Midsize SUV":
      return VEHICLE_LIFETIME_MILES_SUV;

    case "Pickup":
      return VEHICLE_LIFETIME_MILES_PICKUP;

    default:
      return null;
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
  db,
  fipsCode,
  cargoWeight,
  phev,
  uf,
  cityDrivingPercentage
) {
  let phevData = [];
  const cityPhevData = await runQuery(
    db,
    `SELECT Vehicle_Type, Use_Phase_Emissions, Production_phase_emissions_kgCO2e, Utility_Factor
    FROM city_data
    WHERE County = ? AND Cargo = ? AND PowerTrain = ?`,
    [fipsCode, cargoWeight, phev]
  );

  const highwayPhevData = await runQuery(
    db,
    `SELECT Vehicle_Type, Use_Phase_Emissions, Production_phase_emissions_kgCO2e, Utility_Factor
    FROM highway_data
    WHERE County = ? AND Cargo = ? AND PowerTrain = ?`,
    [fipsCode, cargoWeight, phev]
  );

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
  db,
  fipsCode,
  cargoWeight,
  cityDrivingPercentage
) {
  const nonPhevData = await runQuery(
    db,
    `WITH filtered_data AS(
    SELECT
      city.Vehicle_Type,
      city.PowerTrain,
      city.Production_phase_emissions_kgCO2e,
      ((? * city.Use_Phase_Emissions + (1 - ?) * hw.Use_Phase_Emissions)
      + city.Production_phase_emissions_kgCO2e) /
        CASE
          WHEN city.Vehicle_Type = 'Compact Sedan' OR city.Vehicle_Type = 'Midsize Sedan'
            THEN ?
          WHEN city.Vehicle_Type = 'Small SUV' OR city.Vehicle_Type = 'Midsize SUV'
            THEN ?
          WHEN city.Vehicle_Type = 'Pickup'
            THEN ?
          ELSE NULL
        END * 1000000 AS Total_Emissions_per_mile_gCO2e
    FROM
      city_data AS city
    INNER JOIN
      highway_data AS hw
    ON
      city.Vehicle_Type = hw.Vehicle_Type AND city.PowerTrain = hw.PowerTrain
    WHERE
      city.County = ?
      AND city.Cargo = ?
      AND hw.County = ?
      AND hw.Cargo = ?
      AND city.PowerTrain NOT IN ('Par PHEV35', 'Par PHEV50') 
      AND hw.PowerTrain NOT IN ('Par PHEV35', 'Par PHEV50')
    ) 
    SELECT
      Vehicle_Type,
      PowerTrain,
      Total_Emissions_per_mile_gCO2e,
      Production_phase_emissions_kgCO2e
    FROM
      filtered_data;`,
    [
      cityDrivingPercentage,
      cityDrivingPercentage,
      VEHICLE_LIFETIME_MILES_SEDAN,
      VEHICLE_LIFETIME_MILES_SUV,
      VEHICLE_LIFETIME_MILES_PICKUP,
      fipsCode,
      cargoWeight,
      fipsCode,
      cargoWeight,
    ]
  );
  return nonPhevData;
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
