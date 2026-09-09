import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { getSettings } from "@/lib/content";
import { companyFromSettings } from "@/lib/invoice-document";
import { getLegalDoc, type LegalPageId } from "@/lib/legal";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

type Props = { params: Promise<{ locale: string }> };

export function legalMetadata(pageId: LegalPageId) {
  return async function generateMetadata({ params }: Props): Promise<Metadata> {
    const locale = resolveLocale((await params).locale);
    const settings = await getSettings();
    const company = companyFromSettings(settings);
    const doc = getLegalDoc(locale, pageId, {
      legalName: company.legalName,
      taxId: company.taxId,
      address: company.address,
      phone: company.phone,
      email: company.email,
      brandName: company.brandName,
      agencyLicense: company.agencyLicense,
    });
    return { title: doc.title, description: doc.intro };
  };
}

export function LegalPage({ pageId }: { pageId: LegalPageId }) {
  return async function Page({ params }: Props) {
    const locale = resolveLocale((await params).locale);
    const [dict, settings] = await Promise.all([
      getDictionary(locale),
      getSettings(),
    ]);
    const company = companyFromSettings(settings);
    return (
      <LegalDocument
        locale={locale}
        pageId={pageId}
        dict={dict}
        company={{
          legalName: company.legalName,
          taxId: company.taxId,
          address: company.address,
          phone: company.phone,
          email: company.email,
          brandName: company.brandName,
          agencyLicense: company.agencyLicense,
        }}
        heroImage={settings.aboutImage || settings.homeHeroImage}
        heroPosition={settings.aboutHeroPosition}
      />
    );
  };
}
