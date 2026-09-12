import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full min-w-0 text-ink outline-none transition-[border-color,box-shadow,background-color] duration-[120ms] placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Bordered form field. */
        field:
          "h-9 rounded-[9px] border border-line bg-paper px-3 text-[13.5px] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]",
        /** Pill search on paper. */
        pill:
          "h-9 rounded-full border border-line bg-paper px-3 text-[13px] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]",
        /** Filled, borderless — inside panels. */
        inset:
          "h-8 rounded-[9px] border-0 bg-line-2 px-3 text-[13px] focus:shadow-[0_0_0_2px_var(--accent-soft)]",
      },
    },
    defaultVariants: { variant: "field" },
  }
)

type InputProps = React.ComponentProps<"input"> & VariantProps<typeof inputVariants>

function Input({ className, variant, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 resize-y rounded-[9px] border border-line bg-paper px-3 py-[9px] text-[13.5px] leading-[1.45] text-ink outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-ink-3 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]",
        className
      )}
      {...props}
    />
  )
}

type SearchInputProps = Omit<InputProps, "variant"> & {
  variant?: "pill" | "inset"
  containerClassName?: string
}

/** Search field with a leading magnifier icon. */
function SearchInput({ className, containerClassName, variant = "pill", ...props }: SearchInputProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-[13px] -translate-y-1/2 text-ink-3" />
      <Input type="search" variant={variant} className={cn("pl-8 [&::-webkit-search-cancel-button]:hidden", className)} {...props} />
    </div>
  )
}

export { Input, Textarea, SearchInput, inputVariants }
