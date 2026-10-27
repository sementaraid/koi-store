import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

/* Relative paths only, same reason as the helper tests: the runner strips types
   without reading tsconfig, so `@/` does not resolve. */
import { INFO_DOCS, INFO_SLUGS } from './info.ts';
import { ROUTES } from './routes.ts';

/**
 * Every URL `app/` can answer for, as `/`-joined segments.
 *
 * Dynamic segments (`[slug]`) are recorded in a second set, because a link into
 * one is only dead if nothing backs the segment — which is exactly the case
 * these tests exist to catch for the `[slug]` standing pages.
 */
const readRoutes = (dir: string, prefix = ''): { static: Set<string>; dynamic: Set<string> } => {
  const out = { static: new Set<string>(), dynamic: new Set<string>() };

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    /* Route groups are parentheses and do not appear in the URL. */
    const group = /^\(.*\)$/.test(entry.name);
    const path = group ? prefix : `${prefix}/${entry.name}`;

    if (entry.name.startsWith('[')) out.dynamic.add(path);
    else if (!group) out.static.add(path);

    const nested = readRoutes(`${dir}/${entry.name}`, path);
    for (const value of nested.static) out.static.add(value);
    for (const value of nested.dynamic) out.dynamic.add(value);
  }

  if (prefix === '') out.static.add('/');

  return out;
};

const APP = new URL('../app', import.meta.url).pathname;
const routes = readRoutes(APP);

test('every footer link resolves to a real route or a standing page', () => {
  const source = readFileSync(new URL('./footer.ts', import.meta.url), 'utf8');
  const hrefs = [...source.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]!);

  assert.ok(hrefs.length > 0, 'no footer hrefs found — did the shape change?');

  for (const href of hrefs) {
    const ok =
      routes.static.has(href) ||
      (href.startsWith('/') && href.slice(1) in INFO_DOCS);

    assert.ok(ok, `footer link ${href} points at a path nothing answers`);
  }
});

test('the ROUTES keys that are standing pages have copy behind them', () => {
  for (const href of [ROUTES.guide, ROUTES.escrow, ROUTES.contact]) {
    assert.ok(
      href.slice(1) in INFO_DOCS,
      `${href} is linked from the UI but has no entry in INFO_DOCS`
    );
  }
});

test('every standing page is complete enough to render', () => {
  assert.ok(INFO_SLUGS.length > 0);

  for (const slug of INFO_SLUGS) {
    const doc = INFO_DOCS[slug]!;

    assert.ok(doc.title.length > 0, `${slug}: no title`);
    assert.ok(doc.lede.length > 0, `${slug}: no lede`);
    assert.ok(doc.eyebrow.length > 0, `${slug}: no eyebrow`);
    assert.ok(doc.sections.length > 0, `${slug}: no sections`);

    for (const section of doc.sections) {
      assert.ok(section.heading.length > 0, `${slug}: section with no heading`);
      assert.ok(
        section.body.length > 0 && section.body.every((p) => p.length > 0),
        `${slug}: section "${section.heading}" has an empty paragraph`
      );
    }
  }
});

test('no standing page shadows a real route', () => {
  for (const slug of INFO_SLUGS) {
    assert.ok(
      !routes.static.has(`/${slug}`),
      `standing page "${slug}" collides with the route /${slug}`
    );
  }
});
