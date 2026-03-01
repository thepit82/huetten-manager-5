import type { AgeCategory } from '@/types/database'

/**
 * Returns the matching age category for a person at the trip start date.
 *
 * BUGFIX vs v4.x: v4.x only compared years (birth.getFullYear()).
 * This version does an exact birthdate comparison so persons whose birthday
 * falls AFTER the trip start date are correctly assigned to the younger category.
 */
export function getAgeCategory(
  birthDate: string,
  tripStartDate: string,
  ageCategories: AgeCategory[]
): AgeCategory | null {
  const birth = new Date(birthDate)
  const start = new Date(tripStartDate)

  let age = start.getFullYear() - birth.getFullYear()
  const monthDiff = start.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && start.getDate() < birth.getDate())) {
    age--
  }

  const sorted = [...ageCategories].sort((a, b) => a.sort_order ?? 0 - (b.sort_order ?? 0))
  return sorted.find((ac) => age >= ac.age_from && age <= ac.age_to) ?? null
}

/**
 * Returns all calendar dates between start (inclusive) and end (exclusive).
 * For a 7-day trip: days 1–7 are returned; day 8 (end_date) is excluded.
 * The LAST date in the result = last VP day (the day before departure/end).
 */
export function getTripDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current < end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/**
 * Determines if a given date is the LAST day of the trip (departure day).
 * On the last day there is NO VP (no dinner on departure day).
 */
export function isLastDay(date: string, endDate: string): boolean {
  return date === endDate
}

/**
 * VP dates for a person: from their arrival to the day BEFORE their departure.
 * First day = VP day, last day (departure) = never VP day.
 */
export function getPersonMealDates(
  arrivalDate: string,
  departureDate: string,
  tripDates: string[]
): string[] {
  return tripDates.filter(
    (d) => d >= arrivalDate && d < departureDate
  )
}

/**
 * Overnight dates for a person: arrival night until last night before departure.
 * Sleeping from night N to morning N+1 counts as 1 overnight.
 * Number of overnights = number of days from arrival to day before departure.
 */
export function getPersonOvernightDates(
  arrivalDate: string,
  departureDate: string,
  tripDates: string[]
): string[] {
  // Overnight on date D means sleeping night from D to D+1
  // Last possible overnight night = day before departure
  const lastOvernightDate = new Date(departureDate)
  lastOvernightDate.setDate(lastOvernightDate.getDate() - 1)
  const lastOvernight = lastOvernightDate.toISOString().split('T')[0]

  return tripDates.filter(
    (d) => d >= arrivalDate && d <= lastOvernight
  )
}

/**
 * Formats a number as currency (EUR).
 */
export function formatEur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Formats a date string (YYYY-MM-DD) for display in German locale.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Returns today's date as YYYY-MM-DD string.
 */
export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}
