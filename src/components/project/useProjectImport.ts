'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { plural } from '@/lib/utils';
import { toast } from '@/stores/useToastStore';
import type { Project } from '@/types';
import { importFile, pickFile } from './project-io';

import { canvasPath } from '@/lib/routes';
/** Dashboard import: picker menus + dropped files. A single import opens the new project. */
export function useProjectImport() {
  const router = useRouter();

  const handleFiles = useCallback(
    async (files: File[]) => {
      const imported: Project[] = [];
      for (const file of files) imported.push(...(await importFile(file)));
      if (imported.length === 1) {
        router.push(canvasPath(imported[0].id));
      } else if (imported.length > 1) {
        toast({ message: `Imported ${plural(imported.length, 'project')}`, tone: 'ok' });
      }
    },
    [router]
  );

  const importJson = useCallback(async () => {
    const file = await pickFile('.json,application/json');
    if (file) handleFiles([file]);
  }, [handleFiles]);

  const importDockerCompose = useCallback(async () => {
    const file = await pickFile('.yml,.yaml');
    if (file) handleFiles([file]);
  }, [handleFiles]);

  return { handleFiles, importJson, importDockerCompose };
}
