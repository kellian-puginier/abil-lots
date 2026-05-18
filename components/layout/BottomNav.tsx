'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Settings, Grid3x3, Trophy } from 'lucide-react'

const ITEMS = [
  { href: '/',            label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/stock/',      label: 'Stock',       Icon: Package },
  { href: '/config/',     label: 'Config',      Icon: Settings },
  { href: '/repartition/',label: 'Répartition', Icon: Grid3x3 },
  { href: '/ceremonie/',  label: 'Cérémonie',   Icon: Trophy },
]

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-40 no-print">
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = path === href
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center py-2 text-xs ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="size-5 mb-1" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
