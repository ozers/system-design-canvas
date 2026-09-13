"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** 36×22 toggle: line when off, accent when on. */
function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "onChange"> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-[22px] w-9 shrink-0 rounded-full p-0 outline-none transition-colors duration-[120ms] focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-50",
        checked ? "bg-accent" : "bg-line",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-paper shadow-[var(--shadow)] transition-transform duration-[120ms]",
          checked && "translate-x-3.5"
        )}
      />
    </button>
  )
}

export { Switch }
