import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from 'cn';

import { Card } from '@/components/atoms/Card/Card';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { SECTION_LABEL } from '@/const/layout';

/** Props for {@link StatCard}. */
export type StatCardProps = {
  /** What is being stated, in the house's quiet section voice. */
  label: string;
  /** The glyph beside the label, in the brand accent. Omitted, the label
      stands alone. */
  icon?: LucideIcon;
  /** The figure or the phrase itself — the one thing the card is for. */
  value: ReactNode;
  /** A line under the value: the address behind the city, the date behind the
      balance. Omitted, the card is the label and the value. */
  note?: ReactNode;
  /** The way to act on it — "Kelola alamat", "Isi saldo". */
  action?: ReactNode;
  className?: string;
};

/**
 * One fact about the account, boxed: a label, the figure, and the way to change
 * it.
 *
 * @remarks
 * A card rather than a row because these sit two-up at the foot of the account
 * home, where a bare label-over-value pair loses its edges against the sections
 * above it. It stands on the kit's `Card` material, the same panel the cart's
 * rail and the auth screens use: the account pages are the only place in the
 * storefront that was drawing its own hairline box, which is how one page ends
 * up looking like a different product.
 *
 * The value is set in the kit's figure voice — heading face, extrabold,
 * `tabular-nums` — so a price here and a price in the cart's rail are visibly
 * the same kind of fact, and a column of them does not jitter as the digits
 * change.
 *
 * @example
 * <StatCard label="Alamat utama" value="Bandung" action={<Link …>Kelola</Link>} />
 */
export function StatCard({
  label,
  icon: Icon,
  value,
  note,
  action,
  className
}: StatCardProps) {
  return (
    <Card className={cn('gap-0 p-5 [--card-spacing:--spacing(0)]', className)}>
      <p className={cn(SECTION_LABEL, 'flex items-center gap-1.5')}>
        <RenderIf when={Icon}>
          {(Glyph) => (
            <Glyph
              aria-hidden
              className="size-3.5 text-accent-ink"
            />
          )}
        </RenderIf>
        {label}
      </p>

      <p className="mt-2 font-heading text-xl font-extrabold text-foreground tabular-nums">
        {value}
      </p>

      <RenderIf when={note}>
        {(text) => (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
        )}
      </RenderIf>

      <RenderIf when={action}>
        {(node) => <div className="mt-3 text-sm">{node}</div>}
      </RenderIf>
    </Card>
  );
}
