import { useEffect, useState } from 'react'
import { EXERCISE_PLANS, planMinutes } from '../data/exercise'
import { INDICATORS, type IndicatorId } from '../data/indicators'
import type { LocationId } from '../data/locations'
import type { SolarActivity } from '../data/radiation'
import { isCoreDaily, ROUTINE } from '../data/routine'
import { computeAlerts, type HealthAlert } from './alerts'
import { openDb, type Dose, type MindCheck, type Reading, type Workout } from './db'
import { baselineOf, toSummary } from './mindChecks'
import { dbNameFor, settingsKeyFor, type Profile } from './profiles'
import { assessCareer, estimateDose } from './radiation'
import { assessReaction } from './reaction'
import { missionDay, todayStatus } from './routine'
import { assess, worst, type Status } from './rules'

// Mission control: one line per crew member on this device, for the commander or the crew
// medical officer. Each profile's data is read from its own database and only summarised here.

export interface MemberSettings {
  locationId: LocationId
  missionStart: number | null
  priorDoseMSv: number
  solar: SolarActivity
}

export interface MemberRecords {
  readings: Pick<Reading, 'indicatorId' | 'at' | 'values'>[]
  checks: Pick<MindCheck, 'kind' | 'at' | 'score' | 'lapses' | 'falseStarts' | 'responses'>[]
  workouts: Pick<Workout, 'at' | 'minutes'>[]
  doses: Pick<Dose, 'at' | 'mSv'>[]
}

export interface MemberSummary {
  status: Status
  /** Latest reading of each indicator with its status, in the usual order. */
  vitals: { id: IndicatorId; status: Status; at: number }[]
  alerts: HealthAlert[]
  dose: { careerMSv: number; status: Status } | null
  routine: { done: number; total: number }
  lastActivity: number | null
  missionDay: number | null
  locationId: LocationId
  /** True when the crew member has not logged anything for more than a day. */
  quiet: boolean
}

const DAY = 24 * 60 * 60 * 1000

const DEFAULT_SETTINGS: MemberSettings = { locationId: 'orbit', missionStart: null, priorDoseMSv: 0, solar: 'max' }

export function summarizeMember(r: MemberRecords, s: MemberSettings, now: number): MemberSummary {
  const vitals = INDICATORS.flatMap((ind) => {
    const last = r.readings.filter((x) => x.indicatorId === ind.id).reduce<MemberRecords['readings'][number] | undefined>(
      (acc, x) => (!acc || x.at > acc.at ? x : acc),
      undefined,
    )
    return last ? [{ id: ind.id, status: assess(ind.id, last.values).status, at: last.at }] : []
  })

  const reactions = r.checks.filter((c) => c.kind === 'reaction').sort((a, b) => a.at - b.at)
  const lastReaction = reactions.at(-1)
  const alerts = computeAlerts({
    readings: r.readings,
    workouts: r.workouts,
    exerciseTarget: planMinutes(EXERCISE_PLANS[s.locationId]),
    reaction: lastReaction && {
      status: assessReaction(
        toSummary(lastReaction as MindCheck),
        baselineOf(reactions.slice(0, -1) as MindCheck[]),
      ).status,
      at: lastReaction.at,
    },
    now,
  })

  const estimate = estimateDose({
    now,
    location: s.locationId,
    solar: s.solar,
    missionStart: s.missionStart,
    priorMSv: s.priorDoseMSv,
    logs: r.doses,
  })
  const dose = estimate ? { careerMSv: estimate.careerMSv, status: assessCareer(estimate.careerMSv).status } : null

  const daily = ROUTINE.filter(isCoreDaily)
  const statuses = todayStatus(r, now, daily)
  const times = [...r.readings, ...r.checks, ...r.workouts, ...r.doses].map((x) => x.at)
  const lastActivity = times.length ? Math.max(...times) : null

  return {
    status: worst([...vitals.map((v) => v.status), ...alerts.map((a) => a.status), ...(dose ? [dose.status] : [])]),
    vitals,
    alerts,
    dose,
    routine: { done: statuses.filter((x) => x.state === 'done').length, total: daily.length },
    lastActivity,
    missionDay: missionDay(s.missionStart, now),
    locationId: s.locationId,
    quiet: lastActivity === null || now - lastActivity > DAY,
  }
}

/** A profile's saved settings, read without opening it. */
export function readMemberSettings(id: string): MemberSettings {
  try {
    const raw = localStorage.getItem(settingsKeyFor(id))
    const state = raw ? (JSON.parse(raw) as { state?: Partial<MemberSettings> }).state : undefined
    return { ...DEFAULT_SETTINGS, ...state }
  } catch {
    return DEFAULT_SETTINGS
  }
}

async function loadMember(profile: Profile, now: number): Promise<MemberSummary> {
  const d = openDb(dbNameFor(profile.id))
  try {
    const [readings, checks, workouts, doses] = await Promise.all([
      d.readings.where('at').aboveOrEqual(now - 14 * DAY).toArray(),
      d.checks.toArray(),
      d.workouts.toArray(),
      d.doses.toArray(),
    ])
    return summarizeMember({ readings, checks, workouts, doses }, readMemberSettings(profile.id), now)
  } finally {
    d.close()
  }
}

const RANK: Record<Status, number> = { alert: 0, watch: 1, ok: 2 }

/** Every crew member's summary, most urgent first; `undefined` while loading. */
export function useCrewStatus(profiles: Profile[], refreshKey: unknown) {
  const [rows, setRows] = useState<{ profile: Profile; summary: MemberSummary }[]>()
  useEffect(() => {
    let cancelled = false
    const now = Date.now()
    void Promise.all(profiles.map(async (profile) => ({ profile, summary: await loadMember(profile, now) }))).then(
      (list) => {
        if (cancelled) return
        setRows(
          list.sort(
            (a, b) =>
              RANK[a.summary.status] - RANK[b.summary.status] || b.summary.alerts.length - a.summary.alerts.length,
          ),
        )
      },
    )
    return () => {
      cancelled = true
    }
  }, [profiles, refreshKey])
  return rows
}
