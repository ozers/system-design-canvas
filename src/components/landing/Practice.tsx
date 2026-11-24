'use client';

import { useRouter } from 'next/navigation';
import { BriefCard } from '@/components/project/PracticeStrip';
import { openBrief } from '@/components/project/project-io';
import { BRIEFS } from '@/lib/briefs';
import { DASHBOARD_PATH, canvasPath } from '@/lib/routes';
import { SectionHeading } from './SectionHeading';

/** The practice briefs; picking one opens its project (the one in progress, or a new empty one). */
export function Practice() {
  const router = useRouter();

  const start = (briefId: string) => {
    const project = openBrief(briefId);
    router.push(project ? canvasPath(project.id) : DASHBOARD_PATH);
  };

  return (
    <section id="practice" className="landing-dots scroll-mt-14 border-y border-line bg-paper">
      <div className="mx-auto max-w-[1128px] px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="Practice" title={`${BRIEFS.length} problems, an empty canvas and a checklist.`}>
          For the week before a system design interview, or for the fun of it. Each brief gives the requirements and the
          numbers to design for; a checklist follows along as you draw, with hints and a reference design when you are
          stuck.
        </SectionHeading>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BRIEFS.map((brief) => (
            <BriefCard key={brief.id} brief={brief} onSelect={start} className="bg-bg p-4" />
          ))}
        </div>
        <p className="mt-6 text-[12.5px] text-ink-3">
          The checklist looks at which components are there and how they connect. It is a guide, not a grade: a good
          design can do it another way.
        </p>
      </div>
    </section>
  );
}
