import Script from "next/script";
import { gtagConsent } from "@/lib/consent";

/**
 * Google Tag (gtag.js) для Google Analytics 4 и Google Ads с Consent Mode v2.
 * До выбора в баннере и после отказа всё «denied»: теги шлют обезличенные
 * сигналы без cookie. Сохранённое «Принять» применяется сразу, до загрузки тега.
 * Номера тегов — NEXT_PUBLIC_GA4_ID (G-…) и NEXT_PUBLIC_GOOGLE_ADS_ID (AW-…).
 */
export function GoogleTag({ ids }: { ids: string[] }) {
  const init = `
window.dataLayer=window.dataLayer||[];
window.gtag=function(){dataLayer.push(arguments);};
gtag('consent','default',${JSON.stringify({ ...gtagConsent("denied"), wait_for_update: 500 })});
gtag('set','ads_data_redaction',true);
if(/(?:^|;\\s*)consent=granted(?:;|$)/.test(document.cookie))gtag('consent','update',${JSON.stringify(gtagConsent("granted"))});
gtag('js',new Date());
${ids.map((id) => `gtag('config',${JSON.stringify(id)});`).join("\n")}`;

  return (
    <>
      {/* Обычный <script>: выполняется при разборе HTML, раньше gtag.js. */}
      <script dangerouslySetInnerHTML={{ __html: init }} />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0])}`}
        strategy="afterInteractive"
      />
    </>
  );
}
