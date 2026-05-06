"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import {
  GeographyScopeChips,
  MaterialScopeChips,
} from "@/components/regulations/scope-chips";
import { RegulationStatusPill } from "@/components/regulations/regulation-status-pill";
import { useRegulation } from "@/lib/hooks/use-regulations";
import { formatDate } from "@/lib/utils/format";
import { humanizePolicyTheme } from "@/lib/utils/regulations";
import type { RegulationRead } from "@/lib/types";

interface RegulationCardProps {
  regulation: RegulationRead;
  /** material_id → canonical_name for chip labels. Optional; falls back to "#id". */
  materialNameById?: Record<number, string>;
}

export function RegulationCard({
  regulation,
  materialNameById,
}: RegulationCardProps) {
  // Fetch detail to get material_scopes and geography_scopes.
  // Each card triggers its own query — fine at the current 9-regulation
  // scale.  If the count grows, replace with a batched ``GET /regulations``
  // endpoint that returns scopes inline.
  const { data: detail, isLoading } = useRegulation(regulation.id);

  const meta = (regulation.metadata_json ?? {}) as Record<string, unknown>;
  const celex = typeof meta.celex === "string" ? meta.celex : null;

  const subtitleParts = [
    regulation.issuing_body,
    regulation.policy_theme && humanizePolicyTheme(regulation.policy_theme),
    celex ? `CELEX ${celex}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <span className="whitespace-nowrap rounded-md bg-muted px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground">
          {regulation.regulation_key}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="m-0 text-[15px] font-medium leading-snug">
              {regulation.title ?? regulation.regulation_key}
            </h3>
            <VerifiedBadge verified={regulation.verified} />
          </div>
          {subtitleParts.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitleParts.join(" · ")}
            </p>
          )}
        </div>
        <RegulationStatusPill status={regulation.status} />
      </div>

      {/* Meta row */}
      <div className="mb-3.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {regulation.effective_date && (
          <span>
            Effective{" "}
            <strong className="font-medium text-foreground">
              {formatDate(regulation.effective_date)}
            </strong>
          </span>
        )}
        {regulation.publication_date && !regulation.effective_date && (
          <span>
            Published{" "}
            <strong className="font-medium text-foreground">
              {formatDate(regulation.publication_date)}
            </strong>
          </span>
        )}
        {regulation.geography && (
          <span>
            Geography{" "}
            <strong className="font-medium text-foreground">
              {regulation.geography}
            </strong>
          </span>
        )}
      </div>

      {/* Material scope */}
      <div className="border-t border-border/60 pt-3">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
            Material scope
          </p>
          {detail?.material_scopes && detail.material_scopes.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70">
              {detail.material_scopes.length} material
              {detail.material_scopes.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <MaterialScopeChips
            scopes={detail?.material_scopes ?? []}
            materialNameById={materialNameById}
          />
        )}
      </div>

      {/* Geography scope */}
      <div className="mt-3 border-t border-border/60 pt-3">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
            Geography scope
          </p>
          {detail?.geography_scopes && detail.geography_scopes.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70">
              {detail.geography_scopes.length}
            </span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-1/2" />
        ) : (
          <GeographyScopeChips scopes={detail?.geography_scopes ?? []} />
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end border-t border-border/60 pt-3">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href={`/data/regulations/${regulation.id}`}>
            Open detail
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
