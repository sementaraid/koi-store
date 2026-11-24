import { LayoutGrid, Tag } from 'lucide-react';

import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { Link } from '@/components/atoms/Link/Link';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { PageTrail } from '@/components/cells/PageBreadcrumb/PageBreadcrumb';
import { CONTAINER } from '@/const/layout';
import { ROUTES, categoryHref } from '@/const/routes';

export type CategoryGroup = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  children: { id: string; name: string; handle: string }[];
};

export type CategoriesProps = {
  groups: CategoryGroup[];
};

export function Categories({ groups }: CategoriesProps) {
  return (
    <>
      <PageTrail trail={[{ label: 'Beranda', href: ROUTES.home }, { label: 'Kategori' }]} />
      <div className={`${CONTAINER} pb-16`}>
        <div className="mb-8 max-w-2xl">
          <Eyebrow>
            <LayoutGrid aria-hidden className="size-3.5" />
            Varietas Nishikigoi
          </Eyebrow>
          <h1 className="mt-2 font-heading text-3xl font-extrabold lg:text-4xl">
            Kategori
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Katalog dipotong per golongan. Pilih satu untuk melihat koi yang
            tersedia di dalamnya, termasuk dari sub-kategorinya.
          </p>
        </div>

        {groups.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <section
                key={group.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h2 className="font-heading text-lg font-bold">
                  <Link
                    href={categoryHref(group.handle)}
                    className="hover:underline"
                  >
                    {group.name}
                  </Link>
                </h2>

                {group.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {group.description}
                  </p>
                ) : null}

                {group.children.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={categoryHref(child.handle)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                        >
                          <Tag aria-hidden className="size-3" />
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        ) : (
          <EmptyFeed
            icon={<LayoutGrid aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada kategori"
            noMatchBody="Kategori terisi begitu katalog mulai dipotong per varietas."
            action={
              <Link href={ROUTES.catalogs} className="font-bold">
                Lihat katalog
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}
