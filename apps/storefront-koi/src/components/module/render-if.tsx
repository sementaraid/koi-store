import type { ReactNode } from "react"

/** Props for {@link RenderIf}. */
export type RenderIfProps<T> = {
  /** Gate. Rendered only when truthy — `""`, `0`, `null` and `undefined` render nothing. */
  when: T
  /** Receives `when` with its nullish branches removed. */
  children: (value: NonNullable<T>) => ReactNode
}

/**
 * Renders `children(value)` when `value` is truthy, and nothing when it is not.
 *
 * @remarks
 * `children` is a function rather than an element, so the check and the render
 * stay in one place: the value arrives narrowed to its non-nullish type, and
 * nothing inside it is built for the falsy branch. Pair it with
 * `when={!x}` for the negation — there is no second prop for it.
 *
 * @example
 * <RenderIf when={product.image}>{(src) => <img src={src} alt="" />}</RenderIf>
 * <RenderIf when={isOwner}>{() => <DeleteButton />}</RenderIf>
 */
export function RenderIf<T>({ when, children }: RenderIfProps<T>) {
  return when ? children(when as NonNullable<T>) : null
}
