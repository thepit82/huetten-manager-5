'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Settings, Users, BedDouble, Utensils, ClipboardList,
  Receipt, Calculator, LogOut, Menu, X, Mountain,
  ChevronDown, Check
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSelectedTrip } from '@/lib/useSelectedTrip'
import type { Trip } from '@/types/database'

const supabase = getSupabaseClient()

const NAV_ITEMS = [
  { href: '/dashboard/stammdaten', label: 'Stammdaten',  icon: Settings,       adminOnly: true  },
  { href: '/dashboard/personen',   label: 'Personen',    icon: Users,          adminOnly: false },
  { href: '/dashboard/belegung',   label: 'Belegung',    icon: BedDouble,      adminOnly: false },
  { href: '/dashboard/essen',      label: 'Essen',       icon: Utensils,       adminOnly: false },
  { href: '/dashboard/anwesenheit',label: 'Anwesenheit', icon: ClipboardList,  adminOnly: false },
  { href: '/dashboard/belege',     label: 'Belege',      icon: Receipt,        adminOnly: false },
  { href: '/dashboard/abrechnung', label: 'Abrechnung',  icon: Calculator,     adminOnly: true  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { selectedTrip, setSelectedTrip } = useSelectedTrip()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [userRole, setUserRole] = useState<string>('user')

  // Trips laden für Selector
  useEffect(() => {
    supabase.from('trips').select('*').order('year', { ascending: false }).then(({ data }) => {
      if (data) setTrips(data)
    })
  }, [])

  // User-Rolle laden
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data?.role) setUserRole(data.role)
    })
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || userRole === 'admin')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Bar ── */}
      <header className="bg-[#1E3A5F] text-white h-14 flex items-center px-4 gap-3 shrink-0 z-30 sticky top-0">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Mountain className="w-6 h-6 text-[#F97316]" />
          <span className="font-bold text-base hidden sm:block">Hütten-Manager</span>
        </div>

        {/* Trip Selector */}
        <div className="relative ml-auto">
          <button
            onClick={() => setTripDropdownOpen(!tripDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm min-h-[36px] max-w-[200px] sm:max-w-[280px]"
          >
            <span className="truncate">
              {selectedTrip ? selectedTrip.name : 'Urlaub auswählen…'}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0" />
          </button>

          {tripDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setTripDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border w-64 z-50 overflow-hidden">
                {trips.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Keine Trips vorhanden.{' '}
                    <Link href="/dashboard/stammdaten" className="text-[#2563EB] hover:underline" onClick={() => setTripDropdownOpen(false)}>
                      Jetzt anlegen →
                    </Link>
                  </div>
                ) : (
                  <ul className="py-1">
                    {trips.map(trip => (
                      <li key={trip.id}>
                        <button
                          onClick={() => { setSelectedTrip(trip); setTripDropdownOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50"
                        >
                          <Check className={`w-4 h-4 shrink-0 ${selectedTrip?.id === trip.id ? 'text-[#2563EB]' : 'text-transparent'}`} />
                          <span className="flex-1 truncate text-[#1E3A5F] font-medium">{trip.name}</span>
                          <span className="text-xs text-gray-400">{trip.year}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (Desktop) ── */}
        <nav className="hidden md:flex flex-col w-56 bg-[#1E3A5F] shrink-0">
          <ul className="flex-1 py-3 space-y-0.5 px-2">
            {visibleNav.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      active
                        ? 'bg-[#F97316] text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="p-2 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white min-h-[44px]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Abmelden
            </button>
          </div>
        </nav>

        {/* ── Mobile Drawer ── */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-[#1E3A5F] flex flex-col md:hidden">
              <div className="flex items-center gap-2 h-14 px-4 border-b border-white/10">
                <Mountain className="w-5 h-5 text-[#F97316]" />
                <span className="font-bold text-white">Hütten-Manager</span>
                <button onClick={() => setMobileMenuOpen(false)} className="ml-auto p-2 text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ul className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
                {visibleNav.map(item => {
                  const active = pathname.startsWith(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] ${
                          active
                            ? 'bg-[#F97316] text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="p-2 border-t border-white/10">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Abmelden
                </button>
              </div>
            </nav>
          </>
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Trip-Hinweis wenn kein Trip ausgewählt */}
          {!selectedTrip && pathname !== '/dashboard/stammdaten' && (
            <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <strong>Kein Urlaub ausgewählt.</strong>{' '}
              Bitte oben einen Urlaub wählen oder{' '}
              <Link href="/dashboard/stammdaten" className="font-semibold underline">
                in den Stammdaten einen neuen anlegen
              </Link>
              .
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
