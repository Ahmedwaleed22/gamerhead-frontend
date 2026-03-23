import { cn } from '@/lib/utils'
import Image from 'next/image'
import React from 'react'

function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex gap-3 font-bold', className)}>
      <Image src="/logo.png" alt="Logo" width={44.84} height={50} className="w-11 h-12" />
      <div className="navbar-logo-text">
        <span className="navbar-logo-text-main">GamerHead</span>
        <span className="navbar-logo-text-sub">Life's A Game</span>
      </div>
    </div>
  )
}

export default Logo