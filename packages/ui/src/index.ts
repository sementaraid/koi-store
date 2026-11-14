/* The shared kit: the primitives both frontends draw with, so the storefront
   and the back office stay one design system instead of two that drift.
   Exported from source — Next transpiles it (`transpilePackages`), so there is
   no build step and no dist to keep in sync. */

export { Badge, badgeVariants } from './Badge';
export { Button, buttonVariants } from './Button';
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from './Card';
export { FormField, type FormFieldProps } from './FormField';
export { Input } from './Input';
export { Label } from './primitives/label';
export { RenderIf, type RenderIfProps } from './RenderIf';
