"use client";
import { useState } from "react";
import { HeatMapGrid } from "react-grid-heatmap";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  VEHICLE_DISPLAY_NAMES,
  POWERTRAIN_DISPLAY_NAMES,
  VEHICLE_DISPLAY_TO_DB,
  POWERTRAIN_DISPLAY_TO_DB,
  getLifetimeMiles,
} from "@/utils/helpers.js";
import PowertrainTypesLegend from "@/components/powertrain-legend";
import HeatmapColorLegend from "@/components/heatmap-legend";

const VEHICLES = VEHICLE_DISPLAY_NAMES;
const POWERTRAINS = POWERTRAIN_DISPLAY_NAMES;

// IMPORTANT: Axes are inverted in the heatmap functions
// but the labels are in the correct order

const EmissionsHeatmap = ({
  data,
  firstVehicle,
  firstPowertrain,
  secondVehicle,
  secondPowertrain,
  county,
  state,
  isLoading,
}) => {
  const [hoveredCell, setHoveredCell] = useState({ row: null, col: null });

  // Function to get total emissions per mile
  const getTotalEmissionsPerMile = (vehicle, powertrain) => {
    if (Object.keys(data).length === 0) {
      return 0; // Return 0 if data is undefined
    }
    const key = `${VEHICLE_DISPLAY_TO_DB[vehicle]}:${POWERTRAIN_DISPLAY_TO_DB[powertrain]}`;
    return (
      Math.round(data.vehicle_data[key]?.Total_Emissions_per_mile_gCO2e) || 0
    );
  };

  // Function to get total emissions
  const getTotalEmissions = (vehicle, powertrain) => {
    const totalEmissionsPerMile = getTotalEmissionsPerMile(vehicle, powertrain);
    const lifetimeMiles = getLifetimeMiles(vehicle);
    return ((totalEmissionsPerMile * lifetimeMiles) / 1_000_000).toFixed(0);
  };

  const getVehicleCycleEmissions = (vehicle, powertrain) => {
    if (Object.keys(data).length === 0) {
      return 0; // Return 0 if data is undefined
    }
    const key = `${VEHICLE_DISPLAY_TO_DB[vehicle]}:${POWERTRAIN_DISPLAY_TO_DB[powertrain]}`;
    return (
      Math.round(data.vehicle_data[key]?.Production_phase_emissions_kgCO2e) || 0
    );
  };

  const customCellRender = (x, y, value) => {
    const vehicle = VEHICLES[x];
    const powertrain = POWERTRAINS[y];
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onMouseEnter={() => setHoveredCell({ row: x, col: y })}
                onMouseLeave={() => setHoveredCell({ row: null, col: null })}
                className="leading-[22px] h-full w-full text-center flex items-center justify-center flex-col"
              >
                {getTotalEmissionsPerMile(vehicle, powertrain)}
                <br />
                {value}%
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="w-[340px] break-words"
            >
              <div className="flex">
                <div>
                  {vehicle}, {powertrain}
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                Total Lifecycle Emissions per mile
                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                  {getTotalEmissionsPerMile(vehicle, powertrain)}
                  <span className="ml-1 font-normal text-muted-foreground">
                    gCO<sub>2</sub>e
                  </span>
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                Total Lifecycle Emissions
                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                  {getTotalEmissions(vehicle, powertrain)}
                  <span className="ml-1 font-normal text-muted-foreground">
                    MTCO<sub>2</sub>e
                  </span>
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                Emissions from Vehicle Cycle
                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                  {getVehicleCycleEmissions(vehicle, powertrain)}
                  <span className="ml-1 font-normal text-muted-foreground">
                    MTCO<sub>2</sub>e
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <Card className="max-w-screen-xl mx-auto bg-slate-50">
        <CardHeader className="space-y-0 text-center">
          <CardTitle className="text-lg">
            Lifecycle Emissions across Vehicle Classes and Powertrains (gCO
            <sub>2</sub>e/mile)
          </CardTitle>
          <CardDescription className="text-base">
            % of Emissions Compared to{" "}
            <span className="font-semibold">{firstVehicle}</span> with{" "}
            <span className="font-semibold">{firstPowertrain}</span> in{" "}
            <span className="font-semibold">
              {county}, {state}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-10 pr-14">
          {isLoading ? ( // Show loading spinner if data is loading
            <div className="flex flex-col items-center justify-center w-[850px] h-[538px] z-[10000]">
              <Spinner size="md" />
              <p>Loading Heatmap...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-[850px] h-full ">
              <HeatMapGrid
                data={data.percentage_change}
                xLabels={POWERTRAINS}
                yLabels={VEHICLES}
                xLabelsPos="bottom"
                cellHeight="6rem"
                square={true}
                yLabelsStyle={() => ({
                  fontSize: "0.9rem",
                  textAlign: "right",
                  lineHeight: "1",
                  marginRight: "1rem",
                  color: "#36363c",
                  marginTop: "2.3rem",
                  marginBottom: "2.3rem",
                })}
                xLabelsStyle={() => ({
                  fontSize: "0.9rem",
                  paddingTop: "0.6rem",
                  color: "#36363c",
                  // color: "#52525b",
                })}
                cellRender={customCellRender}
                cellStyle={(x, y, ratio) => {
                  const isTargetCell =
                    (POWERTRAINS[y] === firstPowertrain &&
                      VEHICLES[x] === firstVehicle) ||
                    (POWERTRAINS[y] === secondPowertrain &&
                      VEHICLES[x] === secondVehicle);
                  const isHoveredCell =
                    y === hoveredCell.col && x === hoveredCell.row;
                  // Map `ratio` to an HSL color from green (120) to red (0)
                  const hue = Math.pow(1 - ratio, 1.7) * 120;
                  return {
                    backgroundColor: `hsl(${hue}, 70%, 65%)`, // HSL-> hue, saturation, lightness
                    fontSize: "1rem",
                    color: `rgba(0, 0, 0, 0.8)`,
                    letterSpacing: "0.4px",
                    border: isTargetCell
                      ? "3px solid #444"
                      : isHoveredCell
                      ? "2px solid #444"
                      : "0.5px solid #fff",
                    borderWidth: isTargetCell
                      ? "3px"
                      : isHoveredCell
                      ? "2px"
                      : "0.5px",
                    boxShadow: isHoveredCell
                      ? "0 4px 8px rgba(0, 0, 0, 0.2)"
                      : "none",
                    transform: isHoveredCell ? "scale(1.05)" : "none",
                    transition: isHoveredCell
                      ? "transform 0.5s, box-shadow 0.5s, border 0.5s"
                      : "none",
                  };
                }}
              />
            </div>
          )}
        </CardContent>
        {Object.keys(data).length > 0 ? (
          <CardFooter className="flex-col items-center gap-2 text-base">
            <>
              <div className="gap-2 font-medium leading-none">
                {data.least_emissions_vehicle} is the most efficient vehicle
              </div>
              <div className="leading-none text-muted-foreground">
                Produces the lowest lifeycle emissions per mile of{" "}
                {data.least_total_emissions_per_mile.toFixed(0)} gC0
                <sub>2</sub>e/mile
              </div>
            </>
          </CardFooter>
        ) : (
          ""
        )}
      </Card>
      <div className="flex items-start justify-between w-[946px] mt-9">
        <PowertrainTypesLegend className="max-w-[600px]" />
        <HeatmapColorLegend
          lowestTotalEmissionsPerMile={data.least_total_emissions_per_mile}
          highestTotalEmissionsPerMile={data.highest_total_emissions_per_mile}
          leastEmissionsVehicle={data.least_emissions_vehicle}
          highestEmissionsVehicle={data.highest_emissions_vehicle}
        />
      </div>

      <Card className="max-w-[946px] mt-9 bg-slate-50 bg-opacity-40">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Guidance for interpretation of results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          The heatmap results show lifecycle greenhouse gas emissions (g CO
          <sub>2</sub>e/mile) for each vehicle option, including all emissions
          from manufacturing through disposal. Percentages compare emissions of
          all vehicles against your selected baseline vehicle. <br />
          <br />
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-normal">
            Percentage = (Emissions of compared vehicle / Emissions of first
            vehicle)
          </code>
          <br />
          <br />
          Should compare the emissions per mile given the differences in mileage
          across classes.
        </CardContent>
      </Card>
      {/* <Accordion type="single" defaultValue="item-1" className="w-[768px] p-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            Guidance for interpretation of results
          </AccordionTrigger>
          <AccordionContent>
            The heatmap results show lifecycle greenhouse gas emissions (g CO
            <sub>2</sub>e/mile) for each vehicle option, including all emissions
            from manufacturing through disposal. Percentages compare emissions
            of all vehicles against your selected baseline vehicle. <br />
            <br />
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-normal">
              Percentage = (Emissions of compared vehicle / Emissions of first
              vehicle)
            </code>
            <br />
            <br />
            Should compare the emissions per mile given the differences in
            mileage across classes.
          </AccordionContent>
        </AccordionItem>
      </Accordion> */}
    </div>
  );
};

export default EmissionsHeatmap;
