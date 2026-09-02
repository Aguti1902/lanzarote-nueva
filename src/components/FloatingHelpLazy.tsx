"use client";

import dynamic from "next/dynamic";

const FloatingHelp = dynamic(
  () => import("@/components/FloatingHelp").then((m) => m.FloatingHelp),
  { ssr: false }
);

export function FloatingHelpLazy() {
  return <FloatingHelp />;
}
