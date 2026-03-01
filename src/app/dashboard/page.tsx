'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSelectedTrip } from '@/lib/useSelectedTrip'
import { formatDate, formatEur } from '@/lib/billing/helpers'
import { Users, ClipboardCheck, Receipt, Mountain } from 'lucide-react'

interface TripStats {
  personsCount: number
  groupsCount: number
  expensesTotal: number
  attendanceToday: number
}

export default function DashboardPage() {
  const { selectedTrip } = useSelectedTrip()
  const [stats, setStats] = useState<TripStats | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!selectedTrip) return

    async function loadStats() {
      const tripId = selectedTrip!.id
      const today = new Date().toISOString().split('T')[0]

      const [persons, groups, expenses, attendanceToday] = await Promise.all([
        supabase.from('persons').select('id', { count: 'exact', head: true }).eq('trip_id', tripId),
        supabase.from('billing_groups').select('id', { count: 'exact', head: true }).eq('trip_id', tripId),
        supabase.from('expenses').select('amount').eq('trip_id', tripId).eq('status', 'confirmed'),
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('trip_id', tripId)
          .eq('date', today)
          .eq('meal_confirmed', true),
      ])

      const total = (expenses.data ?? []).reduce((s, e) => s + Number(e.amount), 0)

      setStats({
        personsCount: persons.count ?? 0,
        groupsCount: groups.count ?? 0,
        expensesTotal: total,
        attendanceToday: attendanceToday.count ?? 0,
      })
    }

    loadStats()
  }, [selectedTrip, supabase])

  if (!selectedTrip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Mountain className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Kein Trip ausgewählt</h2>
        <p className="text-gray-500 text-sm">
          Wähle einen Trip in der Seitenleiste oder lege einen neuen an.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">{selectedTrip.name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {formatDate(selectedTrip.start_date)} – {formatDate(selectedTrip.end_date)} ·{' '}
          <span className="capitalize">{selectedTrip.status}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="h-6 w-6 text-[#2563EB]" />}
          label="Teilnehmer"
          value={stats?.personsCount ?? '—'}
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-[#F97316]" />}
          label="Gruppen"
          value={stats?.groupsCount ?? '—'}
        />
        <StatCard
          icon={<Receipt className="h-6 w-6 text-[#16A34A]" />}
          label="Belege gesamt"
          value={stats ? formatEur(stats.expensesTotal) : '—'}
        />
        <StatCard
          icon={<ClipboardCheck className="h-6 w-6 text-[#D97706]" />}
          label="VP heute"
          value={stats?.attendanceToday ?? '—'}
        />
      </div>

      {/* Trip details card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-[#1E3A5F] mb-4">Trip-Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Hüttenpreis</dt>
            <dd className="font-medium">{formatEur(selectedTrip.cabin_price)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Pauschale VP</dt>
            <dd className="font-medium">{formatEur(selectedTrip.flat_rate_meal)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Pauschale ÜN</dt>
            <dd className="font-medium">{formatEur(selectedTrip.flat_rate_overnight)}</dd>
          </div>
          {selectedTrip.bank_iban && (
            <div>
              <dt className="text-gray-500">IBAN</dt>
              <dd className="font-medium font-mono text-xs">{selectedTrip.bank_iban}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#1E3A5F]">{value}</p>
    </div>
  )
}
