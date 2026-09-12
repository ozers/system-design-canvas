'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { EDGE_REGISTRY } from './edge-registry';
import { SYSTEM_EDGE_TYPES, type SystemEdgeType } from '@/types';
import { cn } from '@/lib/utils';

/** 2px line in the protocol's color; dashed when the edge is dashed. */
export function ProtocolSwatch({
  type,
  width = 18,
  className,
}: {
  type: SystemEdgeType;
  width?: number;
  className?: string;
}) {
  const config = EDGE_REGISTRY[type] ?? EDGE_REGISTRY.rest;
  return (
    <span
      aria-hidden
      className={cn('inline-block h-0 shrink-0', className)}
      style={{
        width,
        borderTop: `2px ${config.strokeDasharray ? 'dashed' : 'solid'} ${config.color}`,
      }}
    />
  );
}

const ITEM_CLASS =
  'flex h-8 w-full items-center gap-2.5 rounded-[9px] px-[9px] text-left text-[13px] text-ink outline-none transition-colors duration-[120ms] hover:bg-line-2 focus-visible:bg-line-2 [&_svg]:shrink-0';

/** Arrow keys / Home / End move focus between menu items. */
function moveFocus(e: React.KeyboardEvent<HTMLDivElement>) {
  const { key } = e;
  if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-menu-item]'));
  if (items.length === 0) return;
  e.preventDefault();
  e.stopPropagation();
  const current = items.indexOf(document.activeElement as HTMLElement);
  const last = items.length - 1;
  const next =
    key === 'Home'
      ? 0
      : key === 'End'
        ? last
        : key === 'ArrowDown'
          ? (current + 1) % items.length
          : current <= 0
            ? last
            : current - 1;
  items[next].focus();
}

type ProtocolMenuProps = Omit<React.ComponentProps<'div'>, 'onSelect' | 'title'> & {
  title?: string;
  value?: SystemEdgeType;
  onSelect: (type: SystemEdgeType) => void;
};

/** Menu listing the 9 protocols with the current one checked. Extra items go in children. */
export function ProtocolMenu({
  title = 'Protocol',
  value,
  onSelect,
  className,
  children,
  onKeyDown,
  ...props
}: ProtocolMenuProps) {
  return (
    <div
      role="menu"
      aria-label={title}
      className={cn(
        'grid w-[200px] gap-px rounded-[12px] border border-line bg-paper p-[5px] text-[13px] text-ink shadow-[var(--shadow-lg)]',
        className
      )}
      onKeyDown={(e) => {
        moveFocus(e);
        onKeyDown?.(e);
      }}
      {...props}
    >
      <div className="px-[9px] pt-1.5 pb-1 text-[11px] leading-4 font-medium text-ink-3">{title}</div>
      {SYSTEM_EDGE_TYPES.map((type) => {
        const checked = type === value;
        return (
          <button
            key={type}
            type="button"
            role="menuitemradio"
            aria-checked={checked}
            data-menu-item
            onClick={() => onSelect(type)}
            className={cn(ITEM_CLASS, checked && 'bg-line-2')}
          >
            <ProtocolSwatch type={type} />
            <span className="flex-1 truncate">{EDGE_REGISTRY[type].label}</span>
            {checked && <Check className="size-3.5 text-accent" />}
          </button>
        );
      })}
      {children}
    </div>
  );
}

export function ProtocolMenuItem({
  icon,
  danger = false,
  onClick,
  children,
}: {
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      data-menu-item
      onClick={onClick}
      className={cn(
        ITEM_CLASS,
        '[&_svg]:size-3.5',
        danger
          ? 'text-danger hover:bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] focus-visible:bg-[color-mix(in_oklch,var(--danger)_10%,transparent)]'
          : '[&_svg]:text-ink-2'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function ProtocolMenuSeparator() {
  return <div role="separator" className="mx-1 my-[3px] h-px bg-line-2" />;
}
