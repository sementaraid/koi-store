import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import type { InfoDoc } from '@/const/info';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { PageShell } from '@/components/organisms/PageShell/PageShell';
import type { HeaderAccount, HeaderCart } from '@/types/header';

/** Props for {@link Info}. */
export type InfoProps = {
  /** The page's copy, already looked up by segment. */
  doc: InfoDoc;
  /** The segment it was looked up by, for the trail's last step. */
  slug: string;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * One standing page: a heading, a lede, and numbered prose under it.
 *
 * @remarks
 * One component for every one of these pages, because they differ only in their
 * words — a guide, a privacy policy and an escrow explainer are the same
 * object as far as a reader is concerned, and twelve near-identical sections is
 * twelve places for the measure and the heading rank to drift apart.
 *
 * Every paragraph is a `<p>` of plain text. The copy is the house's own, held
 * in `const/info.ts`, and it still is not rendered as HTML: the day these rows
 * come from a CMS instead, the renderer must already refuse markup.
 */
export function Info({ doc, slug, account, cart }: InfoProps) {
  return (
    <PageShell
      data-slot="info-page"
      account={account}
      cart={cart}
      trail={[
        { label: 'Beranda', href: ROUTES.home },
        { label: doc.title }
      ]}
    >
      {/* A measure, not the full gutter: these pages are read, and a line of
          prose running the whole 1200px is a line nobody finishes. */}
      <article className={`${CONTAINER} max-w-[760px] py-10 lg:py-14`}>
        <header className="flex flex-col gap-3">
          <Eyebrow>{doc.eyebrow}</Eyebrow>
          <h1 className="font-heading text-2xl font-black text-pretty sm:text-3xl">
            {doc.title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {doc.lede}
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-9">
          {doc.sections.map((section) => (
            <section key={`${slug}:${section.heading}`} className="flex flex-col gap-3">
              <h2 className="font-heading text-base font-bold text-pretty">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-sm leading-relaxed text-pretty"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </PageShell>
  );
}
