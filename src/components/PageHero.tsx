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
      <div className="absolute inset-0 bg-gradient-to-r from-bg-deep/85 via-bg-deep/50 to-bg-deep/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/70 via-transparent to-bg-deep/30" />
      <div
        className={`relative mx-auto flex max-w-6xl flex-col justify-end px-4 md:px-6 ${
          compact ? "min-h-[40vh] pb-12 pt-24" : "min-h-[56vh] pb-16 pt-28"
        }`}
      >
        {eyebrow && (
          <p className="animate-fade-up mb-3 text-xs font-bold tracking-[0.18em] text-ocean uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="animate-fade-up-delay max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="animate-fade-up-delay-2 mt-4 max-w-2xl text-base leading-relaxed text-white/88 md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
