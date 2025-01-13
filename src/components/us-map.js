"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getEmissionsData } from "@/actions/get-emissions-data";
import geojsonData from "@/../data/georef-usa-county.json";
import chroma from "chroma-js";
import { Spinner } from "@/components/ui/spinner";
import debounce from "lodash.debounce";

const USMap = ({
  firstVehicle = "Pickup",
  firstPowertrain = "ICEV",
  secondVehicle = "Midsize SUV",
  secondPowertrain = "Par HEV SI",
  ufPhev35 = 0.58,
  ufPhev50 = 0.69,
  cityDriving = 0.57,
}) => {
  const [updatedGeojsonData, setUpdatedGeojsonData] = useState(null);
  const [minEmissionsDifference, setMinEmissionsDifference] = useState(null);
  const [maxEmissionsDifference, setMaxEmissionsDifference] = useState(null);
  const [loading, setLoading] = useState(true);

  const mapCenter = [37.8, -96];
  const zoomLevel = 4.5;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchEmissionsData = useCallback(
    debounce(
      (
        firstVehicle,
        firstPowertrain,
        secondVehicle,
        secondPowertrain,
        ufPhev35,
        ufPhev50,
        cityDriving
      ) => {
        if (
          firstVehicle &&
          firstPowertrain &&
          secondVehicle &&
          secondPowertrain
        ) {
          setLoading(true);
          getEmissionsData(
            firstVehicle,
            firstPowertrain,
            secondVehicle,
            secondPowertrain,
            ufPhev35,
            ufPhev50,
            cityDriving
          )
            .then((data) => {
              setMinEmissionsDifference(data.minEmissionsDifference);
              setMaxEmissionsDifference(data.maxEmissionsDifference);

              // Modify geojsonData to add emissions_difference
              const updatedData = { ...geojsonData };
              updatedData.features = updatedData.features.map((feature) => {
                const countyFips = parseInt(
                  feature.properties.coty_code[0],
                  10
                ).toString();
                const emission = data.emissionsDataByFips[countyFips];
                if (emission) {
                  feature.properties.first_emissions = emission.first_emissions;
                  feature.properties.second_emissions =
                    emission.second_emissions;
                  feature.properties.emissions_difference =
                    emission.emissions_difference;
                }
                return feature;
              });
              console.log(updatedData);

              setUpdatedGeojsonData(updatedData);
              setTimeout(() => {
                setLoading(false);
              }, 1000);
            })
            .catch((error) => {
              console.error(error);
              setLoading(false);
            });
        }
      },
      500
    ),
    []
  );

  useEffect(() => {
    fetchEmissionsData(
      firstVehicle,
      firstPowertrain,
      secondVehicle,
      secondPowertrain,
      ufPhev35,
      ufPhev50,
      cityDriving
    );
  }, [
    firstVehicle,
    firstPowertrain,
    secondVehicle,
    secondPowertrain,
    ufPhev35,
    ufPhev50,
    cityDriving,
    fetchEmissionsData,
  ]);

  const onEachFeature = (feature, layer) => {
    layer.bindTooltip(
      `<strong>${feature.properties.coty_name[0]} County</strong><br />
    First Emissions: ${feature.properties.first_emissions || 0} MT CO2e<br />
    Second Emissions: ${feature.properties.second_emissions || 0} MT CO2e<br />
    Emissions Difference: ${
      feature.properties.emissions_difference || 0
    } MT CO2e`,
      {
        sticky: true,
        offset: [10, 0],
      }
    );
  };

  const style = (feature) => {
    return {
      fillColor: getColor(feature.properties.emissions_difference),
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  };

  const colorPalette = chroma
    .scale([
      "#d73027",
      "#fc8d59",
      "#fee090",
      "#ffffbf",
      "#e0f3f8",
      "#91bfdb",
      "#4575b4",
    ])
    .domain([0, 1])
    .mode("lab")
    .colors(7)
    .reverse();

  const getColor = (d) => {
    if (d === null || d === undefined) {
      return "#808080"; // Color for NA values
    }
    if (minEmissionsDifference !== null && maxEmissionsDifference !== null) {
      const normalizedValue =
        (d - minEmissionsDifference) /
        (maxEmissionsDifference - minEmissionsDifference);
      return chroma.scale(colorPalette)(normalizedValue).hex();
    }
    return "#808080"; // Default color if min and max are not set
  };

  const Legend = ({ minEmissionsDifference, maxEmissionsDifference }) => {
    if (minEmissionsDifference === null || maxEmissionsDifference === null) {
      return null;
    }

    const step = (maxEmissionsDifference - minEmissionsDifference) / 5;
    const gradient = `linear-gradient(to right, ${colorPalette.join(", ")})`;

    const labels = [];
    for (let i = 0; i < 5; i++) {
      const value = minEmissionsDifference + (i + 0.5) * step;
      labels.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${i * 20 + 10}%`,
            transform: "translateX(-50%)",
          }}
        >
          {/* <div style={{ height: "10px", borderLeft: "2px solid black" }}></div> */}
          <div className="mt-[2px]">{Math.round(value)}</div>
        </div>
      );
    }

    return (
      <div
        className="absolute z-[1000] w-[200px] bottom-[25px] right-[10px] p-[10px] rounded"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)", // Less white
          boxShadow: "0 0 15px rgba(0, 0, 0, 0.2)", // Shadow
        }}
      >
        <div className="mb-[5px]">Emissions Difference (gCO2e/mile)</div>
        <div
          className="h-[20px] w-full relative"
          style={{ background: gradient }}
        >
          {labels}
        </div>
        <div className="flex items-center mt-[10px]">
          <i className="bg-[#808080] w-[18px] h-[18px] mr-[8px] opacity-[0.7]"></i>
          NA
        </div>
      </div>
    );
  };

  const HomeButton = () => {
    const map = useMap();
    return (
      <button
        onClick={() => map.setView(mapCenter, zoomLevel)}
        className="absolute top-[80px] left-[10px] z-[1000] bg-white py-[5px] px-[10px] rounded cursor-pointer"
        style={{
          boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
        }}
      >
        Center
      </button>
    );
  };

  return (
    <div className="h-[600px] w-[1100px]">
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        zoomSnap={0.5}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />{" "}
        {loading ? (
          <div
            className="flex flex-col items-center justify-center w-full h-full absolute inset-0 z-[10000]"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <Spinner size="md" />
            <p>Loading Map...</p>
          </div>
        ) : (
          <>
            {updatedGeojsonData && (
              <GeoJSON
                data={updatedGeojsonData.features}
                onEachFeature={onEachFeature}
                style={style}
              />
            )}
            <Legend
              minEmissionsDifference={minEmissionsDifference}
              maxEmissionsDifference={maxEmissionsDifference}
            />
          </>
        )}
        <HomeButton />
      </MapContainer>
    </div>
  );
};

export default USMap;
