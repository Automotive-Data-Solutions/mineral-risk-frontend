"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/platform/page-header";
import { PageLayout } from "@/components/platform/page-layout";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import {
  GeographyScopeChips,
  MaterialScopeChips,
} from "@/components/regulations/scope-chips";
import { RegulationStatusPill } from "@/components/regulations/regulation-status-pill";
import { ScoringImpactPanel } from "@/components/regulations/scoring-impact-panel";
import { useMaterials } from "@/lib/hooks/use-materials";
import {
  regulationQueryKeys,
  useRegulation,
} from "@/lib/hooks/use-regulations";
import { useToggleRegulationVerified } from "@/lib/hooks/use-verified";
import { useBreadcrumbLabel } from "@/components/platform/breadcrumb-context";
import { formatDate } from "@/lib/utils/format";
import { humanizePolicyTheme } from "@/lib/utils/regulations";

export default function RegulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id);
  const { data: regulation, isLoading, error, refetch } = useRegulation(numericId);

  // Material list for chip name resolution.
  const { data: materialsResp } = useMaterials({ page: 1, limit: 200 });
  const materialNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const m of materialsResp?.data ?? []) {
      map[m.id] = m.canonical_name;
    }
    return map;
  }, [materialsResp]);

  // Surface a friendly breadcrumb instead of the numeric ID.
  useBreadcrumbLabel(id, regulation?.title ?? regulation?.regulation_key);

  const verifyMutation = useToggleRegulationVerified({
    invalidateKeys: [[...regulationQueryKeys.detail(numericId)]],
  });

  if (isLoading) {
    return (
      <PageLayout>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    );
  }

  if (error || !regulation) {
    return (
      <PageLayout>
        <ErrorState
          error={error ?? new Error("Regulation not found")}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  // metadata_json is typed as Record<string, unknown> on the API; coerce to
  // strings here so JSX rendering is type-safe.
  const meta = (regulation.metadata_json ?? {}) as Record<string, unknown>;
  const celex = typeof meta.celex === "string" ? meta.celex : null;
  const seedVersion =
    typeof meta.seed_version === "string" ? meta.seed_version : null;

  const subtitleParts = [
    regulation.issuing_body,
    regulation.policy_theme && humanizePolicyTheme(regulation.policy_theme),
    celex ? `CELEX ${celex}` : null,
  ].filter(Boolean);

  return (
    <PageLayout>
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/data/regulations">
            <ArrowLeft className="size-3.5" />
            Back to regulations
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <VerifyToggleButton
            verified={regulation.verified}
            disabled={verifyMutation.isPending}
            unmarkLabel="Verified"
            highlightWhenVerified
            onToggle={() =>
              verifyMutation.mutate({
                regulationId: numericId,
                verified: !regulation.verified,
              })
            }
          />
          <EntityFlagIssueDialog
            entityType="regulation"
            entityId={String(regulation.id)}
            entityLabel={regulation.title ?? regulation.regulation_key}
          />
        </div>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-muted-foreground">
              {regulation.regulation_key}
            </span>
            <span>{regulation.title ?? regulation.regulation_key}</span>
            <RegulationStatusPill status={regulation.status} />
          </span>
        }
        subtitle={subtitleParts.join(" · ")}
      />

      {/* Summary card */}
      <section className="mt-4 rounded-lg border border-border/60 bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Key metadata */}
          <dl className="grid grid-cols-[max-content,1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Effective</dt>
            <dd>{formatDate(regulation.effective_date)}</dd>
            <dt className="text-muted-foreground">Published</dt>
            <dd>{formatDate(regulation.publication_date)}</dd>
            <dt className="text-muted-foreground">Geography</dt>
            <dd>{regulation.geography ?? "—"}</dd>
            {celex && (
              <>
                <dt className="text-muted-foreground">CELEX</dt>
                <dd className="font-mono text-xs">{celex}</dd>
              </>
            )}
            {seedVersion && (
              <>
                <dt className="text-muted-foreground">Seed version</dt>
                <dd className="font-mono text-xs">{seedVersion}</dd>
              </>
            )}
          </dl>

          {/* Summary text */}
          {regulation.summary && (
            <div className="text-sm leading-relaxed text-muted-foreground">
              {regulation.summary}
            </div>
          )}
        </div>
      </section>


      {/* Scopes */}
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Materials */}
        <div className="rounded-lg border border-border/60 bg-card p-5">
          <h2 className="mb-3 text-sm font-medium">Material scope</h2>
          <MaterialScopeChips
            scopes={regulation.material_scopes}
            materialNameById={materialNameById}
          />
        </div>

        {/* Geographies */}
        <div className="rounded-lg border border-border/60 bg-card p-5">
          <h2 className="mb-3 text-sm font-medium">Geography scope</h2>
          <GeographyScopeChips scopes={regulation.geography_scopes} />
        </div>
      </section>
      
      {/* Scoring impact — surfaces every scoring contribution this
          regulation drives so partner reviewers can validate config */}
      <ScoringImpactPanel
        regulation={regulation}
        materialNameById={materialNameById}
        className="mt-4"
      />

      {/* Notes (placeholder — can be wired later via useEntityNotes) */}
      <section className="mt-4 rounded-lg border border-border/60 bg-card p-5">
        <h2 className="mb-2 text-sm font-medium">Notes</h2>
        <p className="text-xs text-muted-foreground">
          Use the &ldquo;Flag issue&rdquo; button above to add a partner-review
          note to this regulation.
        </p>
      </section>
    </PageLayout>
  );
}
