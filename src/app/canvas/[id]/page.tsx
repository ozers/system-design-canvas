'use client';

import { use } from 'react';
import { Canvas } from '@/components/canvas/Canvas';

export default function CanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Canvas projectId={id} />;
}
