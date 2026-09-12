'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Segmented } from '@/components/ui/segmented';
import { TEMPLATES } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { TemplateGrid } from './TemplateSelector';

type Tab = 'blank' | 'template';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  /** `create` shows Blank | Template tabs; `rename` shows only the name field. */
  mode: 'create' | 'rename';
  defaultName?: string;
  defaultDescription?: string;
  /** Blank create (name, description) or rename (name). */
  onSubmit: (name: string, description: string) => void;
  onUseTemplate?: (templateId: string) => void;
}

export function ProjectModal({ open, onClose, ...props }: ProjectModalProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      {/* Mounted only while open so fields reset each time. */}
      {open && <ProjectModalContent onClose={onClose} {...props} />}
    </Dialog>
  );
}

function ProjectModalContent({
  mode,
  defaultName = '',
  defaultDescription = '',
  onClose,
  onSubmit,
  onUseTemplate,
}: Omit<ProjectModalProps, 'open'>) {
  const isRename = mode === 'rename';
  const [tab, setTab] = useState<Tab>('blank');
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [templateId, setTemplateId] = useState(TEMPLATES[0]?.id ?? '');

  const template = TEMPLATES.find((t) => t.id === templateId);
  const onTemplateTab = !isRename && tab === 'template';
  const canSubmit = onTemplateTab ? !!template : name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (onTemplateTab) onUseTemplate?.(templateId);
    else onSubmit(name.trim(), description.trim());
  };

  return (
    <DialogContent
      aria-describedby={undefined}
      className={cn(onTemplateTab ? 'max-w-[560px]' : 'max-w-[440px]')}
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <DialogHeader className="items-center">
          <DialogTitle className="flex-1">{isRename ? 'Rename project' : 'New project'}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        {!isRename && (
          <Segmented
            aria-label="Start from"
            className="mx-[18px] mt-3 self-start"
            value={tab}
            onValueChange={setTab}
            options={[
              { value: 'blank', label: 'Blank' },
              { value: 'template', label: 'Template' },
            ]}
          />
        )}

        {onTemplateTab ? (
          <DialogBody className="py-3.5">
            <TemplateGrid selectedId={templateId} onSelect={setTemplateId} onActivate={(id) => onUseTemplate?.(id)} />
          </DialogBody>
        ) : (
          <DialogBody className="grid gap-3.5">
            <Field label="Name">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={isRename ? (e) => e.currentTarget.select() : undefined}
                placeholder="e.g. Payments platform"
              />
            </Field>
            {!isRename && (
              <Field label="Description" hint="optional">
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="One line about the system"
                />
              </Field>
            )}
          </DialogBody>
        )}

        <DialogFooter>
          {onTemplateTab ? (
            <>
              <span className="min-w-0 truncate text-[12px] text-ink-2">
                {template?.name} · <span className="text-ink-3">{template?.description}</span>
              </span>
              <Button type="submit" variant="primary" className="ml-auto" disabled={!canSubmit}>
                Use template
              </Button>
            </>
          ) : (
            <>
              <span className="text-[11.5px] whitespace-nowrap text-ink-3">
                <span className="font-mono">⏎</span> to {isRename ? 'rename' : 'create'}
              </span>
              <Button variant="secondary" className="ml-auto" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!canSubmit}>
                {isRename ? 'Rename' : 'Create'}
              </Button>
            </>
          )}
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
