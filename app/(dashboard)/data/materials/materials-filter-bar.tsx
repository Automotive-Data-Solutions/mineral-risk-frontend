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
import { DataTableToolbar } from "@/components/data-table/toolbar";

// 2026-05-11: filter bar simplified.  Dropped the IRA / EU CRMA / HS-
// mismatch toggles — those were either redundant with how we now display
// rows (badges retired) or referenced UI that no longer exists (mismatch
// view).  Replaced with a single "Launch list only" toggle defaulted on,
// so the page lands on the core 10 minerals for the analyst audience and
// users have to opt-in to see the long tail.

export interface MaterialsFilters {
  search: string;
  category: string;
  /** Scope the table to launch-list materials (the v1 core 10).
   *  Defaults to true so the analyst lands on the relevant set. */
  launch_list_only: boolean;
}

export const INITIAL_MATERIAL_FILTERS: MaterialsFilters = {
  search: "",
  category: "",
  launch_list_only: true,
};

// Curated category list. The backend should still accept arbitrary categories
// from the materials table — this is just a usability hint for analysts.
const CATEGORIES: { value: string; label: string }[] = [
  { value: "metal", label: "Metal" },
  { value: "mineral", label: "Mineral" },
  { value: "compound", label: "Chemical compound" },
  { value: "polymer", label: "Polymer" },
  { value: "graphite", label: "Graphite" },
  { value: "other", label: "Other" },
];

interface MaterialsFilterBarProps {
  value: MaterialsFilters;
  onChange: (next: MaterialsFilters) => void;
  total?: number;
}

export function MaterialsFilterBar({
  value,
  onChange,
  total,
}: MaterialsFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(value.search);

  useEffect(() => {
    setLocalSearch(value.search);
  }, [value.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== value.search) {
        onChange({ ...value, search: localSearch });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // "Has filters" — used to decide whether to render the Clear button.
  // Launch-list-only is the DEFAULT, so treat it as "set" only when the
  // user has flipped it off (which is the non-default state).
  const hasNonDefaultFilters =
    value.search ||
    value.category ||
    value.launch_list_only !== INITIAL_MATERIAL_FILTERS.launch_list_only;

  return (
    <DataTableToolbar
      actions={
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {total != null ? `${total.toLocaleString()} materials` : ""}
        </span>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search material name..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="h-9 w-full min-w-[160px] max-w-[260px] pl-8"
        />
      </div>

      <Select
        value={value.category || "all"}
        onValueChange={(v) =>
          onChange({ ...value, category: v === "all" ? "" : v })
        }
      >
        <SelectTrigger className="h-9 w-full min-w-[140px] max-w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FilterToggle
        label="Launch list only"
        active={value.launch_list_only}
        onClick={() =>
          onChange({ ...value, launch_list_only: !value.launch_list_only })
        }
      />

      {hasNonDefaultFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(INITIAL_MATERIAL_FILTERS)}
        >
          <X className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </DataTableToolbar>
  );
}

interface FilterToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterToggle({ label, active, onClick }: FilterToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={
        active
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
          : undefined
      }
      aria-pressed={active}
    >
      {label}
    </Button>
  );
}
