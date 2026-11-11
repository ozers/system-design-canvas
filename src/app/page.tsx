import type { Metadata } from 'next';
import { ClosingCta } from '@/components/landing/ClosingCta';
import { BuildingBlocks } from '@/components/landing/BuildingBlocks';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { LandingNav } from '@/components/landing/LandingNav';
import { LocalFirst } from '@/components/landing/LocalFirst';
import { ReturningVisitorRedirect } from '@/components/landing/ReturningVisitorRedirect';
import { returningVisitorScript } from '@/components/landing/returning-visitor';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return (
    <div className="landing-root min-h-screen bg-bg">
      {/* Returning visitors (saved projects) go to the dashboard; /?home keeps the landing. */}
      <script dangerouslySetInnerHTML={{ __html: returningVisitorScript }} />
      <ReturningVisitorRedirect />
      <LandingNav />
      <main>
        <Hero />
        <BuildingBlocks />
        <Features />
        <LocalFirst />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
