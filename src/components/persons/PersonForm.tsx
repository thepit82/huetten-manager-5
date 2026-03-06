'use client'

import { useState, useEffect } from 'react'
import type { Person } from '@/hooks/usePersons'
import type { Room } from '@/hooks/useRooms'
import type { BillingGroup } from '@/hooks/useBillingGroups'
import type { Tables } from '@/types/database'

type Trip = Tables<'trips'>

// Einheitlicher Formular-Typ – löst den Union-Type-Fehler
export interface PersonFormData {
  first_name: string
  last_name: string
  birth_date: string
  phone: string | null
  email: string | null
  arrival_date: string
  departure_date: string
  room_id: string | null
  billing_group_id: string | null
  registration_required: boolean
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  nationality: string | null
  id_type: 'id_card' | 'passport' | null
  id_number: string | null
  issuing_authority: string | null
}

interface PersonFormProps {
  person?: Person | null
  trip: Trip
  rooms: Room[]
  billingGroups: BillingGroup[]
  onSave: (data: PersonFormData) => Promise<void>
  onCancel: () => void
}

function emptyForm(trip: Trip): PersonFormData {
  return {
    first_name: '',
    last_name: '',
    birth_date: '',
    phone: null,
    email: null,
    arrival_date: trip.start_date,
    departure_date: trip.end_date,
    room_id: null,
    billing_group_id: null,
    registration_required: false,
    street: null,
    house_number: null,
    postal_code: null,
    city: null,
    nationality: null,
    id_type: null,
    id_number: null,
    issuing_authority: null,
  }
}

function personToForm(person: Person): PersonFormData {
  return {
    first_name: person.first_name,
    last_name: person.last_name,
    birth_date: person.birth_date,
    phone: person.phone ?? null,
    email: person.email ?? null,
    arrival_date: person.arrival_date,
    departure_date: person.departure_date,
    room_id: person.room_id ?? null,
    billing_group_id: person.billing_group_id ?? null,
    registration_required: person.registration_required ?? false,
    street: person.street ?? null,
    house_number: person.house_number ?? null,
    postal_code: person.postal_code ?? null,
    city: person.city ?? null,
    nationality: person.nationality ?? null,
    id_type: (person.id_type as 'id_card' | 'passport' | null) ?? null,
    id_number: person.id_number ?? null,
    issuing_authority: person.issuing_authority ?? null,
  }
}

export default function PersonForm({ person, trip, rooms, billingGroups, onSave, onCancel }: PersonFormProps) {
  const [form, setForm] = useState<PersonFormData>(() => emptyForm(trip))
  const [saving, setSaving] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    if (person) {
      const f = personToForm(person)
      setForm(f)
      setShowRegistration(f.registration_required)
    } else {
      setForm(emptyForm(trip))
      setShowRegistration(false)
    }
  }, [person, trip])

  const set = <K extends keyof PersonFormData>(field: K, value: PersonFormData[K]) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stammdaten */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Stammdaten</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Vorname *</label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={e => set('first_name', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nachname *</label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={e => set('last_name', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Geburtsdatum *</label>
            <input
              type="date"
              required
              value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={e => set('phone', e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>E-Mail</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={e => set('email', e.target.value || null)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Aufenthalt */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Aufenthalt</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Anreise *</label>
            <input
              type="date"
              required
              min={trip.start_date}
              max={trip.end_date}
              value={form.arrival_date}
              onChange={e => set('arrival_date', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Abreise *</label>
            <input
              type="date"
              required
              min={trip.start_date}
              max={trip.end_date}
              value={form.departure_date}
              onChange={e => set('departure_date', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Zimmer</label>
            <select
              value={form.room_id ?? ''}
              onChange={e => set('room_id', e.target.value || null)}
              className={inputClass}
            >
              <option value="">— kein Zimmer —</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.beds} Betten)</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Abrechnungsgruppe</label>
            <select
              value={form.billing_group_id ?? ''}
              onChange={e => set('billing_group_id', e.target.value || null)}
              className={inputClass}
            >
              <option value="">— keine Gruppe —</option>
              {billingGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Meldeliste */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Meldeliste</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.registration_required}
              onChange={e => {
                set('registration_required', e.target.checked)
                setShowRegistration(e.target.checked)
              }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Meldepflichtig</span>
          </label>
        </div>

        {showRegistration && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <label className={labelClass}>Straße</label>
              <input
                type="text"
                value={form.street ?? ''}
                onChange={e => set('street', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Hausnummer</label>
              <input
                type="text"
                value={form.house_number ?? ''}
                onChange={e => set('house_number', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>PLZ</label>
              <input
                type="text"
                value={form.postal_code ?? ''}
                onChange={e => set('postal_code', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ort</label>
              <input
                type="text"
                value={form.city ?? ''}
                onChange={e => set('city', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Staatsangehörigkeit</label>
              <input
                type="text"
                value={form.nationality ?? ''}
                onChange={e => set('nationality', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ausweistyp</label>
              <select
                value={form.id_type ?? ''}
                onChange={e => set('id_type', (e.target.value as 'id_card' | 'passport') || null)}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="id_card">Personalausweis</option>
                <option value="passport">Reisepass</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Ausweisnummer</label>
              <input
                type="text"
                value={form.id_number ?? ''}
                onChange={e => set('id_number', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ausstellungsbehörde</label>
              <input
                type="text"
                value={form.issuing_authority ?? ''}
                onChange={e => set('issuing_authority', e.target.value || null)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px]"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 min-h-[44px]"
        >
          {saving ? 'Speichern…' : person ? 'Speichern' : 'Hinzufügen'}
        </button>
      </div>
    </form>
  )
}
