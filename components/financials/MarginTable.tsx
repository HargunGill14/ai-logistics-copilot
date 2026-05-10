import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MarginRow } from '@/types'

interface Props {
  rows: MarginRow[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function marginClass(pct: number): string {
  if (pct >= 20) return 'bg-green-100 text-green-700'
  if (pct >= 10) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function MarginTable({ rows }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Margin Per Load</h2>
        <p className="text-xs text-slate-500">All covered loads, most recent first</p>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No covered loads yet</p>
          <p className="mt-1 text-xs text-slate-500">Margin data will appear once loads are covered.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Route
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pickup
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Target Rate
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Winning Bid
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Margin $
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Margin %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-900">
                    {row.origin} → {row.destination}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{formatDate(row.pickupDate)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-slate-700">
                    {formatCurrency(row.targetRate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-slate-700">
                    {formatCurrency(row.acceptedBid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium text-slate-900">
                    {formatCurrency(row.marginDollar)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${marginClass(row.marginPercent)}`}
                    >
                      {row.marginPercent.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
