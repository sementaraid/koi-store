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
    product_id?: string | null;
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
