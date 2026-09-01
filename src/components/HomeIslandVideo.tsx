"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/media-embeds";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=sB3nlJfS28o";
const POSTER = "/images/home/lanzarote-mi-amor.png";

export function HomeIslandVideo({ title }: { title: string }) {
  const [playing, setPlaying] = useState(false);
  const embed = youtubeEmbedUrl(YOUTUBE_URL);
  const src = embed
    ? `${embed}?autoplay=1&rel=0&modestbranding=1`
    : null;

  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-bg-deep shadow-xl ring-1 ring-sand-line">
      <div className="relative aspect-video w-full">
        {playing && src ? (
          <iframe
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play: ${title}`}
          >
            <Image
              src={POSTER}
              alt={title}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 560px"
              priority={false}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-bg-deep/55 via-bg-deep/10 to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ocean text-white shadow-lg ring-4 ring-white/30 transition group-hover:scale-105 group-hover:bg-ocean-deep">
                <Play className="ml-0.5 h-7 w-7 fill-current" />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
