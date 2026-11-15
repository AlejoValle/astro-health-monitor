import type { IndicatorId } from '../data/indicators'
import { msg } from '../i18n/msg'

export type Status = 'ok' | 'watch' | 'alert'

export interface Assessment {
  status: Status
  label: string
  advice: string
  /** True when the flight surgeon should be contacted. */
  escalate: boolean
}

const ok = (label: string, advice: string): Assessment => ({ status: 'ok', label, advice, escalate: false })
const watch = (label: string, advice: string): Assessment => ({ status: 'watch', label, advice, escalate: false })
const alert = (label: string, advice: string, escalate = true): Assessment => ({
  status: 'alert',
  label,
  advice,
  escalate,
})

// Category boundaries come from the cited clinical sources (see data/sources.ts).
// How a category maps to ok / watch / alert is this app's triage choice.

/** AHA blood pressure categories. */
function bloodPressure(sys: number, dia: number): Assessment {
  if (sys > 180 || dia > 120)
    return alert(
      msg('Severe'),
      msg('Wait 1 minute and measure again. If it is still this high, contact the flight surgeon now.'),
    )
  if (sys >= 140 || dia >= 90)
    return alert(msg('High (stage 2)'), msg('Rest, measure again in 1 hour and report it to the flight surgeon.'))
  if (sys >= 130 || dia >= 80)
    return watch(msg('High (stage 1)'), msg('Measure again tomorrow at the same time and watch the trend.'))
  if (sys >= 120) return watch(msg('Elevated'), msg('Keep your exercise routine and measure again tomorrow.'))
  return ok(msg('Normal'), msg('Keep your routine.'))
}

/** AHA: normal resting heart rate is 60 to 100 bpm. */
function heartRate(bpm: number): Assessment {
  if (bpm > 100)
    return watch(msg('Fast'), msg('Rest 5 minutes and measure again. A fast pulse can be temporary.'))
  if (bpm < 60)
    return watch(msg('Slow'), msg('Often normal for fit people. Measure again if you feel dizzy or weak.'))
  return ok(msg('Normal'), msg('Keep your routine.'))
}

/** ADA: low below 70 mg/dL; fasting normal below 100, prediabetes 100 to 125, diabetes from 126. */
function fastingGlucose(mgdl: number): Assessment {
  if (mgdl < 70)
    return alert(msg('Low'), msg('Take 15 g of fast-acting carbs now and measure again in 15 minutes.'))
  if (mgdl >= 126) return alert(msg('High'), msg('Measure again tomorrow fasting and report it to the flight surgeon.'))
  if (mgdl >= 100) return watch(msg('Above normal'), msg('Review your meals and measure again tomorrow fasting.'))
  return ok(msg('Normal'), msg('Keep your routine.'))
}

/** CDC: fever is a measured temperature of 38 °C (100.4 °F) or greater. */
function temperature(c: number): Assessment {
  if (c >= 38) return alert(msg('Fever'), msg('Rest, drink fluids and report it. Measure again in 2 hours.'))
  return ok(msg('No fever'), msg('Keep your routine.'))
}

/** CDC: adults aged 18 to 60 need 7 or more hours per night. */
function sleep(h: number): Assessment {
  if (h >= 7) return ok(msg('Enough'), msg('Keep your sleep schedule.'))
  if (h >= 6) return watch(msg('Short'), msg('Plan an earlier sleep period tonight.'))
  return alert(msg('Too short'), msg('Avoid critical tasks if you can and tell your crew you are short on sleep.'), false)
}

/** Self-rated mood, 1 (very low) to 5 (very good). Not a clinical scale. */
function mood(score: number): Assessment {
  if (score >= 4) return ok(msg('Good'), msg('Keep doing what works for you.'))
  if (score === 3) return ok(msg('Neutral'), msg('Take a short break or play a calming sound.'))
  if (score === 2) return watch(msg('Low'), msg('Try the mind check and talk with a crewmate today.'))
  return alert(msg('Very low'), msg('Do the mind check and ask for a private conference with the ground team.'), false)
}

export function assess(id: IndicatorId, values: number[]): Assessment {
  switch (id) {
    case 'bp':
      return bloodPressure(values[0], values[1])
    case 'hr':
      return heartRate(values[0])
    case 'glucose':
      return fastingGlucose(values[0])
    case 'temp':
      return temperature(values[0])
    case 'sleep':
      return sleep(values[0])
    case 'mood':
      return mood(values[0])
  }
}

const RANK: Record<Status, number> = { ok: 0, watch: 1, alert: 2 }

export function worst(statuses: Status[]): Status {
  return statuses.reduce<Status>((acc, s) => (RANK[s] > RANK[acc] ? s : acc), 'ok')
}

export function formatValue(id: IndicatorId, values: number[]): string {
  if (id === 'bp') return `${values[0]}/${values[1]}`
  if (id === 'temp') return values[0].toFixed(1)
  return String(values[0])
}
