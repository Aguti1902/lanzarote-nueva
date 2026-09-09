import { legalMetadata, LegalPage } from "@/lib/legal-page";

export const revalidate = 300;
export const generateMetadata = legalMetadata("privacidad");
export default LegalPage({ pageId: "privacidad" });
