import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterOption {
  value: string;
  label: string;
}

interface CompactFilterProps {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CompactFilter({
  label,
  icon,
  options,
  value,
  onChange,
  className = "",
}: CompactFilterProps) {
  const selectedLabel = options.find((opt) => opt.value === value)?.label || label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 bg-white border-slate-200 hover:bg-slate-50 ${className}`}
        >
          {icon && <span className="text-slate-600">{icon}</span>}
          <span className="text-slate-700">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 text-slate-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer ${
              value === option.value ? "bg-slate-100 font-semibold" : ""
            }`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

