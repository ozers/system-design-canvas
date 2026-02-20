'use client';

import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/useProjectStore';
import { TEMPLATES } from '@/lib/templates';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutTemplate } from 'lucide-react';

export function TemplateSelector() {
  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const saveProject = useProjectStore((s) => s.saveProject);

  const handleSelectTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const project = createProject(template.name, template.description);
    saveProject({
      ...project,
      nodes: template.nodes,
      edges: template.edges,
    });
    router.push(`/canvas/${project.id}`);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <LayoutTemplate className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold text-lg">Start from a Template</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => handleSelectTemplate(template.id)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm">{template.name}</CardTitle>
              <CardDescription className="text-xs">{template.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
