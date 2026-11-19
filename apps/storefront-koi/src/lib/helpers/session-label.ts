export function sessionLabel(seller?: string, at: number = Date.now()) {
  const day = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(at)

  return seller ? `Sesi ${day} · ${seller}` : `Sesi ${day}`
}
