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
  ResponsiveContainer,
} from "recharts";
import {
  // ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getLifetimeMiles } from "@/utils/helpers";

export default function TwoVehicleComparisonCard({
  heatmapData,
  firstVehicle,
  firstPowertrain,
  secondVehicle,
  secondPowertrain,
  county,
  state,
}) {
  // Function to get total emissions per mile
  const getTotalEmissionsPerMile = (vehicle, powertrain) => {
    if (Object.keys(heatmapData).length === 0) {
      return 0; // Return 0 if data is undefined
    }
    const key = `${vehicle}:${powertrain}`;
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
    return ((totalEmissionsPerMile * lifetimeMiles) / 1_000_000).toFixed(2);
  };

  // Calculate lifecycle emissions and difference
  const vehicle1Emissions = getTotalEmissions(firstVehicle, firstPowertrain);
  const vehicle2Emissions =
    secondVehicle && secondPowertrain
      ? getTotalEmissions(secondVehicle, secondPowertrain)
      : 0;
  const difference = (vehicle1Emissions - vehicle2Emissions).toFixed(2);
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
    // {
    //   vehicle: "difference",
    //   emissions: difference,
    //   fill: "var(--color-difference)",
    // },
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
    difference: {
      label: "Difference",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <Card className="max-w-screen-md mx-auto bg-slate-50">
      <CardHeader className="space-y-0">
        <CardTitle className="text-lg">
          Two Vehicle Emissions Comparison
        </CardTitle>
        <CardDescription className="">
          In {county}, {state}
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-[200px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              // margin={{
              //   left: 15,
              //   right: 5,
              // }}
              margin={{
                top: 0,
                right: 50,
                bottom: 0,
                left: 0,
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
                width={90}
              />
              <XAxis dataKey="emissions" type="number" />
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
                        <div className="flex min-w-[170px] items-center text-xs text-muted-foreground">
                          {chartConfig[name]?.label || name}
                          <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                            {value}
                            <span className="ml-1 font-normal text-muted-foreground">
                              MTCO2e
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
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value) => `${value}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        {/* <br />
        <p>
          Lifecycle emissions of <b className="font-semibold">{firstVehicle}</b>{" "}
          with <b className="font-semibold">{firstPowertrain}</b>:{" "}
          {vehicle1Emissions} MTCO2e
        </p>
        <p>
          Lifecycle emissions of{" "}
          <b className="font-semibold">{secondVehicle}</b> with{" "}
          <b className="font-semibold">{secondPowertrain}</b>:{" "}
          {vehicle2Emissions} MTCO2e
        </p>
        <p>
          <b className="font-semibold">Difference</b>: {difference} MTCO2e
        </p> */}
      </CardContent>
      {/* <CardFooter></CardFooter> */}
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {leastEmissionsVehicle} produces lesser emissions over its lifecycle
        </div>
        <div className="leading-none text-muted-foreground">
          By {difference} MTCO2e
          {/* Showing lifecycle emissions in MTCO2e */}
        </div>
      </CardFooter>
    </Card>
  );
}
