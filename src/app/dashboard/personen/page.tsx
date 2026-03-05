'use client'

import { useState, useMemo } from 'react'
import { UserPlus, Pencil, Trash2, Search, Users, MapPin, ClipboardList } from 'lucide-react'
import { useSelectedTrip } from '@/lib/useSelectedTrip'
import { usePersons } from '@/hooks/usePersons'
import { useRooms } from '@/hooks/useRooms'
import { useBillingGroups } from '@/hooks/useBillingGroups'
import PersonForm from '@/components/persons/PersonForm'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { Person } from '@/hooks/usePersons'
import type { Tables } from '@/types/database'

type Trip = Tables<'trips'>

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calcAge(birthDate: string, tripStart: string): number {
  const birth = new Date(birthDate)
  const start = new Date(tripStart)
  let age = start.getFullYear() - birth.getFullYear()
  const m = start.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && start.getDate() < birth.getDate())) age--
  return age
}

export default function PersonenPage() {
  const { selectedTrip } = useSelectedTrip()
  const trip = selectedTrip as Trip | null
  const { persons, loading, createPerson, updatePerson, deletePerson } = usePersons(trip?.id ?? null)
  const { rooms } = useRooms(trip?.id ?? null)
  const { billingGroups } = useBillingGroups(trip?.id ?? null)

  const [showForm, setShowForm] = useState(false)
  const [editPerson, setEditPerson] = useState<Person | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    if (!search) return persons
    const q = search.toLowerCase()
    return persons.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    )
  }, [persons, search])

  const roomMap = useMemo(() => Object.fromEntries(rooms.map(r => [r.id, r])), [rooms])
  const groupMap = useMemo(() => Object.fromEntries(billingGroups.map(g => [g.id, g])), [billingGroups])

  const handleSave = async (data: Parameters<typeof createPerson>[0]) => {
    try {
      if (editPerson) {
        await updatePerson(editPerson.id, data)
        showToast('Person aktualisiert')
      } else {
        await createPerson(data)
        showToast('Person hinzugefügt')
      }
      setShowForm(false)
      setEditPerson(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePerson(deleteTarget.id)
      showToast('Person gelöscht')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Fehler beim Löschen', 'error')
    }
    setDeleteTarget(null)
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Bitte wähle einen Hüttenurlaub aus.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Personen</h1>
          <p className="text-sm text-gray-500 mt-1">{persons.length} Teilnehmer · {trip.name}</p>
        </div>
        <button
          onClick={() => { setEditPerson(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Person hinzufügen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-[#1E3A5F]">{persons.length}</p>
              <p className="text-xs text-gray-500">Teilnehmer gesamt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-[#1E3A5F]">
                {persons.filter(p => p.room_id).length}
              </p>
              <p className="text-xs text-gray-500">Mit Zimmer</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-[#1E3A5F]">
                {persons.filter(p => p.registration_required).length}
              </p>
              <p className="text-xs text-gray-500">Meldepflichtig</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Name oder E-Mail…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Lade…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {search ? 'Keine Personen gefunden.' : 'Noch keine Personen eingetragen.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1E3A5F] text-white text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Alter</th>
                  <th className="px-4 py-3 font-medium">Anreise</th>
                  <th className="px-4 py-3 font-medium">Abreise</th>
                  <th className="px-4 py-3 font-medium">Zimmer</th>
                  <th className="px-4 py-3 font-medium">Gruppe</th>
                  <th className="px-4 py-3 font-medium">Meldung</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person, idx) => (
                  <tr key={person.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-[#1E3A5F]">
                      {person.last_name}, {person.first_name}
                      {person.email && (
                        <div className="text-xs text-gray-400 font-normal">{person.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {calcAge(person.birth_date, trip.start_date)} J.
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(person.arrival_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(person.departure_date)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {person.room_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          <MapPin className="w-3 h-3" />
                          {roomMap[person.room_id]?.name ?? '—'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {person.billing_group_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                          {groupMap[person.billing_group_id]?.name ?? '—'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {person.registration_required ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                          Meldung
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => { setEditPerson(person); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(person)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Person Form Modal */}
      <Modal
        open={showForm}
        title={editPerson ? 'Person bearbeiten' : 'Person hinzufügen'}
        onClose={() => { setShowForm(false); setEditPerson(null) }}
        size="lg"
      >
        <PersonForm
          person={editPerson}
          trip={trip}
          rooms={rooms}
          billingGroups={billingGroups}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditPerson(null) }}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Person löschen?"
        message={deleteTarget
          ? `Soll ${deleteTarget.first_name} ${deleteTarget.last_name} wirklich gelöscht werden? Alle zugehörigen Anwesenheiten und Belege werden ebenfalls entfernt.`
          : ''}
        confirmLabel="Löschen"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

