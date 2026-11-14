import type { AttributeFacet, AttributeSelection } from '@/types/product';

/* The query keys a feed owns itself. A global attribute seeded under one of
   these handles would otherwise shadow the feed's own control — `sort` is a
   plausible attribute name, and a shop that added one would silently lose its
   sort select. */
const RESERVED = new Set(['status', 'category', 'sort', 'page', 'q']);

/**
 * The attribute narrowings a URL carries, as the API takes them.
 *
 * @remarks
 * Only handles the catalog actually offers a facet for are read: an unknown
 * param is not a narrowing, and passing one through would filter on an
 * attribute that does not exist — which Medusa answers with an empty feed, so
 * a stale link would read as "the house sells no koi".
 *
 * Lives outside `src/components` because it is logic, not a component: both
 * the catalog and a category page read the same selection off their own query
 * string, and the client-side hook needs the same rules.
 *
 * @param facets - The facets the catalog defines, from `getAttributeFacets`.
 * @param params - The route's query string, as Next hands it over.
 *
 * @example
 * readAttributeSelection(facets, { bloodline: 'Sakai', page: '2' })
 * // → { bloodline: 'Sakai' }
 */
export function readAttributeSelection(
  facets: AttributeFacet[],
  params: Record<string, string | string[] | undefined> = {}
): AttributeSelection {
  const selected: AttributeSelection = {};

  for (const { handle } of facets) {
    if (RESERVED.has(handle)) continue;

    const value = params[handle];
    /* A repeated param (`?umur=Nisai&umur=Sansai`) takes the first: the bar's
       facets are single selects, so a second value is not something the
       visitor can have asked for through the UI. */
    const picked = Array.isArray(value) ? value[0] : value;

    if (picked) selected[handle] = picked;
  }

  return selected;
}

/** The handles a feed will read, so the client hook and the server agree on
    which params are facets. */
export function facetHandles(facets: AttributeFacet[]): string[] {
  return facets.map((facet) => facet.handle).filter((h) => !RESERVED.has(h));
}
