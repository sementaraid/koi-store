import type { ComponentProps } from "react"
import { cn } from "cn"

import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Card as CardPrimitive,
} from "./primitives/card"

/* koi card (design `.card`): 20 px radius, a soft `#ececf2` edge and a light
   lift. `variant` is kept so existing callers still compile; both values
   render the same card. */
function Card({
  className,
  variant: _variant,
  ...props
}: ComponentProps<typeof CardPrimitive> & { variant?: "elevated" | "flat" }) {
  return <CardPrimitive className={cn(className)} {...props} />
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
