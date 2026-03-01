'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Mountain,
  Settings,
  Users,
  BedDouble,
  UtensilsCrossed,
  ClipboardCheck,
  Receipt,
  Calculator,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSelectedTrip } from '@/lib/useSelectedTrip'
import type { Trip, Profile } from '@/types/database'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard/stammdaten', label: 'Stammdaten', icon: Settings, adminOnly: true },
  { href: '/dashboard/personen', label: 'Personen', icon: Users },
  { href: '/dashboard/belegung', label: 'Belegung', icon: BedDouble },
  { href: '/dashboard/essen', label: 'Essen', icon: UtensilsCrossed },
  { href: '/dashboard/anwesenheit', label: 'Anwesenheit', icon: ClipboardCheck },
  { href: '/dashboard/belege', label: 'Belege', icon: Receipt, adminOnly: true },
  { href: '/dashboard/meine-belege', label: 'Meine Belege', icon: Receipt, guestOnly: true },
  { href: '/dashboard/abrechnung', label: 'Abrechnung', icon: Calculator, adminOnly: true },
  { href: '/dashboard/admin/users', label: 'Admin', icon: ShieldCheck, adminOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const { selectedTrip, setSelectedTrip } = useSelectedTrip()

  const [trips, setTrips] = useState<Trip[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const [{ data: profileData }, { data: tripsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('trips').select('*').order('year', { ascending: false }),
      ])

      setProfile(profileData)
      setTrips(tripsData ?? [])

      // Auto-select first trip if none selected
      if (!selectedTrip && tripsData && tripsData.length > 0) {
        setSelectedTrip(tripsData[0])
      }
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const role = profile?.role ?? 'guest'
  const isAdmin = role === 'admin'
  const isGuest = role === 'guest'

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.guestOnly && !isGuest) return false
    if (!item.adminOnly && !item.guestOnly) return true
    return true
  })

  const NavLinks = () => (
    <>
      {visibleNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-[#F97316] text-white'
              : 'text-blue-100 hover:bg-white/10 hover:text-white'
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {item.label}
        </Link>
      ))}
    </>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1E3A5F] text-white shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <Mountain className="h-8 w-8 text-[#F97316]" />
          <div>
            <p className="font-bold text-sm leading-tight">Hütten-Manager</p>
            <p className="text-xs text-blue-300">v5.0</p>
          </div>
        </div>

        {/* Trip selector */}
        <div className="px-3 py-3 border-b border-white/10">
          <p className="text-xs text-blue-400 uppercase tracking-wider px-2 mb-1">Aktiver Trip</p>
          <div className="relative">
            <button
              onClick={() => setTripDropdownOpen(!tripDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-white/10 hover:bg-white/20 transition-colors"
            >
              <span className="truncate">{selectedTrip?.name ?? 'Kein Trip ausgewählt'}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
            {tripDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => {
                      setSelectedTrip(trip)
                      setTripDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                      selectedTrip?.id === trip.id
                        ? 'bg-orange-50 text-[#F97316] font-medium'
                        : 'text-gray-700'
                    )}
                  >
                    {trip.name} ({trip.year})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* User */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-[#F97316] flex items-center justify-center text-white font-medium text-sm">
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {profile?.full_name ?? profile?.email}
              </p>
              <p className="text-xs text-blue-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-[#1E3A5F] text-white px-4 h-14">
        <div className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-[#F97316]" />
          <span className="font-bold text-sm">{selectedTrip?.name ?? 'Hütten-Manager'}</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="w-64 h-full bg-[#1E3A5F] flex flex-col pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <NavLinks />
            </nav>
            <div className="border-t border-white/10 px-3 py-3">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-blue-300 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-auto">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
