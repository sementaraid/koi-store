// US-071 (AC2, D-028, D-037): the shill-bid flags, pure maths. A flag takes no
// action anywhere — the admin bans by hand (US-059, US-070).
//
// flag A (share): at least 50% of the bidder's bids, all time, on this farmer's
// lots. A row needs `farmBids > 0`, so the zero case never produces a flag.
export const isShillShare = (farmBids: number, totalBids: number): boolean =>
  farmBids > 0 && farmBids * 2 >= totalBids

// flag B (unpaid): two or more unpaid wins reported by this farmer (D-037: one
// `lot_report` row is one unpaid win).
export const isShillUnpaid = (unpaidWins: number): boolean => unpaidWins >= 2
