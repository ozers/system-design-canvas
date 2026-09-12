'use client';

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { IconChip } from '@/components/ui/panel';
import { CATEGORY_ICONS, getNodesByCategory } from '@/components/nodes/node-registry';
import type { SystemNodeType } from '@/types';

const CATEGORIES = getNodesByCategory();

/** One sub-menu per library category; items are icon chip + label. */
export function AddComponentSubmenus({ onAdd }: { onAdd: (type: SystemNodeType) => void }) {
  return (
    <>
      {CATEGORIES.map(({ category, types }) => {
        const CategoryIcon = CATEGORY_ICONS[category];
        return (
          <DropdownMenuSub key={category}>
            <DropdownMenuSubTrigger>
              <CategoryIcon />
              {category}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[200px]">
              {types.map(({ type, config }) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuItem key={type} onSelect={() => onAdd(type)}>
                    <IconChip color={config.color} size={22}>
                      <Icon className="size-[13px] text-current" />
                    </IconChip>
                    {config.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      })}
    </>
  );
}
