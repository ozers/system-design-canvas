"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-[12px] leading-4 font-medium text-ink-2 select-none peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/** Labeled form field: 12px label above the control, 6px gap. */
function Field({
  label,
  hint,
  className,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-[12px] leading-4 font-medium text-ink-2">
        {label}
        {hint && <span className="ml-1 font-normal text-ink-3">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export { Label, Field }
