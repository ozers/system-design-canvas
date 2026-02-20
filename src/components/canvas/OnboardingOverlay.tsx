'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Cable, MousePointerClick, Undo2 } from 'lucide-react';

const STORAGE_KEY = 'sdc-onboarding-seen';

const tips = [
  { icon: GripVertical, text: 'Drag components from the left panel' },
  { icon: Cable, text: 'Connect nodes by dragging from handles' },
  { icon: MousePointerClick, text: 'Click a node to edit its details' },
  { icon: Undo2, text: 'Use Ctrl+Z to undo' },
];

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-80 rounded-lg border border-border bg-card p-5 shadow-xl">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Tips</h3>
        <ul className="space-y-2.5">
          {tips.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              {text}
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full" size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
