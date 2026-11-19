import { Link } from '@/components/atoms/Link/Link';
import { RenderIf } from "@koi/ui";

export type SectionHeadProps = {
  id: string;
  title: string;
  href?: string;
  action?: string;
};

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
