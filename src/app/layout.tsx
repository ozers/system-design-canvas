import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://system-design-canvas-one.vercel.app";
const title = "System Design Canvas — Visual System Architecture Tool";
const description =
  "Free, open-source tool for designing system architectures visually. " +
  "Drag-and-drop services, databases, queues, caches, and more. " +
  "9 templates, dark mode, export to PNG/SVG/Mermaid. No sign-up, runs 100% in the browser.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | System Design Canvas",
  },
  description,
  keywords: [
    "system design",
    "system architecture",
    "architecture diagram",
    "system design tool",
    "microservices diagram",
    "software architecture",
    "infrastructure diagram",
    "react flow",
    "open source",
    "visual design tool",
    "system design interview",
    "architecture canvas",
  ],
  authors: [{ name: "ozers", url: siteUrl }],
  creator: "ozers",
  openGraph: {
    type: "website",
    title,
    description,
    url: siteUrl,
    siteName: "System Design Canvas",
    images: [
      {
        url: `${siteUrl}/screenshots/canvas-light.png`,
        width: 2880,
        height: 1800,
        alt: "System Design Canvas — Serverless Fullstack architecture diagram",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/screenshots/canvas-light.png`],
  },
  metadataBase: new URL(siteUrl),
  robots: {
    index: true,
    follow: true,
  },
};

// Resolve the theme before first paint so there is no flash.
// Reads the persisted settings (sdc.settings), falling back to the legacy key.
const themeScript = `
(function() {
  try {
    var pref = 'system';
    var raw = localStorage.getItem('sdc.settings');
    if (raw) {
      var s = JSON.parse(raw);
      if (s && s.state && s.state.theme) pref = s.state.theme;
    } else {
      var legacy = localStorage.getItem('system-design-canvas-theme');
      if (legacy === 'dark' || legacy === 'light') pref = legacy;
    }
    var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
