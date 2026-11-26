# Mockup vs storefront: gap analysis (2026-11-25)

Source: `ui_ux/Koi Auction House Redesign.html` (15 boards, unpacked to
`ui_ux/boards/`: `txt/` = plain copy, `src/` = full HTML with inline styles).
Board 00 is the design spec (tokens, component specs). Compared against the
running storefront at 390 px and 1440 px. Guest pages were checked in a browser;
signed-in screens were checked from code only (browser sign-in was not allowed).

Footer: out of scope for now (owner, 2026-11-25).

## Owner answers, 2026-11-25

| # | Topic | Answer |
|---|---|---|
| 1 | Held bid balance | Not built. Saldo is only debited for join fees. |
| 1, d | Winner payment | Winner transfers the winning price manually to the **company bank account** within 1×24 h; admin checks the transfer. No payment gateway yet. Farmer bank details are no longer shown to the winner. |
| d | Farmer payout | Admin pays the farmer manually after the winner uploads a photo or video showing the koi arrived healthy, **or automatically 3 days after the farmer marks it shipped** if the winner sends nothing. |
| e | Payout amount | Full winning price, minus the bank transfer fee only. |
| 2, b | Join fee | **Per lot** (each koi the buyer wants to bid on), at **the category amount from today's fee table** (100.000 / 250.000 / 500.000 / 1.000.000). |
| c | Refunds | Unchanged (D-034): a farmer cancel before start, or an admin cancel of a live auction, refunds every join fee. Losing never refunds. |
| a | Extend rule | Unchanged: the auction's `extend_window_minutes`. |
| 3 | Watch list | Ignore for now (D-066 stands). |
| 4 | Koi details | Bring back: variety, size, age, sex, certificate, pond origin, video, filters, photo + video gallery. Video = **YouTube link**. |
| 5 | Notification bell | Not built. |
| g | Header search | Leave out for now. |
| 6 | Quarantine step, "Garansi hidup 24 jam", "tanpa ongkir" | Keep out. Claim window stays 4 h after delivered. |
| 3d | Dead-on-arrival claim | Stays. |
| 7 | Brand | **Koi Auction House** everywhere. |
| 8 | Top-up estimate | "biasanya kurang dari 60 menit". |
| 9 | Won timeline dates | Yes: store and show the date of each step (paid, shipped, delivered). |

**Not yet confirmed (proposed, needs owner approval):**
- While a claim is open, the farmer's payout waits, even past the 3 days.
- An approved refund claim: admin refunds the winner from the company account; the farmer is not paid for that lot.
- An approved replacement: farmer ships a new koi; admin pays the farmer once the replacement arrives healthy.
- Admin cancels a single open lot (D-035): that lot's join fees are refunded (follows from the per-lot fee).

## UI gaps, buildable without a rule change

### Bugs
- Shortfall "Top-up Rp X" loses the amount: `topupHref` adds `?amount=` (`apps/storefront-koi/src/const/routes.ts:44-45`) but `app/(account)/akun/topup/page.tsx` reads no searchParams and the form starts at `amount: ''` (`Topup.tsx:51`).
- Two brand names: `<title>` says "Indokoi", the footer says "Mafia Koi Jogja" (US-103 AC6 wants one, from `NEXT_PUBLIC_SITE_NAME`).
- "Ajukan klaim" on `/akun/menang` is a `<span>` that does nothing (`WonLotsPage.tsx:192`).
- `organisms/BidTerminal` is not imported anywhere (dead code).

### Global
- Desktop header: mockup has a text wordmark "Koi Auction House.", nav Lelang · Katalog · Perlengkapan · Farm (14–15 px, underline on active), saldo pill, Bid Saya, avatar with initials. Live: round icon, 12 px links "Lelang Live / Katalog Koi / Perlengkapan Kolam Koi", no Farm link (`organisms/Header/Header.tsx`, `const/header.ts`). Container: mockup content 1216 px (112 px edges at 1440), live `max-w-[1200px]` with 144 px edges as rendered.

### /lelang
- No grey hero band, no "KATALOG LELANG" eyebrow, no red "Lelang live" button (`AuctionsPage/components/Auctions.tsx:140-162`). Desktop: tabs right-aligned on the title row.
- Desktop: left sidebar (Urutkan select; Varietas, Ukuran min/max, Bersertifikat, Ada video, Yang saya ikuti) + 3-column grid. Live: no sidebar, `FeedGrid` 4 columns (`atoms/FeedGrid/FeedGrid.tsx`) so half the row is empty with 2 lots.
- Card: second line "age · sex · farm" (needs koi fields), photo 3:2 (live ~4:3), "Live" badge with dot.
- Active tab has a red dot; guide box is indigo tint (`--accent`) with border, live is grey.
- Phone: chip row Filter · Varietas · Ukuran · Berakhir duluan.
- Upcoming: session cards (date tile, session name, lot count, time, varieties) on the Live tab under "Akan datang" with "Lihat semua". ("Ingatkan saya" stays out, D-066.)

### Lot page
- Phone guest: live shows "Masuk untuk ikut lelang" twice (inline + sticky bar) plus the bottom nav. Mockup: one sticky footer (copy + "Masuk untuk ikut lelang" + "Daftar gratis"), no bottom nav on the lot page.
- Phone signed in: mockup sticky bar = "Pilih nominal bid · Saldo tersedia", 3 quick-amount chips + edit, "Pasang Bid Rp X" → confirm sheet. Live bar = price/time + one button → "Pasang bid" sheet → confirm (one extra step; `LotPriceBar.tsx:42-82`, `PlaceBid.tsx:408-434`).
- Header: share button (heart stays out). Gallery: thumbnails, zoom/"Perbesar", prev/next arrows, video tile (YouTube).
- Desktop: bid panel in a bordered card; alert inside it; OB/KB boxes outside the dark price panel in tint; quick chips + "Atau ketik nominal" Rp input; rules list under the card. Breadcrumb "Lelang / Sesi <farm>, <dates> / Lot #07 · <name>" with "/" separators, 14 px.
- Specification: Varietas, Ukuran, Umur, Jenis kelamin, Sertifikat, Asal kolam; "Catatan breeder" (needs koi fields).
- Disconnected state missing: alert "Koneksi terputus…", "(mungkin usang)", "Terakhir diperbarui HH.MM WIB", bid button disabled "Menunggu koneksi…". Today poll errors retry silently (`hooks/use-lot-poll.ts:73-76`).
- Won panel: "Menang" chip, "Anda menang dengan bid Rp X", close time, "Berikutnya:" line, "Lacak pesanan". Live: only "Lot Anda menangkan" (`WonLotPanel.tsx:376-382`).
- Lost panel: "Harga akhir" vs "Bid Anda", link to similar open lots.
- Confirm: "Jika menang, Anda bayar Rp X" as a row; desktop pending closes the dialog and disables the panel; "Saldo tersedia" under the highest chip; extend title "Waktu ditambah N menit."
- Join sheet: checkbox "…dan biaya ikut tidak dikembalikan", "Biaya ikut (tidak dikembalikan)"; not-joined panel "Belum ikut" row + "Saldo tersedia".

### Account
- Layout: small h1 inside the content column, inline with tabs; live has breadcrumb + full-width hero h1 above the menu (`AccountFrame.tsx:71-94`).
- Menu: Ringkasan, Bid Saya, Pesanan katalog, Saldo & top-up, Alamat, Pesan, Ulasan, Pengaturan | Daftar jadi farm, Keluar; subtitle "Pembeli · city". Live labels and order differ (`AccountFrame.tsx:35-51`).
- Bid Saya → Menang: won card with "Perlu tindakan" badge, next-action line, actions ("Konfirmasi koi diterima", "Laporkan"), vertical timeline with dates. Live: 4-step horizontal list, no actions (`BidSayaPage.tsx:207-276`). `/akun/menang` duplicates the Menang tab.
- Saldo & top-up merged into one page: balance on top, numbered steps 1-2-3, quick amounts (shortfall, 5 jt, 10 jt, Lainnya), Rp input with thousand separators, "Salin" buttons (account no., amount), dropzone with the disabled-button reason, one history table (Tanggal / Keterangan / Status / Jumlah) with "Kirim ulang bukti" on rejected. Live: two pages, plain number input (`Topup.tsx`, `Wallet.tsx`).

## Needs backend or data
- Koi fields on lots (variety, size cm, age, sex, certificate, pond origin, breeder notes, YouTube video URL) + farmer lot form + store filters.
- Per-lot join fee (join is per lot, not per auction).
- Winner payment to the company bank account, admin confirmation, `paid_at`; `shipped_at`; payout record for the farmer (full price minus transfer fee), "arrived healthy" photo/video upload, auto-release 3 days after shipped.
- Wallet history "Keterangan" with lot name (transaction has only `reference`; not verified what it holds).
