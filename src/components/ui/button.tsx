import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium outline-none select-none transition-[background-color,border-color,color,box-shadow,filter,opacity] duration-[120ms] ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        /** Accent fill. One per view. */
        primary: "bg-accent text-accent-ink shadow-[var(--shadow)] hover:brightness-[1.06]",
        secondary: "border border-line bg-paper text-ink hover:border-ink-3 focus-visible:border-accent",
        ghost: "bg-transparent text-ink-2 hover:bg-line-2 hover:text-ink",
        /** Ink fill — only for the primary action inside the floating toolbar. */
        toolbar: "bg-ink text-paper hover:opacity-90",
        /** Text-only destructive action. */
        danger: "bg-transparent text-danger hover:bg-[color-mix(in_oklch,var(--danger)_10%,transparent)]",
        /** Filled destructive confirm. */
        "danger-solid": "bg-danger text-white hover:brightness-[1.05]",
        /** Round 32×32 ghost icon button. */
        icon: "bg-transparent text-ink-2 hover:bg-line-2 hover:text-ink",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-3.5 text-[13.5px]",
        toolbar: "h-[34px] px-3 text-[13px]",
        icon: "size-8 p-0",
        "icon-sm": "size-7 p-0",
        "icon-toolbar": "size-[34px] p-0 [&_svg:not([class*='size-'])]:size-[15px]",
      },
    },
    compoundVariants: [
      { variant: "primary", size: "sm", className: "px-3.5" },
      { variant: "primary", size: "md", className: "px-4" },
      { variant: "toolbar", size: "toolbar", className: "px-3.5" },
    ],
    defaultVariants: {
      variant: "secondary",
      size: "sm",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, type = "button", ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  const resolvedSize = size ?? (variant === "icon" ? "icon" : undefined)

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size: resolvedSize, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
