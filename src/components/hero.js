import Link from "next/link";

export default function Hero() {
  return (
    <>
      <h2 className="scroll-m-20 border-b pb-2 mb-0 text-2xl font-semibold tracking-tight first:mt-0">
        About This Tool
      </h2>
      <div className="h-[3px]" />
      <p className="leading-7 [&:not(:first-child)]:mt-6 mt-6">
        This tool calculates the total lifecycle greenhouse gas emissions for
        new vehicle purchases by factoring in your location and driving
        patterns. Lifecycle emissions include emissions from: manufacturing,
        petroleum extraction, battery production (for electric vehicles),
        emissions from driving the vehicle (use phase), and end-of-life
        disposal.
      </p>
      <br />

      <h2 className="scroll-m-20 border-b pb-2 mb-0 text-2xl font-semibold tracking-tight first:mt-0">
        Tool Guide
      </h2>
      <div className="h-[3px]" />
      <div className="leading-7 [&:not(:first-child)]:mt-6 mt-6">
        {/* Begin by selecting your location and the two vehicle types you&apos;d
        like to compare. You can customize driving patterns by adjusting the
        city/highway split and electric driving percentage for PHEVs (Utility
        Factor), or use our default settings based on EPA and SAE standards.
        First, user must select location. Default are set for driving patterns
        using EPA and SAE standards. You can modify city/highway… */}
        <div className="text-lg font-semibold tracking-tight mb-3">
          Guide for Input Parameters
        </div>{" "}
        Start by following these simple steps to compare vehicle lifecycle
        emissions:
        <ol className="ml-6 list-decimal list-inside">
          <li>
            <b>Select Location</b> by choosing your region to calculate accurate
            vehicle emissions. Your location affects both electricity grid
            emissions (based on NREL&apos;s Cambium projections for 134 regions)
            and temperature effects based on county-specific climate data.
          </li>
          <li>
            <b>Pick two generic models</b> to compare. Choose Vehicles by
            selecting vehicle class (Compact Sedan, Midsize Sedan, Small SUV,
            Midsize SUV or Pickup) and powertrain type (Battery Electric,
            Plug-in Hybrid, Hybrid, or Internal Combustion Engine).
          </li>
          <li>
            <b>Customize Use</b> by adjusting the city/highway driving split
            and, for PHEVs, setting the Utility Factor (percentage of electric
            driving) based on your charging habits. Not sure? Use our default
            settings based on EPA and SAE standards for typical U.S. driving
            patterns.
          </li>
        </ol>
        <br />
        <div className="text-lg font-semibold tracking-tight mb-3">
          Guide for Results
        </div>{" "}
        View your comparison across three tabs:
        <ol className="ml-6 list-decimal list-inside">
          <li>
            <b> Vehicle Comparison</b> shows total lifecycle greenhouse gas
            emissions (MTCO2-eq) for your two selected vehicles, including the
            emissions difference between them.
          </li>
          <li>
            <b>Vehicle Matrix</b> displays a heatmap comparing emissions across
            all available vehicles. Compare each model to your first vehicle
            selection and hover over cells to view detailed lifecycle and
            vehicle cycle emissions data.
          </li>
          <li>
            <b>Geographic View </b> presents an interactive U.S. map showing how
            your selected vehicles compare across all counties, accounting for
            regional differences in electricity grid emissions.
          </li>
        </ol>
      </div>
      <br />

      <h2 className="scroll-m-20 border-b pb-2 mb-0 text-2xl font-semibold tracking-tight first:mt-0">
        Model Information
      </h2>
      <div className="h-[3px]" />
      <div className="leading-7 [&:not(:first-child)]:mt-6 mt-6">
        Total life cycle emissions are the sum of both: (1) <b>vehicle cycle</b>{" "}
        emissions including vehicle production and disposal based on the GREET
        2023 model, and (2) <b>use phase</b> emissions including both driving
        and upstream sources like fuel production and electricity generation.
        <br />
        <br />
        Default calculations assume:
        <ul className="ml-6 list-disc list-inside">
          <li>57% city / 43% highway driving split</li>
          <li>
            Standard PHEV utility factors (58% for 35-mile range, 69% for
            50-mile range)
          </li>
          <li>
            Preset lifetime mileage
            <ul className="list-[circle] list-inside ml-6">
              <li>Sedan drives 191,386 miles over 14 years</li>
              <li>SUV drives 211,197 miles over 15 years</li>
              <li>Pickup drives 244,179 miles over 18 years</li>
            </ul>
          </li>
        </ul>
        <br />
        Grid decarbonization over the vehicle&apos;s lifetime is factored into
        the analysis and based on grid intensity projections from NREL&apos;s
        Cambium model. For complete methodology details, please reference Smith
        et. al, 2025 (linked below). Please email us at{" "}
        <Link
          href="mailto:gregak@umich.edu"
          className="text-blue-500 underline"
          target="external"
        >
          gregak@umich.edu
        </Link>{" "}
        to answer further questions or to provide feedback and suggestions for
        the tool.
      </div>
      <br />
    </>
  );
}
