/** The shape a per-seller order arrives in from `listOrders`.
 *
 * @remarks
 * A narrowed view of `HttpTypes.StoreOrder`, not a re-declaration: the account
 * pages read a line item's title, thumbnail and seller, and nothing else. Kept
 * here rather than inline in each section because the orders list, the account
 * home and the order detail all draw the same row.
 */
export type AccountOrder = {
  id: string;
  display_id?: number | null;
  total?: number | null;
  currency_code?: string | null;
  created_at?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  items?: Array<{
    id: string;
    title?: string | null;
    product_title?: string | null;
    thumbnail?: string | null;
    quantity?: number | null;
    product?: { handle?: string | null } | null;
  }> | null;
  seller?: { id?: string; name?: string | null } | null;
  order_group?: {
    id: string;
    display_id?: number | string | null;
    created_at?: string | null;
  } | null;
};
