import type { Metadata } from 'next';
import { ClosingCta } from '@/components/landing/ClosingCta';
import { BuildingBlocks } from '@/components/landing/BuildingBlocks';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { LandingNav } from '@/components/landing/LandingNav';
import { LocalFirst } from '@/components/landing/LocalFirst';
import { Practice } from '@/components/landing/Practice';
import { Think } from '@/components/landing/Think';
import { ReturningVisitorRedirect } from '@/components/landing/ReturningVisitorRedirect';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return (
    <div className="landing-root landing-dots min-h-screen bg-bg">
      {/* Returning visitors (saved projects) go to the dashboard; /?home keeps the landing.
          The pre-paint half of this lives in the root layout's <head> (returningVisitorScript). */}
      <ReturningVisitorRedirect />
      <LandingNav />
      <main>
        <Hero />
        <Think />
        <Practice />
        <Features />
        <BuildingBlocks />
        <LocalFirst />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
