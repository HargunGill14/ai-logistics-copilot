import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoleSwitcherCards } from './_RoleSwitcherCards'

export default async function SwitchRolePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'broker'
  const isAdmin = profile?.is_admin ?? false

  if (!isAdmin && role !== 'broker') {
    redirect('/dashboard')
  }

  return <RoleSwitcherCards currentRole={role} />
}
