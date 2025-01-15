"use client";
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  // FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getCounties } from "@/actions/get-counties";
import QuestionMarkPopover from "@/components/ui/question-mark-popover";
import { getPowertrainDescription } from "@/utils/helpers";

const states = [
  "AL",
  "AR",
  "AZ",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "IA",
  "ID",
  "IL",
  "IN",
  "KS",
  "KY",
  "LA",
  "MA",
  "MD",
  "ME",
  "MI",
  "MN",
  "MO",
  "MS",
  "MT",
  "NC",
  "ND",
  "NE",
  "NH",
  "NJ",
  "NM",
  "NV",
  "NY",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VA",
  "VT",
  "WA",
  "WI",
  "WV",
  "WY",
];

const vehicles = [
  "Pickup",
  "Midsize SUV",
  "Small SUV",
  "Midsize Sedan",
  "Compact Sedan",
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

const phev35UfDefault = 0.58;
const phev50UfDefault = 0.69;
const cityDrivingDefault = 0.57;

const VehicleComparisonForm = ({ form }) => {
  const [counties, setCounties] = useState([]);
  const state = form.watch("state");

  useEffect(() => {
    // Fetch counties based on the default state
    getCounties(state)
      .then((newCounties) => {
        setCounties(newCounties);
      })
      .catch((error) => {
        console.error("Error fetching counties:", error);
        setCounties([]); // Ensure counties is an array even if the API call fails
      });
  }, [state]);

  const onSelectState = (state) => {
    form.setValue("state", state);
    form.setValue("county", "");
  };

  const onSubmit = () => {
    console.log("Submit");
  };

  return (
    <Form {...form}>
      <h2
        id="input-params"
        className="flex space-x-3 w-full scroll-m-8 border-b pb-2 mb-6 text-2xl font-semibold tracking-tight first:mt-0"
      >
        <span>Input Parameters</span>
        <div className="bg-[#ffc107] h-[30px] text-sm tracking-tight text-[#212529] leading-3 my-0 py-2 font-semibold border rounded-[5px] shadow px-2">
          Set Values
        </div>
      </h2>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-6 rounded"
      >
        {/* Location Section */}

        <div className="space-y-0 mb-10">
          <h4 className="scroll-m-20 text-lg font-semibold tracking-tight  flex items-center gap-1">
            Location
            <QuestionMarkPopover
              content={
                <p>
                  This tool accounts for regional variation in temperature
                  effects at a county level (3,106 counties CHECK) and regional
                  projected grid intensity factors (134 balancing areas) using
                  NREL&apos;s Cambium Model. Further information can be found in
                  Smith et. al.
                </p>
              }
            />
          </h4>
          <div className="text-muted-foreground text-sm">
            Enter location data
          </div>
          {/* <h3 className="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-normal flex items-center gap-1">
            Location{" "}
          </h3> */}
          <div className="flex gap-8 pt-2">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pr-4">State</FormLabel>
                  <br />
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-[150px] justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? states.find((state) => state === field.value)
                            : "Select state"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[150px] p-0">
                      <Command>
                        <CommandInput placeholder="Search state..." />
                        <CommandList>
                          <CommandEmpty>No state found.</CommandEmpty>
                          <CommandGroup>
                            {states.map((state) => (
                              <CommandItem
                                value={state}
                                key={state}
                                onSelect={() => onSelectState(state)}
                              >
                                {state}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    state === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* <FormDescription>Select your state.</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="county"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="pr-4">County</FormLabel>
                  <br />
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-[250px] justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? counties.find((county) => county === field.value)
                            : "Select county"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput placeholder="Search county..." />
                        <CommandList>
                          <CommandEmpty>
                            Select a state to see a list <br />
                            of counties.
                          </CommandEmpty>
                          <CommandGroup>
                            {counties.map((county) => (
                              <CommandItem
                                value={county}
                                key={county}
                                onSelect={() => form.setValue("county", county)}
                              >
                                {county}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    county === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* <FormDescription>Select your county.</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Vehicle Section */}
        <div className="pb-2">
          <h4 className="scroll-m-20 text-lg font-semibold tracking-tight flex items-center gap-1">
            Vehicle Choice{" "}
            <QuestionMarkPopover
              content={
                <p>
                  The following vehicle powertrains can be chosen for
                  comparison: <br />
                  <b>ICEV</b>: Internal Combustion Engine Vehicle <br />
                  <b>PHEV</b>: Plug-in Hybrid Electric Vehicle with ranges of 35
                  miles (PHEV35) or 50 miles (PHEV50) in electric mode <br />
                  <b>BEV</b>: Battery Electric Vehicle with ranges of -150,
                  -200, -300, and -400 miles
                </p>
              }
            />
          </h4>
          <div className="text-muted-foreground text-sm">
            Choose two vehicles for comparison
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="firstVehicle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Vehicle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(!field.value && "text-muted-foreground")}
                      >
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle} value={vehicle}>
                          {vehicle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* <FormDescription>Select the first vehicle.</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstPowertrain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Powertrain</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(!field.value && "text-muted-foreground")}
                      >
                        <SelectValue placeholder="Select powertrain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {powertrains.map((powertrain) => (
                        // <SelectItem key={powertrain} value={powertrain}>
                        //   {powertrain}
                        // </SelectItem>
                        <TooltipProvider key={powertrain}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectItem value={powertrain}>
                                {powertrain}
                              </SelectItem>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              align="center"
                              className="max-w-[200px] break-words"
                            >
                              {getPowertrainDescription(powertrain)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* <FormDescription>
                    Select the first powertrain.
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondVehicle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Second Vehicle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(!field.value && "text-muted-foreground")}
                      >
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle} value={vehicle}>
                          {vehicle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* <FormDescription>Select the second vehicle.</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondPowertrain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Second Powertrain</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(!field.value && "text-muted-foreground")}
                      >
                        <SelectValue placeholder="Select powertrain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {powertrains.map((powertrain) => (
                        // <SelectItem key={powertrain} value={powertrain}>
                        //   {powertrain}
                        // </SelectItem>
                        <TooltipProvider key={powertrain}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectItem value={powertrain}>
                                {powertrain}
                              </SelectItem>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              align="center"
                              className="max-w-[200px] break-words"
                            >
                              {getPowertrainDescription(powertrain)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* <FormDescription>
                    Select the second powertrain.
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Slider Section */}
        <div className="space-y-4">
          <Collapsible>
            <h4 className="scroll-m-20 text-lg font-semibold tracking-tight flex items-center gap-1">
              Driving Patterns{" "}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </h4>
            <div className="text-muted-foreground text-sm">
              Optional: Set usage patterns
            </div>
            <CollapsibleContent className="mt-4 transition-all duration-500">
              <div className="grid grid-cols-2 gap-4 max-[800px]:grid-cols-1">
                <FormField
                  control={form.control}
                  name="ufPhev35"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="flex items-center gap-2">
                        PHEV 35 UF
                        <QuestionMarkPopover
                          content={
                            <p>
                              The percentage of miles driven using electric
                              power in Plug-in Hybrid Electric Vehicles (PHEVs).
                              Per SAE standards, we use the following defaults :
                              PHEVs with 35-mile electric range have a utility
                              factor of 58% electric driving.
                            </p>
                          }
                        />
                      </FormLabel>
                      <div className="flex gap-3">
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={[field.value]}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="w-[100px] h-[30px] text-center border rounded"
                        />
                        <Button
                          variant="outline"
                          className="w-[60px] h-[30px] text-sm"
                          onClick={() => field.onChange(phev35UfDefault)}
                        >
                          Reset
                        </Button>
                      </div>

                      {/* <FormDescription>
                    Current value: {field.value}
                  </FormDescription> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ufPhev50"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="flex items-center gap-2">
                        PHEV 50 UF
                        <QuestionMarkPopover
                          content={
                            <p>
                              The percentage of miles driven using electric
                              power in Plug-in Hybrid Electric Vehicles (PHEVs).
                              Per SAE standards, we use the following defaults :
                              PHEVs with 50-mile range achieve 69%.
                            </p>
                          }
                        />
                      </FormLabel>
                      <div className="flex gap-3">
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={[field.value]}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="w-[100px] h-[30px] text-center border rounded"
                        />
                        <Button
                          variant="outline"
                          className="w-[60px] h-[30px] text-sm"
                          onClick={() => field.onChange(phev50UfDefault)}
                        >
                          Reset
                        </Button>
                      </div>
                      {/* <FormDescription>
                    Current value: {field.value}
                  </FormDescription> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cityDriving"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="flex items-center gap-2">
                        City Driving %
                        <QuestionMarkPopover
                          content={
                            <p>
                              The percentage of miles travelled in urban areas
                              characterized by frequent stops, slow speeds, and
                              acceleration/deceleration cycles. This driving
                              pattern typically results in different fuel
                              consumption and emissions compared to highway
                              driving, characterized by consistent higher
                              speeds, fewer stops, and more steady-state
                              operation
                            </p>
                          }
                        />
                      </FormLabel>
                      <div className="flex gap-3">
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={[field.value]}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="w-[100px] h-[30px] text-center border rounded"
                        />
                        <Button
                          variant="outline"
                          className="w-[60px] h-[30px] text-sm"
                          onClick={() => field.onChange(cityDrivingDefault)}
                        >
                          Reset
                        </Button>
                      </div>
                      {/* <FormDescription>
                    Current value: {field.value}
                  </FormDescription> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* <Button type="submit">Submit</Button> */}
      </form>
    </Form>
  );
};

export default VehicleComparisonForm;
