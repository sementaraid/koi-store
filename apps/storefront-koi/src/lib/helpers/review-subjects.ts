
import { orderStatus } from './order-status.ts'

export type ReviewReference = 'seller' | 'product'

export type ReviewSubject = {
  reference: ReviewReference
  referenceId: string
  name: string
}

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

export function reviewSubjects(order: ReviewableOrder): ReviewSubject[] {
  if (orderStatus(order).label !== 'Selesai') return []

  const subjects: ReviewSubject[] = []

  if (order.seller?.id) {
    subjects.push({
      reference: 'seller',
      referenceId: order.seller.id,
      name: order.seller.name || 'Penjual'
    })
  }

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
