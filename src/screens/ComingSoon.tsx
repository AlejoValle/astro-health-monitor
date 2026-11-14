export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="panel rounded-3xl p-6">
      <p className="label">In progress</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-ink-dim">This screen is not built yet.</p>
    </section>
  )
}
