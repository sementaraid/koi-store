/* The shared kit: the primitives both frontends draw with, so the storefront
   and the back office stay one design system instead of two that drift.
   Exported from source — Next transpiles it (`transpilePackages`), so there is
   no build step and no dist to keep in sync. */

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './primitives/accordion';
export { Alert, alertVariants, type AlertProps } from './primitives/alert';
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
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './primitives/dialog';
export { FormField, type FormFieldProps } from './FormField';
export { Input } from './Input';
export { Label } from './primitives/label';
export { RenderIf, type RenderIfProps } from './RenderIf';
export { Skeleton } from './primitives/skeleton';
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableProps
} from './Table';
export { Textarea } from './Textarea';
