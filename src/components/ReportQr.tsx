import { QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { fitForQr } from '../lib/backup'

/**
 * The report as a QR code, to pass it to another device with no network: any phone camera reads it
 * as plain text. A long report is shortened to fit, with a note saying so.
 */
export function ReportQr({ text }: { text: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const fit = fitForQr(text)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void QRCode.toDataURL(fit.text, { errorCorrectionLevel: 'L', margin: 1, width: 360 }).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [open, fit.text])

  return (
    <section className="panel rounded-3xl p-5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center gap-3 text-left">
        <QrCode size={22} className="text-accent" aria-hidden />
        <span className="flex-1">
          <span className="block font-semibold">{t('Show as a QR code')}</span>
          <span className="block text-xs text-ink-dim">{t('Pass the report to another device with no network.')}</span>
        </span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col items-center gap-2">
          {url && <img src={url} alt={t('QR code of the report')} className="w-full max-w-72 rounded-2xl bg-white p-2" />}
          {fit.truncated && <p className="text-center text-xs text-watch">{t('Shortened to fit one code. Share or download it for the full report.')}</p>}
        </div>
      )}
    </section>
  )
}
