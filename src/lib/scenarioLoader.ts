import { SCENARIOS, type Scenario } from '../data/scenarios'
import type { Lang } from '../i18n'
import { deleteProfileData, openDb, type Dose, type MindCheck, type Reading, type Workout } from './db'
import { createProfile, dbNameFor, listProfiles, removeProfile, seedProfileSettings, type Profile } from './profiles'

const DAY = 24 * 60 * 60 * 1000

/**
 * Creates a demo crew member for a use case, with its own database and settings, or returns the
 * one already created for it.
 */
export async function loadScenario(s: Scenario, language: Lang): Promise<Profile> {
  const existing = listProfiles().find((p) => p.scenario === s.id)
  if (existing) return existing

  const now = Date.now()
  const data = s.build(now)
  const profile = createProfile({ name: s.person, role: s.role, scenario: s.id })
  const target = openDb(dbNameFor(profile.id))
  await target.transaction('rw', [target.readings, target.checks, target.workouts, target.doses], async () => {
    await target.readings.bulkAdd(data.readings as Reading[])
    await target.checks.bulkAdd(data.checks as MindCheck[])
    await target.workouts.bulkAdd(data.workouts as Workout[])
    await target.doses.bulkAdd(data.doses as Dose[])
  })
  target.close()
  seedProfileSettings(profile.id, {
    locationId: s.location,
    missionStart: now - s.missionDays * DAY,
    priorDoseMSv: s.priorDoseMSv,
    solar: 'max',
    reminders: false,
    language,
  })
  return profile
}

export async function loadAllScenarios(language: Lang) {
  for (const s of SCENARIOS) await loadScenario(s, language)
}

/** Deletes every demo crew member created from a use case. */
export async function removeDemoCrew() {
  for (const p of listProfiles().filter((x) => x.scenario)) {
    await deleteProfileData(p.id)
    removeProfile(p.id)
  }
}
