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
      <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: '#4F5568' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0c' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 240, padding: '24px 32px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}
