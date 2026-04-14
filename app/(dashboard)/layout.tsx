import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'broker'

  // Detect current path from middleware-injected header
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? ''

  // Role-based dashboard routing:
  //   broker  -> /dashboard (default)
  //   carrier -> /carrier
  //   yard    -> /yard
  // Redirect when a user lands on the wrong "home" dashboard for their role.
  if (role === 'carrier' && pathname === '/dashboard') {
    redirect('/carrier')
  }
  if (role === 'yard' && pathname === '/dashboard') {
    redirect('/yard')
  }
  if (role === 'broker' && (pathname === '/carrier' || pathname === '/yard')) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
