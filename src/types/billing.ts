import type { AgeCategory, Person, Attendance, Expense, Billing } from './database'

// ------------------------------------------------------------------
// Input types for billing calculations
// ------------------------------------------------------------------

export interface BillingInput {
  trip: {
    id: string
    start_date: string
    end_date: string
    cabin_price: number
    flat_rate_meal: number
    flat_rate_overnight: number
  }
  billingGroup: {
    id: string
    name: string
    contact_person_id: string | null
  }
  persons: Person[]
  attendance: Attendance[]
  expenses: Expense[]
  ageCategories: AgeCategory[]
  /** All attendance across ALL groups of the trip – needed to compute shared rates */
  allAttendance: Attendance[]
  /** All expenses of the trip (confirmed) – needed to compute VP-Satz */
  allExpenses: Expense[]
  /** All persons of the trip – needed to compute denominators */
  allPersons: Person[]
}

// ------------------------------------------------------------------
// Per-person result within a billing
// ------------------------------------------------------------------

export interface PersonBillingDetail {
  personId: string
  firstName: string
  lastName: string
  ageCategory: AgeCategory | null
  mealDaysCount: number       // VP-Tage (Faktoren angewendet)
  overnightCount: number      // ÜN-Nächte (Faktoren angewendet)
  mealUnits: number           // = mealDaysCount × meal_factor
  overnightUnits: number      // = overnightCount × overnight_factor
  isShortStay: boolean
}

// ------------------------------------------------------------------
// Per-age-category group within a billing
// ------------------------------------------------------------------

export interface AgeCategoryBillingGroup {
  ageCategory: AgeCategory | null
  persons: PersonBillingDetail[]
  mealUnitsTotal: number
  overnightUnitsTotal: number
  mealCostRaw: number        // before Math.ceil
  mealCost: number           // after Math.ceil
  overnightCostRaw: number
  overnightCost: number
}

// ------------------------------------------------------------------
// Main result for one billing group
// ------------------------------------------------------------------

export interface BillingResult {
  billingGroupId: string
  billingGroupName: string

  // Rates (computed from full trip data)
  mealRate: number            // VP-Satz: Σbelege / Σ VP-Einheiten
  overnightRateBase: number   // ÜN-Satz: cabin_price / Σ ÜN-Einheiten

  // Aggregated values for this group
  mealDays: number            // Σ mealUnits der Gruppe
  overnightCount: number      // Σ overnightUnits der Gruppe
  mealCost: number            // Σ gerundete VP-Kosten
  overnightCost: number       // Σ gerundete ÜN-Kosten
  expensesTotal: number       // Eigene bestätigte Belege der Gruppe

  // Final bill
  amountDueMeal: number       // mealCost - expensesTotal (kann negativ sein)
  flatRateApplied: boolean

  // Flat rate surpluses (nur wenn flatRateApplied)
  surplusFlatMeal: number | null
  surplusFlatOvernight: number | null

  // Short stay determination
  isShortStay: boolean        // true wenn ALLE Personen Kurzzeitpflege

  // Breakdown per age category
  ageCategoryGroups: AgeCategoryBillingGroup[]

  // Person details
  personDetails: PersonBillingDetail[]
}

// ------------------------------------------------------------------
// Cash overview (Kassenstand)
// ------------------------------------------------------------------

export interface CashOverview {
  /** Σ min(paid_meal, amount_due_meal) – nur fällige Beträge */
  mealIncomeBar: number
  /** Σ paid_overnight bei flat_rate_applied (Kurzzeitpflege, bar kassiert) */
  overnightIncomeBar: number
  /** Σ Mehrzahlungen + Verzicht auf Auszahlung */
  tips: number
  /** Gesamt: mealIncomeBar + overnightIncomeBar + tips */
  totalIncome: number
  /** Σ tatsächlich ausgezahlte Beträge (amount_due_meal < 0 && paid_meal < 0) */
  totalPayouts: number
  /** Kurzzeitpflege ÜN-Anteile aus Barkasse → in ÜN-Pool umgebucht */
  transferredToOvernightPool: number
  /** Kassenstand = totalIncome - totalPayouts - transferredToOvernightPool */
  cashBalance: number

  /** ÜN-Pool gesamt */
  overnightPool: number
  /** ÜN-Pool aus Kasse (Kurzzeitpflege-Umbuchungen) */
  overnightPoolFromCash: number
  /** ÜN-Pool aus Überweisungen (Langzeitpflege) */
  overnightPoolFromTransfer: number

  /** VP Pauschalen-Überschuss */
  surplusFlatMeal: number
  /** ÜN Pauschalen-Überschuss */
  surplusFlatOvernight: number

  /** Abgerechnete Gruppen */
  billedGroupsCount: number
  /** Noch nicht abgerechnete Gruppen */
  unbilledGroupsCount: number
}

// ------------------------------------------------------------------
// Snapshot types (stored as JSONB in billings table)
// ------------------------------------------------------------------

export type SnapshotPersons = Pick<
  Person,
  | 'id' | 'first_name' | 'last_name' | 'birth_date'
  | 'arrival_date' | 'departure_date' | 'billing_group_id'
>[]

export type SnapshotAttendance = Pick<
  Attendance,
  'id' | 'person_id' | 'date' | 'meal_confirmed' | 'overnight_confirmed'
>[]

export type SnapshotExpenses = Pick<
  Expense,
  'id' | 'person_id' | 'date' | 'amount' | 'description' | 'status'
>[]

// Saved billing with all related data loaded
export interface SavedBilling extends Billing {
  billing_groups?: { name: string; contact_person_id: string | null } | null
}
