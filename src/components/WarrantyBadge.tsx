export default function WarrantyBadge({ installDate }: { installDate: string | null }) {
  if (!installDate) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>🛡</span>
        <span>Garantía: sin fecha de instalación registrada</span>
      </div>
    )
  }

  const install = new Date(installDate)
  const expires = new Date(install)
  expires.setFullYear(expires.getFullYear() + 1)
  const now = new Date()
  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let label: string
  let tone: string
  if (daysLeft < 0) {
    label = `Garantía vencida (expiró ${expires.toLocaleDateString('es-CL')})`
    tone = 'text-slate-500'
  } else if (daysLeft <= 30) {
    label = `Garantía por vencer — ${daysLeft} días (${expires.toLocaleDateString('es-CL')})`
    tone = 'text-amber-400'
  } else {
    label = `En garantía hasta ${expires.toLocaleDateString('es-CL')} (${daysLeft} días)`
    tone = 'text-emerald-400'
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${tone}`}>
      <span>🛡</span>
      <span>{label}</span>
    </div>
  )
}
