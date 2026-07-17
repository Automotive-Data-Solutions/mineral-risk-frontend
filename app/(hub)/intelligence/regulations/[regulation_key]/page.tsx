"use client";

/**
 * Public regulation detail — /intelligence/regulations/[regulation_key].
 * Informative-first launch (2026-07-15): facts, summary, 3-stage timeline
 * (Proposed → Enacted → Effective), scope chips, source when present.
 * Hidden until later phases: scoring-impact panel (both the mock's fake
 * numbers AND the real compliance weights), linked posts.
 * Verified-gated server-side — unverified keys 404.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/hub/Nav";
import { Breadcrumb } from "@/components/hub/entity/Breadcrumb";
import { EntityHeader } from "@/components/hub/entity/EntityHeader";
import { Section } from "@/components/hub/entity/Section";
import { ScopeChips } from "@/components/hub/entity/ScopeChips";
import { TimelineStrip } from "@/components/hub/entity/TimelineStrip";
import { IntroBlocks } from "@/components/hub/entity/IntroBlocks";
import { Footer } from "@/components/hub/Footer";
import { getPublicRegulation, type PublicRegulationDetail } from "@/lib/api/entities";

export default function RegulationDetailPage() {
  const params = useParams<{ regulation_key: string }>();
  const [reg, setReg] = useState<PublicRegulationDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!params?.regulation_key) return;
    getPublicRegulation(decodeURIComponent(params.regulation_key))
      .then((r) => {
        setReg(r);
        setState("ready");
      })
      .catch((e: Error) => setState(e.message === "404" ? "missing" : "error"));
  }, [params?.regulation_key]);

  if (state !== "ready" || !reg) {
    return (
      <div className="ih-page">
        <Nav section="regulations" />
        <main className="ih-entity-main">
          <div className="ih-browse-meta">
            {state === "loading"
              ? "Loading…"
              : state === "missing"
                ? "Regulation not found."
                : "Couldn't load this regulation — try again shortly."}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const facts = [
    { label: "Key", value: reg.regulation_key, mono: true },
    ...(reg.geography ? [{ label: "Geography", value: reg.geography, mono: false }] : []),
    ...(reg.theme ? [{ label: "Theme", value: reg.theme, mono: false }] : []),
    ...(reg.status ? [{ label: "Status", value: reg.status, mono: false }] : []),
  ];

  return (
    <div className="ih-page">
      <Nav section="regulations" />
      <main className="ih-entity-main">
        <Breadcrumb
          trail={[
            { label: "Intelligence", href: "/intelligence" },
            { label: "Regulations", href: "/intelligence/regulations" },
            { label: reg.regulation_key },
          ]}
        />

        <EntityHeader
          eyebrow="Regulation"
          title={reg.title ?? reg.regulation_key}
          subtitle={reg.issuer}
          facts={facts}
        />

        <IntroBlocks text={reg.summary} />

        <div className="ih-entity-single-col">
          <Section title="Status & key dates">
            <TimelineStrip nodes={reg.timeline} />
          </Section>

          {reg.materials_scope.length || reg.geographies_scope.length ? (
            <Section title="Scope">
              <div className="ih-scope">
                <ScopeChips
                  label="Materials in scope"
                  items={reg.materials_scope.map((m) => m.material)}
                  kind="mat"
                />
                <ScopeChips
                  label="Geographies in scope"
                  items={reg.geographies_scope.map((g) => g.country_code)}
                  kind="geo"
                />
              </div>
            </Section>
          ) : null}

          {reg.source_url ? (
            <Section title="Source">
              <a
                className="ih-cta ih-cta-inline"
                href={reg.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View source →
              </a>
            </Section>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
