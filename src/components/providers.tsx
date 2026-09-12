'use client';

import { useEffect } from 'react';
import { hydrateSettings } from '@/stores/useSettingsStore';
import { useApplyTheme } from '@/hooks/useTheme';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateSettings();
  }, []);
  useApplyTheme();

  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
