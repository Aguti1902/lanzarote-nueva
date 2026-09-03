import Image from "next/image";

type Props = {
  title?: string;
  subtitle?: string;
  /** Pantalla completa fija (overlay) o bloque en el flujo (loading.tsx). */
  variant?: "overlay" | "page";
};

/**
 * Pantalla de carga con logo (server + client safe).
 */
export function BrandLoadingPanel({
  title = "Cargando…",
  subtitle,
  variant = "page",
}: Props) {
  const card = (
    <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-10 text-center shadow-[0_24px_60px_rgba(23,28,38,0.28)]">
      <div className="logo-loading-pulse relative h-16 w-24">
        <Image
          src="/images/brand/logo-mark.png"
          alt="Lanzarote Experience Tours"
          fill
          className="object-contain"
          sizes="96px"
          priority
        />
      </div>
      <p className="mt-5 text-sm font-semibold tracking-wide text-ink-muted uppercase">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-1 font-display text-2xl font-extrabold text-ocean">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-6 flex gap-1.5" aria-hidden>
        <span className="logo-loading-dot h-2 w-2 rounded-full bg-ocean" />
        <span className="logo-loading-dot logo-loading-dot-2 h-2 w-2 rounded-full bg-ocean" />
        <span className="logo-loading-dot logo-loading-dot-3 h-2 w-2 rounded-full bg-ocean" />
      </div>
    </div>
  );

  if (variant === "overlay") {
    return (
      <div
        className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1c2433]/75 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {card}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[55vh] w-full flex-1 items-center justify-center bg-bg px-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {card}
    </div>
  );
}
