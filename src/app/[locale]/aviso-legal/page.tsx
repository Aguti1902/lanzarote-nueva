import { legalMetadata, LegalPage } from "@/lib/legal-page";

export const revalidate = 300;
export const generateMetadata = legalMetadata("aviso");
export default LegalPage({ pageId: "aviso" });
