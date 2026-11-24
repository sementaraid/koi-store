import { wibDayMonth } from "./wib.ts"

export function sessionLabel(seller?: string, at: number = Date.now()) {
  const day = wibDayMonth(at)

  return seller ? `Sesi ${day} · ${seller}` : `Sesi ${day}`
}
