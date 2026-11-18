export function shippingDates(days: number, from = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const at = new Date(from)
    at.setDate(at.getDate() + i + 1)

    return {
      id: at.toISOString().slice(0, 10),
      day: new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        timeZone: "Asia/Jakarta",
      }).format(at),
      date: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Jakarta",
      }).format(at),
    }
  })
}

export function formatShippingDate(date: { day: string; date: string }) {
  return `${date.day}, ${date.date}`
}
