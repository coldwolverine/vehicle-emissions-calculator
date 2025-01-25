"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import EmissionsHeatmap from "@/components/heatmap";
import VehicleComparisonForm from "@/components/form";
import { getHeatmapData } from "@/actions/get-heatmap-data";
import debounce from "lodash.debounce";
import dynamic from "next/dynamic";
import TwoVehicleComparisonCard from "@/components/vehicle-comparison-card";
// Dynamically import the USMap component with no SSR
const USMap = dynamic(() => import("@/components/us-map"), { ssr: false });
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [heatmapData, setHeatmapData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm({
    defaultValues: {
      state: "CA",
      county: "Los Angeles County",
      firstVehicle: "Midsize SUV",
      firstPowertrain: "ICEV",
      secondVehicle: "Compact Sedan",
      secondPowertrain: "BEV200",
      ufPhev35: 0.58,
      ufPhev50: 0.69,
      cityDriving: 0.57,
    },
  });

  const state = form.watch("state");
  const county = form.watch("county");
  const firstVehicle = form.watch("firstVehicle");
  const firstPowertrain = form.watch("firstPowertrain");
  const secondVehicle = form.watch("secondVehicle");
  const secondPowertrain = form.watch("secondPowertrain");
  const ufPhev35 = form.watch("ufPhev35");
  const ufPhev50 = form.watch("ufPhev50");
  const cityDriving = form.watch("cityDriving");

  // Debounce the update function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateHeatmap = useCallback(
    debounce(
      (
        state,
        county,
        firstVehicle,
        firstPowertrain,
        ufPhev35,
        ufPhev50,
        cityDriving
      ) => {
        if (state && county && firstVehicle && firstPowertrain) {
          getHeatmapData(
            state,
            county,
            firstVehicle,
            firstPowertrain,
            ufPhev35,
            ufPhev50,
            cityDriving
          )
            .then((data) => {
              setHeatmapData(data);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error(error);
            });
        }
      },
      1000
    ), // Adjust the debounce delay as needed
    []
  );

  // Use useEffect to watch for changes and call the debounced function
  useEffect(() => {
    if (state && county && firstVehicle && firstPowertrain) {
      setIsLoading(true);
      debouncedUpdateHeatmap(
        state,
        county,
        firstVehicle,
        firstPowertrain,
        ufPhev35,
        ufPhev50,
        cityDriving
      );
    }

    return () => {
      // setIsLoading(false);
      debouncedUpdateHeatmap.cancel();
    };
  }, [
    state,
    county,
    firstVehicle,
    firstPowertrain,
    ufPhev35,
    ufPhev50,
    cityDriving,
    debouncedUpdateHeatmap,
  ]);

  return (
    <main className="flex flex-col justify-center items-center">
      <VehicleComparisonForm form={form} />
      <div className="h-[40px]"></div>
      <h2
        id="results"
        className="w-full scroll-m-8 border-b pb-2 mb-6 text-2xl font-semibold tracking-tight first:mt-0"
      >
        Results
      </h2>
      <Tabs defaultValue="compare-two-vehicles" className="w-[1100px]">
        <TabsList className="grid mx-auto max-w-screen-md grid-cols-7 mb-8">
          <TabsTrigger value="compare-two-vehicles" className="col-span-2">
            Two Vehicle Comparison
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="col-span-2">
            Compare All Vehicles
          </TabsTrigger>
          <TabsTrigger value="us-map" className="col-span-3">
            Emissions Differences by US County
          </TabsTrigger>
        </TabsList>
        <TabsContent value="compare-two-vehicles" className="">
          <TwoVehicleComparisonCard
            heatmapData={heatmapData}
            firstVehicle={firstVehicle}
            firstPowertrain={firstPowertrain}
            secondVehicle={secondVehicle}
            secondPowertrain={secondPowertrain}
            state={state}
            county={county}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="heatmap" className="">
          <EmissionsHeatmap
            data={heatmapData}
            firstVehicle={firstVehicle}
            firstPowertrain={firstPowertrain}
            secondVehicle={secondVehicle}
            secondPowertrain={secondPowertrain}
            county={county}
            state={state}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="us-map" className="min-h-[600px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <p className="text-4xl font-bold text-gray-300">Loading...</p>
            </div>
          ) : (
            <USMap
              firstVehicle={firstVehicle}
              firstPowertrain={firstPowertrain}
              secondVehicle={secondVehicle}
              secondPowertrain={secondPowertrain}
              ufPhev35={ufPhev35}
              ufPhev50={ufPhev50}
              cityDriving={cityDriving}
            />
          )}
        </TabsContent>
      </Tabs>
      <div className="h-[50px]"></div>
    </main>
  );
}
