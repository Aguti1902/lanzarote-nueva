"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const FloatingHelp = dynamic(
  () => import("@/components/FloatingHelp").then((m) => m.FloatingHelp),
  { ssr: false }
);

/** Carga el chat solo tras idle o primera interacción (no bloquea el primer pintado). */
export function FloatingHelpLazy() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const enable = () => {
      if (done) return;
      done = true;
      setReady(true);
      cleanup();
    };

    const onInteract = () => enable();
    const cleanup = () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
    };

    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("scroll", onInteract, { once: true, passive: true });

    const ric = window.requestIdleCallback?.(enable, { timeout: 4000 });
    const t = window.setTimeout(enable, 4500);

    return () => {
      cleanup();
      if (ric != null) window.cancelIdleCallback?.(ric);
      window.clearTimeout(t);
    };
  }, []);

  if (!ready) return null;
  return <FloatingHelp />;
}
