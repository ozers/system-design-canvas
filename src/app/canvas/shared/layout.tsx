import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared design",
  description: "Open a system design someone shared with you and save your own copy.",
};

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
