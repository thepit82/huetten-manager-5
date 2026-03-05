'use client'

import { useState, useMemo } from 'react'
import { BedDouble, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSelectedTrip } from '@/lib/useSelectedTrip'
import { usePersons } from '@/hooks/usePersons'
import { useRooms } from '@/hooks/useRooms'
import type { Tables } from '@/types/database'

type Trip = Tables<'trips'>

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const current = new Date(start)
  const last = new Date(end)
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function formatWeekday(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { weekday: 'short' })
}

function isPersonPresentOnDate(person: { arrival_date: string; departure_date: string }, date: string): boolean {
  return date >= person.arrival_date && date < person.departure_date
}

export default function BelegungPage() {
  const { selectedTrip } = useSelectedTrip()
  const trip = selectedTrip as Trip | null
  const { persons, loading: loadingPersons } = usePersons(trip?.id ?? null)
  const { rooms, loading: loadingRooms } = useRooms(trip?.id ?? null)

  const [viewStart, setViewStart] = useState(0)
  const DAYS_VISIBLE = 7

  const allDates = useMemo(() => {
    if (!trip) return []
    return getDatesInRange(trip.start_date, trip.end_date)
  }, [trip])

  const visibleDates = allDates.slice(viewStart, viewStart + DAYS_VISIBLE)

  const canGoBack = viewStart > 0
  const canGoForward = viewStart + DAYS_VISIBLE < allDates.length

  // Group persons by room
  const personsWithoutRoom = useMemo(() =>
    persons.filter(p => !p.room_id), [persons])

  const personsByRoom = useMemo(() => {
    const map: Record<string, typeof persons> = {}
    for (const room of rooms) {
      map[room.id] = persons.filter(p => p.room_id === room.id)
    }
    return map
  }, [persons, rooms])

  // Count occupancy per room per date
  function getOccupancyColor(occupied: number, capacity: number): string {
    if (occupied === 0) return 'bg-gray-50 text-gray-300'
    if (occupied > capacity) return 'bg-red-100 text-red-700'
    if (occupied === capacity) return 'bg-green-100 text-green-700'
    return 'bg-blue-50 text-blue-600'
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Bitte wähle einen Hüttenurlaub aus.</p>
        </div>
      </div>
    )
  }

  const loading = loadingPersons || loadingRooms

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Zimmerbelegung</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rooms.length} Zimmer · {persons.filter(p => p.room_id).length} von {persons.length} Personen zugewiesen
          </p>
        </div>
        {allDates.length > DAYS_VISIBLE && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewStart(Math.max(0, viewStart - DAYS_VISIBLE))}
              disabled={!canGoBack}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[120px] text-center">
              {formatShortDate(visibleDates[0])} – {formatShortDate(visibleDates[visibleDates.length - 1])}
            </span>
            <button
              onClick={() => setViewStart(Math.min(allDates.length - DAYS_VISIBLE, viewStart + DAYS_VISIBLE))}
              disabled={!canGoForward}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">Lade…</div>
      ) : (
        <>
          {/* Room Grid */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1E3A5F] text-white">
                    <th className="px-4 py-3 text-left font-medium w-40 sticky left-0 bg-[#1E3A5F] z-10">Zimmer</th>
                    <th className="px-4 py-3 text-left font-medium w-16">Betten</th>
                    {visibleDates.map(date => (
                      <th key={date} className="px-2 py-3 text-center font-medium w-20">
                        <div className="text-xs opacity-75">{formatWeekday(date)}</div>
                        <div>{formatShortDate(date)}</div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium">Personen</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room, idx) => {
                    const roomPersons = personsByRoom[room.id] ?? []
                    return (
                      <tr key={room.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium text-[#1E3A5F] sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-2">
                            <BedDouble className="w-4 h-4 text-gray-400" />
                            {room.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{room.beds}</td>
                        {visibleDates.map(date => {
                          const presentPersons = roomPersons.filter(p => isPersonPresentOnDate(p, date))
                          const count = presentPersons.length
                          return (
                            <td key={date} className="px-2 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${getOccupancyColor(count, room.beds)}`}>
                                {count > 0 ? count : '–'}
                              </span>
                            </td>
                          )
                        })}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {roomPersons.map(p => (
                              <span key={p.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                {p.first_name} {p.last_name.charAt(0)}.
                              </span>
                            ))}
                            {roomPersons.length === 0 && (
                              <span className="text-xs text-gray-400">Leer</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-gray-600 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gray-50 border border-gray-200 inline-block"></span>
              Leer
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-50 inline-block"></span>
              Teilweise belegt
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-green-100 inline-block"></span>
              Voll belegt
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-red-100 inline-block"></span>
              Überbelegt
            </div>
          </div>

          {/* Persons without room */}
          {personsWithoutRoom.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">
                  {personsWithoutRoom.length} Person{personsWithoutRoom.length !== 1 ? 'en' : ''} ohne Zimmer
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {personsWithoutRoom.map(p => (
                  <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-amber-200 text-amber-800">
                    {p.first_name} {p.last_name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-2">
                Zimmer zuweisen unter → Personen (Stift-Icon)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
