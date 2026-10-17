import { useState, type ReactNode } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import { Input } from "@/components/koi/input"
import { Label } from "@/components/ui/label"
import { cn } from "cn"

import {
  DEFAULT_SHIPPING_ADDRESSES,
  DEFAULT_SHIPPING_DATES,
  DEFAULT_SHIPPING_PARCELS,
} from "@/components/constant/shipping"
import { CONTAINER, SECTION_LABEL } from "@/components/constant/layout"
import { ROUTES } from "@/components/constant/routes"
import { CartSteps } from "@/components/module/cart-steps"
import { CartSummary } from "@/components/module/cart-summary"
import { ChoiceList } from "@/components/module/choice-list"
import { PageShell } from "@/components/module/page-shell"
import { RenderIf } from "@/components/module/render-if"
import type {
  ShippingPageProps,
  ShippingParcel,
} from "@/components/types/shipping"
import { isCounted, settlement } from "@/helper/cart-totals"
import { productHref } from "@/helper/product-href"

export type {
  ShippingAddress,
  ShippingChoice,
  ShippingDate,
  ShippingOption,
  ShippingPageProps,
  ShippingParcel,
} from "@/components/types/shipping"

/** What a parcel is called, in the rail and over its own section. */
function parcelLabel(parcel: ShippingParcel, i: number) {
  return `Paket ${i + 1}${parcel.seller ? ` · ${parcel.seller}` : ""}`
}

/** What a live parcel is, in the two words the page has for it — and the ink it
    is said in. A fish is the thing the visitor is being asked to be home for, so
    it is the only thing on the page said in the alarm's own red. */
function parcelNote(parcel: ShippingParcel) {
  return parcel.mode === "live" ? "Ikan hidup" : "Kurir reguler"
}

/**
 * The delivery step: where the order goes, when the fish lands, and what the
 * freight costs.
 *
 * @remarks
 * The step is not a form, it is a set of decisions about parcels — which is why
 * the page is a list of shipments rather than a column of fields. A cart's three
 * items become three parcels because they come from three sellers, and a fish
 * has a question a sack of food does not: when can somebody be home to take it
 * out of the bag. So the koi parcels carry a day, the courier parcel does not,
 * and the rail says which row is which.
 *
 * The page prices nothing. It hands a choice back — a parcel's key, an option's
 * id — and draws whatever the app answers with, because the kit has no tariff
 * and should not invent one. Until a caller supplies prices, the freight rows
 * say `Ongkir menyusul`, the total is withheld, and the visitor is told why.
 *
 * @example
 * <ShippingPage
 *   parcels={parcels}
 *   totals={settlement(lines, priced)}
 *   onChoiceChange={({ key, optionId }) => priceParcel(key, optionId)}
 *   onPhoneChange={setPhone}
 *   account={session}
 * />
 */
export function ShippingPage({
  parcels = DEFAULT_SHIPPING_PARCELS,
  addresses = DEFAULT_SHIPPING_ADDRESSES,
  addressId = addresses[0]?.id,
  dates = DEFAULT_SHIPPING_DATES,
  dateId,
  phone,
  onPhoneChange,
  onAddressChange,
  onDateChange,
  onChoiceChange,
  totals,
  onCheckout,
  onBack,
  onAddAddress,
  step = "shipping",
  completed,
  account,
  cart,
  activeHref = ROUTES.cart,
  onSearch,
  className,
  ...rest
}: ShippingPageProps) {
  /* The only two things the page holds itself. A day and a phone number are not
     part of any parcel and change no price, so there is nothing to hand back to
     an app for them beyond the fact that they were picked. */
  const [day, setDay] = useState(dateId)
  const [number, setNumber] = useState(phone ?? "")

  /* Which delivery each parcel is taking, so the rail's rows and the page's own
     radio dots can never point at different options. */
  const taken = parcels.map((parcel) =>
    parcel.options.find((o) => o.id === chosen(parcel))
  )

  /* Any live parcel puts the day question on the page: a fish is what needs
     somebody home, and the day is the same day for all of them. */
  const flight = parcels.find((parcel) => parcel.mode === "live")
  const chosenDay = dates.find((date) => date.id === day) ?? dates[0]

  /* What the bill comes to, unless the caller has priced it itself — the kit's
     demo state is a settled order, so the rail has something to add up. */
  const bill =
    totals ??
    settlement(
      parcels.flatMap((parcel) => parcel.items),
      taken.map((option) => ({ shipping: option?.price }))
    )

  return (
    <PageShell
      data-slot="shipping-page"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      cart={cart}
      trail={[
        { label: "Keranjang", href: ROUTES.cart },
        { label: "Pengiriman" },
      ]}
      {...rest}
    >
      <div className={`${CONTAINER} pb-16`}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl font-extrabold lg:text-4xl">
              Pengiriman
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Pesananmu dikirim dalam {parcels.length} paket karena berasal dari{" "}
              {parcels.length} penjual. Koi dikirim hidup, jadi pilih jadwal
              saat kamu bisa menerima langsung.
            </p>
          </div>

          <CartSteps step={step} done={completed} />
        </div>

        <div className="flex flex-wrap items-start gap-12">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
            {/* Where it can go. First, because it is the answer the freight
                depends on — everything below it is priced against it. */}
            <section aria-labelledby="shipping-address">
              <SectionHead id="shipping-address" title="Alamat penerima">
                {/* Drawn only where the caller has somewhere to send them: a
                    control that goes nowhere is furniture. */}
                <RenderIf when={onAddAddress}>
                  {(add) => (
                    <Button
                      variant="link"
                      onClick={add}
                      className="h-auto gap-1 p-0 text-xs font-bold"
                    >
                      <Plus aria-hidden />
                      Alamat baru
                    </Button>
                  )}
                </RenderIf>
              </SectionHead>

              <ChoiceList
                label="Alamat penerima"
                options={addresses.map((a) => ({
                  id: a.id,
                  title: a.name,
                  tag: a.tag,
                  detail: a.line,
                }))}
                value={addressId}
                onValueChange={(id) => {
                  const next = addresses.find((a) => a.id === id)
                  if (next) onAddressChange?.(next)
                }}
              />
            </section>

            {parcels.map((parcel, i) => (
              <section
                key={parcel.key}
                aria-labelledby={`parcel-${parcel.key}`}
              >
                <SectionHead
                  id={`parcel-${parcel.key}`}
                  title={parcelLabel(parcel, i)}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      parcel.mode === "live"
                        ? "text-destructive-ink"
                        : "text-muted-foreground"
                    )}
                  >
                    {parcelNote(parcel)}
                  </span>
                </SectionHead>

                {/* What is in the box, before what it costs to send it: the
                    visitor is confirming a shipment, not shopping. */}
                <ul className="flex flex-col">
                  {parcel.items.map(({ product, quantity }) => (
                    <li
                      key={product.id}
                      className="flex items-center gap-3.5 border-b border-border py-3.5"
                    >
                      <RenderIf when={product.image}>
                        {(src) => (
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-14 w-11 shrink-0 rounded-lg object-cover"
                          />
                        )}
                      </RenderIf>
                      <RenderIf when={!product.image}>
                        {() => (
                          <div className="h-14 w-11 shrink-0 rounded-lg bg-muted" />
                        )}
                      </RenderIf>

                      <Link
                        href={productHref(product)}
                        className="min-w-0 font-bold hover:text-accent-ink"
                      >
                        {product.title}
                        {/* The count, where the seller counts: two sacks of the
                            same food are one line, not two. */}
                        {quantity && isCounted({ product, quantity }) ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            × {quantity}
                          </span>
                        ) : product.listing?.ref ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · {product.listing.ref}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>

                <ChoiceList
                  label={`Cara kirim — ${parcelLabel(parcel, i)}`}
                  className="mt-2"
                  options={parcel.options.map((o) => ({
                    id: o.id,
                    title: o.title,
                    detail: o.detail,
                    price: o.price,
                  }))}
                  value={chosen(parcel)}
                  onValueChange={(optionId) =>
                    onChoiceChange?.({ key: parcel.key, optionId })
                  }
                />
              </section>
            ))}

            {/* The day, and who to ring. Only where something is alive: a courier
                parcel has a tracking number, not an appointment. */}
            <RenderIf when={flight}>
              {() => (
                <section aria-labelledby="shipping-date">
                  <SectionHead id="shipping-date" title="Jadwal terima koi" />

                  <p className="mt-3.5 mb-3 text-sm leading-relaxed text-muted-foreground">
                    Pilih hari kamu ada di lokasi. Kedua paket koi dijadwalkan
                    tiba di hari yang sama.
                  </p>

                  {/* One choice out of four, so the list is a radio group — the
                      same act as the address above it, in a row rather than a
                      column. */}
                  <fieldset className="flex flex-wrap gap-2.5">
                    <legend className="sr-only">Hari terima koi</legend>
                    {dates.map((date) => (
                      <label
                        key={date.id}
                        className={cn(
                          "min-w-28 cursor-pointer rounded-xl border px-4.5 py-3 text-sm font-semibold transition-colors",
                          date.id === chosenDay?.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-muted/60"
                        )}
                      >
                        <input
                          type="radio"
                          name="tanggal-terima"
                          value={date.id}
                          checked={date.id === chosenDay?.id}
                          onChange={() => {
                            setDay(date.id)
                            onDateChange?.(date)
                          }}
                          className="peer sr-only"
                        />
                        <span className="block text-xs opacity-75">
                          {date.day}
                        </span>
                        {date.date}
                      </label>
                    ))}
                  </fieldset>

                  <div className="mt-4 max-w-90">
                    <Label
                      htmlFor="penerima-hp"
                      className="mb-1.5 block text-xs text-muted-foreground"
                    >
                      No. HP penerima
                      <span className="font-normal text-muted-foreground">
                        (dihubungi kurir saat koi tiba)
                      </span>
                    </Label>
                    <Input
                      id="penerima-hp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+62 812-3456-7890"
                      value={number}
                      onChange={(e) => {
                        setNumber(e.target.value)
                        onPhoneChange?.(e.target.value)
                      }}
                    />
                  </div>
                </section>
              )}
            </RenderIf>
          </div>

          <aside className="min-w-0 flex-[1_1_360px]">
            <CartSummary
              totals={bill}
              /* `parcels` is the only row group the rail draws here, so the
                 `detail` fields it does not read are zeroes rather than
                 invented counts — a delivery is not made of a cart's two
                 halves. */
              detail={{
                lines: 0,
                units: 0,
                lotLines: 0,
                goodLines: 0,
                sellers: 0,
                auction: 0,
                direct: 0,
                total: bill.items,
                due: bill.due,
                dueRef: bill.dueRef,
                parcels: parcels.map((parcel, i) => ({
                  label: parcelLabel(parcel, i),
                  price: taken[i]?.price,
                })),
              }}
              step={step}
              onCheckout={onCheckout}
              onBack={onBack}
              className="lg:sticky lg:top-24"
            />
          </aside>
        </div>
      </div>
    </PageShell>
  )
}

/** The delivery option a parcel is taking. Omitted, the first the house offers —
    a page that drew no choice would otherwise price nothing. */
function chosen(parcel: ShippingParcel) {
  return parcel.choice?.optionId ?? parcel.options[0]?.id
}

/** A shelf's name over its body: the section's own heading, with whatever the
    section has to say on the right. */
function SectionHead({
  id,
  title,
  children,
}: {
  id: string
  title: string
  /** What the section has to say on the right, where it has anything. */
  children?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
      <h2 id={id} className={SECTION_LABEL}>
        {title}
      </h2>
      {children}
    </div>
  )
}
