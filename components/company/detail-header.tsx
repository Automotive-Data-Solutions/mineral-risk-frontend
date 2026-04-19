"use client";

import Link from "next/link";
import {
  Building2,
  MapPin,
  Tag,
  TrendingUp,
} from "lucide-react";
import { StageBadge } from "@/components/shared/stage-badge";
import { CountryFlag } from "@/components/shared/country-flag";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import type { CompanyDetail } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

interface DetailHeaderProps {
  company: CompanyDetail;
  action?: React.ReactNode;
}

export function DetailHeader({ company, action }: DetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {company.canonical_name}
            </h1>
            {company.public_ticker && (
              <span className="rounded border bg-background px-1.5 py-0.5 font-mono text-xs">
                {company.public_ticker}
              </span>
            )}
          </div>
          {company.legal_name &&
            company.legal_name !== company.canonical_name && (
              <p className="text-sm text-muted-foreground">{company.legal_name}</p>
            )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <StageBadge stage={company.supply_chain_stage} />
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <CountryFlag code={company.headquarters_country} />
              {company.headquarters_region && (
                <span>· {company.headquarters_region}</span>
              )}
            </span>
            {company.parent && (
              <span className="inline-flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Parent:{" "}
                <Link
                  className="font-medium text-foreground hover:underline"
                  href={`/companies/${company.parent.id}`}
                >
                  {company.parent.canonical_name}
                </Link>
              </span>
            )}
            {company.lei && (
              <span className="font-mono">LEI: {company.lei}</span>
            )}
            {company.duns_number && (
              <span className="font-mono">DUNS: {company.duns_number}</span>
            )}
          </div>
          {company.aliases && company.aliases.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
              <span className="text-muted-foreground">Aliases:</span>
              {company.aliases.map((a) => (
                <span
                  key={a.id}
                  className="rounded-full border bg-muted/50 px-2 py-0.5"
                  title={humanize(a.alias_type)}
                >
                  {a.alias}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <ConfidenceBadge value={company.data_confidence} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {company.is_public ? "Public" : "Private"}
        </div>
        {action}
      </div>
    </div>
  );
}
