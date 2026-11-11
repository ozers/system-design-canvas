import type { Metadata } from 'next';
import { BuildingBlocks } from '@/components/landing/BuildingBlocks';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { LandingNav } from '@/components/landing/LandingNav';
import { LocalFirst } from '@/components/landing/LocalFirst';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <LandingNav />
      <main>
        <Hero />
        <BuildingBlocks />
        <Features />
        <LocalFirst />
      </main>
      <Footer />
    </div>
  );
}
