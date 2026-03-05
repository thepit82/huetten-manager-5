'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type BillingGroup = Tables<'billing_groups'>

export function useBillingGroups(tripId: string | null) {
  const [billingGroups, setBillingGroups] = useState<BillingGroup[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBillingGroups = useCallback(async () => {
    if (!tripId) { setBillingGroups([]); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('billing_groups')
      .select('*')
      .eq('trip_id', tripId)
      .order('name')
    setBillingGroups(data ?? [])
    setLoading(false)
  }, [tripId])

  useEffect(() => { fetchBillingGroups() }, [fetchBillingGroups])

  return { billingGroups, loading, refetch: fetchBillingGroups }
}
