import { Check, FlaskConical, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { BackupCard } from '../components/BackupCard'
import { useT } from '../i18n'
import { deleteProfileData } from '../lib/db'
import {
  createProfile,
  getActiveProfileId,
  PROFILE_COLORS,
  removeProfile,
  ROLES,
  switchProfile,
  updateProfile,
  useProfiles,
  type Profile,
  type RoleId,
} from '../lib/profiles'

/** Crew profiles on this device: add, edit, switch and remove. */
export function Crew() {
  const t = useT()
  const profiles = useProfiles()
  const activeId = getActiveProfileId()
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  const remove = async (p: Profile) => {
    if (
      !window.confirm(
        t('Delete {name} and all of their readings from this device? This cannot be undone.', { name: p.name }),
      )
    )
      return
    await deleteProfileData(p.id)
    removeProfile(p.id)
    if (p.id === activeId) window.location.reload()
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Crew')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Who is using Tether?')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'Each crew member has their own readings, routine, dose and settings on this device. Nothing mixes between profiles.',
          )}
        </p>
      </div>

      <ul className="space-y-3">
        {profiles.map((p) => (
          <li key={p.id} className={`panel rounded-3xl p-4 ${p.id === activeId ? 'border-accent/60' : ''}`}>
            {editing === p.id ? (
              <ProfileForm
                initial={p}
                onCancel={() => setEditing(null)}
                onSave={(v) => {
                  updateProfile(p.id, v)
                  setEditing(null)
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Avatar profile={p} size={44} />
                <div className="min-w-0 flex-1 basis-[calc(100%-56px)] sm:basis-auto">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {p.name}
                    {p.callSign && <span className="text-xs font-normal text-ink-dim">“{p.callSign}”</span>}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink-dim">
                    {t(ROLES[p.role])}
                    {p.scenario && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px]">
                        <FlaskConical size={11} aria-hidden /> {t('Demo')}
                      </span>
                    )}
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-1">
                  {p.id === activeId ? (
                    <span className="flex items-center gap-1 px-2 text-sm font-medium text-accent">
                      <Check size={16} aria-hidden /> {t('Active')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchProfile(p.id)}
                      className="min-h-10 rounded-full bg-ink px-4 text-sm font-semibold text-space"
                    >
                      {t('Switch')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(p.id)}
                    aria-label={t('Edit {name}', { name: p.name })}
                    className="flex size-10 items-center justify-center rounded-full text-ink-dim hover:bg-white/5"
                  >
                    <Pencil size={16} aria-hidden />
                  </button>
                  {profiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => void remove(p)}
                      aria-label={t('Delete {name}', { name: p.name })}
                      className="flex size-10 items-center justify-center rounded-full text-ink-dim hover:bg-alert/10 hover:text-alert"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  )}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === 'new' ? (
        <section className="panel rounded-3xl p-4">
          <ProfileForm
            onCancel={() => setEditing(null)}
            onSave={(v) => {
              const p = createProfile(v)
              setEditing(null)
              if (window.confirm(t('Switch to {name} now?', { name: p.name }))) switchProfile(p.id)
            }}
          />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="panel flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl font-medium"
        >
          <Plus size={18} aria-hidden /> {t('Add crew member')}
        </button>
      )}

      <BackupCard />

      <Link to="/scenarios" className="panel flex min-h-16 items-center gap-3 rounded-2xl px-4 active:bg-panel-2">
        <Users size={22} className="shrink-0 text-accent" aria-hidden />
        <span className="flex-1">
          <span className="block font-medium">{t('Use cases')}</span>
          <span className="block text-xs text-ink-dim">
            {t('Load demo crew members who are sick, tired or low, and see how Tether reacts.')}
          </span>
        </span>
      </Link>

      <p className="px-1 text-xs text-ink-faint">
        {t(
          'Profiles stay on this device. There are no accounts or passwords, so anyone holding the device can switch profile.',
        )}
      </p>
    </div>
  )
}

function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Profile
  onSave: (v: { name: string; role: RoleId; callSign?: string; color: string }) => void
  onCancel: () => void
}) {
  const t = useT()
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState<RoleId>(initial?.role ?? 'specialist')
  const [callSign, setCallSign] = useState(initial?.callSign ?? '')
  const [color, setColor] = useState(initial?.color ?? PROFILE_COLORS[1])
  const valid = name.trim().length > 0

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSave({ name: name.trim(), role, callSign: callSign.trim() || undefined, color })
      }}
    >
      <label className="block">
        <span className="label">{t('Name')}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
          className="panel mt-2 h-12 w-full rounded-2xl px-4 text-base outline-none focus:border-accent/60"
        />
      </label>
      <label className="block">
        <span className="label">{t('Role')}</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleId)}
          className="panel mt-2 h-12 w-full rounded-2xl px-3 text-base [color-scheme:dark]"
        >
          {(Object.keys(ROLES) as RoleId[]).map((r) => (
            <option key={r} value={r}>
              {t(ROLES[r])}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">{t('Call sign (optional)')}</span>
        <input
          value={callSign}
          onChange={(e) => setCallSign(e.target.value)}
          maxLength={20}
          className="panel mt-2 h-12 w-full rounded-2xl px-4 text-base outline-none focus:border-accent/60"
        />
      </label>
      <div>
        <span className="label">{t('Colour')}</span>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('Colour')}>
          {PROFILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`size-9 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className="panel min-h-12 rounded-2xl font-medium">
          {t('Cancel')}
        </button>
        <button
          type="submit"
          disabled={!valid}
          className="min-h-12 rounded-2xl bg-ink font-semibold text-space disabled:opacity-40"
        >
          {t('Save')}
        </button>
      </div>
    </form>
  )
}
