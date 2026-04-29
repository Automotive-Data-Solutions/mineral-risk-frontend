"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { SUPPLY_CHAIN_STAGES } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

export interface CompaniesFilters {
  search: string;
  stage: string;
  country: string;
  min_confidence: number;
}

export const INITIAL_FILTERS: CompaniesFilters = {
  search: "",
  stage: "",
  country: "",
  min_confidence: 0,
};

interface CompaniesFilterBarProps {
  value: CompaniesFilters;
  onChange: (next: CompaniesFilters) => void;
  total?: number;
}

/**
 * Debounces the ``search`` + ``country`` text inputs by 300ms so we don't
 * re-fetch on every keystroke. Stage and min_confidence fire immediately
 * because they're coarse-grained.
 */
export function CompaniesFilterBar({
  value,
  onChange,
  total,
}: CompaniesFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(value.search);
  const [localCountry, setLocalCountry] = useState(value.country);

  useEffect(() => {
    setLocalSearch(value.search);
    setLocalCountry(value.country);
  }, [value.search, value.country]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== value.search) {
        onChange({ ...value, search: localSearch });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localCountry !== value.country) {
        onChange({ ...value, country: localCountry });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCountry]);

  const hasFilters =
    value.search ||
    value.stage ||
    value.country ||
    value.min_confidence > 0;

  return (
    <DataTableToolbar
      actions={
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {total != null ? `${total.toLocaleString()} companies` : ""}
        </span>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name or alias..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="h-9 w-full max-w-[260px] pl-8"
        />
      </div>

      <Select
        value={value.stage || "all"}
        onValueChange={(v) => onChange({ ...value, stage: v === "all" ? "" : v })}
      >
        <SelectTrigger className="h-9 max-w-[160px]">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {SUPPLY_CHAIN_STAGES.map((s) => (
            <SelectItem key={s} value={s}>
              {humanize(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Country (ISO-2)"
        maxLength={2}
        value={localCountry}
        onChange={(e) => setLocalCountry(e.target.value.toUpperCase())}
        className="h-9 max-w-[120px] uppercase"
      />

      <div className="flex w-[220px] items-center gap-2 rounded-md border px-2 py-1 text-xs">
        <span className="text-muted-foreground">Min confidence</span>
        <Slider
          className="flex-1"
          value={[value.min_confidence * 100]}
          min={0}
          max={100}
          step={5}
          onValueChange={(vals) => {
            const v0 = vals[0];
            if (v0 == null) return;
            onChange({ ...value, min_confidence: v0 / 100 });
          }}
        />
        <span className="w-8 tabular-nums text-right font-mono">
          {Math.round(value.min_confidence * 100)}%
        </span>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(INITIAL_FILTERS)}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </DataTableToolbar>
  );
}
