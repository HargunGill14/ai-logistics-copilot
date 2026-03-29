export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back</p>
        </div>
        <a href="/loads/new" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#1a3a5c' }}>
          + New Load
        </a>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Active Loads</div>
          <div className="text-2xl font-semibold text-slate-900">0</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Avg Margin</div>
          <div className="text-2xl font-semibold text-slate-900">—</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Revenue MTD</div>
          <div className="text-2xl font-semibold text-slate-900">$0</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">At-Risk Loads</div>
          <div className="text-2xl font-semibold text-slate-900">0</div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <h3 className="text-sm font-medium text-slate-900 mb-1">No loads yet</h3>
        <p className="text-sm text-slate-500 mb-4">Create your first load to get AI-powered pricing</p>
        <a href="/loads/new" className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#1a3a5c' }}>
          Create first load
        </a>
      </div>
    </div>
  )
}
