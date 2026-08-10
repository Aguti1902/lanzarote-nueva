import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { getSettings } from "@/lib/content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  return { title: dict.houses.title };
}

export default async function CasasPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const [settings, dict] = await Promise.all([
    getSettings(),
    getDictionary(locale),
  ]);

  return (
    <>
      <PageHero
        image={settings.aboutImage}
        title={dict.houses.title}
        subtitle={dict.houses.subtitle}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-8 overflow-hidden rounded-lg bg-white ring-1 ring-sand-line md:grid-cols-2">
          <div className="relative min-h-[280px]">
            <Image
              src={settings.aboutImageSecondary}
              alt={dict.houses.houseTitle}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ocean/10 text-ocean">
              <Home className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold text-ink">
              {dict.houses.houseTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted md:text-base">
              {dict.houses.houseBody}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              {dict.houses.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <Link
              href={localePath(locale, "/contacto")}
              className="btn-primary mt-6 w-fit"
            >
              {dict.houses.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
