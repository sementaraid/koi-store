import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import type { InfoDoc } from '@/const/info';
import { Button, RenderIf } from "@koi/ui";
import { Link } from '@/components/atoms/Link/Link';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { PageTrail } from '@/components/cells/PageBreadcrumb/PageBreadcrumb';

export type InfoProps = {
  doc: InfoDoc;
  slug: string;
};

export function Info({ doc, slug }: InfoProps) {
  return (
    <div data-slot="info-page">
      <PageTrail trail={[{ label: 'Beranda', href: ROUTES.home }, { label: doc.title }]} />
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

        <RenderIf when={doc.action}>
          {(action) => (
            <div className="mt-10 flex flex-col items-start gap-2 border-t border-border pt-8">
              <Button
                render={
                  <Link
                    href={action.href}
                    {...(/^https?:/.test(action.href)
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  />
                }
                nativeButton={false}
              >
                {action.label}
              </Button>
              <RenderIf when={action.note}>
                {(note) => (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {note}
                  </p>
                )}
              </RenderIf>
            </div>
          )}
        </RenderIf>
      </article>
    </div>
  );
}
