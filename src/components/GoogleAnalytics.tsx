import { SITE_GA_MEASUREMENT_ID } from "@/lib/ga-id";

/**
 * Snippet visible en el HTML, el mismo que pide Google.
 * Sin aceptación, el consentimiento queda denegado y no se guardan cookies de analítica.
 */
export function GoogleAnalytics() {
  const id = SITE_GA_MEASUREMENT_ID;
  const bootstrap = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
var analytics='denied';
var marketing='denied';
try {
  var raw=null;
  try { raw=localStorage.getItem('lt_cookie_consent'); } catch (e) {}
  if (!raw && document.cookie) {
    var match=document.cookie.match(/(?:^|; )lt_cookie_consent=([^;]*)/);
    if (match) raw=decodeURIComponent(match[1]);
  }
  if (raw) {
    var saved=JSON.parse(raw);
    if (saved && saved.v===1) {
      if (saved.analytics) analytics='granted';
      if (saved.marketing) marketing='granted';
    }
  }
} catch (e) {}
gtag('consent','default',{
  analytics_storage:analytics,
  ad_storage:marketing,
  ad_user_data:marketing,
  ad_personalization:marketing,
  wait_for_update:500
});
gtag('js', new Date());
gtag('config','${id}',{anonymize_ip:true});
`;

  return (
    <>
      <script id="ga-bootstrap" dangerouslySetInnerHTML={{ __html: bootstrap }} />
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
    </>
  );
}
