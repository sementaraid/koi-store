'use client';

import { Button } from '@koi/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@koi/ui/primitives/dropdown-menu';

export type RowAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Destructive actions (`Tolak`, `Batalkan`, `Hapus`) read in the signal red. */
  tone?: 'default' | 'destructive';
};

/* Every row that offers two or more mutations hides them behind one menu, so
   the table stays readable and a miss-click cannot fire the wrong workflow. */
export function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" aria-label={label} />}
      >
        Aksi
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.disabled}
            onClick={action.onSelect}
            className={action.tone === 'destructive' ? 'text-destructive-ink' : undefined}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
