/* What one delivered parcel can be reviewed about.

   `/store/reviews` takes a `(reference, reference_id)` pair and an `order_id`:
   the farm that shipped, or one fish out of the box. One parcel therefore
   offers several reviews, and the page needs them as a list rather than as a
   button per item — two of the same koi in one order is one subject, not two.

   Held here with a self-check because the de-duplication and the "paid and
   delivered only" gate are the whole of the rule, and both are easy to get
   silently wrong inside a component. */

import { orderStatus } from './order-status.ts'

/** What the customer may rate: the farm, or one fish. Mirrors
    `ReviewReference` in `lib/data/reviews.ts`, re-declared here so this helper
    stays free of the `'use server'` module. */
export type ReviewReference = 'seller' | 'product'

/** One thing a parcel can be reviewed about. */
export type ReviewSubject = {
  reference: ReviewReference
  /** The seller's or the product's Medusa id — what the API is given. */
  referenceId: string
  /** What the customer sees named in the sheet: the farm, or the koi. */
  name: string
}

/** The slice of a per-seller order this reads. */
export type ReviewableOrder = {
  payment_status?: string | null
  fulfillment_status?: string | null
  seller?: { id?: string; name?: string | null } | null
  items?: Array<{
    product_id?: string | null
    product_title?: string | null
    title?: string | null
  }> | null
}

/**
 * Everything one parcel can be reviewed about, farm first.
 *
 * Returns nothing at all until the parcel has arrived: a review is a verdict
 * on a fish the customer has seen, and the house does not ask for one while
 * the box is still in transit.
 *
 * @example
 * reviewSubjects({ payment_status: 'captured', fulfillment_status: 'delivered',
 *                  seller: { id: 'sel_1', name: 'Dainichi' }, items: [] })
 * // [{ reference: 'seller', referenceId: 'sel_1', name: 'Dainichi' }]
 */
export function reviewSubjects(order: ReviewableOrder): ReviewSubject[] {
  /* "Selesai" is the one status that means delivered — see `order-status.ts`,
     which already folds payment and fulfillment into that single phrase. */
  if (orderStatus(order).label !== 'Selesai') return []

  const subjects: ReviewSubject[] = []

  if (order.seller?.id) {
    subjects.push({
      reference: 'seller',
      referenceId: order.seller.id,
      name: order.seller.name || 'Penjual'
    })
  }

  /* Two of the same koi in one parcel is one subject: the API rejects the
     second review of a pair outright, so offering the button twice would be
     offering one of them as a guaranteed error. */
  const seen = new Set<string>()
  for (const item of order.items ?? []) {
    const id = item.product_id
    if (!id || seen.has(id)) continue
    seen.add(id)
    subjects.push({
      reference: 'product',
      referenceId: id,
      name: item.product_title || item.title || 'Koi'
    })
  }

  return subjects
}
