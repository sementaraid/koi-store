// Fee categories are stored with English names (`seed-fee-categories.ts`).
// The admin shows only a translation; the stored row, its id and the payload
// stay untouched. An unknown name is shown as the API sent it.
const FEE_CATEGORY_LABELS: Record<string, string> = {
  'Lokal, no certificate': 'Lokal, tanpa sertifikat',
  'Lokal, certificate': 'Lokal, bersertifikat',
  'Import, certificate': 'Impor, bersertifikat'
};

export function feeCategoryLabel(name: string): string {
  return FEE_CATEGORY_LABELS[name] ?? name;
}
