'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { getSupabaseClient } from '@/lib/supabase'
import type { Trip } from '@/types/database'

interface TripFormProps {
  open: boolean
  onClose: () => void
  onSaved: (trip: Trip) => void
  editTrip?: Trip | null
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planung' },
  { value: 'active', label: 'Aktiv' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' },
]

interface FormState {
  name: string
  start_date: string
  end_date: string
  cabin_price: string
  flat_rate_meal: string
  flat_rate_overnight: string
  bank_iban: string
  status: string
}

function defaultForm(trip?: Trip | null): FormState {
  if (trip) {
    return {
      name: trip.name,
      start_date: trip.start_date,
      end_date: trip.end_date,
      cabin_price: String(trip.cabin_price),
      flat_rate_meal: String(trip.flat_rate_meal),
      flat_rate_overnight: String(trip.flat_rate_overnight),
      bank_iban: trip.bank_iban ?? '',
      status: trip.status,
    }
  }
  const year = new Date().getFullYear()
  return {
    name: `Hüttenurlaub ${year + 1}`,
    start_date: '',
    end_date: '',
    cabin_price: '0',
    flat_rate_meal: '0',
    flat_rate_overnight: '0',
    bank_iban: '',
    status: 'planning',
  }
}

export function TripForm({ open, onClose, onSaved, editTrip }: TripFormProps) {
  const supabase = getSupabaseClient()
  const { success, error: showError } = useToast()
  const [form, setForm] = useState<FormState>(defaultForm(editTrip))
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<FormState>>({})

  useEffect(() => {
    if (open) {
      setForm(defaultForm(editTrip))
      setErrors({})
    }
  }, [open, editTrip])

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const errs: Partial<FormState> = {}
    if (!form.name.trim()) errs.name = 'Name ist erforderlich'
    if (!form.start_date) errs.start_date = 'Startdatum erforderlich'
    if (!form.end_date) errs.end_date = 'Enddatum erforderlich'
    if (form.start_date && form.end_date && form.end_date <= form.start_date) {
      errs.end_date = 'Enddatum muss nach Startdatum liegen'
    }
    if (isNaN(Number(form.cabin_price))) errs.cabin_price = 'Ungültiger Betrag'
    if (isNaN(Number(form.flat_rate_meal))) errs.flat_rate_meal = 'Ungültiger Betrag'
    if (isNaN(Number(form.flat_rate_overnight))) errs.flat_rate_overnight = 'Ungültiger Betrag'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const payload = {
      name: form.name.trim(),
      year: new Date(form.start_date).getFullYear(),
      start_date: form.start_date,
      end_date: form.end_date,
      cabin_price: Number(form.cabin_price),
      flat_rate_meal: Number(form.flat_rate_meal),
      flat_rate_overnight: Number(form.flat_rate_overnight),
      bank_iban: form.bank_iban.trim() || null,
      status: form.status as Trip['status'],
    }

    try {
      if (editTrip) {
        const { data, error } = await supabase
          .from('trips')
          .update(payload)
          .eq('id', editTrip.id)
          .select()
          .single()
        if (error) throw error
        success('Trip gespeichert', data.name)
        onSaved(data)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
          .from('trips')
          .insert({ ...payload, created_by: user?.id })
          .select()
          .single()
        if (error) throw error
        success('Trip angelegt', `${data.name} wurde erstellt`)
        onSaved(data)
      }
      onClose()
    } catch (err) {
      showError('Fehler beim Speichern', String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTrip ? 'Trip bearbeiten' : 'Neuen Trip anlegen'}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          required
          placeholder="z.B. Hüttenurlaub 2026"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Startdatum"
            type="date"
            value={form.start_date}
            onChange={set('start_date')}
            error={errors.start_date}
            required
          />
          <Input
            label="Enddatum"
            type="date"
            value={form.end_date}
            onChange={set('end_date')}
            error={errors.end_date}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Hüttenpreis (€)"
            type="number"
            min="0"
            step="0.01"
            value={form.cabin_price}
            onChange={set('cabin_price')}
            error={errors.cabin_price}
            hint="Gesamt-Hüttenmiete"
          />
          <Input
            label="Pauschale VP (€)"
            type="number"
            min="0"
            step="0.01"
            value={form.flat_rate_meal}
            onChange={set('flat_rate_meal')}
            error={errors.flat_rate_meal}
            hint="Pro VP-Einheit"
          />
          <Input
            label="Pauschale ÜN (€)"
            type="number"
            min="0"
            step="0.01"
            value={form.flat_rate_overnight}
            onChange={set('flat_rate_overnight')}
            error={errors.flat_rate_overnight}
            hint="Pro ÜN-Einheit"
          />
        </div>

        <Input
          label="IBAN (für ÜN-Abrechnung per E-Mail)"
          value={form.bank_iban}
          onChange={set('bank_iban')}
          placeholder="DE00 0000 0000 0000 0000 00"
          hint="Wird bei Langzeitpflege-Abrechnungen verwendet"
        />

        <Select
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={STATUS_OPTIONS}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button type="submit" loading={loading}>
            {editTrip ? 'Speichern' : 'Trip anlegen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
