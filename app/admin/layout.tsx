'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AdminSidebar from './components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  const isAdmin = (user as any)?.role === 'admin'

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, loading, isAdmin])

  if (loading || !user || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: '#4F5568' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0a0a0c]">
      <AdminSidebar />
      <div className="px-8! py-18! md:p-8! flex-1 min-h-screen w-full min-w-0 pt-[73px] md:pt-0">
        <div className="p-4 md:p-8 lg:p-10 w-full min-w-0 max-w-full overflow-x-visible">
          {children}
        </div>
      </div>
    </div>
  )
}
