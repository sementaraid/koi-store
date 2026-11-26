import type { AttributeFacet, AttributeSelection } from '@/types/product';

const RESERVED = new Set(['status', 'category', 'sort', 'page', 'q']);

// Display-only Indonesian labels for the attributes and values the API seeds in
// English. Keys stay untouched on the wire: `facet.values` is what the API
// filters on, so only the label shown to the shopper is translated.
const FACET_LABELS: Record<string, string> = {
  bloodline: 'Garis keturunan'
};

const FACET_VALUE_LABELS: Record<string, Record<string, string>> = {
  bloodline: { 'Bloodline Lokal': 'Lokal' }
};

export function facetLabel(handle: string, label: string): string {
  return FACET_LABELS[handle] ?? label;
}

export function facetValueLabel(handle: string, value: string): string {
  return FACET_VALUE_LABELS[handle]?.[value] ?? value;
}

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

/**
 * Mercur's `attributes[handle]` filter only matches variant axis values; every
 * other facet is a product attribute value and needs `attribute_values[handle]`.
 */
export function splitAttributeSelection(
  facets: AttributeFacet[],
  selected: AttributeSelection
): { variantAxis: AttributeSelection; productValues: AttributeSelection } {
  const axisHandles = new Set(
    facets.filter((facet) => facet.is_variant_axis).map((facet) => facet.handle)
  )

  const variantAxis: AttributeSelection = {}
  const productValues: AttributeSelection = {}

  for (const [handle, value] of Object.entries(selected)) {
    if (axisHandles.has(handle)) {
      variantAxis[handle] = value
    } else {
      productValues[handle] = value
    }
  }

  return { variantAxis, productValues }
}
