'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Boxes, Download, Github, Trash2, Upload } from 'lucide-react';
import packageJson from '../../../package.json';
import { Header } from '@/components/layout/Header';
import { ConfirmDialog } from '@/components/project/ConfirmDialog';
import { exportAllProjectsFile, importFile, pickFile } from '@/components/project/project-io';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { getStorageSize } from '@/lib/storage';
import { cn, formatBytes, plural } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSettingsStore, type ThemePreference } from '@/stores/useSettingsStore';
import { toast } from '@/stores/useToastStore';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'data', label: 'Data' },
  { id: 'about', label: 'About' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsPage() {
  const { preference, setPreference } = useTheme();
  const snap = useSettingsStore((s) => s.snap);
  const minimap = useSettingsStore((s) => s.minimap);
  const validation = useSettingsStore((s) => s.validation);
  const animatedEdges = useSettingsStore((s) => s.animatedEdges);
  const setSnap = useSettingsStore((s) => s.setSnap);
  const setMinimap = useSettingsStore((s) => s.setMinimap);
  const setValidation = useSettingsStore((s) => s.setValidation);
  const setAnimatedEdges = useSettingsStore((s) => s.setAnimatedEdges);

  const projects = useProjectStore((s) => s.projects);
  const loaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const clearAllProjects = useProjectStore((s) => s.clearAllProjects);

  const [active, setActive] = useState<SectionId>('appearance');
  const [confirmClear, setConfirmClear] = useState(false);
  const lockUntil = useRef(0);

  useEffect(() => {
    if (!loaded) loadProjects();
  }, [loaded, loadProjects]);

  // Highlight the section nearest the top while scrolling.
  useEffect(() => {
    const onScroll = () => {
      if (performance.now() < lockUntil.current) return;
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
        setActive(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      let current: SectionId = SECTIONS[0].id;
      for (const section of SECTIONS) {
        const el = document.getElementById(`s-${section.id}`);
        if (el && el.getBoundingClientRect().top <= 120) current = section.id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // `eventTime` is the click's timeStamp (same clock as performance.now()).
  const goTo = (id: SectionId, eventTime: number) => {
    setActive(id);
    lockUntil.current = eventTime + 800;
    document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const storageBytes = loaded ? getStorageSize() : 0;

  const handleExportAll = () => {
    const filename = exportAllProjectsFile(useProjectStore.getState().projects);
    toast({ message: `Exported ${filename}`, tone: 'ok' });
  };

  const handleImport = async () => {
    const file = await pickFile('.json,application/json');
    if (!file) return;
    const imported = await importFile(file);
    if (imported.length > 0) {
      toast({ message: `Imported ${plural(imported.length, 'project')}`, tone: 'ok' });
    }
  };

  const handleClear = () => {
    clearAllProjects();
    setConfirmClear(false);
    toast({ message: 'All projects cleared', icon: Trash2 });
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header containerClassName="max-w-[880px]" />
      <main className="mx-auto grid w-full max-w-[880px] gap-6 px-6 pt-8 pb-18 md:grid-cols-[180px_minmax(0,1fr)] md:gap-10">
        <nav
          aria-label="Settings sections"
          className="-mx-1 flex gap-0.5 self-start overflow-x-auto px-1 md:sticky md:top-20 md:mx-0 md:flex-col md:overflow-visible md:px-0"
        >
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#s-${section.id}`}
              aria-current={active === section.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                goTo(section.id, e.timeStamp);
              }}
              className={cn(
                'focus-ring rounded-[8px] px-2.5 py-[7px] text-[13.5px] whitespace-nowrap transition-colors duration-[120ms]',
                active === section.id
                  ? 'bg-line-2 font-medium text-ink'
                  : 'text-ink-2 hover:bg-line-2 hover:text-ink'
              )}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="grid max-w-[640px] min-w-0 gap-8">
          <div className="grid gap-2">
            <Link
              href="/"
              className="focus-ring -ml-1 inline-flex w-fit items-center gap-1 rounded-full px-1 text-[13px] text-ink-2 transition-colors duration-[120ms] hover:text-ink"
            >
              <ArrowLeft className="size-3.5" />
              Projects
            </Link>
            <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.02em]">Settings</h1>
          </div>

          <Section id="appearance" title="Appearance">
            <Row title="Theme" description="Follows your system by default.">
              <Segmented aria-label="Theme" value={preference} onValueChange={setPreference} options={THEME_OPTIONS} />
            </Row>
          </Section>

          <Section id="canvas" title="Canvas">
            <Row title="Snap to grid" description="20px dot grid.">
              <Switch aria-label="Snap to grid" checked={snap} onCheckedChange={setSnap} />
            </Row>
            <Row title="Show minimap">
              <Switch aria-label="Show minimap" checked={minimap} onCheckedChange={setMinimap} />
            </Row>
            <Row title="Validation checks" description="Flags disconnected components and missing tech.">
              <Switch aria-label="Validation checks" checked={validation} onCheckedChange={setValidation} />
            </Row>
            <Row title="Animated edges" description="Flow animation on async connections.">
              <Switch aria-label="Animated edges" checked={animatedEdges} onCheckedChange={setAnimatedEdges} />
            </Row>
          </Section>

          <Section id="data" title="Data">
            <Row
              title="Storage"
              description={
                loaded ? `${plural(projects.length, 'project')} · ${formatBytes(storageBytes)} in this browser` : '—'
              }
            >
              <span className="inline-flex items-center gap-[5px] text-[12px] text-ink-3">
                <span className="size-1.5 rounded-full bg-ok" />
                Local
              </span>
            </Row>
            <Row title="Export all projects" description="A single JSON file you can re-import.">
              <Button variant="secondary" onClick={handleExportAll} disabled={!loaded || projects.length === 0}>
                <Download />
                Export
              </Button>
            </Row>
            <Row title="Import" description="Restore from an exported file, or add a single project.">
              <Button variant="secondary" onClick={handleImport}>
                <Upload />
                Import
              </Button>
            </Row>
            <Row title="Clear all data" description="Removes every project from this browser.">
              <Button variant="danger" onClick={() => setConfirmClear(true)} disabled={!loaded || projects.length === 0}>
                <Trash2 />
                Clear
              </Button>
            </Row>
          </Section>

          <Section id="about" title="About">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <span className="inline-flex size-8 items-center justify-center rounded-[9px] bg-accent text-accent-ink">
                <Boxes className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium">
                  System Design Canvas
                  <span className="ml-1.5 font-mono text-[11.5px] font-normal text-ink-3">v{packageJson.version}</span>
                </div>
                <div className="text-[12.5px] text-ink-3">Open source · MIT</div>
              </div>
              <Button variant="secondary" asChild className="ml-auto">
                <a href="https://github.com/ozers/system-design-canvas" target="_blank" rel="noreferrer">
                  <Github />
                  GitHub
                </a>
              </Button>
            </div>
          </Section>
        </div>
      </main>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all data?"
        description={`${plural(projects.length, 'project')} will be removed from this browser. This can't be undone — export them first if you might need them.`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="danger-solid" onClick={handleClear}>
              Clear all data
            </Button>
          </>
        }
      />
    </div>
  );
}

function Section({ id, title, children }: { id: SectionId; title: string; children: React.ReactNode }) {
  return (
    <section id={`s-${id}`} aria-labelledby={`s-${id}-title`} className="grid scroll-mt-6 gap-2.5">
      <h2 id={`s-${id}-title`} className="text-[13px] font-medium text-ink-2">
        {title}
      </h2>
      <div className="overflow-hidden rounded-[14px] border border-line bg-paper">{children}</div>
    </section>
  );
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-2 px-4 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium">{title}</div>
        {description && <div className="text-[12.5px] text-ink-3">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
