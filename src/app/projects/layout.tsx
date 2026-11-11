import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Your system designs, saved in this browser. Start from a template or import a docker-compose file.',
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
