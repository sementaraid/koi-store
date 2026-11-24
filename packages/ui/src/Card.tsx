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

/* koi card: flat, 1 px border, no shadow, no gloss. `variant` is kept so
   existing callers still compile; both values render the same flat card. */
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
