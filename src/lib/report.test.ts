import { describe, expect, it } from 'vitest'
import { buildReport, stamp, type ReportInput } from './report'

const AT = new Date(2026, 10, 15, 8, 5).getTime()

const base: ReportInput = {
  generatedAt: AT,
  location: { name: 'Mars surface', gravity: '3/8 of Earth gravity', contact: 'Delayed contact with ground' },
  missionDay: 120,
  vitals: [{ name: 'Blood pressure', value: '142/88', unit: 'mmHg', label: 'High (stage 2)', status: 'alert', at: AT }],
  alerts: [{ status: 'alert', title: 'Possible accumulated fatigue or stress', detail: 'Sleep and mood are both falling.' }],
  radiation: { missionMSv: 64.36, careerMSv: 314, limit: 600, label: 'Over half of limit' },
  exercise: { averageMin: 31.4, targetMin: 120, label: 'Far below target' },
  stress: { score: 9, max: 16, label: 'Building up', at: AT },
  reaction: { ms: 341, label: 'Slower than usual', at: AT },
  routine: { streak: 4, doneToday: 3, totalToday: 5, rank: 'Crew member' },
  note: '  Headache since yesterday.  ',
  simulated: false,
}

describe('buildReport', () => {
  it('formats local time', () => {
    expect(stamp(AT)).toBe('2026-11-15 08:05')
  })

  it('includes every section the flight surgeon needs', () => {
    const text = buildReport(base)
    expect(text).toContain('Location: Mars surface (3/8 of Earth gravity). Contact: Delayed contact with ground.')
    expect(text).toContain('Mission day: 120')
    expect(text).toContain('- [ACT] Possible accumulated fatigue or stress. Sleep and mood are both falling.')
    expect(text).toContain('- Blood pressure: 142/88 mmHg [ACT: High (stage 2)] at 2026-11-15 08:05')
    expect(text).toContain('This mission: 64.4 mSv. Career: 314 of 600 mSv (52%). Over half of limit.')
    expect(text).toContain('31 min a day of 120 planned')
    expect(text).toContain('- Reaction test: 341 ms median (Slower than usual)')
    expect(text).toContain('CREW NOTE\nHeadache since yesterday.')
  })

  it('says so when there is nothing to report and marks demo data', () => {
    const text = buildReport({
      ...base,
      alerts: [],
      vitals: [],
      radiation: undefined,
      exercise: undefined,
      stress: undefined,
      reaction: undefined,
      missionDay: null,
      note: '',
      simulated: true,
    })
    expect(text).toContain('- No early warnings.')
    expect(text).toContain('- No readings yet.')
    expect(text).toContain('NOTE: includes simulated demo data.')
    expect(text).toContain('CREW NOTE\nNone.')
    expect(text).not.toContain('RADIATION')
    expect(text).not.toContain('Mission day')
  })
})
