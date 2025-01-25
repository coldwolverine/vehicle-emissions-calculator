import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  // ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import {
  VEHICLE_DISPLAY_TO_DB,
  POWERTRAIN_DISPLAY_TO_DB,
  getLifetimeMiles,
} from "@/utils/helpers.js";
import PowertrainTypesLegend from "@/components/powertrain-legend";

const CustomXAxisLabel = ({ viewBox }) => {
  const { width, height, x, y } = viewBox;
  return (
    <text
      x={x + width / 2}
      y={y + height + 8}
      textAnchor="middle"
      fill="#666"
      className="text-sm"
    >
      Total Lifecycle Emissions (Metric Tons CO
      <tspan baselineShift="sub" className="text-[10px]">
        2
      </tspan>
      e)
    </text>
  );
};

export default function TwoVehicleComparisonCard({
  heatmapData,
  firstVehicle,
  firstPowertrain,
  secondVehicle,
  secondPowertrain,
  county,
  state,
  isLoading,
}) {
  // Function to get total emissions per mile
  const getTotalEmissionsPerMile = (vehicle, powertrain) => {
    if (Object.keys(heatmapData).length === 0) {
      return 0; // Return 0 if data is undefined
    }
    const key = `${VEHICLE_DISPLAY_TO_DB[vehicle]}:${POWERTRAIN_DISPLAY_TO_DB[powertrain]}`;
    return (
      Math.round(
        heatmapData.vehicle_data[key]?.Total_Emissions_per_mile_gCO2e
      ) || 0
    );
  };

  // Function to get total emissions
  const getTotalEmissions = (vehicle, powertrain) => {
    const totalEmissionsPerMile = getTotalEmissionsPerMile(vehicle, powertrain);
    const lifetimeMiles = getLifetimeMiles(vehicle);
    return Math.round((totalEmissionsPerMile * lifetimeMiles) / 1_000_000);
  };

  // Calculate lifecycle emissions and difference
  const vehicle1Emissions = getTotalEmissions(firstVehicle, firstPowertrain);
  const vehicle2Emissions =
    secondVehicle && secondPowertrain
      ? getTotalEmissions(secondVehicle, secondPowertrain)
      : 0;
  const difference = Math.abs(vehicle1Emissions - vehicle2Emissions).toFixed(0);
  const leastEmissionsVehicle =
    vehicle1Emissions < vehicle2Emissions
      ? `${firstVehicle} ${firstPowertrain}`
      : `${secondVehicle} ${secondPowertrain}`;

  const chartData = [
    {
      vehicle: `vehicle1`,
      emissions: vehicle1Emissions,
      fill: "var(--color-vehicle1)",
    },
    {
      vehicle: `vehicle2`,
      emissions: vehicle2Emissions,
      fill: "var(--color-vehicle2)",
    },
  ];

  const chartConfig = {
    emissions: {
      label: "Emissions",
    },
    vehicle1: {
      label: `${firstVehicle} ${firstPowertrain}`,
      color: "hsl(var(--chart-1))",
    },
    vehicle2: {
      label: `${secondVehicle} ${secondPowertrain}`,
      color: "hsl(var(--chart-2))",
    },
  };

  // Custom domain function to calculate the upper bound
  const calculateDomain = (data) => {
    const maxValue = Math.max(...data.map((d) => d.emissions));
    return [0, Math.ceil(maxValue * 1.1)]; // Add some padding to the upper bound
  };

  return (
    <div className="mx-auto max-w-screen-md">
      <Card className="bg-slate-50">
        <CardHeader className="space-y-0 text-center">
          <CardTitle className="text-lg">
            Two Vehicle Emissions Comparison
          </CardTitle>
          <CardDescription className="text-base">
            In {county}, {state}
          </CardDescription>
        </CardHeader>
        {isLoading ? ( // Show loading spinner if data is loading
          <div className="flex flex-col items-center justify-center w-full h-[210px] z-[10000]">
            <Spinner size="md" />
            <p>Loading Chart...</p>
          </div>
        ) : (
          <CardContent className="">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[210px] w-full"
            >
              <BarChart
                accessibilityLayer
                key={JSON.stringify(chartData)}
                data={chartData}
                layout="vertical"
                margin={{
                  top: 0,
                  right: 50,
                  bottom: 20,
                  left: 10,
                }}
              >
                <CartesianGrid vertical={true} />
                <YAxis
                  dataKey="vehicle"
                  type="category"
                  tickLine={true}
                  tickMargin={7}
                  axisLine={true}
                  tickFormatter={(value) => chartConfig[value]?.label}
                  width={75}
                  style={{
                    fill: "#36363c",
                    fontSize: "0.85rem",
                  }}
                />
                <XAxis
                  dataKey="emissions"
                  type="number"
                  label={<CustomXAxisLabel />}
                  domain={calculateDomain(chartData)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item) => (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                            style={{
                              "--color-bg": `var(--color-${item?.payload?.vehicle})`,
                            }}
                          />
                          <div className="flex min-w-[220px] items-center text-xs text-muted-foreground">
                            {chartConfig[name]?.label || name}
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              {value}
                              <span className="ml-2 font-normal tracking-tight text-muted-foreground">
                                Metric Tons CO<sub>2</sub>e
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    />
                  }
                  cursor={true}
                  defaultIndex={1}
                />
                <Bar
                  dataKey="emissions"
                  // layout="vertical"
                  radius={5}
                  barSize={30}
                >
                  <LabelList
                    dataKey="emissions"
                    position="right"
                    offset={10}
                    className="fill-foreground"
                    fontSize={14}
                    formatter={(value) => `${value}`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        )}
        <CardFooter className="flex-col items-center gap-2 text-base">
          {isLoading ? (
            " "
          ) : (
            <>
              <div className="flex gap-2 font-medium leading-none">
                {leastEmissionsVehicle} produces lesser emissions over its
                lifecycle
              </div>
              <div className="leading-none text-muted-foreground">
                By {difference} Metric Tons CO<sub>2</sub>e
              </div>
            </>
          )}
        </CardFooter>
      </Card>
      <PowertrainTypesLegend className="mt-9" />
    </div>
  );
}
