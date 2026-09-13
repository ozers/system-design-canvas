import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Translucent chip background from a component color: color-mix(color pct%, transparent). */
export function tint(color: string, pct = 12) {
  return `color-mix(in oklch, ${color} ${pct}%, transparent)`
}

/** Edge stroke: registry color mixed toward ink-3 by the theme's --edge-mix. */
export function edgeStroke(color: string) {
  return `color-mix(in oklch, ${color} var(--edge-mix), var(--ink-3))`
}

/** True on Apple platforms, where shortcuts use ⌘ instead of Ctrl. */
export function isMac() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

/** Human-readable byte size: 812 B, 3.2 KB, 1.4 MB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "3 components", "1 connection" */
export function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

/** Trigger a browser download for a Blob or data URL. */
export function downloadFile(filename: string, data: Blob | string) {
  const url = typeof data === "string" ? data : URL.createObjectURL(data)
  const link = document.createElement("a")
  link.download = filename
  link.href = url
  link.click()
  if (typeof data !== "string") URL.revokeObjectURL(url)
}

/** "just now", "5m ago", "2h ago", "yesterday", "3d ago", then a short date. */
export function formatRelative(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: days > 300 ? "numeric" : undefined,
  })
}
