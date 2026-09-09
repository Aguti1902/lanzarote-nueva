import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { getLegalDoc, LEGAL_PAGE_IDS, LEGAL_PATHS, type LegalPageId } from "@/lib/legal";
import { localePath } from "@/i18n/path";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type CompanyBits = {
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  brandName: string;
  agencyLicense: string;
};

export function LegalDocument({
  locale,
  pageId,
  dict,
  company,
  heroImage,
  heroPosition,
}: {
  locale: Locale;
  pageId: LegalPageId;
  dict: Dictionary;
  company: CompanyBits;
  heroImage: string;
  heroPosition?: string;
}) {
  const doc = getLegalDoc(locale, pageId, company);
  const lp = (path: string) => localePath(locale, path);

  return (
    <>
      <PageHero
        image={heroImage}
        title={doc.title}
        subtitle={company.legalName}
        objectPosition={heroPosition || "50% 40%"}
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[220px_1fr] md:px-6 md:py-16">
        <nav aria-label={dict.legal.indexTitle} className="md:pt-2">
          <p className="text-xs font-bold tracking-[0.14em] text-ink-muted uppercase">
            {dict.legal.indexTitle}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {LEGAL_PAGE_IDS.map((id) => {
              const title = getLegalDoc(locale, id, company).title;
              const active = id === pageId;
              return (
                <li key={id}>
                  <Link
                    href={lp(LEGAL_PATHS[id])}
                    className={
                      active
                        ? "font-bold text-ocean"
                        : "text-ink-muted transition hover:text-ink"
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <article className="max-w-3xl">
          <p className="text-xs text-ink-muted">{doc.updatedLabel}</p>
          <h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">{doc.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{doc.intro}</p>
          <div className="mt-8 space-y-8">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-bold text-ink">{section.heading}</h2>
                {section.paragraphs.map((p, i) => (
                  <p
                    key={`${section.heading}-${i}`}
                    className="mt-3 text-sm leading-relaxed text-ink-muted"
                  >
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
          {pageId === "cookies" && (
            <p className="mt-10">
              <CookieSettingsButton
                label={dict.footer.cookieSettings}
                className="rounded-full bg-ocean px-5 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep"
              />
            </p>
          )}
        </article>
      </div>
    </>
  );
}
