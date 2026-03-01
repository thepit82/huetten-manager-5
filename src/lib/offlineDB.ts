import Dexie, { type Table } from 'dexie'
import type { Attendance, Expense } from '@/types/database'

// Offline-capable tables mirroring critical Supabase data
export interface OfflineAttendance extends Omit<Attendance, 'created_at' | 'updated_at'> {
  _synced: boolean
  _localId?: number
}

export interface OfflineExpense extends Omit<Expense, 'created_at' | 'updated_at'> {
  _synced: boolean
  _localId?: number
}

class HuettenManagerDB extends Dexie {
  attendance!: Table<OfflineAttendance>
  expenses!: Table<OfflineExpense>

  constructor() {
    super('huetten-manager-5')
    this.version(1).stores({
      attendance: '++_localId, id, trip_id, person_id, date, _synced',
      expenses: '++_localId, id, trip_id, person_id, date, _synced',
    })
  }
}

export const offlineDB = new HuettenManagerDB()

// ---------------------------------------------------------------------------
// Sync helpers
// ---------------------------------------------------------------------------

/**
 * Upserts an attendance record in the local DB.
 * Marks as unsynced until confirmed by Supabase.
 */
export async function upsertOfflineAttendance(
  record: Omit<OfflineAttendance, '_synced' | '_localId'>
): Promise<void> {
  const existing = await offlineDB.attendance
    .where({ person_id: record.person_id, date: record.date })
    .first()

  if (existing) {
    await offlineDB.attendance.update(existing._localId!, { ...record, _synced: false })
  } else {
    await offlineDB.attendance.add({ ...record, _synced: false })
  }
}

/**
 * Returns all unsynced attendance records for upload.
 */
export async function getUnsyncedAttendance(): Promise<OfflineAttendance[]> {
  return offlineDB.attendance.where('_synced').equals(0).toArray()
}

/**
 * Marks attendance records as synced after successful Supabase upsert.
 */
export async function markAttendanceSynced(localIds: number[]): Promise<void> {
  await offlineDB.attendance.bulkUpdate(
    localIds.map((id) => ({ key: id, changes: { _synced: true } }))
  )
}
