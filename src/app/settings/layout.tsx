import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
