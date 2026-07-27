"use client";

import type {
  RegulationGeographyScopeRead,
  RegulationMaterialScopeRead,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  countryName,
  geographyScopeChipClass,
  humanizeGeographyScope,
  humanizeMaterialScope,
  materialDisplayName,
  materialScopeChipClass,
} from "@/lib/utils/regulations";

// ---------------------------------------------------------------------------
// Material scope chips
// ---------------------------------------------------------------------------
// Renders one section per distinct ``scope_type`` so all the
// ``strategic_raw_material`` chips group together, all the
// ``disclosure_required`` chips group together, etc.  This keeps the
// scope-type label off each individual chip and lets colour + group
// header carry the meaning instead.

interface MaterialScopeChipsProps {
  scopes: RegulationMaterialScopeRead[];
  /** Resolves material_id → canonical_name. Pass via parent's material list query. */
  materialNameById?: Record<number, string>;
  className?: string;
}

export function MaterialScopeChips({
  scopes,
  materialNameById,
  className,
}: MaterialScopeChipsProps) {
  if (scopes.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">
        No material scope — applies broadly without naming specific materials.
      </p>
    );
  }

  // Group by scope_type so the colour + section header carry semantics.
  const byScope = new Map<string, RegulationMaterialScopeRead[]>();
  for (const s of scopes) {
    const list = byScope.get(s.scope_type) ?? [];
    list.push(s);
    byScope.set(s.scope_type, list);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from(byScope.entries()).map(([scopeType, group]) => (
        <div key={scopeType}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
            {humanizeMaterialScope(scopeType)}
            <span className="ml-1.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {group.length}
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.map((s) => (
              <span
                key={s.id}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-inset",
                  materialScopeChipClass(scopeType),
                )}
                title={s.notes ?? undefined}
              >
                {materialDisplayName(
                  materialNameById?.[s.material_id] ?? `#${s.material_id}`,
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Geography scope chips
// ---------------------------------------------------------------------------

interface GeographyScopeChipsProps {
  scopes: RegulationGeographyScopeRead[];
  className?: string;
}

const GEO_SCOPE_ORDER = [
  "jurisdiction",
  "targeted_country",
  "origin_country",
] as const;

export function GeographyScopeChips({
  scopes,
  className,
}: GeographyScopeChipsProps) {
  if (scopes.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">
        No geography scope.
      </p>
    );
  }

  // Group by scope_type and render in canonical order so jurisdictions
  // always appear above targeted countries above origin countries.
  const byScope = new Map<string, RegulationGeographyScopeRead[]>();
  for (const s of scopes) {
    const list = byScope.get(s.scope_type) ?? [];
    list.push(s);
    byScope.set(s.scope_type, list);
  }

  // Push known scope_type values in canonical order, then anything else.
  const ordered: Array<[string, RegulationGeographyScopeRead[]]> = [];
  for (const k of GEO_SCOPE_ORDER) {
    const v = byScope.get(k);
    if (v) {
      ordered.push([k, v]);
      byScope.delete(k);
    }
  }
  for (const [k, v] of byScope) ordered.push([k, v]);

  return (
    <div className={cn("space-y-2", className)}>
      {ordered.map(([scopeType, group]) => (
        <div key={scopeType}>
          <p className="mb-1.5 text-xs font-medium text-foreground/70">
            {humanizeGeographyScope(scopeType)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.map((s) => (
              <span
                key={s.id}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-inset",
                  geographyScopeChipClass(scopeType),
                )}
              >
                {countryName(s.country_code)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
