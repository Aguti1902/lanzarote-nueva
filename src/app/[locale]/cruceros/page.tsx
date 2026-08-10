import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

type Props = { params: Promise<{ locale: string }> };

export default async function CrucerosRedirectPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  redirect(localePath(locale, "/cruceristas"));
}
