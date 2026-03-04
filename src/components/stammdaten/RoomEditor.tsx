'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, BedDouble } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { getSupabaseClient } from '@/lib/supabase'
import type { Room, RoomInsert } from '@/types/database'

interface RoomEditorProps {
  tripId: string
  rooms: Room[]
  onChange: (rooms: Room[]) => void
}

interface RoomForm {
  name: string
  beds: string
}

export function RoomEditor({ tripId, rooms, onChange }: RoomEditorProps) {
  const supabase = getSupabaseClient()
  const { success, error: showError } = useToast()

  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<RoomForm>({ name: '', beds: '2' })
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [loading, setLoading] = useState(false)

  function openNew() {
    setEditingRoom(null)
    setForm({ name: '', beds: '2' })
    setFormOpen(true)
  }

  function openEdit(room: Room) {
    setEditingRoom(room)
    setForm({ name: room.name, beds: String(room.beds) })
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)

    const payload: RoomInsert = {
      name: form.name.trim(),
      beds: Math.max(1, Number(form.beds)),
      trip_id: tripId,
      sort_order: editingRoom?.sort_order ?? rooms.length,
    }

    try {
      if (editingRoom) {
        const { data, error } = await supabase
          .from('rooms')
          .update(payload)
          .eq('id', editingRoom.id)
          .select()
          .single()
        if (error) throw error
        onChange(rooms.map((r) => (r.id === editingRoom.id ? data : r)))
        success('Zimmer gespeichert')
      } else {
        const { data, error } = await supabase
          .from('rooms')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        onChange([...rooms, data])
        success('Zimmer angelegt')
      }
      setFormOpen(false)
    } catch (err) {
      showError('Fehler', String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setLoading(true)
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', deleteTarget.id)
      if (error) throw error
      onChange(rooms.filter((r) => r.id !== deleteTarget.id))
      success('Zimmer gelöscht')
      setDeleteTarget(null)
    } catch (err) {
      showError('Fehler', String(err))
    } finally {
      setLoading(false)
    }
  }

  const totalBeds = rooms.reduce((s, r) => s + r.beds, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {rooms.length} Zimmer · {totalBeds} Betten gesamt
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Neues Zimmer
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center text-gray-400">
          <BedDouble className="h-10 w-10 mb-2" />
          <p className="text-sm">Noch keine Zimmer angelegt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <BedDouble className="h-5 w-5 text-[#2563EB] shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{room.name}</p>
                    <p className="text-xs text-gray-500">{room.beds} Bett{room.beds !== 1 ? 'en' : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(room)}
                    className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-[#2563EB]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(room)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-[#DC2626]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRoom ? 'Zimmer bearbeiten' : 'Neues Zimmer'}
        className="max-w-sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            placeholder="z.B. Großes Schlafzimmer"
            autoFocus
          />
          <Input
            label="Anzahl Betten"
            type="number"
            min="1"
            max="20"
            value={form.beds}
            onChange={(e) => setForm((p) => ({ ...p, beds: e.target.value }))}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" loading={loading}>
              Speichern
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Zimmer löschen"
        message={`Soll das Zimmer „${deleteTarget?.name}" wirklich gelöscht werden? Alle Zimmerzuteilungen gehen verloren.`}
        confirmLabel="Löschen"
        loading={loading}
      />
    </div>
  )
}
