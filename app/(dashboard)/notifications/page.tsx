'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  title: string
  description: string
  type: string
  read: boolean
  load_id: string | null
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
    fetchNotifications()
  }

  async function markRead(id: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const typeConfig: Record<string, { bg: string, text: string, icon: string }> = {
    margin_alert: { bg: 'bg-red-100', text: 'text-red-600', icon: '⚠' },
    carrier_update: { bg: 'bg-green-100', text: 'text-green-600', icon: '✓' },
    shipper_reply: { bg: 'bg-blue-100', text: 'text-blue-600', icon: '↩' },
    system: { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'i' },
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-medium"
            style={{ color: '#1a3a5c' }}>
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'unread', 'margin_alert', 'carrier_update', 'shipper_reply'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            style={filter === f ? { backgroundColor: '#1a3a5c' } : {}}>
            {f === 'all' ? 'All' :
             f === 'unread' ? 'Unread' :
             f === 'margin_alert' ? 'Margin' :
             f === 'carrier_update' ? 'Carrier' : 'Shipper'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm text-slate-500">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">Alerts will appear here as you manage loads</p>
          </div>
        ) : (
          filtered.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system
            return (
              <div
                key={notification.id}
                onClick={() => !notification.read && markRead(notification.id)}
                className={`bg-white rounded-lg border p-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                  notification.read ? 'border-slate-200' : 'border-l-4 border-l-blue-500 border-slate-200'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${config.bg} ${config.text}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {timeAgo(notification.created_at)}
                    </span>
                  </div>
                  {notification.description && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {notification.description}
                    </p>
                  )}
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
