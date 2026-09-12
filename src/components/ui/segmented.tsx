"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
}

/** Pill tab switcher: line-2 track, active segment on paper. */
function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedOption<T>[]
  size?: "sm" | "md"
  className?: string
  "aria-label"?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex shrink-0 gap-0.5 rounded-full bg-line-2 p-[3px]", className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "rounded-full font-medium whitespace-nowrap outline-none transition-[background-color,color,box-shadow] duration-[120ms] focus-visible:shadow-[0_0_0_2px_var(--accent-soft)]",
              size === "md" ? "h-7 px-3.5 text-[12.5px]" : "h-[26px] px-[11px] text-[12px]",
              active ? "bg-paper text-ink shadow-[var(--shadow)]" : "text-ink-2 hover:text-ink"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { Segmented, type SegmentedOption }
