import Image from "next/image";

export function PageHero({
  image,
  title,
  subtitle,
  eyebrow,
  compact = false,
  objectPosition = "50% 40%",
}: {
  image: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  compact?: boolean;
  /** Encuadre CSS, p. ej. "50% 30%" (ajustable desde Admin → Ajustes). */
  objectPosition?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden bg-[#2a3344] text-white ${
        compact ? "min-h-[40vh]" : "min-h-[52vh] md:min-h-[56vh]"
      }`}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        className="hero-still object-cover"
        sizes="100vw"
        style={{ objectPosition }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/28 via-black/8 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
      <div
        className={`relative mx-auto flex max-w-6xl flex-col justify-end px-4 md:px-6 ${
          compact ? "min-h-[40vh] pb-12 pt-24" : "min-h-[52vh] pb-14 pt-28 md:min-h-[56vh] md:pb-16"
        }`}
      >
        {eyebrow && (
          <p className="animate-fade-up mb-3 text-xs font-bold tracking-[0.18em] text-[#ffb59f] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="animate-fade-up-delay text-hero-shadow max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="animate-fade-up-delay-2 text-hero-shadow mt-4 max-w-2xl text-base leading-relaxed text-white md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
