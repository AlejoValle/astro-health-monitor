import { useEffect, useState } from 'react'
import { msg } from '../i18n/msg'
import { openDb } from './db'
import { dbNameFor, type Profile } from './profiles'

// Crew goals are shared, not a competition: cohesion is one of the risks NASA tracks for
// isolated crews. Each profile's database is read on its own and only counts are combined.

const DAY = 24 * 60 * 60 * 1000
const dayStart = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export interface MemberToday {
  profileId: string
  sleepLogged: boolean
  exerciseMin: number
  mindThisWeek: boolean
}

/** Exercise minutes the crew aims for together each day, per crew member. */
export const CREW_MINUTES_EACH = 60

export interface CrewGoal {
  id: 'sleep' | 'exercise' | 'mind'
  title: string
  /** Members who have done their part (for per-member goals). */
  done: string[]
  value: number
  target: number
  complete: boolean
}

export function crewGoals(members: MemberToday[]): CrewGoal[] {
  const n = members.length
  const sleep = members.filter((m) => m.sleepLogged).map((m) => m.profileId)
  const mind = members.filter((m) => m.mindThisWeek).map((m) => m.profileId)
  const minutes = members.reduce((sum, m) => sum + m.exerciseMin, 0)
  return [
    { id: 'sleep', title: msg('Everyone logs last night’s sleep'), done: sleep, value: sleep.length, target: n, complete: n > 0 && sleep.length === n },
    {
      id: 'exercise',
      title: msg('Crew exercise minutes today'),
      done: members.filter((m) => m.exerciseMin > 0).map((m) => m.profileId),
      value: minutes,
      target: CREW_MINUTES_EACH * n,
      complete: n > 0 && minutes >= CREW_MINUTES_EACH * n,
    },
    { id: 'mind', title: msg('Everyone does a mind check or brain game this week'), done: mind, value: mind.length, target: n, complete: n > 0 && mind.length === n },
  ]
}

async function memberToday(profile: Profile, now: number): Promise<MemberToday> {
  const d = openDb(dbNameFor(profile.id))
  try {
    const today = dayStart(now)
    const [sleep, workouts, checks] = await Promise.all([
      d.readings.where('[indicatorId+at]').between(['sleep', today], ['sleep', Infinity]).count(),
      d.workouts.where('at').aboveOrEqual(today).toArray(),
      d.checks.filter((c) => c.at >= now - 7 * DAY && c.kind !== 'quiz').count(),
    ])
    return {
      profileId: profile.id,
      sleepLogged: sleep > 0,
      exerciseMin: workouts.reduce((s, w) => s + w.minutes, 0),
      mindThisWeek: checks > 0,
    }
  } finally {
    d.close()
  }
}

/** Today's progress of every crew member, read in the background; `undefined` while loading. */
export function useCrewToday(profiles: Profile[], refreshKey: unknown): MemberToday[] | undefined {
  const [members, setMembers] = useState<MemberToday[]>()
  useEffect(() => {
    let cancelled = false
    void Promise.all(profiles.map((p) => memberToday(p, Date.now()))).then((m) => {
      if (!cancelled) setMembers(m)
    })
    return () => {
      cancelled = true
    }
  }, [profiles, refreshKey])
  return members
}
