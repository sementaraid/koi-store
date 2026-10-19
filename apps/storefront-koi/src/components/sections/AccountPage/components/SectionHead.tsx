import { Link } from '@/components/atoms/Link/Link';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';

/** Props for {@link SectionHead}. */
export type SectionHeadProps = {
  /** The heading's own id, so the section it heads can be `aria-labelledby` it. */
  id: string;
  /** What the block below is. */
  title: string;
  /** Where the whole of it lives, when the block is only showing the first few. */
  href?: string;
  /** The link's words. @defaultValue `"Lihat semua"` */
  action?: string;
};

/**
 * A heading over a block of the account page, with the way to the rest of it.
 *
 * @remarks
 * Bigger than `SECTION_LABEL` and sitting on its own rule, which is what the
 * dashboard's sections do and what the cart's quiet labels deliberately do not:
 * these are the page's own parts, read in sequence, not asides beside a feed.
 */
export function SectionHead({ id, title, href, action = 'Lihat semua' }: SectionHeadProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-3">
      <h2
        id={id}
        className="font-heading text-base font-extrabold text-foreground"
      >
        {title}
      </h2>
      <RenderIf when={href}>
        {(to) => (
          <Link
            href={to}
            className="text-xs font-medium text-accent-ink hover:underline"
          >
            {action}
          </Link>
        )}
      </RenderIf>
    </div>
  );
}
