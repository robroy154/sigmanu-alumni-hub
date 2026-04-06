"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-sn-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sn-black active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary: gold fill — use for primary CTAs
        default:
          "bg-sn-gold text-sn-black hover:bg-sn-gold-light transition-colors",
        // Secondary: gold border — use for secondary actions
        outline:
          "border-sn-gold text-sn-gold bg-transparent hover:bg-sn-gold/10 transition-colors",
        // Secondary alias
        secondary:
          "border-sn-gold text-sn-gold bg-transparent hover:bg-sn-gold/10 transition-colors",
        // Ghost: no border, no bg — use for tertiary/low-emphasis actions
        ghost:
          "text-sn-gray-light hover:underline border-transparent bg-transparent",
        // Destructive: red border — use for delete/cancel
        destructive:
          "border border-red-800 text-red-400 bg-transparent hover:border-red-600 hover:text-red-300 transition-colors",
        link: "text-sn-gold underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
