import type { ReactNode } from 'react'

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-20 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
