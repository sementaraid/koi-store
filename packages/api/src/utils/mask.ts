// US-092 T-092.2 (D-039, D-042): what every API result shows instead of a full
// PII value. The full value only leaves the server through a logged reveal.
// Each mask keeps the value's length; null/blank stays null.

const stars = (n: number) => "*".repeat(Math.max(n, 0))

const keepEnds = (value: string, head: number, tail: number) =>
  value.length <= head + tail
    ? stars(value.length)
    : value.slice(0, head) + stars(value.length - head - tail) + value.slice(value.length - tail)

const clean = (value: string | null | undefined) => value?.trim() || null

// NIK: first 4 (province + regency code) and last 2. 3273012345678901 → 3273**********01
export const maskNik = (value: string | null | undefined) => {
  const v = clean(value)
  return v && keepEnds(v, 4, 2)
}

// Bank account number: last 4. 1234567890 → ******7890
export const maskAccountNumber = (value: string | null | undefined) => {
  const v = clean(value)
  return v && keepEnds(v, 0, 4)
}

// Name: first letter of each word. Budi Santoso → B*** S******
export const maskName = (value: string | null | undefined) => {
  const v = clean(value)
  return v && v.split(/\s+/).map((w) => keepEnds(w, 1, 0)).join(" ")
}

// US-044 (D-051): a public bidder. First 3 letters of the trimmed first name
// (unpadded) + `***` + the last 2 characters of the customer id, lowercased.
// Derived at read time, nothing stored, so the same inputs always give the
// same mask. Budi + cus_…S09X → Bud***9x; blank name → ***9x.
export const maskBidder = (
  firstName: string | null | undefined,
  customerId: string
) =>
  `${(firstName ?? "").trim().slice(0, 3)}***${customerId
    .slice(-2)
    .toLowerCase()}`

// Phone: the +62 country code (when present) and the last 3 digits.
// +6281234567890 → +62********890, 081234567890 → *********890
export const maskPhone = (value: string | null | undefined) => {
  const v = clean(value)
  if (!v) return v
  return v.startsWith("+62") ? "+62" + keepEnds(v.slice(3), 0, 3) : keepEnds(v, 0, 3)
}
