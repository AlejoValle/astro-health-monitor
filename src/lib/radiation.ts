import { CAREER_LIMIT_MSV, DOSE_RATE, type SolarActivity } from '../data/radiation'
import { msg } from '../i18n/msg'
import type { LocationId } from '../data/locations'
import type { Assessment } from './rules'

export const DAY_MS = 24 * 60 * 60 * 1000

/** A reading of the crew member's active dosimeter: total mission dose so far, in mSv. */
export interface DoseLog {
  at: number
  mSv: number
}

export interface DoseEstimate {
  /** Mission dose so far, in mSv. */
  missionMSv: number
  /** Prior career dose plus this mission. */
  careerMSv: number
  /** Expected dose rate at the current location, in mSv per day. */
  rate: number
  /** Where the number comes from. */
  basis: 'dosimeter' | 'estimate'
  /** Days until the career limit at the current rate. */
  daysToLimit: number
}

export const expectedRate = (location: LocationId, solar: SolarActivity) => DOSE_RATE[location][solar]

/**
 * Mission dose now. The latest dosimeter reading is used when there is one, plus the expected
 * rate for the time since it. With no reading, the expected rate times the days since mission start.
 * Returns null when there is neither a mission start nor a reading.
 */
export function estimateDose(opts: {
  now: number
  location: LocationId
  solar: SolarActivity
  missionStart: number | null
  priorMSv: number
  logs: DoseLog[]
}): DoseEstimate | null {
  const { now, location, solar, missionStart, priorMSv, logs } = opts
  const rate = expectedRate(location, solar)
  const last = logs.reduce<DoseLog | undefined>((acc, l) => (!acc || l.at > acc.at ? l : acc), undefined)

  let missionMSv: number
  let basis: DoseEstimate['basis']
  if (last) {
    missionMSv = last.mSv + (rate * Math.max(0, now - last.at)) / DAY_MS
    basis = 'dosimeter'
  } else if (missionStart !== null) {
    missionMSv = (rate * Math.max(0, now - missionStart)) / DAY_MS
    basis = 'estimate'
  } else {
    return null
  }

  const careerMSv = priorMSv + missionMSv
  const daysToLimit = Math.max(0, (CAREER_LIMIT_MSV - careerMSv) / rate)
  return { missionMSv, careerMSv, rate, basis, daysToLimit }
}

/**
 * Dose rate measured between the two latest dosimeter readings, in mSv per day.
 * Null when there are fewer than two readings or they are less than 12 hours apart.
 */
export function measuredRate(logs: DoseLog[]): number | null {
  if (logs.length < 2) return null
  const [a, b] = [...logs].sort((x, y) => x.at - y.at).slice(-2)
  const days = (b.at - a.at) / DAY_MS
  if (days < 0.5) return null
  return Math.max(0, (b.mSv - a.mSv) / days)
}

// Bands below are this app's triage choice. The 600 mSv limit is NASA-STD-3001.

/** Rates the career dose against the NASA limit. */
export function assessCareer(careerMSv: number): Assessment {
  const share = careerMSv / CAREER_LIMIT_MSV
  if (share >= 1)
    return {
      status: 'alert',
      label: msg('Over career limit'),
      advice: msg('Report it to the flight surgeon and the radiation team now. Stay in the most shielded area you can.'),
      escalate: true,
    }
  if (share >= 0.8)
    return {
      status: 'alert',
      label: msg('Close to career limit'),
      advice: msg('Report it to the flight surgeon. Ask the radiation team to review spacewalks and where you sleep.'),
      escalate: true,
    }
  if (share >= 0.5)
    return {
      status: 'watch',
      label: msg('Over half of limit'),
      advice: msg('Keep doses as low as you can: sleep in the most shielded spot and log your dosimeter every week.'),
      escalate: false,
    }
  return {
    status: 'ok',
    label: msg('Within limit'),
    advice: msg('Log your dosimeter reading once a week so your total stays correct.'),
    escalate: false,
  }
}

/** Compares a measured daily rate with what is expected at the location. */
export function assessRate(measured: number, location: LocationId): Assessment {
  const expected = Math.max(DOSE_RATE[location].max, DOSE_RATE[location].min)
  if (measured > expected * 2)
    return {
      status: 'alert',
      label: msg('Far above expected'),
      advice: msg('This may be a solar storm. Go to the storm shelter and report the reading now.'),
      escalate: true,
    }
  if (measured > expected)
    return {
      status: 'watch',
      label: msg('Above expected'),
      advice: msg('Check your dosimeter and log again tomorrow. Mention it in your next report.'),
      escalate: false,
    }
  return {
    status: 'ok',
    label: msg('As expected'),
    advice: msg('Your dosimeter matches the expected dose rate here.'),
    escalate: false,
  }
}
