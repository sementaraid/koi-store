/* The tier barrel, as `apps/storefront` keeps one per component tier. Atoms are
   the leaves: no component inside this tier imports another, so a barrel here
   costs nothing and lets a caller name the tier instead of the file.

   The primitives shared with the back office now live in `@koi/ui`; re-exporting
   them here keeps callers that name the whole tier (`@/components/atoms`) working
   without a second import line. */

export {
  Badge,
  badgeVariants,
  Button,
  buttonVariants,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  RenderIf,
} from '@koi/ui';
export { Eyebrow } from './Eyebrow/Eyebrow';
export { FeedGrid } from './FeedGrid/FeedGrid';
export { Link } from './Link/Link';
export { LotLayout } from './LotLayout/LotLayout';
export { PulseIcon } from './PulseIcon/PulseIcon';
export { Stars, StarsInput } from './Stars/Stars';
