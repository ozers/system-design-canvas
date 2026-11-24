'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openTemplateFromLanding } from '@/components/project/project-io';
import { DASHBOARD_PATH, canvasPath } from '@/lib/routes';

/** The landing's one primary action: open a canvas with the given template on it. */
export function OpenCanvasButton({ templateId = 'microservices' }: { templateId?: string }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const open = () => {
    if (opening) return;
    setOpening(true);
    const project = openTemplateFromLanding(templateId);
    router.push(project ? canvasPath(project.id) : DASHBOARD_PATH);
  };

  return (
    <Button variant="primary" size="md" className="h-10 px-5 text-[14px]" onClick={open} disabled={opening}>
      Open the canvas
      <ArrowRight className="size-4" />
    </Button>
  );
}
