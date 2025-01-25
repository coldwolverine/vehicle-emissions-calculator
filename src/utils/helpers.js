export const VEHICLE_DB_NAMES = [
  "Pickup",
  "Midsize SUV",
  "Small SUV",
  "Midsize Sedan",
  "Compact Sedan",
];

export const POWERTRAIN_DB_NAMES = [
  "ICEV",
  "Par HEV SI",
  "Par PHEV35",
  "Par PHEV50",
  "BEV150",
  "BEV200",
  "BEV300",
  "BEV400",
];

export const VEHICLE_DISPLAY_NAMES = [
  "Pickup",
  "Midsize SUV",
  "Crossover", // Small SUV
  "Midsize Sedan",
  "Compact Sedan",
];

export const POWERTRAIN_DISPLAY_NAMES = [
  "ICEV",
  "HEV", // Par HEV SI
  "PHEV35", // Par PHEV35
  "PHEV50", // Par PHEV50
  "BEV150",
  "BEV200",
  "BEV300",
  "BEV400",
];

export const VEHICLE_DISPLAY_TO_DB = {
  Pickup: "Pickup",
  "Midsize SUV": "Midsize SUV",
  Crossover: "Small SUV",
  "Midsize Sedan": "Midsize Sedan",
  "Compact Sedan": "Compact Sedan",
};

export const POWERTRAIN_DISPLAY_TO_DB = {
  ICEV: "ICEV",
  HEV: "Par HEV SI",
  PHEV35: "Par PHEV35",
  PHEV50: "Par PHEV50",
  BEV150: "BEV150",
  BEV200: "BEV200",
  BEV300: "BEV300",
  BEV400: "BEV400",
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

    case "Crossover":
    case "Small SUV":
    case "Midsize SUV":
      return VEHICLE_LIFETIME_MILES_SUV;

    case "Pickup":
      return VEHICLE_LIFETIME_MILES_PICKUP;

    default:
      return null;
  }
}

export const getPowertrainDescription = (powertrain) => {
  switch (powertrain) {
    case "ICEV":
      return "Internal Combustion Engine Vehicle";
    case "Par HEV SI":
    case "HEV":
      return "Hybrid Electric Vehicle";
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
