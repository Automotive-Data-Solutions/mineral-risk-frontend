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

export interface MaterialsFilters {
  search: string;
  category: string;
  is_ira_critical: boolean;
  is_eu_crma_critical: boolean;
  has_mismatched_mappings: boolean;
}

export const INITIAL_MATERIAL_FILTERS: MaterialsFilters = {
  search: "",
  category: "",
  is_ira_critical: false,
  is_eu_crma_critical: false,
  has_mismatched_mappings: false,
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

  const hasFilters =
    value.search ||
    value.category ||
    value.is_ira_critical ||
    value.is_eu_crma_critical ||
    value.has_mismatched_mappings;

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
          className="h-9 w-[260px] pl-8"
        />
      </div>

      <Select
        value={value.category || "all"}
        onValueChange={(v) =>
          onChange({ ...value, category: v === "all" ? "" : v })
        }
      >
        <SelectTrigger className="h-9 w-[180px]">
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
        label="IRA critical"
        active={value.is_ira_critical}
        onClick={() =>
          onChange({ ...value, is_ira_critical: !value.is_ira_critical })
        }
      />
      <FilterToggle
        label="EU CRMA"
        active={value.is_eu_crma_critical}
        onClick={() =>
          onChange({
            ...value,
            is_eu_crma_critical: !value.is_eu_crma_critical,
          })
        }
      />
      <FilterToggle
        label="Mismatched mappings only"
        active={value.has_mismatched_mappings}
        onClick={() =>
          onChange({
            ...value,
            has_mismatched_mappings: !value.has_mismatched_mappings,
          })
        }
        tone="amber"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(INITIAL_MATERIAL_FILTERS)}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </DataTableToolbar>
  );
}

interface FilterToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "default" | "amber";
}

function FilterToggle({
  label,
  active,
  onClick,
  tone = "default",
}: FilterToggleProps) {
  const activeClass =
    tone === "amber"
      ? "border-amber-500 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
      : "border-primary bg-primary/10 text-primary hover:bg-primary/20";
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={active ? activeClass : undefined}
      aria-pressed={active}
    >
      {label}
    </Button>
  );
}
