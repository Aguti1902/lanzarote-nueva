/** Convert a YouTube watch/share/embed URL into an embeddable iframe src. */
export function youtubeEmbedUrl(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();

  if (/youtube\.com\/embed\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.toString();
    } catch {
      return value;
    }
  }

  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}

export function mapEmbedUrl(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  const isEmbedPath =
    /google\.[^/\s]+\/maps\/embed/i.test(value) ||
    /maps\.google\.[^/\s]+\/maps\/embed/i.test(value);
  const isOutputEmbed =
    /[?&]output=embed\b/i.test(value) &&
    /(google\.[^/\s]+\/maps|maps\.google\.)/i.test(value);
  if (isEmbedPath || isOutputEmbed) return value;
  return null;
}

export function isHttpUrl(raw: string | undefined | null): boolean {
  if (!raw?.trim()) return false;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
