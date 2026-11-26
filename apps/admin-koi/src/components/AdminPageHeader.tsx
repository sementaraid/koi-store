import type { ReactNode } from 'react';

// One page heading for every admin screen. Matches the storefront: Instrument
// Sans (`font-heading`), bold, at the same scale the old `text-xl font-medium`
// headings used. `back` and `actions` cover the routes that need them.
export type AdminPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  back?: ReactNode;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, description, back, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid gap-1">
        {back}
        <h1 className="font-heading text-xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <div className="text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
