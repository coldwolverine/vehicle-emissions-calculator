import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

export default function DropdownInfo() {
  return (
    <Accordion type="single" collapsible>
      <p className="leading-7 [&:not(:first-child)]:mt-6 mt-6">
        This tool calculates the total lifecycle greenhouse gas emissions for
        new vehicle purchases by factoring in your location and driving
        patterns. Lifecycle emissions include emissions from: manufacturing,
        petroleum extraction, battery production (for electric vehicles),
        emissions from driving the vehicle (use phase), and end-of-life
        disposal.
      </p>
      <br />
      <AccordionItem value="item-1">
        <AccordionTrigger className="">
          Guidance for input parameters
        </AccordionTrigger>
        <AccordionContent>
          Begin by selecting your location and the two vehicle types you&apos;d
          like to compare. You can customize driving patterns by adjusting the
          city/highway split and electric driving percentage for PHEVs (Utility
          Factor), or use our default settings based on EPA and SAE standards.
          First, user must select location. Default are set for driving patterns
          using EPA and SAE standards. You can modify city/highway…
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          Guidance for interpretation of results
        </AccordionTrigger>
        <AccordionContent>
          The heatmap results show lifecycle greenhouse gas emissions (g
          CO2e/mile) for each vehicle option, including all emissions from
          manufacturing through disposal. Percentages compare emissions of all
          vehicles against your selected baseline vehicle. <br />
          <br />
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-normal">
            Percentage = (Emissions of compared vehicle / Emissions of first
            vehicle)
          </code>
          <br />
          <br />
          Should compare the emissions per mile given the differences in mileage
          across classes.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Additional background information</AccordionTrigger>
        <AccordionContent>
          Total life cycle emissions are the sum of both: (1){" "}
          <b>vehicle cycle</b> emissions including vehicle production and
          disposal based on the GREET 2023 model, and (2) <b>use phase</b>{" "}
          emissions including both driving and upstream sources like fuel
          production and electricity generation.
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
          Cambium model. For complete methodology details, please reference
          Smith et. al, 2025 (linked below). Please email us at{" "}
          <Link
            href="mailto:gregak@umich.edu"
            className="text-blue-500 underline"
            target="external"
          >
            gregak@umich.edu
          </Link>{" "}
          to answer further questions or to provide feedback and suggestions for
          the tool.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
