import { legalMetadata, LegalPage } from "@/lib/legal-page";

export const revalidate = 300;
export const generateMetadata = legalMetadata("cancelacion");
export default LegalPage({ pageId: "cancelacion" });
