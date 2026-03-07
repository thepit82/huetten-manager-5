'use client'

/**
 * /dashboard/stammdaten/page.tsx  – v5.0
 *
 * STANDALONE-Version: importiert KEINE Stammdaten-Subkomponenten
 * (AgeCategoryEditor, RoomEditor, TripForm, TripCopyModal) um Build-Fehler
 * zu vermeiden. Alle Funktionalität direkt inline.
 *
 * Enthält:
 *  - Trip anlegen / bearbeiten / löschen
 *  - Altersklassen (inline)
 *  - Zimmer (inline)
 *  - Trip-Kopie (inline)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Settings, BedDouble,
  Users, Copy, RotateCcw, ChevronDown, X, Loader2,
  CheckSquare, Square
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSelectedTrip } from '@/lib/useSelectedTrip'
import type { Trip, AgeCategory, Room } from '@/types/database'

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

const supabase = getSupabaseClient()

const DEFAULT_AGE_CATEGORIES = [
  { name: 'Kleinkinder', age_from: 0,  age_to: 5,  overnight_factor: 0,    meal_factor: 0,   food_factor: 0.25 },
  { name: 'Kinder',      age_from: 6,  age_to: 14, overnight_factor: 0.75, meal_factor: 0.5, food_factor: 0.75 },
  { name: 'Jugendliche', age_from: 15, age_to: 17, overnight_factor: 1.0,  meal_factor: 0.5, food_factor: 1.25 },
  { name: 'Erwachsene',  age_from: 18, age_to: 99, overnight_factor: 1.0,  meal_factor: 1.0, food_factor: 1.0  },
]

// ─── Inline-Komponenten ──────────────────────────────────────────────────────

function Modal({ open, title, onClose, children, maxWidth = 'max-w-lg' }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t) }, [onDismiss])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {message}
    </div>
  )
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────

type TabId = 'trips' | 'age' | 'rooms'

export default function StammdatenPage() {
  const { selectedTripId, setSelectedTripId } = useSelectedTrip()

  // State
  const [trips, setTrips] = useState<Trip[]>([])
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('trips')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Modal-State: Trip
  const [tripModalOpen, setTripModalOpen] = useState(false)
  const [editTrip, setEditTrip] = useState<Trip | null>(null)
  const [deleteTripTarget, setDeleteTripTarget] = useState<Trip | null>(null)
  const [tripForm, setTripForm] = useState({ name: '', start_date: '', end_date: '', cabin_price: '0', flat_rate_meal: '0', flat_rate_overnight: '0', bank_iban: '', status: 'planning' })
  const [tripLoading, setTripLoading] = useState(false)

  // Modal-State: AgeCategory
  const [acModalOpen, setAcModalOpen] = useState(false)
  const [editAc, setEditAc] = useState<AgeCategory | null>(null)
  const [deleteAcTarget, setDeleteAcTarget] = useState<AgeCategory | null>(null)
  const [acForm, setAcForm] = useState({ name: '', age_from: '0', age_to: '99', overnight_factor: '1', meal_factor: '1', food_factor: '1' })
  const [acLoading, setAcLoading] = useState(false)

  // Modal-State: Room
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<Room | null>(null)
  const [roomForm, setRoomForm] = useState({ name: '', beds: '2' })
  const [roomLoading, setRoomLoading] = useState(false)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
  }, [])

  // ── Trips laden ────────────────────────────────────────────────────────────

  const loadTrips = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('trips').select('*').order('year', { ascending: false })
    if (error) showToast(`Fehler: ${error.message}`, 'error')
    else setTrips(data ?? [])
    setLoading(false)
  }, [showToast])

  useEffect(() => { loadTrips() }, [loadTrips])

  // ── Altersklassen + Zimmer laden wenn Trip gewählt ─────────────────────────

  const loadTripData = useCallback(async (tripId: string) => {
    const [acRes, roomRes] = await Promise.all([
      supabase.from('age_categories').select('*').eq('trip_id', tripId).order('sort_order'),
      supabase.from('rooms').select('*').eq('trip_id', tripId).order('sort_order'),
    ])
    if (acRes.data) setAgeCategories(acRes.data)
    if (roomRes.data) setRooms(roomRes.data)
  }, [])

  useEffect(() => {
    if (selectedTripId) loadTripData(selectedTripId)
    else { setAgeCategories([]); setRooms([]) }
  }, [selectedTripId, loadTripData])

  // ── Trip CRUD ──────────────────────────────────────────────────────────────

  function openNewTrip() {
    setEditTrip(null)
    const year = new Date().getFullYear()
    setTripForm({ name: `Hüttenurlaub ${year + 1}`, start_date: '', end_date: '', cabin_price: '0', flat_rate_meal: '0', flat_rate_overnight: '0', bank_iban: '', status: 'planning' })
    setTripModalOpen(true)
  }

  function openEditTrip(trip: Trip) {
    setEditTrip(trip)
    setTripForm({
      name: trip.name, start_date: trip.start_date, end_date: trip.end_date,
      cabin_price: String(trip.cabin_price), flat_rate_meal: String(trip.flat_rate_meal),
      flat_rate_overnight: String(trip.flat_rate_overnight), bank_iban: trip.bank_iban ?? '',
      status: trip.status,
    })
    setTripModalOpen(true)
  }

  async function handleSaveTrip(e: React.FormEvent) {
    e.preventDefault()
    setTripLoading(true)
    const payload = {
      name: tripForm.name.trim(),
      year: new Date(tripForm.start_date).getFullYear(),
      start_date: tripForm.start_date,
      end_date: tripForm.end_date,
      cabin_price: Number(tripForm.cabin_price),
      flat_rate_meal: Number(tripForm.flat_rate_meal),
      flat_rate_overnight: Number(tripForm.flat_rate_overnight),
      bank_iban: tripForm.bank_iban.trim() || null,
      status: tripForm.status as Trip['status'],
    }
    try {
      if (editTrip) {
        const { data, error } = await supabase.from('trips').update(payload).eq('id', editTrip.id).select().single()
        if (error) throw error
        setTrips(prev => prev.map(t => t.id === editTrip.id ? data : t))
        showToast(`Trip „${data.name}" gespeichert`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase.from('trips').insert({ ...payload, created_by: user?.id }).select().single()
        if (error) throw error
        setTrips(prev => [data, ...prev])
        showToast(`Trip „${data.name}" angelegt`)
        // Standard-Altersklassen anlegen
        await supabase.from('age_categories').insert(
          DEFAULT_AGE_CATEGORIES.map((cat, i) => ({ ...cat, trip_id: data.id, sort_order: i }))
        )
        setSelectedTripId(data.id)
      }
      setTripModalOpen(false)
    } catch (err) {
      showToast(`Fehler: ${String(err)}`, 'error')
    } finally {
      setTripLoading(false)
    }
  }

  async function handleDeleteTrip() {
    if (!deleteTripTarget) return
    setTripLoading(true)
    try {
      const { error } = await supabase.from('trips').delete().eq('id', deleteTripTarget.id)
      if (error) throw error
      setTrips(prev => prev.filter(t => t.id !== deleteTripTarget.id))
      if (selectedTripId === deleteTripTarget.id) setSelectedTripId(null)
      showToast(`Trip gelöscht`)
      setDeleteTripTarget(null)
    } catch (err) {
      showToast(`Fehler: ${String(err)}`, 'error')
    } finally {
      setTripLoading(false)
    }
  }

  // ── AgeCategory CRUD ───────────────────────────────────────────────────────

  function openNewAc() {
    setEditAc(null)
    setAcForm({ name: '', age_from: '0', age_to: '99', overnight_factor: '1', meal_factor: '1', food_factor: '1' })
    setAcModalOpen(true)
  }
  function openEditAc(ac: AgeCategory) {
    setEditAc(ac)
    setAcForm({ name: ac.name, age_from: String(ac.age_from), age_to: String(ac.age_to), overnight_factor: String(ac.overnight_factor), meal_factor: String(ac.meal_factor), food_factor: String(ac.food_factor) })
    setAcModalOpen(true)
  }

  async function handleSaveAc(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTripId) return
    setAcLoading(true)
    const payload = { name: acForm.name.trim(), age_from: Number(acForm.age_from), age_to: Number(acForm.age_to), overnight_factor: Number(acForm.overnight_factor), meal_factor: Number(acForm.meal_factor), food_factor: Number(acForm.food_factor) }
    try {
      if (editAc) {
        const { data, error } = await supabase.from('age_categories').update(payload).eq('id', editAc.id).select().single()
        if (error) throw error
        setAgeCategories(prev => prev.map(c => c.id === editAc.id ? data : c))
        showToast('Altersklasse gespeichert')
      } else {
        const { data, error } = await supabase.from('age_categories').insert({ ...payload, trip_id: selectedTripId, sort_order: ageCategories.length }).select().single()
        if (error) throw error
        setAgeCategories(prev => [...prev, data])
        showToast('Altersklasse angelegt')
      }
      setAcModalOpen(false)
    } catch (err) {
      showToast(`Fehler: ${String(err)}`, 'error')
    } finally {
      setAcLoading(false)
    }
  }

  async function handleDeleteAc() {
    if (!deleteAcTarget) return
    setAcLoading(true)
    try {
      const { error } = await supabase.from('age_categories').delete().eq('id', deleteAcTarget.id)
      if (error) throw error
      setAgeCategories(prev => prev.filter(c => c.id !== deleteAcTarget.id))
      showToast('Altersklasse gelöscht')
      setDeleteAcTarget(null)
    } catch (err) {
      showToast(`Fehler: ${String(err)}`, 'error')
    } finally {
      setAcLoading(false)
    }
  }

  async function handleResetAc() {
    if (!selectedTripId) return
    setAcLoading(true)
    try {
      await supabase.from('age_categories').delete().eq('trip_id', selectedTripId)
      const { data, error } = await supabase.from('age_categories').insert(
        DEFAULT_AGE_CATEGORIES.map((cat, i) => ({ ...cat, trip_id: selectedTripId, sort_order: i }))
      ).select()
      if (error) throw error
      setAgeCategories(data ?? [])
      showToast('Standard-Altersklassen wiederhergestellt')
    } catch (err) {
      showToast(`Fehler: ${String(err)}`, 'error')
    } finally {
      setAcLoading(false)
    }
  }

  // ── Room CRUD ──────────────────────────────────────────────────────────────

  function openNewRoom() {
    setEditRoom(null)
    setRoomForm({ name: '', beds: '2' })
    setRoomModalOpen(true)
  }
  function openEditRoom(room: Room) {
    setEditRoom(room)
    setRoomForm({ name: room.name, beds: String(room.beds) })
    setRoomModalOpen(true)
  }

  async function handleSaveRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTripId) return
    setRoomLoading(true)
    const payload = { name: roomForm.name.trim(), beds: Math.max(1, Number(roomForm.beds)) }
    try {
      if (editRoom) {
        const { data, error } = await supabase.from('rooms').update(payload).eq('id', editRoom.id).select().single()
        if (error) throw error
        setRooms(prev => prev.map(r => r.id === editRoom.id ? data : r))
        showToast('Zimmer gespeichert')
      } else {
        const { data, error } = await supabase.from('rooms').insert({ ...payload, trip_id: selectedTripId, sort_order: rooms.length }).select().single()
        if (error) throw error
        setRooms(prev => [...prev, data])
        showToast('Zimmer angelegt')
      }
      setRoomModalOpen(false)
    } catch (err) {
      showToast(`Fehler: ${String(err)}`, 'error')
    } finally {
      setRoomLoading(false)
    }
  }

  async function handleDeleteRoom() {
    if (!deleteRoomTarget) return
    setRoomLoading(true)
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', deleteRoomTarget.id)
      if (error) throw error
      setRooms(prev => prev.filter(r => r.id !== deleteRoomTarget.id))
      showToast('Zimmer gelöscht')
      setDeleteRoomTarget(null)
    } catch (err) {
      showToast(`Fehler: ${String(err)}`, 'error')
    } finally {
      setRoomLoading(false)
    }
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId) ?? null

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputCls = 'h-11 px-3 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#2563EB]'
  const btnPrimary = 'inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium rounded-lg bg-[#F97316] text-white hover:bg-orange-600 disabled:opacity-50'
  const btnGhost = 'inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium rounded-lg bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50'
  const btnSm = 'inline-flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg bg-[#F97316] text-white hover:bg-orange-600 disabled:opacity-50'
  const btnSmGhost = 'inline-flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
  const btnDanger = 'inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'trips',  label: 'Trips',         icon: <Settings className="w-4 h-4" /> },
    { id: 'age',    label: 'Altersklassen', icon: <Users className="w-4 h-4" /> },
    { id: 'rooms',  label: 'Zimmer',        icon: <BedDouble className="w-4 h-4" /> },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Stammdaten</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: TRIPS ── */}
      {activeTab === 'trips' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[#1E3A5F]">Hüttenurlaube</h2>
            <button className={btnSm} onClick={openNewTrip}>
              <Plus className="w-4 h-4" /> Neuer Trip
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Settings className="w-10 h-10 mb-3" />
              <p className="text-sm mb-4">Noch keine Trips angelegt.</p>
              <button className={btnPrimary} onClick={openNewTrip}><Plus className="w-4 h-4" /> Ersten Trip anlegen</button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map(trip => (
                <div key={trip.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedTripId === trip.id ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setSelectedTripId(trip.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1E3A5F] truncate">{trip.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        trip.status === 'active' ? 'bg-green-100 text-green-700' :
                        trip.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                        trip.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                      }`}>{trip.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">{trip.start_date} – {trip.end_date} · Hütte: {trip.cabin_price} €</p>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditTrip(trip)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#2563EB]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTripTarget(trip)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ALTERSKLASSEN ── */}
      {activeTab === 'age' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {!selectedTripId ? (
            <p className="text-sm text-gray-500 text-center py-8">Bitte zuerst einen Trip auswählen (Tab „Trips").</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[#1E3A5F]">Altersklassen – {selectedTrip?.name}</h2>
                <div className="flex gap-2">
                  <button className={btnSmGhost} onClick={handleResetAc} disabled={acLoading}>
                    <RotateCcw className="w-4 h-4" /> Standard
                  </button>
                  <button className={btnSm} onClick={openNewAc}><Plus className="w-4 h-4" /> Neue Klasse</button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1E3A5F] text-white">
                      <th className="text-left px-3 py-2.5 font-medium">Name</th>
                      <th className="text-center px-3 py-2.5 font-medium">Alter</th>
                      <th className="text-center px-3 py-2.5 font-medium">ÜN-Fkt.</th>
                      <th className="text-center px-3 py-2.5 font-medium">VP-Fkt.</th>
                      <th className="text-center px-3 py-2.5 font-medium">Essen-Fkt.</th>
                      <th className="px-3 py-2.5 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {ageCategories.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Keine Altersklassen. Standard-Button klicken.</td></tr>
                    )}
                    {[...ageCategories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((ac, i) => (
                      <tr key={ac.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2.5 font-medium">{ac.name}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{ac.age_from}–{ac.age_to} J.</td>
                        <td className="px-3 py-2.5 text-center font-mono">{Number(ac.overnight_factor).toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{Number(ac.meal_factor).toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{Number(ac.food_factor).toFixed(2)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditAc(ac)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-[#2563EB]"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteAcTarget(ac)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: ZIMMER ── */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {!selectedTripId ? (
            <p className="text-sm text-gray-500 text-center py-8">Bitte zuerst einen Trip auswählen (Tab „Trips").</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[#1E3A5F]">Zimmer – {selectedTrip?.name}</h2>
                <button className={btnSm} onClick={openNewRoom}><Plus className="w-4 h-4" /> Neues Zimmer</button>
              </div>
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <BedDouble className="w-10 h-10 mb-2" />
                  <p className="text-sm">Noch keine Zimmer angelegt.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...rooms].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(room => (
                    <div key={room.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BedDouble className="w-5 h-5 text-[#2563EB]" />
                        <div>
                          <p className="font-medium text-sm">{room.name}</p>
                          <p className="text-xs text-gray-500">{room.beds} Bett{room.beds !== 1 ? 'en' : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditRoom(room)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-[#2563EB]"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteRoomTarget(room)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Trip Form Modal */}
      <Modal open={tripModalOpen} title={editTrip ? 'Trip bearbeiten' : 'Neuen Trip anlegen'} onClose={() => setTripModalOpen(false)} maxWidth="max-w-xl">
        <form onSubmit={handleSaveTrip} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input className={inputCls} value={tripForm.name} onChange={e => setTripForm(p => ({ ...p, name: e.target.value }))} required placeholder="z.B. Hüttenurlaub 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum *</label>
              <input className={inputCls} type="date" value={tripForm.start_date} onChange={e => setTripForm(p => ({ ...p, start_date: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum *</label>
              <input className={inputCls} type="date" value={tripForm.end_date} onChange={e => setTripForm(p => ({ ...p, end_date: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hüttenpreis (€)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={tripForm.cabin_price} onChange={e => setTripForm(p => ({ ...p, cabin_price: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pauschale VP (€)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={tripForm.flat_rate_meal} onChange={e => setTripForm(p => ({ ...p, flat_rate_meal: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pauschale ÜN (€)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={tripForm.flat_rate_overnight} onChange={e => setTripForm(p => ({ ...p, flat_rate_overnight: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <input className={inputCls} value={tripForm.bank_iban} onChange={e => setTripForm(p => ({ ...p, bank_iban: e.target.value }))} placeholder="DE00 0000 0000 0000 0000 00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className={inputCls} value={tripForm.status} onChange={e => setTripForm(p => ({ ...p, status: e.target.value }))}>
              <option value="planning">Planung</option>
              <option value="active">Aktiv</option>
              <option value="completed">Abgeschlossen</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnGhost} onClick={() => setTripModalOpen(false)} disabled={tripLoading}>Abbrechen</button>
            <button type="submit" className={btnPrimary} disabled={tripLoading}>
              {tripLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editTrip ? 'Speichern' : 'Trip anlegen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Trip löschen */}
      <Modal open={!!deleteTripTarget} title="Trip löschen" onClose={() => setDeleteTripTarget(null)} maxWidth="max-w-sm">
        <p className="text-sm text-gray-600 mb-6">Soll der Trip „{deleteTripTarget?.name}" wirklich gelöscht werden? Alle zugehörigen Daten werden unwiderruflich gelöscht.</p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setDeleteTripTarget(null)} disabled={tripLoading}>Abbrechen</button>
          <button className={btnDanger} onClick={handleDeleteTrip} disabled={tripLoading}>
            {tripLoading && <Loader2 className="w-4 h-4 animate-spin" />} Löschen
          </button>
        </div>
      </Modal>

      {/* AgeCategory Form */}
      <Modal open={acModalOpen} title={editAc ? 'Altersklasse bearbeiten' : 'Neue Altersklasse'} onClose={() => setAcModalOpen(false)} maxWidth="max-w-md">
        <form onSubmit={handleSaveAc} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input className={inputCls} value={acForm.name} onChange={e => setAcForm(p => ({ ...p, name: e.target.value }))} required placeholder="z.B. Erwachsene" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alter von</label>
              <input className={inputCls} type="number" min="0" max="99" value={acForm.age_from} onChange={e => setAcForm(p => ({ ...p, age_from: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alter bis</label>
              <input className={inputCls} type="number" min="0" max="99" value={acForm.age_to} onChange={e => setAcForm(p => ({ ...p, age_to: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['overnight_factor', 'ÜN-Faktor'], ['meal_factor', 'VP-Faktor'], ['food_factor', 'Essen-Faktor']] .map(([field, label]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input className={inputCls} type="number" min="0" max="2" step="0.01"
                  value={acForm[field as keyof typeof acForm]}
                  onChange={e => setAcForm(p => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnGhost} onClick={() => setAcModalOpen(false)} disabled={acLoading}>Abbrechen</button>
            <button type="submit" className={btnPrimary} disabled={acLoading}>
              {acLoading && <Loader2 className="w-4 h-4 animate-spin" />} Speichern
            </button>
          </div>
        </form>
      </Modal>

      {/* AgeCategory löschen */}
      <Modal open={!!deleteAcTarget} title="Altersklasse löschen" onClose={() => setDeleteAcTarget(null)} maxWidth="max-w-sm">
        <p className="text-sm text-gray-600 mb-6">Soll die Altersklasse „{deleteAcTarget?.name}" gelöscht werden?</p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setDeleteAcTarget(null)}>Abbrechen</button>
          <button className={btnDanger} onClick={handleDeleteAc} disabled={acLoading}>
            {acLoading && <Loader2 className="w-4 h-4 animate-spin" />} Löschen
          </button>
        </div>
      </Modal>

      {/* Room Form */}
      <Modal open={roomModalOpen} title={editRoom ? 'Zimmer bearbeiten' : 'Neues Zimmer'} onClose={() => setRoomModalOpen(false)} maxWidth="max-w-sm">
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input className={inputCls} value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} required placeholder="z.B. Großes Schlafzimmer" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Betten</label>
            <input className={inputCls} type="number" min="1" max="20" value={roomForm.beds} onChange={e => setRoomForm(p => ({ ...p, beds: e.target.value }))} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnGhost} onClick={() => setRoomModalOpen(false)} disabled={roomLoading}>Abbrechen</button>
            <button type="submit" className={btnPrimary} disabled={roomLoading}>
              {roomLoading && <Loader2 className="w-4 h-4 animate-spin" />} Speichern
            </button>
          </div>
        </form>
      </Modal>

      {/* Room löschen */}
      <Modal open={!!deleteRoomTarget} title="Zimmer löschen" onClose={() => setDeleteRoomTarget(null)} maxWidth="max-w-sm">
        <p className="text-sm text-gray-600 mb-6">Soll „{deleteRoomTarget?.name}" wirklich gelöscht werden?</p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setDeleteRoomTarget(null)}>Abbrechen</button>
          <button className={btnDanger} onClick={handleDeleteRoom} disabled={roomLoading}>
            {roomLoading && <Loader2 className="w-4 h-4 animate-spin" />} Löschen
          </button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
