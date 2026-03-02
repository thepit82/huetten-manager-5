'use client'

import { useState } from 'react'
import { Copy, CheckSquare, Square } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { getSupabaseClient } from '@/lib/supabase'
import type { Trip, AgeCategory, Room } from '@/types/database'

interface TripCopyModalProps {
  open: boolean
  onClose: () => void
  /** The newly created target trip */
  targetTripId: string
  /** All available source trips (excluding target) */
  sourceTrips: Trip[]
  onCopied: (data: { ageCategories: AgeCategory[]; rooms: Room[] }) => void
}

interface CopyOptions {
  copyAgeCategories: boolean
  copyRooms: boolean
  copyPersons: boolean
  copyGroups: boolean
}

export function TripCopyModal({
  open,
  onClose,
  targetTripId,
  sourceTrips,
  onCopied,
}: TripCopyModalProps) {
  const supabase = getSupabaseClient()
  const { success, error: showError } = useToast()

  const [sourceTripId, setSourceTripId] = useState<string>(sourceTrips[0]?.id ?? '')
  const [opts, setOpts] = useState<CopyOptions>({
    copyAgeCategories: true,
    copyRooms: true,
    copyPersons: false,
    copyGroups: false,
  })
  const [loading, setLoading] = useState(false)

  function toggle(field: keyof CopyOptions) {
    setOpts((prev) => {
      const next = { ...prev, [field]: !prev[field] }

      // Coupling rules (match v4.x TripCopyModal):
      // – If groups selected → persons must be selected
      // – If persons deselected → groups must be deselected
      if (field === 'copyGroups' && next.copyGroups) {
        next.copyPersons = true
      }
      if (field === 'copyPersons' && !next.copyPersons) {
        next.copyGroups = false
      }

      return next
    })
  }

  async function handleCopy() {
    if (!sourceTripId) return
    setLoading(true)

    try {
      const newAgeCategories: AgeCategory[] = []
      const newRooms: Room[] = []

      // ---- Age categories ----
      if (opts.copyAgeCategories) {
        const { data: srcAc, error } = await supabase
          .from('age_categories')
          .select('*')
          .eq('trip_id', sourceTripId)
        if (error) throw error

        if (srcAc && srcAc.length > 0) {
          const inserts = srcAc.map(({ id: _id, created_at: _ca, updated_at: _ua, trip_id: _ti, ...rest }) => ({
            ...rest,
            trip_id: targetTripId,
          }))
          const { data: created, error: insertErr } = await supabase
            .from('age_categories')
            .insert(inserts)
            .select()
          if (insertErr) throw insertErr
          newAgeCategories.push(...(created ?? []))
        }
      }

      // ---- Rooms ----
      if (opts.copyRooms) {
        const { data: srcRooms, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('trip_id', sourceTripId)
        if (error) throw error

        if (srcRooms && srcRooms.length > 0) {
          const inserts = srcRooms.map(({ id: _id, created_at: _ca, updated_at: _ua, trip_id: _ti, ...rest }) => ({
            ...rest,
            trip_id: targetTripId,
          }))
          const { data: created, error: insertErr } = await supabase
            .from('rooms')
            .insert(inserts)
            .select()
          if (insertErr) throw insertErr
          newRooms.push(...(created ?? []))
        }
      }

      // ---- Billing groups + Persons ----
      if (opts.copyPersons || opts.copyGroups) {
        // Room id mapping (old → new)
        const roomIdMap = new Map<string, string>()
        if (opts.copyRooms) {
          const { data: srcRooms } = await supabase
            .from('rooms')
            .select('id, name')
            .eq('trip_id', sourceTripId)
          srcRooms?.forEach((srcRoom) => {
            const newRoom = newRooms.find((r) => r.name === srcRoom.name)
            if (newRoom) roomIdMap.set(srcRoom.id, newRoom.id)
          })
        }

        // 1. Load source billing groups
        const { data: srcGroups } = await supabase
          .from('billing_groups')
          .select('*')
          .eq('trip_id', sourceTripId)

        // 2. Create new groups (without contact_person_id yet)
        const groupIdMap = new Map<string, string>()
        if (opts.copyGroups && srcGroups && srcGroups.length > 0) {
          const groupInserts = srcGroups.map(({ id: _id, created_at: _ca, updated_at: _ua, trip_id: _ti, contact_person_id: _cp, ...rest }) => ({
            ...rest,
            trip_id: targetTripId,
            contact_person_id: null,
          }))
          const { data: newGroups, error } = await supabase
            .from('billing_groups')
            .insert(groupInserts)
            .select()
          if (error) throw error
          newGroups?.forEach((ng, i) => groupIdMap.set(srcGroups[i].id, ng.id))
        }

        // 3. Load + create persons
        if (opts.copyPersons) {
          const { data: srcPersons } = await supabase
            .from('persons')
            .select('*')
            .eq('trip_id', sourceTripId)

          const personIdMap = new Map<string, string>()
          if (srcPersons && srcPersons.length > 0) {
            const personInserts = srcPersons.map(({
              id: _id, created_at: _ca, updated_at: _ua, trip_id: _ti,
              room_id, billing_group_id,
              // Clear registration/address data for new trip
              street: _s, house_number: _hn, postal_code: _pc, city: _ci,
              nationality: _na, id_type: _it, id_number: _in, issuing_authority: _ia,
              registration_required: _rr,
              ...rest
            }) => ({
              ...rest,
              trip_id: targetTripId,
              room_id: room_id ? roomIdMap.get(room_id) ?? null : null,
              billing_group_id: billing_group_id && opts.copyGroups
                ? groupIdMap.get(billing_group_id) ?? null
                : null,
              registration_required: false,
              // Keep arrival/departure relative dates conceptually – user can adjust
            }))

            const { data: newPersons, error } = await supabase
              .from('persons')
              .insert(personInserts)
              .select()
            if (error) throw error

            newPersons?.forEach((np, i) => personIdMap.set(srcPersons[i].id, np.id))

            // 4. Update contact_person_id in new groups
            if (opts.copyGroups && srcGroups) {
              for (const srcGroup of srcGroups) {
                if (srcGroup.contact_person_id) {
                  const newGroupId = groupIdMap.get(srcGroup.id)
                  const newPersonId = personIdMap.get(srcGroup.contact_person_id)
                  if (newGroupId && newPersonId) {
                    await supabase
                      .from('billing_groups')
                      .update({ contact_person_id: newPersonId })
                      .eq('id', newGroupId)
                  }
                }
              }
            }
          }
        }
      }

      const what = [
        opts.copyAgeCategories && 'Altersklassen',
        opts.copyRooms && 'Zimmer',
        opts.copyPersons && 'Personen',
        opts.copyGroups && 'Gruppen',
      ]
        .filter(Boolean)
        .join(', ')

      success('Daten übernommen', `Kopiert: ${what}`)
      onCopied({ ageCategories: newAgeCategories, rooms: newRooms })
      onClose()
    } catch (err) {
      showError('Fehler beim Kopieren', String(err))
    } finally {
      setLoading(false)
    }
  }

  if (sourceTrips.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title="Daten aus Vorjahr übernehmen" className="max-w-md">
        <p className="text-gray-500 text-sm">
          Keine vorherigen Trips vorhanden, von denen Daten übernommen werden könnten.
        </p>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>Schließen</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daten aus Vorjahr übernehmen"
      className="max-w-md"
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quelle</label>
          <select
            value={sourceTripId}
            onChange={(e) => setSourceTripId(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
          >
            {sourceTrips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.year})
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Was übernehmen?</p>
          <div className="space-y-2">
            {(
              [
                { key: 'copyAgeCategories', label: 'Altersklassen', hint: 'Faktoren für ÜN, VP, Essen' },
                { key: 'copyRooms', label: 'Zimmer', hint: 'Name und Bettenzahl' },
                { key: 'copyPersons', label: 'Personen', hint: 'Alle Gastdaten (ohne Meldefelder)' },
                { key: 'copyGroups', label: 'Abrechnungsgruppen', hint: 'Gruppen + Zuordnungen' },
              ] as const
            ).map(({ key, label, hint }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className="flex items-start gap-3 w-full text-left rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                {opts[key] ? (
                  <CheckSquare className="h-5 w-5 text-[#2563EB] mt-0.5 shrink-0" />
                ) : (
                  <Square className="h-5 w-5 text-gray-300 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-500">{hint}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 px-1">
            Hinweis: Gruppen benötigen Personen. Personen ohne Gruppen sind möglich.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleCopy} loading={loading}>
            <Copy className="h-4 w-4" />
            Übernehmen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
