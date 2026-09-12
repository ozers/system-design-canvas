import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/** Mono tech tag, filled line-2. Shows a remove × when onRemove is set. */
function Tag({
  className,
  children,
  onRemove,
  ...props
}: React.ComponentProps<"span"> & { onRemove?: () => void }) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-line-2 px-[9px] font-mono text-[11.5px] text-ink-2",
        onRemove && "pr-1",
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === "string" ? children : "tag"}`}
          className="inline-flex size-4 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-line hover:text-ink focus-visible:shadow-[0_0_0_2px_var(--accent-soft)] focus-visible:outline-none"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

/** Dashed "+ label" suggestion chip. */
function SuggestionTag({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="suggestion-tag"
      className={cn(
        "inline-flex h-[22px] items-center rounded-full border border-dashed border-line px-[9px] text-[11.5px] text-ink-3 transition-colors duration-[120ms] hover:border-ink-3 hover:text-ink focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] focus-visible:outline-none",
        className
      )}
      {...props}
    >
      + {children}
    </button>
  )
}

export { Tag, SuggestionTag }
