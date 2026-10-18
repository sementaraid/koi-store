/* How a product list is ordered. The only export of the old `types/product.ts`
   that anything referenced — the other seven interfaces in it were dead — so it
   keeps a file of its own and the koi product taxonomy takes `product.ts`. */
export type SortOptions = "price_asc" | "price_desc" | "created_at";
