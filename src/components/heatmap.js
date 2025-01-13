"use client";
import { useState, useEffect } from "react";
import { HeatMapGrid } from "react-grid-heatmap";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   // CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import { getLifetimeMiles } from "@/utils/helpers";

const xLabels = [
  "ICEV",
  "HEV",
  "PHEV35",
  "PHEV50",
  "BEV150",
  "BEV200",
  "BEV300",
  "BEV400",
];

const powertrains = [
  "ICEV",
  "Par HEV SI",
  "Par PHEV35",
  "Par PHEV50",
  "BEV150",
  "BEV200",
  "BEV300",
  "BEV400",
];

const yLabels = [
  "Pickup",
  "Midsize SUV",
  "Small SUV",
  "Midsize Sedan",
  "Compact Sedan",
];

const EmissionsHeatmap = ({
  heatmapData,
  firstVehicle,
  firstPowertrain,
  secondVehicle,
  secondPowertrain,
  county,
}) => {
  const [hoveredCell, setHoveredCell] = useState({ row: null, col: null });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // Function to get total emissions per mile
  const getTotalEmissionsPerMile = (vehicle, powertrain) => {
    if (Object.keys(data).length === 0) {
      return 0; // Return 0 if data is undefined
    }
    const key = `${vehicle}:${powertrain}`;
    return (
      Math.round(data.vehicle_data[key]?.Total_Emissions_per_mile_gCO2e) || 0
    );
  };

  // Function to get total emissions
  const getTotalEmissions = (vehicle, powertrain) => {
    const totalEmissionsPerMile = getTotalEmissionsPerMile(vehicle, powertrain);
    const lifetimeMiles = getLifetimeMiles(vehicle);
    return ((totalEmissionsPerMile * lifetimeMiles) / 1_000_000).toFixed(2);
  };

  const getVehicleCycleEmissions = (vehicle, powertrain) => {
    if (Object.keys(data).length === 0) {
      return 0; // Return 0 if data is undefined
    }
    const key = `${vehicle}:${powertrain}`;
    return (
      Math.round(data.vehicle_data[key]?.Production_phase_emissions_kgCO2e) || 0
    );
  };

  const customCellRender = (y, x, value) => {
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
                {getTotalEmissionsPerMile(yLabels[y], powertrains[x])}
                <br />
                {value}%
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="w-[335px] break-words"
            >
              <div className="flex">
                <div>
                  {yLabels[y]}, {powertrains[x]}
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                Total Lifecycle Emissions per mile
                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                  {getTotalEmissionsPerMile(yLabels[y], powertrains[x])}
                  <span className="ml-1 font-normal text-muted-foreground">
                    gCO2e
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                Total Lifecycle Emissions
                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                  {getTotalEmissions(yLabels[y], powertrains[x])}
                  <span className="ml-1 font-normal text-muted-foreground">
                    MTCO2e
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                Emissions from Vehicle Cycle
                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                  {getVehicleCycleEmissions(yLabels[y], powertrains[x])}
                  <span className="ml-1 font-normal text-muted-foreground">
                    MTCO2e
                  </span>
                </div>
              </div>
              {/* <div className="flex">
                <div className="text-muted-foreground mr-1">
                  Total Lifecycle Emissions per mile:
                </div>
                <div>
                  {getTotalEmissionsPerMile(yLabels[y], powertrains[x])} g CO2e
                </div>
              </div> */}
              {/* <div className="flex">
                <div className="text-muted-foreground mr-1">
                  Total Lifecycle Emissions:
                </div>
                <div>
                  {getTotalEmissions(yLabels[y], powertrains[x])} MT CO2e
                </div>
              </div> */}
              {/* <div className="flex">
                <div className="text-muted-foreground mr-1">
                  Emissions from Vehicle Cycle:
                </div>
                <div>
                  {getVehicleCycleEmissions(yLabels[y], powertrains[x])} MT CO2e
                </div>
              </div> */}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    );
  };

  useEffect(() => {
    // Update heatmap based on heatmapData
    console.log("Heatmap data changed:", heatmapData);
    setLoading(true);
    // Display skeleton while loading
    setLoading(true);
    if (Object.keys(heatmapData).length > 0) {
      setData(heatmapData);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } else {
      setData({});
      // setTimeout(() => {
      //   setLoading(false);
      // }, 1000);
    }
  }, [heatmapData]);

  // Calculate lifecycle emissions and difference
  // const vehicle1Emissions = getTotalEmissions(firstVehicle, firstPowertrain);
  // const vehicle2Emissions =
  //   secondVehicle && secondPowertrain
  //     ? getTotalEmissions(secondVehicle, secondPowertrain)
  //     : 0;
  // const difference = (vehicle1Emissions - vehicle2Emissions).toFixed(2);

  return (
    <div className="flex flex-col items-center">
      {loading ? (
        <div className="flex flex-col items-center w-full h-full space-y-2 my-48">
          <Spinner size="md" />
          <p>Loading Heatmap...</p>
        </div>
      ) : (
        // <Skeleton className="flex w-[650px] h-[400px] ml-auto" />
        <div className="flex flex-col justify-start items-center w-[850px] h-full ">
          <p className="text-lg text-zinc-600 text-center mb-6">
            Lifecycle Emissions across Vehicle Classes and Powertrains (g
            CO2e/mile) <br />% of Emissions Compared to {firstVehicle} with{" "}
            {firstPowertrain} <br />
            {county}
          </p>
          <HeatMapGrid
            data={data.percentage_change}
            xLabels={xLabels}
            yLabels={yLabels}
            xLabelsPos="bottom"
            cellHeight="6rem"
            square={true}
            yLabelsStyle={() => ({
              fontSize: "0.9rem",
              textAlign: "right",
              lineHeight: "1",
              marginRight: "1rem",
              color: "#71717a",
              marginTop: "2.2rem",
              marginBottom: "2.2rem",
            })}
            xLabelsStyle={() => ({
              fontSize: "0.9rem",
              paddingTop: "0.6rem",
              color: "#71717a",
            })}
            cellRender={customCellRender}
            cellStyle={(y, x, ratio) => {
              const isTargetCell =
                (powertrains[x] === firstPowertrain &&
                  yLabels[y] === firstVehicle) ||
                (powertrains[x] === secondPowertrain &&
                  yLabels[y] === secondVehicle);
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
          {/* <Card className="bg-blue-100 mt-10 mx-auto max-w-screen-lg p-0 flex justify-evenly">
            <CardHeader className="space-y-0 justify-center">
              <CardTitle className="text-xl">Emissions comparison</CardTitle>
              <CardDescription className="text-base mt-0">
                See how the two vehicles compare
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6">
              <p className="text-base leading-normal">
                Lifecycle emissions of{" "}
                <b className="font-semibold">{firstVehicle}</b>:{" "}
                {vehicle1Emissions} MT CO2e
              </p>
              <p className="text-base leading-normal">
                Lifecycle emissions of{" "}
                <b className="font-semibold">{secondVehicle}</b>:{" "}
                {vehicle2Emissions} MT CO2e
              </p>
              <p className="text-base leading-normal">
                <b className="font-medium">Difference</b>: {difference} MT CO2e
              </p>
            </CardContent>
          </Card> */}
          <div className="h-[30px]"></div>
          <Accordion
            type="single"
            defaultValue="item-1"
            collapsible
            className="w-[700px]"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="">
                Guidance for interpretation of results
              </AccordionTrigger>
              <AccordionContent>
                The heatmap results show lifecycle greenhouse gas emissions (g
                CO2e/mile) for each vehicle option, including all emissions from
                manufacturing through disposal. Percentages compare emissions of
                all vehicles against your selected baseline vehicle. <br />
                <br />
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-normal">
                  Percentage = (Emissions of compared vehicle / Emissions of
                  first vehicle)
                </code>
                <br />
                <br />
                Should compare the emissions per mile given the differences in
                mileage across classes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      <br />
    </div>
  );
};

export default EmissionsHeatmap;
