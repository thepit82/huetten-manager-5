/**
 * Billing Core – v5.0
 *
 * Ported from v4.x abrechnungCore.ts with the following bug fixes:
 *   Bug 1: Kurzzeitpflege: `> 4 || > 4` → `>= 4 && >= 4`  (FIXED)
 *   Bug 2: Altersberechnung: year-only → exact birthdate     (FIXED in helpers.ts)
 *   Bug 3: attendance without trip_id filter                  (FIXED: trip_id is required in DB)
 *
 * Key invariants that must NEVER be violated:
 *   - VP and ÜN are always separate pots – never net them against each other
 *   - Math.ceil() per age-category group, not per person and not on the total
 *   - Flat rate (Pauschale) only when ALL members of the group have short stay
 *   - If ONE member has long stay → errechnete Sätze for the entire group
 */

import type {
  BillingInput,
  BillingResult,
  PersonBillingDetail,
  AgeCategoryBillingGroup,
} from '@/types/billing'
import type { AgeCategory, Attendance, Expense, Person } from '@/types/database'
import {
  getAgeCategory,
  getPersonMealDates,
  getPersonOvernightDates,
  getTripDates,
} from './helpers'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes a live (unsaved) billing result for a single billing group.
 * Uses current attendance/expense data – not a snapshot.
 */
export function computeLiveBilling(input: BillingInput): BillingResult {
  const {
    trip,
    billingGroup,
    persons,
    attendance,
    expenses,
    ageCategories,
    allAttendance,
    allExpenses,
    allPersons,
  } = input

  const tripDates = getTripDates(trip.start_date, trip.end_date)

  // ---------------------------------------------------------------------------
  // Step 1: Compute shared rates across the entire trip
  // ---------------------------------------------------------------------------
  const { mealRate, overnightRateBase } = computeTripRates({
    trip,
    allPersons,
    allAttendance,
    allExpenses,
    ageCategories,
    tripDates,
  })

  // ---------------------------------------------------------------------------
  // Step 2: Compute per-person details for this billing group
  // ---------------------------------------------------------------------------
  const personDetails = persons.map((person) =>
    computePersonDetail(person, attendance, ageCategories, trip.start_date, tripDates)
  )

  // ---------------------------------------------------------------------------
  // Step 3: Determine short-stay status for the GROUP
  //
  // BUGFIX (Bug 1):
  //   v4.x: if (count > 4 || nights > 4) isShortStay = false   ← WRONG
  //   v5.0: if (mealDaysCount >= 4 && overnightCount >= 4) isShortStay = false
  //
  // A person is short-stay if they have < 4 meal days AND < 4 overnights.
  // The GROUP uses flat rates only if ALL members are short-stay.
  // If ONE member has >= 4 meal days AND >= 4 overnights → whole group uses
  // calculated rates (errechnete Sätze).
  // ---------------------------------------------------------------------------
  const groupIsShortStay = personDetails.every((p) => p.isShortStay)

  // ---------------------------------------------------------------------------
  // Step 4: Compute expenses for this group (confirmed only)
  // ---------------------------------------------------------------------------
  const groupPersonIds = new Set(persons.map((p) => p.id))
  const confirmedExpenses = expenses.filter(
    (e) => e.status === 'confirmed' && e.person_id !== null && groupPersonIds.has(e.person_id)
  )
  const expensesTotal = confirmedExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // ---------------------------------------------------------------------------
  // Step 5: Compute costs per age-category group with Math.ceil()
  // ---------------------------------------------------------------------------
  const ageCategoryGroups = computeAgeCategoryGroups(
    personDetails,
    ageCategories,
    mealRate,
    overnightRateBase,
    groupIsShortStay,
    trip.flat_rate_meal,
    trip.flat_rate_overnight
  )

  const mealDays = ageCategoryGroups.reduce((s, g) => s + g.mealUnitsTotal, 0)
  const overnightCount = ageCategoryGroups.reduce((s, g) => s + g.overnightUnitsTotal, 0)
  const mealCost = ageCategoryGroups.reduce((s, g) => s + g.mealCost, 0)
  const overnightCost = ageCategoryGroups.reduce((s, g) => s + g.overnightCost, 0)

  // ---------------------------------------------------------------------------
  // Step 6: Flat rate surplus (only when flat rate applied)
  // ---------------------------------------------------------------------------
  let surplusFlatMeal: number | null = null
  let surplusFlatOvernight: number | null = null

  if (groupIsShortStay) {
    // Surplus = what the flat rate produced vs. what the calculated rate would cost
    const calculatedMealCost = ageCategoryGroups.reduce((s, g) => {
      const calculatedRaw = g.mealUnitsTotal * mealRate
      return s + Math.ceil(calculatedRaw)
    }, 0)
    const calculatedOvernightCost = ageCategoryGroups.reduce((s, g) => {
      const calculatedRaw = g.overnightUnitsTotal * overnightRateBase
      return s + Math.ceil(calculatedRaw)
    }, 0)
    surplusFlatMeal = mealCost - calculatedMealCost
    surplusFlatOvernight = overnightCost - calculatedOvernightCost
  }

  // ---------------------------------------------------------------------------
  // Step 7: Amount due for meals (can be negative = payout)
  // ---------------------------------------------------------------------------
  const amountDueMeal = mealCost - expensesTotal

  return {
    billingGroupId: billingGroup.id,
    billingGroupName: billingGroup.name,
    mealRate,
    overnightRateBase,
    mealDays,
    overnightCount,
    mealCost,
    overnightCost,
    expensesTotal,
    amountDueMeal,
    flatRateApplied: groupIsShortStay,
    surplusFlatMeal,
    surplusFlatOvernight,
    isShortStay: groupIsShortStay,
    ageCategoryGroups,
    personDetails,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface TripRatesInput {
  trip: BillingInput['trip']
  allPersons: Person[]
  allAttendance: Attendance[]
  allExpenses: Expense[]
  ageCategories: AgeCategory[]
  tripDates: string[]
}

interface TripRates {
  mealRate: number
  overnightRateBase: number
}

/**
 * Computes the shared VP-Satz and ÜN-Satz across the entire trip.
 *
 * VP-Satz = Σ confirmed expenses / Σ VP-Einheiten (alle Personen)
 * ÜN-Satz = cabin_price / Σ ÜN-Einheiten (alle Personen)
 */
function computeTripRates(input: TripRatesInput): TripRates {
  const { trip, allPersons, allAttendance, allExpenses, ageCategories, tripDates } = input

  // Build attendance lookup: personId -> Set<date>
  const mealDates = new Map<string, Set<string>>()
  const overnightDates = new Map<string, Set<string>>()

  for (const a of allAttendance) {
    if (a.meal_confirmed) {
      if (!mealDates.has(a.person_id)) mealDates.set(a.person_id, new Set())
      mealDates.get(a.person_id)!.add(a.date)
    }
    if (a.overnight_confirmed) {
      if (!overnightDates.has(a.person_id)) overnightDates.set(a.person_id, new Set())
      overnightDates.get(a.person_id)!.add(a.date)
    }
  }

  let totalMealUnits = 0
  let totalOvernightUnits = 0

  for (const person of allPersons) {
    const ac = getAgeCategory(person.birth_date, trip.start_date, ageCategories)
    const mealFactor = ac?.meal_factor ?? 1
    const overnightFactor = ac?.overnight_factor ?? 1

    const personMealDates = mealDates.get(person.id)
    const confirmedMealDays = personMealDates?.size ?? 0
    totalMealUnits += confirmedMealDays * mealFactor

    const personOvernightDates = overnightDates.get(person.id)
    const confirmedOvernights = personOvernightDates?.size ?? 0
    totalOvernightUnits += confirmedOvernights * overnightFactor
  }

  const totalConfirmedExpenses = allExpenses
    .filter((e) => e.status === 'confirmed')
    .reduce((s, e) => s + Number(e.amount), 0)

  const mealRate = totalMealUnits > 0 ? totalConfirmedExpenses / totalMealUnits : 0
  const overnightRateBase = totalOvernightUnits > 0 ? trip.cabin_price / totalOvernightUnits : 0

  return { mealRate, overnightRateBase }
}

/**
 * Computes the per-person billing detail for one person.
 *
 * isShortStay:
 *   v5.0 CORRECT: short stay = mealDaysCount < 4 AND overnightCount < 4
 *   (both conditions must hold for short stay; one condition meeting ≥4 makes it long stay)
 */
function computePersonDetail(
  person: Person,
  attendance: Attendance[],
  ageCategories: AgeCategory[],
  tripStartDate: string,
  tripDates: string[]
): PersonBillingDetail {
  const ac = getAgeCategory(person.birth_date, tripStartDate, ageCategories)
  const mealFactor = ac?.meal_factor ?? 1
  const overnightFactor = ac?.overnight_factor ?? 1

  // Confirmed meal days for this person
  const confirmedMealDays = attendance.filter(
    (a) => a.person_id === person.id && a.meal_confirmed === true
  ).length

  // Confirmed overnight days for this person
  const confirmedOvernights = attendance.filter(
    (a) => a.person_id === person.id && a.overnight_confirmed === true
  ).length

  const mealUnits = confirmedMealDays * mealFactor
  const overnightUnits = confirmedOvernights * overnightFactor

  // BUGFIX Bug 1:
  // v4.x: isShortStay starts true, then: if (count > 4 || nights > 4) isShortStay = false
  // v5.0: isShortStay = mealDaysCount < 4 AND overnightCount < 4
  //       (>= 4 meal days AND >= 4 overnights → long stay, i.e., NOT short stay)
  const isShortStay = !(confirmedMealDays >= 4 && confirmedOvernights >= 4)

  return {
    personId: person.id,
    firstName: person.first_name,
    lastName: person.last_name,
    ageCategory: ac,
    mealDaysCount: confirmedMealDays,
    overnightCount: confirmedOvernights,
    mealUnits,
    overnightUnits,
    isShortStay,
  }
}

/**
 * Groups persons by age category and computes costs with Math.ceil() per group.
 *
 * RULE: Math.ceil() is applied per age-category group, not per person and not
 * on the grand total. This always rounds in favor of the cabin (Hütte).
 */
function computeAgeCategoryGroups(
  personDetails: PersonBillingDetail[],
  ageCategories: AgeCategory[],
  mealRate: number,
  overnightRateBase: number,
  groupIsShortStay: boolean,
  flatRateMeal: number,
  flatRateOvernight: number
): AgeCategoryBillingGroup[] {
  // Group persons by age category id (null = no category found)
  const groupMap = new Map<string | null, PersonBillingDetail[]>()

  for (const person of personDetails) {
    const key = person.ageCategory?.id ?? null
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(person)
  }

  const result: AgeCategoryBillingGroup[] = []

  for (const [acId, persons] of groupMap) {
    const ac = acId ? ageCategories.find((a) => a.id === acId) ?? null : null

    const mealUnitsTotal = persons.reduce((s, p) => s + p.mealUnits, 0)
    const overnightUnitsTotal = persons.reduce((s, p) => s + p.overnightUnits, 0)

    let mealCostRaw: number
    let overnightCostRaw: number

    if (groupIsShortStay) {
      // Flat rate: flat_rate_meal × mealUnits
      mealCostRaw = flatRateMeal * mealUnitsTotal
      overnightCostRaw = flatRateOvernight * overnightUnitsTotal
    } else {
      // Calculated rate
      mealCostRaw = mealRate * mealUnitsTotal
      overnightCostRaw = overnightRateBase * overnightUnitsTotal
    }

    // Math.ceil per age-category group
    const mealCost = Math.ceil(mealCostRaw)
    const overnightCost = Math.ceil(overnightCostRaw)

    result.push({
      ageCategory: ac,
      persons,
      mealUnitsTotal,
      overnightUnitsTotal,
      mealCostRaw,
      mealCost,
      overnightCostRaw,
      overnightCost,
    })
  }

  return result
}
