'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Settings, Grid3x3, Trophy, ListChecks } from 'lucide-react'

const ITEMS = [
  { href: '/',             label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/stock/',       label: 'Stock',       Icon: Package },
  { href: '/config/',      label: 'Config',      Icon: Settings },
  { href: '/repartition/', label: 'Répartition', Icon: Grid3x3 },
  { href: '/preparation/', label: 'Préparation', Icon: ListChecks },
  { href: '/ceremonie/',   label: 'Cérémonie',   Icon: Trophy },
]

export function SideNav() {
  const path = usePathname()
  return (
    <aside className="hidden md:flex md:w-56 shrink-0 flex-col gap-1 p-4 border-r bg-card no-print">
      {/* Logo ABIL */}
      <div className="mb-4 flex flex-col items-center gap-0.5">
        <Image
          src="/logo-abil-noir.png"
          alt="ABIL — Bad In Lez"
          width={120}
          height={120}
          priority
          className="w-24 h-auto object-contain"
        />
        <span className="font-display text-sm text-primary tracking-widest uppercase">Prizes</span>
      </div>

      {ITEMS.map(({ href, label, Icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        )
      })}
    </aside>
  )
}
