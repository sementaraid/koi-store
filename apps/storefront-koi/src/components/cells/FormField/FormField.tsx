import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from 'cn';

import { Input } from '@/components/atoms/Input/Input';
import { Label } from '@/components/ui/label';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';

/** Props for {@link FormField}: the label and the error, plus everything the
    input itself takes — so `register()`'s `ref`, `name`, `onChange` and
    `onBlur` spread straight onto it. */
export type FormFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  /** Visible label. Also what a screen reader announces for the field. */
  label: string;
  /** The complaint, when there is one. Draws the field invalid and prints the
      message under it. */
  error?: string;
  /** Standing guidance — a password's rules, a phone's format. Read before the
      visitor types, where the error is read after. */
  hint?: ReactNode;
  /** Classes for the wrapper, not the input: the field is a block, and a caller
      sizing it (`md:w-1/2`) means the block. */
  className?: string;
};

/**
 * One labelled field: the label, the input, and whatever the form has to say
 * about what is in it.
 *
 * @remarks
 * The four auth forms carry fourteen fields between them, and the triple is
 * only correct when all three parts are wired together — the label to the
 * input, the error to the input's `aria-describedby`, the invalid state to
 * `aria-invalid` so the `Input` atom's own `aria-invalid:` ring lights up. Done
 * by hand fourteen times, some of them would be a label floating beside an
 * input a screen reader never connects to it.
 *
 * The id is generated rather than asked for: a caller passing ids is a caller
 * who can pass the same one twice, and the field has no reason to be addressed
 * from outside.
 *
 * @example
 * <FormField
 *   label="Email"
 *   type="email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 */
export function FormField({
  label,
  error,
  hint,
  className,
  ...input
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        /* Both, in reading order: the guidance the visitor needs to fix it,
           then the complaint that says it needs fixing. */
        aria-describedby={
          cn(hint && hintId, error && errorId).trim() || undefined
        }
        {...input}
      />
      <RenderIf when={hint}>
        {(node) => (
          <div id={hintId} className="text-xs text-muted-foreground">
            {node}
          </div>
        )}
      </RenderIf>
      <RenderIf when={error}>
        {(message) => (
          /* `role="alert"` rather than a live region on the form: the message
             appears on submit, and the visitor's focus is elsewhere. */
          <p id={errorId} role="alert" className="text-xs text-destructive-ink">
            {message}
          </p>
        )}
      </RenderIf>
    </div>
  );
}
