/* App-wide numbers, held once as `apps/storefront` holds its own in `src/const`.
   Kit constants (filters, demo lots, routes) stay in `components/constant/` so
   that tree can be re-synced from the koi kit without merge noise. */

/** How much of a feed one page fetches. The koi pages narrow and page the list
    themselves, so this is the whole working set, not a screenful. */
export const FEED_LIMIT = 100;

/** The shelf under a product: enough to fill the strip, not the catalog. */
export const SHELF_LIMIT = 12;
