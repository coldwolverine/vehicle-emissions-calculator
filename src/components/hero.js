export default function Hero() {
  return (
    <>
      <h2
        id="about-tool"
        className="scroll-m-8 border-b pb-2 mb-0 text-2xl font-semibold tracking-tight first:mt-0"
      >
        About This Tool
      </h2>
      <div className="h-[3px]" />
      <p className="leading-7 [&:not(:first-child)]:mt-6 mt-6">
        Calculate total lifecycle greenhouse gas emissions for new vehicles
        based on your location and driving patterns. Lifecycle emissions include
        emissions from manufacturing, petroleum extraction and battery
        production (for electric vehicles), emissions from driving the vehicle
        (use phase) and end-of-life disposal. The methodology is based on
        research published in{" "}
        <a
          href="https://pubs.acs.org/doi/10.1021/acs.est.5c05406"
          className="text-blue-500 underline"
          target="_blank"
        >
          Smith et al., 2025.
        </a>
      </p>
      <br />

      <h2
        id="tool-guide"
        className="scroll-m-8 border-b pb-2 mb-0 text-2xl font-semibold tracking-tight first:mt-0"
      >
        Tool Guide
      </h2>
      <div className="h-[3px]" />
      <div className="leading-7 [&:not(:first-child)]:mt-6 mt-6">
        <div className="text-lg font-semibold tracking-tight mb-3">
          Instructions
        </div>
        <ol className="ml-6 list-decimal list-inside">
          <li>
            <b>Select Location:</b> Set your region for accurate electricity
            grid mix (NREL Cambium Model) and temperature-based variations
            (NOAA).
          </li>
          <li>
            <b>Vehicle Comparison:</b> Compare two models by selecting:
            <ul className="ml-6 list-disc list-inside">
              <li>
                <u>Class:</u> Compact/Midsize Sedan, Crossover, Midsize SUV, or
                Pickup
              </li>
              <li>
                <u>Powertrain:</u> Battery Electric, Plug-in Hybrid, Hybrid, or
                Internal Combustion
              </li>
            </ul>
          </li>
          <li>
            <b>Driving pattern:</b> Adjust city/highway split and PHEV Utility
            Factor (percentage of Electric driving). Not sure? Keep our default
            settings based on EPA and SAE standards for typical U.S. driving
            patterns.
          </li>
        </ol>
        <br />
        <div className="text-lg font-semibold tracking-tight mb-3">
          Results
        </div>{" "}
        View your comparison across three tabs:
        <ol className="ml-6 list-decimal list-inside">
          <li>
            <b> Two Vehicle Comparison</b> compares lifecycle greenhouse gas
            emissions for selected vehicles.
          </li>
          <li>
            <b>Compare All Vehicles</b> displays a heatmap comparing emissions
            across all available vehicle models.
          </li>
          <li>
            <b>Emissions Differences by US County</b> presents an interactive
            county-level map displaying regional emission variations for
            selected vehicles. Regional differences account for variations in
            temperature and electricity grid mix.
          </li>
        </ol>
      </div>
      <br />

      <h2
        id="model-info"
        className="scroll-m-8 border-b pb-2 mb-0 text-2xl font-semibold tracking-tight first:mt-0"
      >
        Calculation Details
      </h2>
      <div className="h-[3px]" />
      <div className="leading-7 [&:not(:first-child)]:mt-6 mt-6">
        <b>Total life cycle emissions</b> combine two key phases: (1){" "}
        <b>vehicle cycle</b> emissions including <i>vehicle production</i> and{" "}
        <i>disposal</i> based on the GREET 2023 model, and (2) <b>use phase</b>{" "}
        emissions including both <i>driving</i> and{" "}
        <i>upstream fuel production</i> and/or <i>electricity generation</i>.
        <br />
        <br />
        Default calculations are based on EPA and SAE standards, which assume:
        <ul className="ml-6 list-disc list-inside">
          <li>43% city / 57% highway driving split</li>
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
        <b>Grid decarbonization</b> over the vehicle&apos;s lifetime is factored
        into the analysis and based on grid intensity projections from
        NREL&apos;s Cambium model. For complete methodology details, please
        reference Smith et. al, 2025 (linked below). Please email us at{" "}
        <a
          href="mailto:gregak@umich.edu"
          className="text-blue-500 underline"
          target="_blank"
        >
          gregak@umich.edu
        </a>{" "}
        to answer further questions or to provide feedback and suggestions for
        the tool.
      </div>
      <br />
    </>
  );
}
