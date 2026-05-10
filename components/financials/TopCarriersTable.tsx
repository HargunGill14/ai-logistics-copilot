import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CarrierMarginStat } from '@/types'

interface Props {
  carriers: CarrierMarginStat[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function marginClass(pct: number): string {
  if (pct >= 20) return 'bg-green-100 text-green-700'
  if (pct >= 10) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function TopCarriersTable({ carriers }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Top Carriers by Margin</h2>
        <p className="text-xs text-slate-500">Carriers with the best average margins on your loads</p>
      </div>

      {carriers.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No carrier data yet</p>
          <p className="mt-1 text-xs text-slate-500">Data appears once bids are accepted.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Carrier
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Loads
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Avg Margin $
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Avg Margin %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carriers.map((c) => (
                <TableRow key={c.carrierId} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-900">{c.carrierName}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-slate-700">
                    {c.loadsWorked}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium text-slate-900">
                    {formatCurrency(c.avgMarginDollar)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${marginClass(c.avgMarginPercent)}`}
                    >
                      {c.avgMarginPercent.toFixed(1)}%
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
