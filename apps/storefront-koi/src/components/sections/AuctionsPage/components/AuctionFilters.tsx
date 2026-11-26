"use client"

import { useState } from "react"
import { Check, SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button, Input, Label } from "@koi/ui"
import { NativeSelect } from "@koi/ui/primitives/native-select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@koi/ui/primitives/sheet"
import { SECTION_LABEL } from "@/const/layout"
import { KOI_VARIETIES, type AuctionTab } from "@/lib/helpers/auction-list"

// `GET /store/lots` takes no sort: it always returns the lot that ends first,
// first (`packages/api/src/api/store/lots/route.ts`). So the select shows that
// single order rather than inventing one the API cannot apply (US-097 AC13).
const SORT = { value: "end_time", label: "Berakhir paling cepat" }
// The phone chip shortens it, as on board 01.
const SORT_CHIP = "Berakhir duluan"

const CHIP =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

const FILTER_KEYS = ["variety", "size_min", "size_max", "certificate", "has_video", "joined"]
const SIZE_MIN = 1
const SIZE_MAX = 150

function SortField({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={SECTION_LABEL}>
        Urutkan
      </Label>
      <NativeSelect id={id} variant="filled" defaultValue={SORT.value}>
        <option value={SORT.value}>{SORT.label}</option>
      </NativeSelect>
    </div>
  )
}

// Checkboxes drawn as the board's tick boxes (the same shape as /katalog's
// category list), with a count on the right where one is known.
function CheckOption({
  id,
  label,
  checked,
  count,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  count?: number
  onChange: () => void
}) {
  return (
    <label
      htmlFor={id}
      className="group/opt flex cursor-pointer items-center gap-3 py-1.5 text-sm"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden
        className="flex size-4.5 shrink-0 items-center justify-center rounded-md border border-input group-has-checked/opt:border-primary group-has-checked/opt:bg-primary group-has-focus-visible/opt:ring-3 group-has-focus-visible/opt:ring-ring/50"
      >
        <Check className="size-3 text-primary-foreground opacity-0 group-has-checked/opt:opacity-100" />
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined ? (
        <span className="text-sm text-muted-foreground tabular-nums">{count}</span>
      ) : null}
    </label>
  )
}

type PanelProps = {
  place: string
  tab: AuctionTab
  signedIn: boolean
  selected: string[]
  sizeMin: string
  sizeMax: string
  certificate: boolean
  hasVideo: boolean
  joined: boolean
  counts?: Record<string, number>
  active: boolean
  onToggleVariety: (variety: string) => void
  onClearVariety: () => void
  onCommitSize: (key: "size_min" | "size_max", value: string) => void
  onToggleFlag: (key: "certificate" | "has_video") => void
  onToggleJoined: () => void
  onReset: () => void
}

// One set of fields, drawn twice: the desktop sidebar and the phone sheet. The
// `place` suffix keeps the ids unique while both sit in the DOM.
function FilterPanel({
  place,
  tab,
  signedIn,
  selected,
  sizeMin,
  sizeMax,
  certificate,
  hasVideo,
  joined,
  counts,
  active,
  onToggleVariety,
  onClearVariety,
  onCommitSize,
  onToggleFlag,
  onToggleJoined,
  onReset,
}: PanelProps) {
  return (
    <>
      {tab === "ended" ? (
        <div className="flex flex-col gap-2">
          <span className={SECTION_LABEL}>Urutkan</span>
          <span className="text-sm font-semibold">Baru selesai</span>
        </div>
      ) : (
        <SortField id={`auctions-sort-${place}`} />
      )}

      {/* US-111 AC6 (US-097 AC13): the viewer's own lots. Only a signed-in
          customer can have joined anything, so guests never see it. */}
      {signedIn ? (
        <fieldset className="flex flex-col">
          <legend className={`${SECTION_LABEL} mb-1`}>Ikut lelang</legend>
          <CheckOption
            id={`joined-${place}`}
            label="Yang saya ikuti"
            checked={joined}
            onChange={onToggleJoined}
          />
        </fieldset>
      ) : null}

      <fieldset className="flex flex-col">
        <legend className={`${SECTION_LABEL} mb-1`}>Varietas</legend>
        <CheckOption
          id={`variety-all-${place}`}
          label="Semua varietas"
          checked={selected.length === 0}
          onChange={onClearVariety}
        />
        {KOI_VARIETIES.map((variety) => (
          <CheckOption
            key={variety}
            id={`variety-${place}-${variety}`}
            label={variety}
            checked={selected.includes(variety)}
            count={counts?.[variety]}
            onChange={() => onToggleVariety(variety)}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${SECTION_LABEL} mb-1`}>Ukuran (cm)</legend>
        <div className="flex items-center gap-2">
          <Input
            key={`${place}-min-${sizeMin}`}
            id={`size-min-${place}`}
            type="number"
            inputMode="numeric"
            min={SIZE_MIN}
            max={SIZE_MAX}
            defaultValue={sizeMin}
            placeholder="Min"
            aria-label="Ukuran minimum (cm)"
            className="h-11 md:h-10"
            onBlur={(event) => onCommitSize("size_min", event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onCommitSize("size_min", event.currentTarget.value)
              }
            }}
          />
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          <Input
            key={`${place}-max-${sizeMax}`}
            id={`size-max-${place}`}
            type="number"
            inputMode="numeric"
            min={SIZE_MIN}
            max={SIZE_MAX}
            defaultValue={sizeMax}
            placeholder="Maks"
            aria-label="Ukuran maksimum (cm)"
            className="h-11 md:h-10"
            onBlur={(event) => onCommitSize("size_max", event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onCommitSize("size_max", event.currentTarget.value)
              }
            }}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className={`${SECTION_LABEL} mb-1`}>Lainnya</legend>
        <CheckOption
          id={`certificate-${place}`}
          label="Bersertifikat"
          checked={certificate}
          onChange={() => onToggleFlag("certificate")}
        />
        <CheckOption
          id={`video-${place}`}
          label="Ada video"
          checked={hasVideo}
          onChange={() => onToggleFlag("has_video")}
        />
      </fieldset>

      {active ? (
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-control text-sm font-semibold text-accent-ink underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Hapus filter
        </button>
      ) : null}
    </>
  )
}

// Desktop: the board's left sidebar with `Urutkan`, `Varietas` (counts),
// `Ukuran (cm)` and `Lainnya`. Phone: the chip row, with every sidebar control
// in a bottom sheet behind `Filter`, `Varietas` or `Ukuran` (US-097 AC13, AC16;
// US-105 AC5). The koi filters are all in the URL, like the tab, so a narrowed
// list can be linked and the back button undoes a change.
export function AuctionFilters({
  tab,
  counts,
  signedIn = false,
}: {
  tab: AuctionTab
  counts?: Record<string, number>
  signedIn?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)

  const selected = params.getAll("variety").filter((v) => (KOI_VARIETIES as readonly string[]).includes(v))
  const sizeMin = params.get("size_min") ?? ""
  const sizeMax = params.get("size_max") ?? ""
  const certificate = params.get("certificate") === "true"
  const hasVideo = params.get("has_video") === "true"
  const joined = params.get("joined") === "1"
  const active =
    selected.length > 0 ||
    sizeMin !== "" ||
    sizeMax !== "" ||
    certificate ||
    hasVideo ||
    joined

  const write = (mutate: (query: URLSearchParams) => void) => {
    const query = new URLSearchParams(params.toString())
    mutate(query)
    router.replace(query.toString() ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }

  const toggleVariety = (variety: string) => {
    write((query) => {
      const current = query
        .getAll("variety")
        .filter((v) => (KOI_VARIETIES as readonly string[]).includes(v))
      const next = current.includes(variety)
        ? current.filter((v) => v !== variety)
        : [...current, variety]
      query.delete("variety")
      for (const value of KOI_VARIETIES) {
        if (next.includes(value)) query.append("variety", value)
      }
    })
  }

  const clearVariety = () => write((query) => query.delete("variety"))

  const commitSize = (key: "size_min" | "size_max", raw: string) => {
    const n = Number(raw)
    const valid = raw.trim() !== "" && Number.isInteger(n) && n >= SIZE_MIN && n <= SIZE_MAX
    write((query) => {
      if (valid) query.set(key, String(n))
      else query.delete(key)
    })
  }

  const toggleFlag = (key: "certificate" | "has_video") =>
    write((query) => {
      if (query.get(key) === "true") query.delete(key)
      else query.set(key, "true")
    })

  const toggleJoined = () =>
    write((query) => {
      if (query.get("joined") === "1") query.delete("joined")
      else query.set("joined", "1")
    })

  const reset = () => write((query) => FILTER_KEYS.forEach((key) => query.delete(key)))

  const panel = (place: string) => (
    <FilterPanel
      place={place}
      tab={tab}
      signedIn={signedIn}
      selected={selected}
      sizeMin={sizeMin}
      sizeMax={sizeMax}
      certificate={certificate}
      hasVideo={hasVideo}
      joined={joined}
      counts={counts}
      active={active}
      onToggleVariety={toggleVariety}
      onClearVariety={clearVariety}
      onCommitSize={commitSize}
      onToggleFlag={toggleFlag}
      onToggleJoined={toggleJoined}
      onReset={reset}
    />
  )

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={CHIP}
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filter
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={CHIP}
        >
          Varietas
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={CHIP}
        >
          Ukuran
        </button>
        {tab !== "ended" ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`Urutkan: ${SORT_CHIP}`}
            className={CHIP}
          >
            {SORT_CHIP}
          </button>
        ) : null}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="gap-0">
            <SheetHeader className="border-b border-border pe-14">
              <SheetTitle className="text-base font-semibold">Filter</SheetTitle>
            </SheetHeader>
            <div className="flex max-h-[65svh] flex-col gap-4 overflow-y-auto px-4 py-4">
              {panel("sheet")}
            </div>
            <SheetFooter className="sticky bottom-0 flex-row border-t border-border bg-popover pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={!active}
                className="flex-1"
              >
                Hapus filter
              </Button>
              <SheetClose render={<Button type="button" className="flex-1" />}>
                Tampilkan hasil
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-6">
        {panel("side")}
      </aside>
    </>
  )
}
