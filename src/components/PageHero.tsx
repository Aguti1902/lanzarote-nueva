import Image from "next/image";

export function PageHero({
  image,
  title,
  subtitle,
  eyebrow,
  compact = false,
}: {
  image: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden bg-bg-deep text-white ${
        compact ? "min-h-[40vh]" : "min-h-[56vh]"
      }`}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        className="hero-image object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
      <div
        className={`relative mx-auto flex max-w-6xl flex-col justify-end px-4 md:px-6 ${
          compact ? "min-h-[40vh] pb-12 pt-24" : "min-h-[56vh] pb-16 pt-28"
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
