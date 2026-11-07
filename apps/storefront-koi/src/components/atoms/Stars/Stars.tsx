import { Star } from 'lucide-react';
import { cn } from 'cn';

/** Props for {@link Stars}. */
export type StarsProps = {
  /** The score, 1–5. Rounded down to whole stars when drawn. */
  value: number;
  /** How large the row sits. @defaultValue `"sm"` */
  size?: 'sm' | 'md';
  className?: string;
};

const SIZES = { sm: 'size-3.5', md: 'size-5' } as const;

/**
 * A score, as five stars.
 *
 * @remarks
 * `aria-hidden` on the stars and the figure in the label, not the other way
 * round: five glyphs announced one at a time is five "star, star, image" in a
 * row, where the sentence a screen reader wants is "4 dari 5 bintang".
 *
 * Gold fill is the same `gold-ink` the partner card's single star already
 * uses, so a score reads the same wherever the customer meets one.
 */
export function Stars({ value, size = 'sm', className }: StarsProps) {
  const filled = Math.round(value);

  return (
    <span
      role="img"
      aria-label={`${value} dari 5 bintang`}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            SIZES[size],
            n <= filled ? 'fill-gold-ink text-gold-ink' : 'text-muted-foreground/40'
          )}
        />
      ))}
    </span>
  );
}

/** Props for {@link StarsInput}. */
export type StarsInputProps = {
  /** The score picked so far, or `0` for none. */
  value: number;
  onValueChange: (value: number) => void;
  /** Names the group for a screen reader — "Nilai untuk Dainichi Koi Farm". */
  label: string;
  /** Marks the group invalid and wires the complaint to it. */
  errorId?: string;
  className?: string;
};

/** What each score means, said in words rather than left to the glyph count. */
const WORDS = ['Buruk', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'] as const;

/**
 * Five radios drawn as stars: how the customer sets a score.
 *
 * @remarks
 * Real radios under the glyphs, the same construction `ChoiceList` uses: a
 * rating is a choice with one answer out of five, and a row of `<button>`s
 * gives a keyboard user five tab stops and a screen reader no group at all.
 * The `sr-only` input keeps arrow-key navigation, the group semantics and the
 * focus ring that the glyph then draws from `peer-focus-visible`.
 *
 * Each star carries its word as `title` and in its hidden label, so the score
 * is not conveyed by a count of filled shapes alone.
 */
export function StarsInput({
  value,
  onValueChange,
  label,
  errorId,
  className
}: StarsInputProps) {
  return (
    <fieldset className={cn('flex flex-col gap-1.5', className)}>
      <legend className="sr-only">{label}</legend>

      <div
        className="flex items-center gap-1"
        {...(errorId ? { 'aria-describedby': errorId } : {})}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            title={WORDS[n - 1]}
            className="cursor-pointer rounded-sm p-0.5 focus-within:ring-[3px] focus-within:ring-gold-ink/30"
          >
            <input
              type="radio"
              name={label}
              value={n}
              checked={value === n}
              onChange={() => onValueChange(n)}
              className="peer sr-only"
            />
            <span className="sr-only">
              {n} — {WORDS[n - 1]}
            </span>
            <Star
              aria-hidden
              className={cn(
                'size-7 transition-colors',
                n <= value ? 'fill-gold-ink text-gold-ink' : 'text-muted-foreground/40'
              )}
            />
          </label>
        ))}
      </div>

      {/* The word for what is picked, drawn once beside the row rather than as
          five permanent captions. */}
      <span className="min-h-4 text-xs text-muted-foreground">
        {value ? WORDS[value - 1] : 'Belum dinilai'}
      </span>
    </fieldset>
  );
}
