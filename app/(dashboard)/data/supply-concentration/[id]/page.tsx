'use client'

/**
 * Supply Concentration — per-material detail: the numbers behind the score.
 *
 * V1 stage-max scoring (stage_concentration.py):
 *
 *   sub_score(stage, geo) = hhi_cliff(HHI_stage) × √(share_geo_stage) × 100
 *   pillar(geo)           = MAX over FRESH stages, then the 4.1 governance
 *                           amplifier for the geography
 *
 * The score is ONE stage's number, not a blend — so the transparency view is
 * a per-stage table with the binding row marked. Freshness is a gate, not a
 * caveat: a stale stage that would out-score the fresh max is a finding and
 * gets a banner, not a footnote. The retired criticality inputs are shown as
 * labelled context only.
 */

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ChevronRight, Lock } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageLayout } from '@/components/platform/page-layout'
import { PlatformCard, PlatformCardBody, PlatformCardHeader } from '@/components/platform/platform-card'
import { PlatformTable } from '@/components/platform/platform-table'
import { ScoreChip } from '@/components/platform/score-chip'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CountrySharePill } from '@/components/shared/country-share-pill'
import { SupplyChainStageBadge, type SupplyChainStage } from '@/components/shared/supply-chain-stage-badge'
import { FreshnessBadge } from '@/components/concentration/freshness-badge'
import { GovernanceStep } from '@/components/concentration/governance-step'
import { Notice } from '@/components/concentration/notice'
import { useConcentrationDetail } from '@/lib/hooks/use-concentration'
import { humanize } from '@/lib/utils/format'
import type { CapacityRow, StageDetail } from '@/lib/api/concentration'

const fmtVolume = (v: number | null | undefined) => (v == null ? '—' : new Intl.NumberFormat('en-US').format(v))

export default function SupplyConcentrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const materialId = Number(id)
    const { data, isLoading, error, refetch } = useConcentrationDetail(materialId)

    const [geo, setGeo] = useState<string>('')
    // Default to the driving geography — the one whose score is the material's.
    useEffect(() => {
        if (data) setGeo(data.driving_geo ?? data.producers[0]?.country_code ?? '')
    }, [data])

    const asOfYear = data ? Number(data.as_of.slice(0, 4)) : new Date().getFullYear()
    const g = data && geo ? data.per_geo[geo] : undefined

    const geoOptions = useMemo(() => {
        if (!data) return []
        return Object.keys(data.per_geo).sort((a, b) => (data.per_geo[b]?.score ?? 0) - (data.per_geo[a]?.score ?? 0))
    }, [data])

    /** Capacity grouped per detail_type — streams must never be summed. */
    const capacityStreams = useMemo(() => {
        const map = new Map<string, CapacityRow[]>()
        for (const c of data?.capacity ?? []) {
            if (!map.has(c.detail_type)) map.set(c.detail_type, [])
            map.get(c.detail_type)!.push(c)
        }
        return [...map.entries()].map(
            ([k, v]) => [k, [...v].sort((a, b) => (b.capacity_share ?? 0) - (a.capacity_share ?? 0))] as const
        )
    }, [data])

    const stageColumns = useMemo<ColumnDef<StageDetail, unknown>[]>(() => {
        if (!data) return []
        const subScore = (d: StageDetail): number | null => {
            const share = d.shares[geo]
            if (!share || share <= 0) return null
            return d.hhi_cliff * Math.sqrt(share) * 100
        }
        return [
            {
                id: 'stage',
                header: 'Stage',
                cell: ({ row }) => {
                    const d = row.original
                    const binding = g?.binding_stage === d.stage
                    return (
                        <div className='flex items-center gap-1.5'>
                            {binding && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ChevronRight size={13} className='shrink-0 text-primary' />
                                    </TooltipTrigger>
                                    <TooltipContent side='top' className='max-w-[260px]'>
                                        Binding stage — this sub-score IS the pillar value for the selected geography
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            <span className={d.fresh ? '' : 'opacity-60'}>
                                <SupplyChainStageBadge stage={d.stage as SupplyChainStage} />
                            </span>
                        </div>
                    )
                }
            },
            {
                id: 'hhi',
                header: 'Stage HHI',
                meta: { align: 'right' },
                cell: ({ row }) => {
                    const d = row.original
                    return (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className='inline-flex cursor-help items-baseline gap-1.5'>
                                    <span
                                        className={
                                            'font-mono text-[13px] font-semibold tabular-nums ' +
                                            (d.fresh ? '' : 'text-muted-foreground')
                                        }
                                    >
                                        {d.hhi_raw.toFixed(3)}
                                    </span>
                                    <span className='font-mono text-[9.5px] text-muted-foreground/70'>
                                        →{d.hhi_cliff.toFixed(2)}
                                    </span>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side='top'>
                                Raw Σshare² = {d.hhi_raw.toFixed(3)} · cliff-mapped to {d.hhi_cliff.toFixed(3)}
                            </TooltipContent>
                        </Tooltip>
                    )
                }
            },
            {
                id: 'share',
                header: `Share · ${geo || '—'}`,
                meta: { align: 'right' },
                cell: ({ row }) => {
                    const s = row.original.shares[geo]
                    if (!s || s <= 0) {
                        return (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className='cursor-help text-xs text-muted-foreground/60'>—</span>
                                </TooltipTrigger>
                                <TooltipContent side='top'>
                                    {geo} is not a producer at this stage — non-producers score 0
                                </TooltipContent>
                            </Tooltip>
                        )
                    }
                    return (
                        <span
                            className={
                                'font-mono text-xs tabular-nums ' +
                                (s >= 0.5 ? 'font-semibold ' : '') +
                                (row.original.fresh ? '' : 'text-muted-foreground')
                            }
                        >
                            {(s * 100).toFixed(1)}%
                        </span>
                    )
                }
            },
            {
                id: 'sub',
                header: 'Sub-score',
                meta: { align: 'right' },
                cell: ({ row }) => {
                    const d = row.original
                    const s = subScore(d)
                    if (s == null) {
                        return <span className='font-mono text-xs text-muted-foreground/60'>0.0</span>
                    }
                    const binding = g?.binding_stage === d.stage
                    const wouldWin = !d.fresh && !!g?.understated && g?.stale_best?.stage === d.stage
                    return (
                        <span className='inline-flex items-center justify-end gap-1.5'>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        className={
                                            'cursor-help font-mono text-[13px] tabular-nums ' +
                                            (binding || wouldWin ? 'font-semibold ' : '') +
                                            (wouldWin
                                                ? 'text-red-600'
                                                : d.fresh
                                                  ? ''
                                                  : 'text-muted-foreground/60 line-through')
                                        }
                                    >
                                        {s.toFixed(1)}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side='top' className='max-w-[280px]'>
                                    {d.fresh
                                        ? binding
                                            ? 'Highest fresh sub-score — this is the pillar value before amplification'
                                            : 'Fresh, but below the binding stage'
                                        : 'Excluded from the max by the freshness gate' +
                                          (wouldWin ? ' — and it would otherwise be the binding stage' : '')}
                                </TooltipContent>
                            </Tooltip>
                            {binding && (
                                <span className='inline-flex h-4 items-center rounded border border-primary bg-primary/10 px-1 text-[8.5px] font-semibold uppercase tracking-wide text-primary'>
                                    binding
                                </span>
                            )}
                            {wouldWin && <AlertTriangle size={11} className='text-red-600' />}
                        </span>
                    )
                }
            },
            {
                id: 'fresh',
                header: 'Freshness',
                meta: { align: 'right' },
                cell: ({ row }) => (
                    <FreshnessBadge
                        referenceYear={row.original.reference_year}
                        asOfYear={asOfYear}
                        freshnessYears={data.freshness_years}
                    />
                )
            },
            {
                id: 'source',
                header: 'Source',
                meta: { align: 'right' },
                cell: ({ row }) => (
                    <span className='whitespace-nowrap text-[10px] text-muted-foreground'>
                        {row.original.source === 'usgs_mcs'
                            ? 'USGS MCS'
                            : row.original.source === 'benchmark'
                              ? 'Benchmark'
                              : humanize(row.original.source ?? '—')}
                    </span>
                )
            }
        ]
    }, [data, geo, g, asOfYear])

    if (isLoading || !data) {
        return (
            <PageLayout>
                <PlatformTable data={[]} columns={[]} isLoading error={error} onRetry={() => void refetch()} />
            </PageLayout>
        )
    }

    const driving = data.driving_geo ? data.per_geo[data.driving_geo] : undefined
    const ore = data.stages.find((s) => s.stage === 'ore') ?? null
    const oreDelta = ore && data.prior_ore_hhi ? ore.hhi_raw - data.prior_ore_hhi.hhi_raw : null
    const freshCount = data.stages.filter((s) => s.fresh).length
    const staleCount = data.stages.length - freshCount
    const scarcity =
        data.criticality?.reserve_life_index == null
            ? null
            : Math.max(0, Math.min(1, (80 - data.criticality.reserve_life_index) / 60))

    return (
        <PageLayout>
            <div className='flex items-center justify-between gap-2'>
                <Button variant='ghost' size='sm' asChild>
                    <Link href='/data/supply-concentration'>
                        <ArrowLeft className='mr-1.5 h-3.5 w-3.5' />
                        All materials
                    </Link>
                </Button>
                <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className='cursor-help'>
                                Scored as of <strong className='font-medium text-foreground'>{data.as_of}</strong>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>Freshness is evaluated against this date</TooltipContent>
                    </Tooltip>
                    {data.wgi_vintage != null && <span>WGI {data.wgi_vintage}</span>}
                </div>
            </div>

            {/* Header card */}
            <PlatformCard>
                <PlatformCardBody>
                    <div className='flex flex-wrap items-start justify-between gap-6'>
                        <div>
                            <h1 className='text-2xl font-semibold tracking-tight'>{data.name}</h1>
                            <div className='mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                                {data.symbol && <span className='font-mono'>{data.symbol}</span>}
                                <span>·</span>
                                <span>{data.producers.length} producing countries</span>
                                <span>·</span>
                                <span>
                                    {freshCount} fresh {freshCount === 1 ? 'stage' : 'stages'}
                                    {staleCount ? `, ${staleCount} stale` : ''}
                                </span>
                                {data.unit && (
                                    <>
                                        <span>·</span>
                                        <span>{data.unit}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {driving && data.driving_geo && (
                            <div className='flex flex-col items-end gap-1'>
                                <span className='text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
                                    Pillar score · {data.country_names[data.driving_geo] ?? data.driving_geo}
                                </span>
                                <ScoreChip score={driving.score} />
                                {driving.binding_stage && (
                                    <span className='text-[9.5px] text-muted-foreground/70'>
                                        binding: {humanize(driving.binding_stage)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </PlatformCardBody>
            </PlatformCard>

            {g?.understated && g.stale_best && (
                <Notice tone='amber'>
                    <strong className='font-semibold'>Score understated by staleness.</strong>{' '}
                    {humanize(g.stale_best.stage)} for {data.country_names[geo] ?? geo} last snapshotted in{' '}
                    {g.stale_best.reference_year} and would score{' '}
                    <strong className='font-mono font-semibold'>{g.stale_best.score.toFixed(1)}</strong>, above the
                    fresh max of <strong className='font-mono font-semibold'>{g.raw_score.toFixed(1)}</strong>
                    {g.binding_stage ? ` from ${humanize(g.binding_stage)}` : ''}. The freshness gate excludes it, so
                    the published score sits below a chokepoint we already know about. Refresh the snapshot — the model
                    is behaving correctly.
                </Notice>
            )}

            {data.stages.length === 0 && (
                <Notice tone='amber'>
                    No stage-share rows are mapped for this material, so the concentration pillar has nothing to score.
                    Producer data below is display-only until stages are mapped.
                </Notice>
            )}

            {!ore && data.stages.length > 0 && (
                <Notice tone='slate'>
                    No ore-stage shares are mapped for this material. Stage sub-scores below are computed from the
                    stages that are mapped.
                </Notice>
            )}

            {/* Stage sub-scores — the numbers behind the score */}
            {data.stages.length > 0 && (
                <PlatformCard>
                    <PlatformCardHeader
                        title='Stage sub-scores'
                        subtitle='hhi_cliff(stage HHI) × √(share) × 100 — the pillar is the MAX over fresh stages, not a blend'
                        actions={
                            <div className='flex items-center gap-2'>
                                <span className='text-[10px] text-muted-foreground'>Geography</span>
                                <Select value={geo} onValueChange={setGeo}>
                                    <SelectTrigger className='h-8 w-[170px] text-xs'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {geoOptions.map((c) => (
                                            <SelectItem key={c} value={c} className='text-xs'>
                                                {data.country_names[c] ?? c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        }
                    />
                    <PlatformCardBody noPadding>
                        <PlatformTable data={data.stages} columns={stageColumns} embedded striped={false} />
                    </PlatformCardBody>
                    {g && (
                        <div className='border-t border-border/70 px-4 py-3.5'>
                            <h4 className='mb-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground'>
                                Governance amplifier · {data.country_names[geo] ?? geo}
                            </h4>
                            <GovernanceStep
                                geo={geo}
                                geoName={data.country_names[geo]}
                                result={g}
                                beta={data.governance_beta}
                            />
                        </div>
                    )}
                    <div className='border-t border-border/70 px-4 py-3'>
                        <p className='text-[10px] leading-snug text-muted-foreground'>
                            Stages outside the pillar&rsquo;s scope (<span className='font-mono'>fabricated</span>,{' '}
                            <span className='font-mono'>scrap</span>) are not listed. Each stage HHI is computed from a
                            single reference year — vintages are never mixed. Missing components contribute zero, never
                            a 0.5 default.
                            {oreDelta != null && Math.abs(oreDelta) >= 0.001 && data.prior_ore_hhi && (
                                <>
                                    {' '}
                                    Ore-stage HHI {oreDelta > 0 ? 'rose' : 'fell'}{' '}
                                    <span className='font-mono'>{Math.abs(oreDelta).toFixed(3)}</span> vs{' '}
                                    {data.prior_ore_hhi.reference_year} — rendered as a trend, never as a risk event.
                                </>
                            )}
                        </p>
                    </div>
                </PlatformCard>
            )}

            {/* Producers */}
            <PlatformCard>
                <PlatformCardHeader
                    title='Producers'
                    subtitle={`All ${data.producers.length} countries with published production · capacity is compared per stream below, not here — the denominators differ`}
                    actions={
                        data.unit ? <span className='text-[10.5px] text-muted-foreground'>{data.unit}</span> : undefined
                    }
                />
                <PlatformCardBody noPadding>
                    <PlatformTable
                        embedded
                        data={data.producers}
                        columns={[
                            {
                                id: 'country',
                                header: 'Country',
                                cell: ({ row }) => (
                                    <CountrySharePill
                                        code={row.original.country_code}
                                        name={data.country_names[row.original.country_code]}
                                    />
                                )
                            },
                            {
                                id: 'share',
                                header: 'Production share',
                                cell: ({ row }) => {
                                    const s = row.original.production_share
                                    return (
                                        <div className='flex w-[200px] items-center gap-2'>
                                            <span
                                                className={
                                                    'min-w-[46px] font-mono text-[13px] tabular-nums ' +
                                                    (s >= 0.1 ? 'font-semibold' : '')
                                                }
                                            >
                                                {(s * 100).toFixed(1)}%
                                            </span>
                                            <span className='h-1.5 flex-1 overflow-hidden rounded-sm bg-muted'>
                                                <span
                                                    className={
                                                        'block h-full rounded-sm ' +
                                                        (s >= 0.5
                                                            ? 'bg-red-500'
                                                            : s >= 0.2
                                                              ? 'bg-orange-500'
                                                              : 'bg-slate-400')
                                                    }
                                                    style={{ width: `${s * 100}%` }}
                                                />
                                            </span>
                                        </div>
                                    )
                                }
                            },
                            {
                                id: 'volume',
                                header: 'Volume',
                                meta: { align: 'right' },
                                cell: ({ row }) => (
                                    <span className='font-mono text-xs tabular-nums'>
                                        {fmtVolume(row.original.production_volume)}
                                    </span>
                                )
                            },
                            {
                                id: 'pillar',
                                header: 'Pillar score',
                                meta: { align: 'right' },
                                cell: ({ row }) => {
                                    const gr = data.per_geo[row.original.country_code]
                                    if (!gr || !gr.binding_stage) {
                                        return (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className='cursor-help text-xs text-muted-foreground/60'>
                                                        0
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side='top'>
                                                    No fresh stage share for this country — non-producers score 0
                                                </TooltipContent>
                                            </Tooltip>
                                        )
                                    }
                                    return (
                                        <span className='inline-flex items-center justify-end gap-1.5'>
                                            <span className='font-mono text-xs font-semibold tabular-nums'>
                                                {gr.score.toFixed(1)}
                                            </span>
                                            {gr.understated && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertTriangle size={11} className='text-red-600' />
                                                    </TooltipTrigger>
                                                    <TooltipContent side='top'>
                                                        Understated by a stale stage
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </span>
                                    )
                                }
                            },
                            {
                                id: 'snapshot',
                                header: 'Snapshot',
                                meta: { align: 'right' },
                                cell: ({ row }) => (
                                    <FreshnessBadge
                                        referenceYear={row.original.reference_year}
                                        asOfYear={asOfYear}
                                        freshnessYears={data.freshness_years}
                                        compact
                                    />
                                )
                            },
                            {
                                id: 'source',
                                header: 'Source',
                                meta: { align: 'right' },
                                cell: ({ row }) => (
                                    <span className='whitespace-nowrap text-[10px] text-muted-foreground'>
                                        {row.original.source === 'usgs_mcs'
                                            ? 'USGS MCS'
                                            : humanize(row.original.source ?? '—')}
                                    </span>
                                )
                            }
                        ]}
                    />
                </PlatformCardBody>
            </PlatformCard>

            {/* Capacity streams */}
            <PlatformCard>
                <PlatformCardHeader
                    title='Installed capacity'
                    subtitle={
                        capacityStreams.length
                            ? 'Capacity beside production. Streams are listed separately — one source can publish several, and their denominators differ.'
                            : undefined
                    }
                />
                <PlatformCardBody>
                    {capacityStreams.length === 0 ? (
                        <p className='text-sm text-muted-foreground'>No capacity data published for this material.</p>
                    ) : (
                        <div className='flex flex-col gap-4'>
                            {capacityStreams.map(([stream, rows]) => (
                                <div key={stream} className='flex flex-col gap-2'>
                                    <div className='flex flex-wrap items-baseline gap-2'>
                                        <span className='text-xs font-semibold'>{stream}</span>
                                        <span className='text-[9.5px] text-muted-foreground/70'>
                                            shares computed within this stream · capacity is not a production share and
                                            does not feed the sub-score
                                        </span>
                                    </div>
                                    {rows.map((c) => {
                                        const prod = data.producers.find((p) => p.country_code === c.country_code)
                                        return (
                                            <div key={c.country_code} className='flex items-center gap-2.5'>
                                                <span className='w-[86px] shrink-0'>
                                                    <CountrySharePill
                                                        code={c.country_code}
                                                        name={data.country_names[c.country_code]}
                                                    />
                                                </span>
                                                <div className='grid flex-1 grid-cols-[max-content_1fr_44px] items-center gap-x-1.5 gap-y-1'>
                                                    <span className='whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
                                                        capacity
                                                    </span>
                                                    <span className='h-[7px] overflow-hidden rounded-sm bg-muted'>
                                                        <span
                                                            className='block h-full rounded-sm bg-violet-500'
                                                            style={{ width: `${(c.capacity_share ?? 0) * 100}%` }}
                                                        />
                                                    </span>
                                                    <span className='text-right font-mono text-[10px] font-semibold tabular-nums'>
                                                        {c.capacity_share != null
                                                            ? (c.capacity_share * 100).toFixed(1) + '%'
                                                            : '—'}
                                                    </span>
                                                    <span className='whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
                                                        production
                                                    </span>
                                                    <span className='h-[7px] overflow-hidden rounded-sm bg-muted'>
                                                        <span
                                                            className='block h-full rounded-sm bg-slate-400'
                                                            style={{
                                                                width: `${(prod ? prod.production_share : 0) * 100}%`
                                                            }}
                                                        />
                                                    </span>
                                                    <span
                                                        className={
                                                            'text-right font-mono text-[10px] tabular-nums ' +
                                                            (prod ? '' : 'text-muted-foreground/60')
                                                        }
                                                    >
                                                        {prod ? (prod.production_share * 100).toFixed(1) + '%' : '—'}
                                                    </span>
                                                </div>
                                                <span className='w-[90px] shrink-0 text-right font-mono text-[10px] text-muted-foreground/70'>
                                                    {fmtVolume(c.capacity_volume)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </PlatformCardBody>
            </PlatformCard>

            {/* Retired inputs, demoted and labelled */}
            {data.criticality && (
                <div className='rounded-md border border-dashed border-border bg-muted/30 p-4'>
                    <div className='mb-1 flex flex-wrap items-baseline justify-between gap-3'>
                        <h3 className='text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground'>
                            Criticality signal
                        </h3>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className='inline-flex h-[18px] cursor-help items-center gap-1 rounded border border-border bg-muted px-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground'>
                                    <Lock size={10} />
                                    Context only — does not enter the concentration score
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side='left' className='max-w-[280px]'>
                                Retired from the concentration pillar in V1 stage-max scoring. The engine retains it as
                                rationale context; it is not an input to the score above.
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className='mb-3 max-w-[760px] text-[10.5px] leading-snug text-muted-foreground'>
                        The 70/30 criticality blend and the older five-component composite were replaced by stage-max
                        scoring. Kept here because analysts still reason with reserve life and scarcity — but none of it
                        contributes to the pillar score.
                    </p>
                    <div className='grid grid-cols-1 gap-x-8 gap-y-2 text-xs sm:grid-cols-2'>
                        <div className='flex items-baseline justify-between'>
                            <span className='text-muted-foreground'>Reserve life index</span>
                            <span className='font-mono font-semibold tabular-nums'>
                                {data.criticality.reserve_life_index == null
                                    ? '—'
                                    : `${Math.round(data.criticality.reserve_life_index)} years`}
                            </span>
                        </div>
                        <div className='flex items-baseline justify-between'>
                            <span className='text-muted-foreground'>Reserve scarcity (0 at ≥80y, 1 at ≤20y)</span>
                            <span className='font-mono font-semibold tabular-nums'>
                                {scarcity == null ? '—' : scarcity.toFixed(2)}
                            </span>
                        </div>
                        <div className='flex items-baseline justify-between'>
                            <span className='text-muted-foreground'>MCS production HHI (retired input)</span>
                            <span className='font-mono font-semibold tabular-nums'>
                                {data.criticality.hhi_score == null ? '—' : data.criticality.hhi_score.toFixed(3)}
                            </span>
                        </div>
                        <div className='flex items-baseline justify-between'>
                            <span className='text-muted-foreground'>Reserve HHI (retired input)</span>
                            <span className='font-mono font-semibold tabular-nums'>
                                {data.criticality.reserve_hhi_score == null
                                    ? '—'
                                    : data.criticality.reserve_hhi_score.toFixed(3)}
                            </span>
                        </div>
                        <div className='flex items-baseline justify-between'>
                            <span className='text-muted-foreground'>Capacity utilisation</span>
                            <span className='font-mono font-semibold tabular-nums'>
                                {data.criticality.capacity_utilization == null
                                    ? '—'
                                    : (data.criticality.capacity_utilization * 100).toFixed(0) + '%'}
                            </span>
                        </div>
                        <div className='flex items-baseline justify-between'>
                            <span className='text-muted-foreground'>Production YoY</span>
                            <span className='font-mono font-semibold tabular-nums'>
                                {data.criticality.production_yoy_pct == null
                                    ? '—'
                                    : (data.criticality.production_yoy_pct > 0 ? '+' : '') +
                                      (data.criticality.production_yoy_pct * 100).toFixed(1) +
                                      '%'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <p className='text-[10.5px] leading-relaxed text-muted-foreground'>
                Movement over time is shown here as a trend, deliberately — share shifts are not emitted as risk events,
                so nothing on this page enters the triage queue.
            </p>
        </PageLayout>
    )
}
