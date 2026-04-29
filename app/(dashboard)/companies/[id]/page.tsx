"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, Flag } from "lucide-react";
import { useState, use } from "react";
import { PageLayout } from "@/components/platform/page-layout";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/shared/error-state";
import { DetailHeader } from "@/components/company/detail-header";
import { ExposuresSection } from "@/components/company/sections/exposures-section";
import { RelationshipsSection } from "@/components/company/sections/relationships-section";
import { RegulationsSection } from "@/components/company/sections/regulations-section";
import { EventsSection } from "@/components/company/sections/events-section";
import { FacilitiesSection } from "@/components/company/sections/facilities-section";
import { VehicleModelsSection } from "@/components/company/sections/vehicle-models-section";
import { NotesSection } from "@/components/company/sections/notes-section";
import { FlagIssueDialog } from "@/components/company/flag-issue-dialog";
import { useCompany, useCompanyAllNotes } from "@/lib/hooks/use-companies";

const TABS = [
  { value: "exposures", label: "Exposures" },
  { value: "relationships", label: "Relationships" },
  { value: "regulations", label: "Regulations" },
  { value: "events", label: "Events" },
  { value: "facilities", label: "Facilities" },
  { value: "vehicles", label: "Vehicle Models" },
  { value: "notes", label: "Notes" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: company, isLoading, error, refetch } = useCompany(id);
  const [tab, setTab] = useState<TabValue>("exposures");

  if (isLoading) {
    return (
      <PageLayout>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    );
  }

  if (error || !company) {
    return (
      <PageLayout>
        <ErrorState error={error ?? new Error("Company not found")} onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/companies">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Companies
          </Link>
        </Button>
      </div>

      <DetailHeader
        company={company}
        action={
          <FlagIssueDialog
            companyId={id}
            sectionLabel="Company"
            trigger={
              <Button variant="outline" size="sm">
                <Flag className="h-3.5 w-3.5" />
                Flag company
              </Button>
            }
          />
        }
      />

      <FlaggedIssuesPanel companyId={id} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="exposures" className="mt-3">
          <ExposuresSection companyId={id} />
        </TabsContent>
        <TabsContent value="relationships" className="mt-3">
          <RelationshipsSection companyId={id} />
        </TabsContent>
        <TabsContent value="regulations" className="mt-3">
          <RegulationsSection companyId={id} />
        </TabsContent>
        <TabsContent value="events" className="mt-3">
          <EventsSection companyId={id} />
        </TabsContent>
        <TabsContent value="facilities" className="mt-3">
          <FacilitiesSection companyId={id} />
        </TabsContent>
        <TabsContent value="vehicles" className="mt-3">
          <VehicleModelsSection companyId={id} />
        </TabsContent>
        <TabsContent value="notes" className="mt-3">
          <NotesSection companyId={id} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

function FlaggedIssuesPanel({ companyId }: { companyId: string }) {
  const { data = [] } = useCompanyAllNotes(companyId);
  const [open, setOpen] = useState(true);
  if (data.length === 0) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border bg-amber-50/40 dark:bg-amber-950/10"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <Flag className="h-3.5 w-3.5 text-amber-600" />
            Flagged issues
            <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              {data.length}
            </span>
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-4 py-3">
        <ul className="flex flex-col gap-2 text-sm">
          {data.slice(0, 5).map((n) => (
            <li key={n.id} className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {n.note_type} ·{" "}
                {new Date(n.created_at).toLocaleDateString()}
              </span>
              <span className="whitespace-pre-wrap">{n.note_text}</span>
            </li>
          ))}
          {data.length > 5 && (
            <li className="text-xs text-muted-foreground">
              +{data.length - 5} more – see the Notes tab.
            </li>
          )}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
