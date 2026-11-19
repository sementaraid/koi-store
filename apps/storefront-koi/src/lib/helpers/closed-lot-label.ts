
export type ClosedLotLabel = {
  priceLabel: string
  statusLabel: string
}

export function closedLotLabel(sold?: boolean): ClosedLotLabel | undefined {
  if (sold === undefined) return undefined
  return {
    priceLabel: 'Harga akhir',
    statusLabel: sold ? 'Terjual' : 'Tidak terjual',
  }
}
