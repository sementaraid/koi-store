import { Star } from 'lucide-react';
import { cn } from 'cn';

export type StarsProps = {
  value: number;
  size?: 'sm' | 'md';
  className?: string;
};

const SIZES = { sm: 'size-3.5', md: 'size-5' } as const;

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

export type StarsInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  errorId?: string;
  className?: string;
};

const WORDS = ['Buruk', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'] as const;

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

      <span className="min-h-4 text-xs text-muted-foreground">
        {value ? WORDS[value - 1] : 'Belum dinilai'}
      </span>
    </fieldset>
  );
}
