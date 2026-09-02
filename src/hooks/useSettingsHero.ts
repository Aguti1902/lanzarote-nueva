"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/types";

type HeroKey =
  | "contact"
  | "excursions"
  | "about"
  | "home"
  | "transfer"
  | "cruise"
  | "blog"
  | "houses";

const FALLBACKS: Record<
  HeroKey,
  { image: keyof SiteSettings | string; position: keyof SiteSettings | string; imageFallback: string; positionFallback: string }
> = {
  contact: {
    image: "contactHeroImage",
    position: "contactHeroPosition",
    imageFallback: "/images/home/amigas-volcan.jpg",
    positionFallback: "45% 35%",
  },
  excursions: {
    image: "excursionsHeroImage",
    position: "excursionsHeroPosition",
    imageFallback: "/images/heroes/excursions.jpg",
    positionFallback: "28% 42%",
  },
  about: {
    image: "aboutImage",
    position: "aboutHeroPosition",
    imageFallback: "/images/home/amigas-volcan.jpg",
    positionFallback: "45% 35%",
  },
  home: {
    image: "homeHeroImage",
    position: "homeHeroPosition",
    imageFallback: "/images/home/timanfaya-familia.jpg",
    positionFallback: "50% 42%",
  },
  transfer: {
    image: "transferHeroImage",
    position: "transferHeroPosition",
    imageFallback: "/images/home/traslados.jpg",
    positionFallback: "50% 45%",
  },
  cruise: {
    image: "cruiseHeroImage",
    position: "cruiseHeroPosition",
    imageFallback: "/images/home/cruceros.jpg",
    positionFallback: "50% 45%",
  },
  blog: {
    image: "blogHeroImage",
    position: "blogHeroPosition",
    imageFallback: "/images/heroes/blog.jpg",
    positionFallback: "50% 40%",
  },
  houses: {
    image: "housesHeroImage",
    position: "housesHeroPosition",
    imageFallback: "/images/heroes/about.jpg",
    positionFallback: "50% 40%",
  },
};

export function useSettingsHero(key: HeroKey) {
  const cfg = FALLBACKS[key];
  const [image, setImage] = useState(cfg.imageFallback);
  const [objectPosition, setObjectPosition] = useState(cfg.positionFallback);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const s = (d.settings || {}) as SiteSettings;
        const img = String(s[cfg.image as keyof SiteSettings] || "").trim();
        const pos = String(s[cfg.position as keyof SiteSettings] || "").trim();
        if (img) setImage(img);
        if (pos) setObjectPosition(pos);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cfg.image, cfg.imageFallback, cfg.position, cfg.positionFallback, key]);

  return { image, objectPosition };
}
