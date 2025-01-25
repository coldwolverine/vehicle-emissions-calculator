import React from "react";
import chroma from "chroma-js";
import {
  Card,
  CardContent,
  // CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define the color scale using chroma.js
// Define the function to compute hue based on the ratio
function getHue(ratio) {
  return Math.pow(1 - ratio, 1) * 120;
}

// Generate five evenly spaced ratios
const ratios = [0, 0.25, 0.5, 0.75, 1];

// Map each ratio to a color
const colors = ratios.map((ratio) => {
  const hue = getHue(ratio); // Compute the hue
  return chroma.hsl(hue, 0.7, 0.65).hex();
});

const HeatmapColorLegend = ({
  lowestTotalEmissionsPerMile,
  highestTotalEmissionsPerMile,
  leastEmissionsVehicle,
  highestEmissionsVehicle,
}) => {
  const colorPalette = chroma.scale(colors).mode("lab").colors(5);

  const gradient = `linear-gradient(to right, ${colorPalette.join(", ")})`;

  return (
    <Card className="bg-slate-50 w-[305px]">
      <CardHeader className="">
        {/* <CardTitle>Heatmap Legend</CardTitle> */}
        <CardTitle className="">
          Lifecycle Emissions per Mile <br />
          (gCO<sub>2</sub>
          e/mile){" "}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="flex justify-between w-full mb-1 text-sm ">
          <span>Lowest</span>
          <span>Highest</span>
        </div>
        <div
          className="w-full h-7"
          style={{
            background: gradient,
          }}
        >
          <div className="flex justify-between w-full px-2 mt-1 text-sm">
            <span>{lowestTotalEmissionsPerMile.toFixed(0)}</span>

            <span>{highestTotalEmissionsPerMile.toFixed(0)}</span>
          </div>
        </div>

        <div className="flex justify-between w-full mt-2 text-sm text-muted-foreground">
          <span className="max-w-20">{leastEmissionsVehicle}</span>
          <span className="max-w-20 text-right">{highestEmissionsVehicle}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapColorLegend;
