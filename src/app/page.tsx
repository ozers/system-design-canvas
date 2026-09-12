'use client';

import { Header } from '@/components/layout/Header';
import { ImportDropZone } from '@/components/project/ImportDropZone';
import { ProjectList } from '@/components/project/ProjectList';
import { useProjectImport } from '@/components/project/useProjectImport';

export default function DashboardPage() {
  const { handleFiles, importJson, importDockerCompose } = useProjectImport();

  return (
    <div className="min-h-screen bg-bg">
      <Header onImportJson={importJson} onImportDockerCompose={importDockerCompose} />
      <main className="mx-auto w-full max-w-[1128px] px-6 pt-10 pb-20">
        <ProjectList />
      </main>
      <ImportDropZone onFiles={handleFiles} />
    </div>
  );
}
