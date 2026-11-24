// IDR is built from integer math so the server's Node ICU and a phone's Safari
// print the same text ("Rp 4.250.000" with a no-break space; Safari alone drops
// the space). Other currencies and non-finite amounts still go through Intl.
const NBSP = '\u00a0'

const isIdr = (currency: string) => currency.toUpperCase() === 'IDR'

// "12.500.000" or "1.000.000,50": '.' groups thousands, ',' starts decimals.
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatRupiahNumber(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const [whole, fraction] = Math.abs(amount).toFixed(Number.isInteger(amount) ? 0 : 2).split('.')

  return `${sign}${groupDigits(whole)}${fraction ? `,${fraction}` : ''}`
}

export function formatPrice(amount: number, currency = "IDR") {
  if (isIdr(currency) && Number.isFinite(amount) && Math.abs(amount) < 1e21) {
    const text = formatRupiahNumber(amount)
    return text.startsWith('-') ? `-Rp${NBSP}${text.slice(1)}` : `Rp${NBSP}${text}`
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

// Indonesian scale words: rb (ribu), jt (juta), M (miliar), T (triliun).
const COMPACT_UNITS: [number, string][] = [
  [1e12, ' T'],
  [1e9, ' M'],
  [1e6, ' jt'],
  [1e3, ' rb'],
  [1, '']
]

export function formatPriceCompact(amount: number, currency = "IDR") {
  if (isIdr(currency) && Number.isFinite(amount) && Math.abs(amount) < 1e15) {
    const abs = Math.abs(amount)
    let index = COMPACT_UNITS.findIndex(([divisor]) => abs >= divisor)
    if (index < 0) index = COMPACT_UNITS.length - 1

    // One decimal, rounded half up. A value that rounds up to 1.000 of its
    // unit moves to the next one ("999.950" is "1,0 jt", not "1.000,0 rb").
    let tenths = Math.round((abs * 10) / COMPACT_UNITS[index][0])
    if (tenths >= 10_000 && index > 0) {
      index -= 1
      tenths = Math.round((abs * 10) / COMPACT_UNITS[index][0])
    }

    const number = `${groupDigits(String(Math.floor(tenths / 10)))},${tenths % 10}`
    return `${amount < 0 ? '-' : ''}Rp${NBSP}${number}${COMPACT_UNITS[index][1].replace(' ', NBSP)}`
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    notation: "compact",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount)
}
