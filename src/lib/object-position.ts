/** Valor CSS `object-position`, p. ej. `"50% 40%"`. */
export function parseObjectPosition(value?: string | null): {
  x: number;
  y: number;
} {
  const match = String(value || "50% 50%").match(
    /([\d.]+)\s*%\s+([\d.]+)\s*%/
  );
  if (!match) return { x: 50, y: 50 };
  return {
    x: clampPercent(Number(match[1])),
    y: clampPercent(Number(match[2])),
  };
}

export function formatObjectPosition(x: number, y: number): string {
  return `${clampPercent(x)}% ${clampPercent(y)}%`;
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}
