'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
    >
      <LogOut size={15} />
      Sign out
    </button>
  )
}
