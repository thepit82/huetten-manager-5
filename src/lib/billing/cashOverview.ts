/**
 * Cash Overview (Kassenstand) – v5.0
 *
 * Ported from v4.x berechneKassenstand() with the correct architecture:
 *
 *   Kassenstand = Gesamt-Einnahmen + Trinkgeld - Auszahlungen - An ÜN-Pool
 *   ÜN-Pool     = Überweisungen Langzeit + Zuschuss aus Kasse (Pauschale → Satz)
 *   Überschuss  = VP-Pauschalen-Überschuss + ÜN-Pauschalen-Überschuss + Trinkgeld + ÜN-Pool-Rest
 *
 * Critical rule: Einnahmen = min(gezahlt, zu_zahlen)
 *   Mehrzahlungen laufen als Trinkgeld separat!
 */

import type { Billing } from '@/types/database'
import type { CashOverview } from '@/types/billing'

export function calculateCashOverview(
  billings: Billing[],
  totalBillingGroups: number
): CashOverview {
  let mealIncomeBar = 0
  let overnightIncomeBar = 0
  let tips = 0
  let totalPayouts = 0
  let transferredToOvernightPool = 0
  let overnightPoolFromTransfer = 0
  let surplusFlatMeal = 0
  let surplusFlatOvernight = 0

  const billedGroupsCount = billings.length
  const unbilledGroupsCount = Math.max(0, totalBillingGroups - billedGroupsCount)

  for (const billing of billings) {
    const amountDueMeal = Number(billing.amount_due_meal)
    const paidMeal = Number(billing.paid_meal ?? 0)
    const paidOvernight = Number(billing.paid_overnight ?? 0)
    const overnightCost = Number(billing.overnight_cost)

    // -------------------------------------------------------------------
    // VP-Einnahmen bar: min(paid_meal, amount_due_meal)
    // Only count what was actually owed – overpayments go to tips
    // -------------------------------------------------------------------
    if (amountDueMeal > 0) {
      // Person owes money
      if (paidMeal > 0) {
        const actualIncome = Math.min(paidMeal, amountDueMeal)
        mealIncomeBar += actualIncome

        // Overpayment or deliberate tip
        if (paidMeal > amountDueMeal) {
          tips += paidMeal - amountDueMeal
        }
      }
    } else if (amountDueMeal < 0) {
      // Person receives a payout (their expenses exceeded VP costs)
      if (paidMeal < 0) {
        // Negative paid_meal = actual payout was made
        totalPayouts += Math.abs(paidMeal)
      } else if (paidMeal > 0) {
        // Person waived their payout or paid more – count as tip
        tips += paidMeal + Math.abs(amountDueMeal) // waived payout + any extra
      }
    }

    // -------------------------------------------------------------------
    // ÜN-Einnahmen bar: nur bei Kurzzeitpflege (flat_rate_applied)
    // Langzeitpflege wird per Überweisung abgerechnet
    // -------------------------------------------------------------------
    if (billing.flat_rate_applied) {
      // Kurzzeitpflege: ÜN was billed in cash together with VP
      overnightIncomeBar += paidOvernight

      // The overnight portion goes into the ÜN-Pool
      // (flat rate amount → converted to calculated rate = overnightCost)
      transferredToOvernightPool += overnightCost
    } else {
      // Langzeitpflege: ÜN via bank transfer
      if (billing.overnight_billed) {
        overnightPoolFromTransfer += paidOvernight
      }
    }

    // -------------------------------------------------------------------
    // Flat rate surpluses
    // -------------------------------------------------------------------
    if (billing.surplus_flat_meal !== null) {
      surplusFlatMeal += Number(billing.surplus_flat_meal)
    }
    if (billing.surplus_flat_overnight !== null) {
      surplusFlatOvernight += Number(billing.surplus_flat_overnight)
    }
  }

  // -------------------------------------------------------------------
  // Totals
  // -------------------------------------------------------------------
  const totalIncome = mealIncomeBar + overnightIncomeBar + tips
  const cashBalance = totalIncome - totalPayouts - transferredToOvernightPool
  const overnightPoolFromCash = transferredToOvernightPool
  const overnightPool = overnightPoolFromCash + overnightPoolFromTransfer

  return {
    mealIncomeBar,
    overnightIncomeBar,
    tips,
    totalIncome,
    totalPayouts,
    transferredToOvernightPool,
    cashBalance,
    overnightPool,
    overnightPoolFromCash,
    overnightPoolFromTransfer,
    surplusFlatMeal,
    surplusFlatOvernight,
    billedGroupsCount,
    unbilledGroupsCount,
  }
}
