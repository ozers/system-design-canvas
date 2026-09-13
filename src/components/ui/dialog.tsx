"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/** Scrim: bg at 55% + 2px blur. */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "animate-fade-in fixed inset-0 z-50 bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] backdrop-blur-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Centered dialog card (radius 16, elevation 2). `position="top"` pins it at 15vh
 * for command-menu style dialogs.
 */
function DialogContent({
  className,
  children,
  position = "center",
  overlayClassName,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  position?: "center" | "top"
  overlayClassName?: string
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "animate-dialog-in fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 flex-col overflow-hidden rounded-[16px] border border-line bg-paper text-ink shadow-[var(--shadow-lg)] outline-none",
          position === "center" ? "top-1/2 max-h-[calc(100dvh-2rem)] -translate-y-1/2" : "top-[15vh] max-h-[70vh]",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/** Round icon close button for dialog headers. */
function DialogCloseButton({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close asChild>
      <Button variant="icon" size="icon-sm" aria-label="Close" className={cn("text-ink-3", className)}>
        <XIcon />
      </Button>
    </DialogPrimitive.Close>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex items-start gap-2.5 px-[18px] pt-4", className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 overflow-y-auto px-[18px] py-4", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex items-center gap-1.5 border-t border-line-2 px-[18px] pt-3 pb-4", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[16px] leading-6 font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("mt-0.5 text-[12.5px] text-ink-2", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
