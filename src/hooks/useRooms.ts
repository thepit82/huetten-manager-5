'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Room = Tables<'rooms'>

export function useRooms(tripId: string | null) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRooms = useCallback(async () => {
    if (!tripId) { setRooms([]); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('trip_id', tripId)
      .order('sort_order')
      .order('name')
    setRooms(data ?? [])
    setLoading(false)
  }, [tripId])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  return { rooms, loading, refetch: fetchRooms }
}
