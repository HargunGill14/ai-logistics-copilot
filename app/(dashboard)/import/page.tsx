import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ImportClient from './ImportClient'

interface BrokerProfile {
  role: string | null
}

export default async function ImportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<BrokerProfile>()

  if (!profile || (profile.role !== 'broker' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  return <ImportClient />
}
