import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Floating card for library, editors, validation: radius 14, line border, elevation 2. */
function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "rounded-[14px] border border-line bg-paper text-ink shadow-[var(--shadow-lg)]",
        className
      )}
      {...props}
    />
  )
}

/** Panel header: icon chip + title/subtitle + close button. */
function PanelHeader({
  icon,
  title,
  subtitle,
  onClose,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  onClose?: () => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2.5 border-b border-line-2 px-3.5 pt-3.5 pb-3", className)}>
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] leading-[18px] font-semibold">{title}</div>
        {subtitle && <div className="truncate text-[11.5px] leading-[14px] text-ink-3">{subtitle}</div>}
      </div>
      {onClose && (
        <Button variant="icon" size="icon-sm" onClick={onClose} aria-label="Close" className="text-ink-3">
          <X />
        </Button>
      )}
    </div>
  )
}

function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid min-h-0 flex-1 content-start gap-[18px] overflow-y-auto p-3.5", className)}
      {...props}
    />
  )
}

function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-1.5 border-t border-line-2 px-3.5 py-2.5", className)}
      {...props}
    />
  )
}

/** Square tinted chip holding a component icon. */
function IconChip({
  color,
  size = 32,
  className,
  children,
}: {
  color: string
  size?: 22 | 24 | 28 | 32
  className?: string
  children: React.ReactNode
}) {
  const radius = size >= 32 ? 9 : size >= 28 ? 8 : 6
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      {children}
    </span>
  )
}

export { Panel, PanelHeader, PanelBody, PanelFooter, IconChip }
