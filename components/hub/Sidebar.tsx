'use client'

/**
 * Hub sidebar — material risk bars wired to the live API (2026-07-21),
 * replacing the design-phase mock values.
 *
 * Data: GET /intelligence/risk-summary — latest L2 global rollup per
 * material (the SAME numbers as the platform materials page), banded by
 * the shared 25/45/60/insufficient-data rules server-side.
 *
 * Display (curated full-spectrum, decided 2026-07-21 — replaced the
 * brief top-N hybrid the same day): a fixed list of battery-chain
 * materials a reader will recognize, spanning the whole band range
 * (Crit down to Low) so the panel shows the model discriminates.
 * Deliberate tradeoffs: by-product minor metals (gallium, magnesium,
 * bismuth — currently the top absolute scorers) are NOT shown here;
 * they belong in ranking/report surfaces, not the orientation sidebar.
 * Zinc is included solely to anchor the Low end — no core battery
 * material scores below Mod, which is itself the finding.
 * Order still follows the API (score DESC), so band cut changes or
 * rescores reorder the list automatically; unknown names are skipped.
 *
 * Pillar counts below remain mock until the per-pillar count endpoint
 * exists; the subscribe form is not yet wired to a backend.
 */

import { useEffect, useState } from 'react'
import { PillarStat } from './types'
import { PILLARS as PILLAR_SOURCE } from './pillars'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** Curated sidebar materials (canonical names, API spelling). */
const SIDEBAR_MATERIALS = new Set([
    'Gallium',
    'Natural Graphite',
    'Cobalt',
    'Rare Earth Elements',
    'Nickel',
    'Manganese',
    'Lithium',
    'Copper',
    'Iron Ore',
    'Zinc'
])

/** Long canonical names → sidebar-width display names. */
const DISPLAY_NAME: Record<string, string> = {
    'Natural Graphite': 'Nat. Graphite',
    'Synthetic Graphite': 'Syn. Graphite',
    'Rare Earth Elements': 'Rare Earths',
    'Silicon (Anode Grade)': 'Silicon (Anode)',
    'Platinum-Group Metals': 'PGMs'
}

const LEVEL_LABEL: Record<string, string> = {
    crit: 'Crit',
    high: 'High',
    med: 'Med',
    low: 'Low'
}

/** API shape — mirrors MaterialRiskBar / RiskSummary (app/schemas/intelligence.py). */
interface ApiRiskBar {
    material_id: number
    material_name: string
    band: {
        label: string
        level: 'crit' | 'high' | 'med' | 'low'
        score: number | null
    }
}

interface ApiRiskSummary {
    as_of_date: string | null
    materials: ApiRiskBar[]
}

function formatAsOf(iso: string): string {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    })
}

function MatRow({ bar }: { bar: ApiRiskBar }) {
    const score = bar.band.score ?? 0
    return (
        <div className='ih-mat-row'>
            <span className='ih-mat-name' title={bar.material_name}>
                {DISPLAY_NAME[bar.material_name] ?? bar.material_name}
            </span>
            <div className='ih-mat-track'>
                <div
                    className={`ih-mat-fill ih-mat-${bar.band.level}`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
            </div>
            <span className={`ih-mat-level ih-mat-level-${bar.band.level}`}>
                {LEVEL_LABEL[bar.band.level] ?? bar.band.label}
            </span>
        </div>
    )
}

// Colours/labels from the shared pillar source; counts remain mock until
// the per-pillar content-count endpoint exists.
const PILLARS: PillarStat[] = [
    { name: PILLAR_SOURCE.regulatory_compliance.label, count: 14, color: PILLAR_SOURCE.regulatory_compliance.color },
    { name: PILLAR_SOURCE.material_concentration.label, count: 12, color: PILLAR_SOURCE.material_concentration.color },
    { name: PILLAR_SOURCE.geopolitical_trade.label, count: 9, color: PILLAR_SOURCE.geopolitical_trade.color },
    { name: PILLAR_SOURCE.operational.label, count: 7, color: PILLAR_SOURCE.operational.color },
    { name: PILLAR_SOURCE.financial_pressure.label, count: 5, color: PILLAR_SOURCE.financial_pressure.color }
]

export function Sidebar() {
    const [summary, setSummary] = useState<ApiRiskSummary | null>(null)

    useEffect(() => {
        let cancelled = false
        fetch(`${API_BASE}/api/v1/intelligence/risk-summary`)
            .then((r) => {
                if (!r.ok) throw new Error(String(r.status))
                return r.json()
            })
            .then((json: ApiRiskSummary) => {
                if (!cancelled) setSummary(json)
            })
            .catch(() => {
                /* On error the whole block stays hidden — never show stale or
           invented numbers on the public site. */
            })
        return () => {
            cancelled = true
        }
    }, [])

    const bars = (summary?.materials ?? []).filter((b) => SIDEBAR_MATERIALS.has(b.material_name))

    return (
        <aside className='ih-sidebar'>
            {/* Material risk bars — hidden until live data arrives */}
            {bars.length > 0 ? (
                <section className='ih-side-block'>
                    <div className='ih-eyebrow'>Material risk</div>

                    <div className='ih-mat-list'>
                        {bars.map((b) => (
                            <MatRow key={b.material_id} bar={b} />
                        ))}
                    </div>

                    {summary?.as_of_date ? (
                        <div className='ih-mat-asof'>Scores as of {formatAsOf(summary.as_of_date)}</div>
                    ) : null}
                </section>
            ) : null}

            {/* Browse by pillar */}
            <section className='ih-side-block'>
                <div className='ih-eyebrow'>Browse by pillar</div>
                <div className='ih-pillars'>
                    {PILLARS.map((p) => (
                        <button key={p.name} className='ih-pillar-btn' style={{ color: p.color }}>
                            <span className='ih-pillar-l'>
                                <span className='ih-pillar-dot' style={{ background: p.color }} />
                                {p.name}
                            </span>
                            <span className='ih-pillar-n'>{p.count}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Subscribe */}
            <section className='ih-side-block ih-subscribe'>
                <div className='ih-eyebrow ih-eyebrow-on-dark'>Subscribe</div>
                <p className='ih-subscribe-copy'>
                    Weekly intelligence digest — new analysis, signals, and reports delivered to your inbox.
                </p>
                <input type='email' placeholder='your@email.com' />
                <button className='ih-btn-primary ih-btn-block'>Subscribe →</button>
            </section>
        </aside>
    )
}
