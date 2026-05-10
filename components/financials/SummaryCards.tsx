import { DollarSign, Package, TrendingUp, BarChart2 } from 'lucide-react'
import type { FinancialSummary } from '@/types'

interface Props {
  summary: FinancialSummary
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function SummaryCards({ summary }: Props) {
  const cards = [
    {
      label: 'Revenue This Month',
      value: formatCurrency(summary.totalRevenueMTD),
      icon: DollarSign,
      border: 'border-l-[#1a3a5c]',
      iconBg: 'bg-[#1a3a5c]/10',
      iconColor: 'text-[#1a3a5c]',
    },
    {
      label: 'Loads Covered MTD',
      value: String(summary.totalLoadsCoveredMTD),
      icon: Package,
      border: 'border-l-green-500',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-700',
    },
    {
      label: 'Avg Margin / Load',
      value: formatCurrency(summary.avgMarginPerLoad),
      icon: TrendingUp,
      border: 'border-l-teal-500',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-700',
    },
    {
      label: 'Projected Revenue',
      value: formatCurrency(summary.projectedMonthlyRevenue),
      icon: BarChart2,
      border: 'border-l-blue-500',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`rounded-xl border border-slate-200 ${card.border} border-l-4 bg-white p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                  {card.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <Icon size={18} className={card.iconColor} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
