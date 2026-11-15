import { db, type Dose, type Intake, type Message, type MindCheck, type Reading, type Workout } from './db'
import { getActiveProfileId, listProfiles, settingsKeyFor } from './profiles'

// QR codes and backups: moving data between devices with no network.

/**
 * Bytes put in one QR code. A code can hold about 2,900 at the lowest error correction, but one that
 * dense is hard for a phone camera to read off a screen, so the report is kept to about half.
 */
export const QR_MAX_BYTES = 1500

const bytes = (s: string) => new TextEncoder().encode(s).length

/** The text cut to fit one QR code, ending with a note when it was cut. */
export function fitForQr(text: string, max = QR_MAX_BYTES): { text: string; truncated: boolean } {
  if (bytes(text) <= max) return { text, truncated: false }
  const note = '\n[Shortened to fit. Ask for the full report.]'
  let lines = text.split('\n')
  while (lines.length > 1 && bytes(lines.join('\n') + note) > max) lines = lines.slice(0, -1)
  return { text: lines.join('\n') + note, truncated: true }
}

export const BACKUP_VERSION = 1

export interface Backup {
  app: 'tether'
  version: number
  exportedAt: number
  profile: { name: string }
  settings: unknown
  readings: Reading[]
  checks: MindCheck[]
  workouts: Workout[]
  doses: Dose[]
  intake: Intake[]
  messages: Message[]
}

type Row = { at: number }
const TABLES = ['readings', 'checks', 'workouts', 'doses', 'intake', 'messages'] as const
type Table = (typeof TABLES)[number]

/** A record's identity, ignoring its local id, so the same record is never imported twice. */
export function recordKey(table: Table, r: Row & Record<string, unknown>): string {
  const what = r.indicatorId ?? r.kind ?? r.blockId ?? r.mSv ?? r.text ?? ''
  return `${table}|${r.at}|${String(what)}`
}

/** Incoming records that are not already there, without their ids. */
export function newRecords<T extends Row>(table: Table, existing: T[], incoming: T[]): Omit<T, 'id'>[] {
  const have = new Set(existing.map((r) => recordKey(table, r as T & Record<string, unknown>)))
  return incoming
    .filter((r) => r && typeof r.at === 'number' && !have.has(recordKey(table, r as T & Record<string, unknown>)))
    .map((r) => {
      const copy = { ...r } as T & { id?: number }
      delete copy.id
      return copy
    })
}

export function isBackup(x: unknown): x is Backup {
  const b = x as Backup
  return !!b && b.app === 'tether' && typeof b.version === 'number' && b.version <= BACKUP_VERSION && TABLES.every((t) => Array.isArray(b[t]))
}

/** Everything the active crew member has logged, as a file to save. */
export async function exportBackup(): Promise<Backup> {
  const id = getActiveProfileId()
  const [readings, checks, workouts, doses, intake, messages] = await Promise.all(TABLES.map((t) => db[t].toArray()))
  let settings: unknown
  try {
    settings = JSON.parse(localStorage.getItem(settingsKeyFor(id)) ?? 'null')
  } catch {
    settings = null
  }
  return {
    app: 'tether',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    profile: { name: listProfiles().find((p) => p.id === id)?.name ?? '' },
    settings,
    readings: readings as Reading[],
    checks: checks as MindCheck[],
    workouts: workouts as Workout[],
    doses: doses as Dose[],
    intake: intake as Intake[],
    messages: messages as Message[],
  }
}

/** Adds a backup's records to the active crew member, skipping the ones already there. */
export async function importBackup(b: Backup): Promise<number> {
  let added = 0
  await db.transaction('rw', TABLES.map((t) => db[t]), async () => {
    for (const t of TABLES) {
      const fresh = newRecords(t, (await db[t].toArray()) as Row[], b[t] as Row[])
      // Each table has its own record type; the rows come from a backup of the same schema.
      await (db[t] as unknown as { bulkAdd: (rows: unknown[]) => Promise<unknown> }).bulkAdd(fresh)
      added += fresh.length
    }
  })
  return added
}
