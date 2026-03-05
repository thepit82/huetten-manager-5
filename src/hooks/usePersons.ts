'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Person = Tables<'persons'>
export type PersonInsert = TablesInsert<'persons'>
export type PersonUpdate = TablesUpdate<'persons'>

export function usePersons(tripId: string | null) {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPersons = useCallback(async () => {
    if (!tripId) {
      setPersons([])
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('persons')
      .select('*')
      .eq('trip_id', tripId)
      .order('last_name')
      .order('first_name')
    if (err) {
      setError(err.message)
    } else {
      setPersons(data ?? [])
    }
    setLoading(false)
  }, [tripId])

  useEffect(() => {
    fetchPersons()
  }, [fetchPersons])

  const createPerson = async (data: Omit<PersonInsert, 'trip_id'>): Promise<Person | null> => {
    if (!tripId) return null
    const supabase = createClient()
    const { data: created, error: err } = await supabase
      .from('persons')
      .insert({ ...data, trip_id: tripId })
      .select()
      .single()
    if (err) throw new Error(err.message)
    setPersons(prev => [...prev, created].sort((a, b) =>
      `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`)
    ))
    return created
  }

  const updatePerson = async (id: string, data: PersonUpdate): Promise<Person | null> => {
    const supabase = createClient()
    const { data: updated, error: err } = await supabase
      .from('persons')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    setPersons(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }

  const deletePerson = async (id: string): Promise<void> => {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('persons')
      .delete()
      .eq('id', id)
    if (err) throw new Error(err.message)
    setPersons(prev => prev.filter(p => p.id !== id))
  }

  return { persons, loading, error, refetch: fetchPersons, createPerson, updatePerson, deletePerson }
}
