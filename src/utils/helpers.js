export function jsonResponse(message_dict, status = 200) {
  return new Response(JSON.stringify(message_dict), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

// Utility function for running SQL queries (single or multiple row)
export function runQuery(db, query, params = [], singleRow = false) {
  return new Promise((resolve, reject) => {
    const callback = (err, result) => {
      if (err) return reject(err);
      resolve(result);
    };

    if (singleRow) {
      db.get(query, params, callback); // Use db.get for a single row
    } else {
      db.all(query, params, callback); // Use db.all for multiple rows
    }
  });
}

export const getPowertrainDescription = (powertrain) => {
  switch (powertrain) {
    case "ICEV":
      return "Internal Combustion Engine Vehicle";
    case "Par HEV SI":
    case "HEV":
      return "Hybrid Electric Vehicle with Spark Ignition";
    case "Par PHEV35":
    case "PHEV35":
      return "Plug-in Hybrid Electric Vehicle with 35-mile range";
    case "Par PHEV50":
    case "PHEV50":
      return "Plug-in Hybrid Electric Vehicle with 50-mile range";
    case "BEV150":
      return "Battery Electric Vehicle with 150-mile range";
    case "BEV200":
      return "Battery Electric Vehicle with 200-mile range";
    case "BEV300":
      return "Battery Electric Vehicle with 300-mile range";
    case "BEV400":
      return "Battery Electric Vehicle with 400-mile range";
    default:
      return "";
  }
};

const VEHICLE_LIFETIME_MILES_SEDAN = 191386; // compact and midsize sedan
const VEHICLE_LIFETIME_MILES_SUV = 211197; // small and midsize suv
const VEHICLE_LIFETIME_MILES_PICKUP = 244179; // pickup

export function getLifetimeMiles(vehicleType) {
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
