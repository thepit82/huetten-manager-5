'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSelectedTrip } from '@/lib/useSelectedTrip'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, TripStatusBadge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { TripForm } from '@/components/stammdaten/TripForm'
import { AgeCategoryEditor } from '@/components/stammdaten/AgeCategoryEditor'
import { RoomEditor } from '@/components/stammdaten/RoomEditor'
import { TripCopyModal } from '@/components/stammdaten/TripCopyModal'
import { formatDate, formatEur } from '@/lib/billing/helpers'
import type { Trip, AgeCategory, Room } from '@/types/database'

export default function StammdatenPage() {
  const supabase = getSupabaseClient()
  const { selectedTrip, setSelectedTrip } = useSelectedTrip()
  const { success, error: showError } = useToast()

  // --- State ---
  const [trips, setTrips] = useState<Trip[]>([])
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [tripFormOpen, setTripFormOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'ageCategories' | 'rooms' | null>('ageCategories')

  // ---- Load all trips ----
  const loadTrips = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('year', { ascending: false })
    if (error) {
      showError('Fehler beim Laden', error.message)
    } else {
      setTrips(data ?? [])
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Load data for selected trip ----
  const loadTripData = useCallback(async (tripId: string) => {
    const [acResult, roomResult] = await Promise.all([
      supabase.from('age_categories').select('*').eq('trip_id', tripId).order('sort_order'),
      supabase.from('rooms').select('*').eq('trip_id', tripId).order('sort_order'),
    ])
    setAgeCategories(acResult.data ?? [])
    setRooms(roomResult.data ?? [])
  }, [supabase])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  useEffect(() => {
    if (selectedTrip) {
      loadTripData(selectedTrip.id)
    }
  }, [selectedTrip, loadTripData])

  function handleTripSaved(trip: Trip) {
    setTrips((prev) => {
      const exists = prev.find((t) => t.id === trip.id)
      if (exists) return prev.map((t) => (t.id === trip.id ? trip : t))
      return [trip, ...prev]
    })
    // Auto-select newly created trip
    setSelectedTrip(trip)
  }

  async function handleDeleteTrip() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from('trips').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      if (selectedTrip?.id === deleteTarget.id) {
        setSelectedTrip(null)
        setAgeCategories([])
        setRooms([])
      }
      success('Trip gelöscht', deleteTarget.name)
      setDeleteTarget(null)
    } catch (err) {
      showError('Fehler beim Löschen', String(err))
    } finally {
      setDeleteLoading(false)
    }
  }

  function toggleSection(section: 'ageCategories' | 'rooms') {
    setExpandedSection((prev) => (prev === section ? null : section))
  }

  const sourceTrips = trips.filter((t) => t.id !== selectedTrip?.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stammdaten"
        subtitle="Trips, Altersklassen und Zimmer verwalten"
        action={
          <Button
            onClick={() => {
              setEditingTrip(null)
              setTripFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Neuer Trip
          </Button>
        }
      />

      {/* Trip list */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1E3A5F]">Alle Trips</h2>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400 text-sm">Laden…</div>
        ) : trips.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            Noch keine Trips angelegt.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {trips.map((trip) => {
              const isSelected = selectedTrip?.id === trip.id
              return (
                <div
                  key={trip.id}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-[#2563EB]' : 'bg-gray-300'}`}
                    />
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${isSelected ? 'text-[#1E3A5F]' : 'text-gray-700'}`}>
                        {trip.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                      </p>
                    </div>
                    <TripStatusBadge status={trip.status} />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTrip(trip)
                        setTripFormOpen(true)
                      }}
                      className="p-2 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-[#2563EB]"
                      title="Bearbeiten"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(trip)
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-[#DC2626]"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Selected trip details */}
      {selectedTrip && (
        <>
          {/* Trip summary */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1E3A5F]">{selectedTrip.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatDate(selectedTrip.start_date)} – {formatDate(selectedTrip.end_date)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCopyModalOpen(true)}
                >
                  <Copy className="h-4 w-4" />
                  Daten übernehmen
                </Button>
              </div>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide">Hüttenpreis</dt>
                <dd className="font-semibold mt-0.5">{formatEur(selectedTrip.cabin_price)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide">Pauschale VP</dt>
                <dd className="font-semibold mt-0.5">{formatEur(selectedTrip.flat_rate_meal)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide">Pauschale ÜN</dt>
                <dd className="font-semibold mt-0.5">{formatEur(selectedTrip.flat_rate_overnight)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide">IBAN</dt>
                <dd className="font-mono text-xs mt-0.5 truncate">
                  {selectedTrip.bank_iban ?? '—'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Age categories – collapsible */}
          <Card padding="none">
            <button
              className="flex items-center justify-between w-full px-5 py-4 text-left"
              onClick={() => toggleSection('ageCategories')}
            >
              <div>
                <h2 className="text-base font-semibold text-[#1E3A5F]">Altersklassen</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {ageCategories.length} Klassen · Faktoren für ÜN, VP und Essen
                </p>
              </div>
              {expandedSection === 'ageCategories' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === 'ageCategories' && (
              <div className="px-5 pb-5">
                <AgeCategoryEditor
                  tripId={selectedTrip.id}
                  categories={ageCategories}
                  onChange={setAgeCategories}
                />
              </div>
            )}
          </Card>

          {/* Rooms – collapsible */}
          <Card padding="none">
            <button
              className="flex items-center justify-between w-full px-5 py-4 text-left"
              onClick={() => toggleSection('rooms')}
            >
              <div>
                <h2 className="text-base font-semibold text-[#1E3A5F]">Zimmer</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {rooms.length} Zimmer · {rooms.reduce((s, r) => s + r.beds, 0)} Betten
                </p>
              </div>
              {expandedSection === 'rooms' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === 'rooms' && (
              <div className="px-5 pb-5">
                <RoomEditor
                  tripId={selectedTrip.id}
                  rooms={rooms}
                  onChange={setRooms}
                />
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modals */}
      <TripForm
        open={tripFormOpen}
        onClose={() => {
          setTripFormOpen(false)
          setEditingTrip(null)
        }}
        onSaved={handleTripSaved}
        editTrip={editingTrip}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTrip}
        title="Trip löschen"
        message={`Soll der Trip „${deleteTarget?.name}" wirklich gelöscht werden? Alle zugehörigen Daten (Personen, Anwesenheiten, Belege, Abrechnungen) werden unwiderruflich gelöscht.`}
        confirmLabel="Endgültig löschen"
        loading={deleteLoading}
      />

      {selectedTrip && (
        <TripCopyModal
          open={copyModalOpen}
          onClose={() => setCopyModalOpen(false)}
          targetTripId={selectedTrip.id}
          sourceTrips={sourceTrips}
          onCopied={({ ageCategories: newAc, rooms: newRooms }) => {
            if (newAc.length > 0) setAgeCategories(newAc)
            if (newRooms.length > 0) setRooms(newRooms)
          }}
        />
      )}
    </div>
  )
}
