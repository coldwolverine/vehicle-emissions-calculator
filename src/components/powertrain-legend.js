import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PowertrainTypesLegend({ className }) {
  return (
    <Card className={cn("max-w-screen-md bg-blue-50 bg-opacity-85", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Powertrain Types Legend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex">
            <dt className="font-medium text-muted-foreground w-16">ICEV </dt>
            <dd className="w-full">Internal Combustion Engine Vehicle</dd>
          </div>
          <div className="flex">
            <dt className="font-medium text-muted-foreground w-16">HEV </dt>
            <dd className="w-full">Hybrid Electric Vehicle</dd>
          </div>
          <div className="flex">
            <dt className="font-medium text-muted-foreground w-16">PHEV</dt>
            <dd className="w-full">
              Plug-in Hybrid Electric Vehicle with ranges of 35 miles (PHEV35)
              or 50 miles (PHEV50) in electric mode
            </dd>
          </div>
          <div className="flex">
            <dt className="font-medium text-muted-foreground w-16">BEV</dt>
            <dd className="w-full">
              Battery Electric Vehicle with ranges of -150, -200, -300, and -400
              miles
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
