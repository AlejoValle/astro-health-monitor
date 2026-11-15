import { DatabaseBackup, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useT } from '../i18n'
import { exportBackup, importBackup, isBackup } from '../lib/backup'

/** Saves the active crew member's data to a file, or adds a saved file back, with no network. */
export function BackupCard() {
  const t = useT()
  const file = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  const save = async () => {
    const b = await exportBackup()
    const url = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `tether-backup-${(b.profile.name || 'crew').replace(/\W+/g, '-').toLowerCase()}-${new Date(b.exportedAt).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus(t('Backup saved.'))
  }

  const restore = async (f: File) => {
    try {
      const data: unknown = JSON.parse(await f.text())
      if (!isBackup(data)) {
        setStatus(t('This file is not a Tether backup.'))
        return
      }
      const n = await importBackup(data)
      setStatus(t('{n} records added. Records already here were skipped.', { n }))
    } catch {
      setStatus(t('This file is not a Tether backup.'))
    }
  }

  return (
    <section className="panel rounded-3xl p-5">
      <h2 className="label flex items-center gap-2">
        <DatabaseBackup size={14} aria-hidden /> {t('Backup')}
      </h2>
      <p className="mt-2 text-sm text-ink-dim">
        {t('Save your data to a file, or add it to another device, with no network. Restoring only adds records that are missing.')}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void save()} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink text-sm font-semibold text-space">
          <Download size={16} aria-hidden /> {t('Save backup')}
        </button>
        <button type="button" onClick={() => file.current?.click()} className="panel flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium">
          <Upload size={16} aria-hidden /> {t('Restore')}
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void restore(f)
          e.target.value = ''
        }}
      />
      {status && (
        <p className="mt-2 text-sm text-ink-dim" role="status">
          {status}
        </p>
      )}
    </section>
  )
}
