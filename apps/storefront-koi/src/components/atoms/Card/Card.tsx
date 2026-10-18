import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Card as CardPrimitive,
} from "@/components/ui/card"

import { RAISED, RING } from "@/const/surface"

/* koi card: the button's material spread over a panel — standoff shadow,
   hairline top highlight, inset edge — so panels and controls read as one kit.
   Structure (header/title/content/footer) is the shadcn card's, unchanged. */

const cardVariants = cva("", {
  variants: {
    variant: {
      /* `elevated` is the koi surface; `flat` is the plain shadcn card, for
         panels that are already inside an elevated container. */
      elevated: `${RAISED} ${RING}`,
      flat: "",
    },
  },
  defaultVariants: { variant: "elevated" },
})

function Card({
  className,
  variant,
  ...props
}: ComponentProps<typeof CardPrimitive> & VariantProps<typeof cardVariants>) {
  return (
    <CardPrimitive
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
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
