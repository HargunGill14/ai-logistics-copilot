import { createClient } from '@/lib/supabase/server'
import { Load } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let loads: Load[] = []
  let fetchError: string | null = null

  try {
    const { data, error } = await supabase
      .from('loads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    loads = data ?? []
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load dashboard data'
  }

  const activeLoads = loads.filter(l => l.status === 'active' || l.status === 'negotiating')
  const atRiskLoads = loads.filter(l => l.margin_percentage && l.margin_percentage < 8)
  const avgMargin = loads.length
    ? loads.filter(l => l.margin_percentage).reduce((sum, l) => sum + (l.margin_percentage || 0), 0) / loads.filter(l => l.margin_percentage).length
    : 0
  const revenue = loads.reduce((sum, l) => sum + (l.shipper_rate || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back — here's your overview</p>
        </div>
        <a href="/loads/new" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#1a3a5c' }}>
          + New Load
        </a>
      </div>

      {fetchError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Active Loads</div>
          <div className="text-2xl font-semibold text-slate-900">{activeLoads.length}</div>
          <div className="text-xs text-slate-400 mt-1">{loads?.length || 0} total</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Avg Margin</div>
          <div className="text-2xl font-semibold text-slate-900">
            {avgMargin > 0 ? `${avgMargin.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all loads</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Revenue MTD</div>
          <div className="text-2xl font-semibold text-slate-900">
            ${revenue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Shipper rates</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">At-Risk Loads</div>
          <div className={`text-2xl font-semibold ${atRiskLoads.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {atRiskLoads.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Below 8% margin</div>
        </div>
      </div>

      {loads && loads.length > 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent loads</h2>
            <a href="/loads" className="text-xs font-medium" style={{ color: '#1a3a5c' }}>View all →</a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Route</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Shipper Rate</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Margin</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loads.slice(0, 5).map((load) => (
                <tr key={load.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{load.pickup_location}</div>
                    <div className="text-slate-400 text-xs">to {load.delivery_location}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{load.load_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">${load.shipper_rate.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {load.margin_percentage ? (
                      <span className={`font-medium ${load.margin_percentage >= 15 ? 'text-green-600' : load.margin_percentage >= 8 ? 'text-amber-600' : 'text-red-600'}`}>
                        {load.margin_percentage.toFixed(1)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      load.status === 'active' ? 'bg-green-100 text-green-700' :
                      load.status === 'negotiating' ? 'bg-purple-100 text-purple-700' :
                      load.status === 'pricing' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {load.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <h3 className="text-sm font-medium text-slate-900 mb-1">No loads yet</h3>
          <p className="text-sm text-slate-500 mb-4">Create your first load to get AI-powered pricing</p>
          <a href="/loads/new" className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#1a3a5c' }}>
            Create first load
          </a>
        </div>
      )}
    </div>
  )
}
