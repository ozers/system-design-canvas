import * as React from "react"

import { cn, isMac } from "@/lib/utils"

/** Display ⌘/⌥ as Ctrl/Alt off Apple platforms. */
export function formatKey(key: string) {
  if (isMac()) return key
  if (key === "⌘") return "Ctrl"
  if (key === "⌥") return "Alt"
  return key
}

/** Keycap with a heavier bottom border. `bare` renders plain mono text. */
function Kbd({
  className,
  bare = false,
  children,
  ...props
}: React.ComponentProps<"kbd"> & { bare?: boolean }) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "font-mono whitespace-nowrap",
        bare
          ? "text-[11px] text-ink-3"
          : "inline-flex h-[22px] min-w-5 items-center justify-center rounded-[6px] border border-b-2 border-line bg-paper px-1.5 text-[11.5px] text-ink-2",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? formatKey(children) : children}
    </kbd>
  )
}

/** A shortcut as a row of keycaps (or one bare string when `bare`). */
function KbdCombo({ keys, bare = false, className }: { keys: string[]; bare?: boolean; className?: string }) {
  if (bare) {
    return (
      <Kbd bare className={className}>
        {keys.map(formatKey).join(keys.some((k) => k.length > 1) ? " " : "")}
      </Kbd>
    )
  }
  return (
    <span className={cn("inline-flex gap-[3px]", className)}>
      {keys.map((key, i) => (
        <Kbd key={`${key}-${i}`}>{key}</Kbd>
      ))}
    </span>
  )
}

export { Kbd, KbdCombo }
