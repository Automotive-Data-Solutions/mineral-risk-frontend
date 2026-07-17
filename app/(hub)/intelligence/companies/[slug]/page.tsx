"use client";

/**
 * Public company profile — /intelligence/companies/[slug].
 * Informative-first launch (2026-07-15): identity, supply chain, and
 * facility exposure only. Hidden until later phases: risk bands/scores,
 * linked intelligence (posts/events), methodology links, subscribe.
 * The lede renders companies.public_intro and is omitted when unset.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/hub/Nav";
import { Breadcrumb } from "@/components/hub/entity/Breadcrumb";
import { EntityHeader } from "@/components/hub/entity/EntityHeader";
import { Section } from "@/components/hub/entity/Section";
import { ExposureRow } from "@/components/hub/entity/ExposureRow";
import { FacilityRow } from "@/components/hub/entity/FacilityRow";
import { IntroBlocks } from "@/components/hub/entity/IntroBlocks";
import { Footer } from "@/components/hub/Footer";
import { getPublicCompany, type PublicCompanyProfile } from "@/lib/api/entities";

export default function CompanyProfilePage() {
  const params = useParams<{ slug: string }>();
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!params?.slug) return;
    getPublicCompany(params.slug)
      .then((c) => {
        setCompany(c);
        setState("ready");
      })
      .catch((e: Error) => setState(e.message === "404" ? "missing" : "error"));
  }, [params?.slug]);

  if (state !== "ready" || !company) {
    return (
      <div className="ih-page">
        <Nav section="companies" />
        <main className="ih-entity-main">
          <div className="ih-browse-meta">
            {state === "loading"
              ? "Loading…"
              : state === "missing"
                ? "Company not found."
                : "Couldn't load this company — try again shortly."}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ih-page">
      <Nav section="companies" />
      <main className="ih-entity-main">
        <Breadcrumb
          trail={[
            { label: "Intelligence", href: "/intelligence" },
            { label: "Companies", href: "/intelligence/companies" },
            { label: company.name },
          ]}
        />

        <EntityHeader
          eyebrow="Company"
          title={company.name}
          subtitle={company.legal_name}
          facts={company.facts}
        />

        <IntroBlocks text={company.intro} />

        <div className="ih-entity-single-col">
          <Section
            title="Material exposure"
            aside={company.exposures.length ? `${company.exposures.length} tracked` : null}
          >
            {company.exposures.length ? (
              <div className="ih-expo-list">
                {company.exposures.map((e, i) => (
                  <ExposureRow key={i} row={e} />
                ))}
              </div>
            ) : (
              <p className="ih-empty-note">No tracked material exposures yet.</p>
            )}
          </Section>

          <Section
            title="Facilities & geography"
            aside={
              company.facilities_total > company.facilities.length
                ? `${company.facilities.length} of ${company.facilities_total} shown`
                : company.facilities.length
                  ? `${company.facilities.length} tracked`
                  : null
            }
          >
            {company.facilities.length ? (
              <div className="ih-fac-list">
                {company.facilities.map((f, i) => (
                  <FacilityRow key={i} row={f} />
                ))}
              </div>
            ) : (
              <p className="ih-empty-note">No tracked facilities yet.</p>
            )}
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
