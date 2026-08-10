import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactWidget } from "@/components/ContactWidget";
import { AIChat } from "@/components/AIChat";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales, type Locale } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);

  return (
    <LocaleProvider locale={locale} dict={dict}>
      <div lang={locale} className="flex min-h-full flex-1 flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AIChat />
        <ContactWidget />
      </div>
    </LocaleProvider>
  );
}
