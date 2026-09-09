import { legalMetadata, LegalPage } from "@/lib/legal-page";

export const revalidate = 300;
export const generateMetadata = legalMetadata("cookies");
export default LegalPage({ pageId: "cookies" });
