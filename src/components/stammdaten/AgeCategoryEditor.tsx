'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, RotateCcw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { Database } from '@/types/database'
import type { AgeCategory, AgeCategoryInsert } from '@/types/database'

// Direkt typisierter Client – umgeht den Singleton-Inference-Bug mit getSupabaseClient()
function useSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const DEFAULT_CATEGORIES: Omit<AgeCategoryInsert, 'trip_id' | 'sort_order'>[] = [
  { name: 'Kleinkinder', age_from: 0,  age_to: 5,  overnight_factor: 0,    meal_factor: 0,   food_factor: 0.25 },
  { name: 'Kinder',      age_from: 6,  age_to: 14, overnight_factor: 0.75, meal_factor: 0.5, food_factor: 0.75 },
  { name: 'Jugendliche', age_from: 15, age_to: 17, overnight_factor: 1.0,  meal_factor: 0.5, food_factor: 1.25 },
  { name: 'Erwachsene',  age_from: 18, age_to: 99, overnight_factor: 1.0,  meal_factor: 1.0, food_factor: 1.0  },
]

interface AgeCategoryEditorProps {
  tripId: string
  categories: AgeCategory[]
  onChange: (categories: AgeCategory[]) => void
}

interface AcFormState {
  name: string
  age_from: string
  age_to: string
  overnight_factor: string
  meal_factor: string
  food_factor: string
}

function defaultAcForm(ac?: AgeCategory | null): AcFormState {
  return {
    name: ac?.name ?? '',
    age_from: String(ac?.age_from ?? 0),
    age_to: String(ac?.age_to ?? 99),
    overnight_factor: String(ac?.overnight_factor ?? 1.0),
    meal_factor: String(ac?.meal_factor ?? 1.0),
    food_factor: String(ac?.food_factor ?? 1.0),
  }
}

export function AgeCategoryEditor({ tripId, categories, onChange }: AgeCategoryEditorProps) {
  const supabase = useSupabase()
  const { success, error: showError } = useToast()

  const [editingAc, setEditingAc] = useState<AgeCategory | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<AcFormState>(defaultAcForm())
  const [deleteTarget, setDeleteTarget] = useState<AgeCategory | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  function openNew() {
    setEditingAc(null)
    setForm(defaultAcForm())
    setFormOpen(true)
  }

  function openEdit(ac: AgeCategory) {
    setEditingAc(ac)
    setForm(defaultAcForm(ac))
    setFormOpen(true)
  }

  function setField(field: keyof AcFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const parsedFields = {
      name: form.name.trim(),
      age_from: Number(form.age_from),
      age_to: Number(form.age_to),
      overnight_factor: Number(form.overnight_factor),
      meal_factor: Number(form.meal_factor),
      food_factor: Number(form.food_factor),
    }

    try {
      if (editingAc) {
        // Expliziter Typ direkt aus Database – kein Alias, maximale TypeScript-Klarheit
        const updateData: Database['public']['Tables']['age_categories']['Update'] = {
          name: parsedFields.name,
          age_from: parsedFields.age_from,
          age_to: parsedFields.age_to,
          overnight_factor: parsedFields.overnight_factor,
          meal_factor: parsedFields.meal_factor,
          food_factor: parsedFields.food_factor,
        }
        const { data, error } = await supabase
          .from('age_categories')
          .update(updateData)
          .eq('id', editingAc.id)
          .select()
          .single()
        if (error) throw error
        onChange(categories.map((c) => (c.id === editingAc.id ? data : c)))
        success('Altersklasse gespeichert')
      } else {
        const insertData: Database['public']['Tables']['age_categories']['Insert'] = {
          ...parsedFields,
          trip_id: tripId,
          sort_order: categories.length,
        }
        const { data, error } = await supabase
          .from('age_categories')
          .insert(insertData)
          .select()
          .single()
        if (error) throw error
        onChange([...categories, data])
        success('Altersklasse angelegt')
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
      const { error } = await supabase
        .from('age_categories')
        .delete()
        .eq('id', deleteTarget.id)
      if (error) throw error
      onChange(categories.filter((c) => c.id !== deleteTarget.id))
      success('Altersklasse gelöscht')
      setDeleteTarget(null)
    } catch (err) {
      showError('Fehler', String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetToDefault() {
    setResetLoading(true)
    try {
      if (categories.length > 0) {
        const { error } = await supabase
          .from('age_categories')
          .delete()
          .eq('trip_id', tripId)
        if (error) throw error
      }

      const inserts: Database['public']['Tables']['age_categories']['Insert'][] =
        DEFAULT_CATEGORIES.map((cat, i) => ({
          name: cat.name,
          age_from: cat.age_from,
          age_to: cat.age_to,
          overnight_factor: cat.overnight_factor,
          meal_factor: cat.meal_factor,
          food_factor: cat.food_factor,
          trip_id: tripId,
          sort_order: i,
        }))

      const { data, error } = await supabase
        .from('age_categories')
        .insert(inserts)
        .select()
      if (error) throw error
      onChange(data ?? [])
      success('Altersklassen zurückgesetzt', 'Standard-Kategorien wiederhergestellt')
    } catch (err) {
      showError('Fehler beim Zurücksetzen', String(err))
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Neue Klasse
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetToDefault} loading={resetLoading}>
            <RotateCcw className="h-4 w-4" />
            Standard
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1E3A5F] text-white">
              <th className="text-left px-3 py-2.5 font-medium">Name</th>
              <th className="text-center px-3 py-2.5 font-medium">Alter von–bis</th>
              <th className="text-center px-3 py-2.5 font-medium">ÜN-Faktor</th>
              <th className="text-center px-3 py-2.5 font-medium">VP-Faktor</th>
              <th className="text-center px-3 py-2.5 font-medium">Essen-Faktor</th>
              <th className="px-3 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Keine Altersklassen angelegt.
                </td>
              </tr>
            )}
            {[...categories]
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((ac, idx) => (
                <tr key={ac.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2.5 font-medium">{ac.name}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">
                    {ac.age_from}–{ac.age_to} J.
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono">
                    {Number(ac.overnight_factor).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono">
                    {Number(ac.meal_factor).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono">
                    {Number(ac.food_factor).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(ac)}
                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-[#2563EB]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(ac)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-[#DC2626]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingAc ? 'Altersklasse bearbeiten' : 'Neue Altersklasse'}
        className="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" value={form.name} onChange={setField('name')} required placeholder="z.B. Erwachsene" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Alter von" type="number" min="0" max="99" value={form.age_from} onChange={setField('age_from')} required />
            <Input label="Alter bis"  type="number" min="0" max="99" value={form.age_to}   onChange={setField('age_to')}   required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="ÜN-Faktor"    type="number" min="0" max="2" step="0.01" value={form.overnight_factor} onChange={setField('overnight_factor')} hint="0 = kostenlos" />
            <Input label="VP-Faktor"    type="number" min="0" max="2" step="0.01" value={form.meal_factor}      onChange={setField('meal_factor')} />
            <Input label="Essen-Faktor" type="number" min="0" max="2" step="0.01" value={form.food_factor}      onChange={setField('food_factor')} hint="Mengenkalkulation" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)} disabled={loading}>Abbrechen</Button>
            <Button type="submit" loading={loading}>Speichern</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Altersklasse löschen"
        message={`Soll die Altersklasse „${deleteTarget?.name}" wirklich gelöscht werden?`}
        confirmLabel="Löschen"
        loading={loading}
      />
    </div>
  )
}
