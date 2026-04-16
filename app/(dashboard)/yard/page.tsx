'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Load } from '@/types'

interface DockAppointment {
  id: string
  organization_id: string
  created_by: string
  dock_number: number
  truck_id: string
  carrier_name: string
  type: 'arrival' | 'departure'
  scheduled_time: string
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'missed'
  load_id?: string
  created_at: string
}

const DOCKS = [1, 2, 3, 4]
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
]

export default function YardDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const [appointments, setAppointments] = useState<DockAppointment[]>([])
  const [loads, setLoads] = useState<Load[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)

  const [form, setForm] = useState({
    dock_number: '1',
    truck_id: '',
    carrier_name: '',
    type: 'arrival',
    scheduled_time: '08:00',
    load_id: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const res = await fetch(`/api/yard/data?date=${selectedDate}`)
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        throw new Error(json.error ?? 'Failed to load yard data')
      }

      setOrganizationId(json.organization_id ?? null)
      setAppointments(json.appointments ?? [])
      setLoads(json.loads ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load yard data')
    } finally {
      setLoading(false)
    }
  }, [router, supabase, selectedDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    try {
      if (!userId) throw new Error('Not authenticated')

      const scheduledAt = new Date(`${selectedDate}T${form.scheduled_time}:00`).toISOString()

      const res = await fetch('/api/yard/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dock_number: parseInt(form.dock_number, 10),
          truck_id: form.truck_id,
          carrier_name: form.carrier_name,
          type: form.type,
          scheduled_time: scheduledAt,
          load_id: form.load_id || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to schedule appointment')

      setForm({
        dock_number: '1',
        truck_id: '',
        carrier_name: '',
        type: 'arrival',
        scheduled_time: '08:00',
        load_id: '',
      })
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to schedule appointment')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, status: DockAppointment['status']) {
    try {
      const res = await fetch('/api/yard/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update appointment')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
    }
  }

  function appointmentAt(dock: number, time: string) {
    return appointments.find(a => {
      const apptTime = new Date(a.scheduled_time)
      const hh = apptTime.getHours().toString().padStart(2, '0')
      const mm = apptTime.getMinutes().toString().padStart(2, '0')
      return a.dock_number === dock && `${hh}:${mm}` === time
    })
  }

  const scheduledCount = appointments.filter(a => a.status === 'scheduled').length
  const inYardCount = appointments.filter(a => a.status === 'checked_in').length
  const completedCount = appointments.filter(a => a.status === 'checked_out').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Yard Manager</h1>
          <p className="text-sm text-slate-500">Schedule docks, track check-ins, and monitor loads</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Scheduled</div>
          <div className="text-2xl font-semibold text-slate-900">{scheduledCount}</div>
          <div className="text-xs text-slate-400 mt-1">Awaiting arrival</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">In Yard</div>
          <div className="text-2xl font-semibold text-slate-900">{inYardCount}</div>
          <div className="text-xs text-slate-400 mt-1">Checked in</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Completed</div>
          <div className="text-2xl font-semibold text-slate-900">{completedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Checked out</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Active Loads</div>
          <div className="text-2xl font-semibold text-slate-900">{loads.length}</div>
          <div className="text-xs text-slate-400 mt-1">In transit / pending</div>
        </div>
      </div>

      {/* Dock scheduling grid */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Dock schedule — {new Date(selectedDate).toLocaleDateString()}</h2>
          <span className="text-xs text-slate-400">{appointments.length} appointments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-medium text-slate-500 sticky left-0 bg-slate-50">Time</th>
                {DOCKS.map(d => (
                  <th key={d} className="text-left px-3 py-2 font-medium text-slate-500">Dock {d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-600 sticky left-0 bg-white">{time}</td>
                  {DOCKS.map(dock => {
                    const appt = appointmentAt(dock, time)
                    if (!appt) {
                      return <td key={dock} className="px-3 py-2 text-slate-300">—</td>
                    }
                    const badgeColor =
                      appt.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                      appt.status === 'checked_out' ? 'bg-slate-100 text-slate-600' :
                      appt.status === 'missed' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    return (
                      <td key={dock} className="px-3 py-2">
                        <div className={`rounded-md px-2 py-1 ${badgeColor}`}>
                          <div className="font-medium">{appt.truck_id}</div>
                          <div className="text-[10px] opacity-75 capitalize">{appt.type} · {appt.carrier_name}</div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* Schedule appointment form */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Schedule appointment</h2>
          <p className="text-xs text-slate-500 mb-4">Reserve a dock slot for an incoming or outgoing truck.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dock</label>
                <select
                  name="dock_number"
                  value={form.dock_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
                >
                  {DOCKS.map(d => <option key={d} value={d}>Dock {d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <select
                  name="scheduled_time"
                  value={form.scheduled_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Truck / trailer ID</label>
              <input
                name="truck_id"
                type="text"
                placeholder="TRK-1042"
                value={form.truck_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Carrier</label>
              <input
                name="carrier_name"
                type="text"
                placeholder="Acme Freight"
                value={form.carrier_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
                >
                  <option value="arrival">Arrival</option>
                  <option value="departure">Departure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Load (optional)</label>
                <select
                  name="load_id"
                  value={form.load_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
                >
                  <option value="">— None —</option>
                  {loads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.pickup_location} → {l.delivery_location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#1a3a5c' }}
            >
              {submitting ? 'Scheduling…' : 'Schedule appointment'}
            </button>
          </form>
        </div>

        {/* Check-in / check-out log */}
        <div className="col-span-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Check-in / check-out log</h2>
            <span className="text-xs text-slate-400">{appointments.length} total</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No appointments scheduled for this day.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Truck</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Carrier</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Dock</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(appt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="text-[10px] text-slate-400 capitalize">{appt.type}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{appt.truck_id}</td>
                    <td className="px-4 py-3 text-slate-600">{appt.carrier_name}</td>
                    <td className="px-4 py-3 text-slate-600">#{appt.dock_number}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        appt.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                        appt.status === 'checked_out' ? 'bg-slate-100 text-slate-600' :
                        appt.status === 'missed' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {appt.status === 'scheduled' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'checked_in')}
                          className="text-xs font-medium px-2 py-1 rounded-md text-white"
                          style={{ backgroundColor: '#1a3a5c' }}
                        >
                          Check in
                        </button>
                      )}
                      {appt.status === 'checked_in' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'checked_out')}
                          className="text-xs font-medium px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          Check out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Load tracking */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Load tracking</h2>
          <span className="text-xs text-slate-400">{loads.length} loads</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
        ) : loads.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No active loads to track.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Route</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Weight</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loads.slice(0, 8).map(load => (
                <tr key={load.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{load.pickup_location}</div>
                    <div className="text-slate-400 text-xs">to {load.delivery_location}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{load.load_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{load.weight_lbs?.toLocaleString()} lbs</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      load.status === 'active' ? 'bg-green-100 text-green-700' :
                      load.status === 'negotiating' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {load.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
