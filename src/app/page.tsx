'use client';

import { Header } from '@/components/layout/Header';
import { ProjectList } from '@/components/project/ProjectList';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <ProjectList />
      </main>
    </div>
  );
}
