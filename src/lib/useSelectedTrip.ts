'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trip } from '@/types/database'

const STORAGE_KEY = 'huetten-manager-5-selected-trip'

export function useSelectedTrip() {
  const [selectedTrip, setSelectedTripState] = useState<Trip | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSelectedTripState(JSON.parse(stored) as Trip)
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true)
  }, [])

  const setSelectedTrip = useCallback((trip: Trip | null) => {
    setSelectedTripState(trip)
    try {
      if (trip) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trip))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  return { selectedTrip, setSelectedTrip, isLoaded }
}
