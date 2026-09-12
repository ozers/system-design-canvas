'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Canvas } from '@/components/canvas/Canvas';
import { Button } from '@/components/ui/button';

function CanvasRoute() {
  const id = useSearchParams().get('id');

  if (!id) {
    return (
      <div className="dot-grid flex min-h-screen items-center justify-center p-6">
        <div className="grid max-w-[300px] justify-items-center gap-2 text-center">
          <div className="text-[15px] font-semibold">No project selected</div>
          <p className="text-[12.5px] text-ink-2">Open a project from the dashboard.</p>
          <Button variant="secondary" asChild className="mt-1.5">
            <Link href="/">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Keyed so switching projects remounts the canvas with fresh state.
  return <Canvas key={id} projectId={id} />;
}

export default function CanvasPage() {
  return (
    <Suspense fallback={null}>
      <CanvasRoute />
    </Suspense>
  );
}
