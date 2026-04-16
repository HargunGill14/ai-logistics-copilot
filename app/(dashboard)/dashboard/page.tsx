import { createClient } from '@/lib/supabase/server'
import { Load, Notification } from '@/types'
import { DashboardSplitView } from '@/components/dashboard/DashboardSplitView'

export default async function DashboardPage() {
  const supabase = await createClient()

  let loads: Load[] = []
  let notifications: Notification[] = []
  let fetchError: string | null = null

  try {
    const [loadsRes, notifsRes] = await Promise.all([
      supabase.from('loads').select('*').order('created_at', { ascending: false }),
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15),
    ])

    if (loadsRes.error) throw loadsRes.error
    loads = loadsRes.data ?? []
    notifications = notifsRes.error ? [] : (notifsRes.data ?? [])
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load dashboard data'
  }

  return (
    <DashboardSplitView
      loads={loads}
      notifications={notifications}
      fetchError={fetchError}
    />
  )
}
