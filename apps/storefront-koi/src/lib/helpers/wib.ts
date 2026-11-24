// Jakarta wall-clock text without Intl. Node's ICU and Safari's CLDR spell the
// same date differently ("Kam" vs "Kamis", "Agu" vs "Agt", a space or none
// before "WIB"), so any Intl text rendered on the server and again on the
// client can fail hydration. Everything here is the UTC instant plus seven
// hours and fixed Indonesian names: the same string on every engine and in
// every viewer time zone.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

const WEEKDAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const WEEKDAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const pad2 = (n: number) => String(n).padStart(2, '0')

export type WibParts = {
  weekdayShort: string
  weekdayLong: string
  day: number
  monthShort: string
  year: number
  hour: string
  minute: string
}

// Like Intl.DateTimeFormat, an invalid instant throws instead of printing "NaN".
export function wibParts(epochMs: number): WibParts {
  if (!Number.isFinite(epochMs)) throw new RangeError('Invalid time value')
  const d = new Date(epochMs + WIB_OFFSET_MS)

  return {
    weekdayShort: WEEKDAY_SHORT[d.getUTCDay()],
    weekdayLong: WEEKDAY_LONG[d.getUTCDay()],
    day: d.getUTCDate(),
    monthShort: MONTH_SHORT[d.getUTCMonth()],
    year: d.getUTCFullYear(),
    hour: pad2(d.getUTCHours()),
    minute: pad2(d.getUTCMinutes())
  }
}

// "26 Nov"
export function wibDayMonth(epochMs: number): string {
  const p = wibParts(epochMs)
  return `${p.day} ${p.monthShort}`
}

// "16.59"
export function wibClock(epochMs: number): string {
  const p = wibParts(epochMs)
  return `${p.hour}.${p.minute}`
}

// "2026-11-26T16:59", the value a datetime-local input takes.
export function wibInputValue(epochMs: number): string {
  const d = new Date(epochMs + WIB_OFFSET_MS)
  if (Number.isNaN(d.getTime())) throw new RangeError('Invalid time value')
  return d.toISOString().slice(0, 16)
}
