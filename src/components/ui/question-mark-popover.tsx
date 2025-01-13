import React from "react";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface QuestionMarkPopoverProps {
  content: React.ReactNode;
}

export default function QuestionMarkPopover({
  content,
}: QuestionMarkPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-sm flex items-center"
        >
          <InfoIcon className="h-4 w-4" />
          <span className="sr-only">Open popover</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" side="right" sideOffset={10}>
        <div className="grid gap-4">
          <div className="space-y-2">{content}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
