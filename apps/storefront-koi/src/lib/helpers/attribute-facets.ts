import type { AttributeFacet, AttributeSelection } from '@/types/product';

const RESERVED = new Set(['status', 'category', 'sort', 'page', 'q']);

export function readAttributeSelection(
  facets: AttributeFacet[],
  params: Record<string, string | string[] | undefined> = {}
): AttributeSelection {
  const selected: AttributeSelection = {};

  for (const { handle } of facets) {
    if (RESERVED.has(handle)) continue;

    const value = params[handle];
    const picked = Array.isArray(value) ? value[0] : value;

    if (picked) selected[handle] = picked;
  }

  return selected;
}

export function facetHandles(facets: AttributeFacet[]): string[] {
  return facets.map((facet) => facet.handle).filter((h) => !RESERVED.has(h));
}
