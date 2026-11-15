import { initials, type Profile } from '../lib/profiles'

/** Round badge with a crew member's initials in their colour. */
export function Avatar({ profile, size = 40 }: { profile: Profile; size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-space"
      style={{ width: size, height: size, background: profile.color, fontSize: size * 0.38 }}
    >
      {initials(profile.name)}
    </span>
  )
}
