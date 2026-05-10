import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M3 14L8 7L13 10L17 4"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="16" r="2.5" fill="#34d399" />
    </svg>
  )
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white [font-family:var(--font-dm-sans)]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-[#1a3a5c]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
              <BrandMark size={14} />
            </div>
            <span className="text-sm font-semibold text-white">FreTraq</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft size={13} />
            Back to fretraq.com
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} FreTraq, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-700">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
