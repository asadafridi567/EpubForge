import { useApp } from "../context/AppContext";

export default function Cookies() {
  const { isDark } = useApp();
  const bg = isDark ? "bg-[#09090e] text-slate-100" : "bg-white text-slate-900";
  const textStrong = isDark ? "text-white" : "text-slate-950";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const bodyText = isDark ? "text-slate-300" : "text-slate-700";
  const h2 = isDark ? "text-slate-100" : "text-slate-900";

  return (
    <div className={`min-h-screen py-20 transition-colors duration-300 ${bg}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className={`text-4xl font-black tracking-tight ${textStrong}`}>Cookie Policy</h1>
        <p className={`mt-3 text-sm ${textMuted}`}>Last updated: May 2026</p>

        <div className={`mt-10 space-y-8 text-base leading-relaxed ${bodyText}`}>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>1. What Are Cookies and Local Storage?</h2>
            <p>
              Cookies are small data fragments consisting of plain text strings sent down to your machine to help web platforms optimize user interfaces. In addition to traditional cookies, modern web architectures utilize client-side storage technologies such as <strong>Web Storage (localStorage / sessionStorage)</strong> and <strong>IndexedDB</strong> to retain memory targets directly inside your browser container. EPUBForge utilizes these local storage layers to power its local-first file processing mechanics without transferring application states to remote database servers.
            </p>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>2. How We Deploy Storage Mechanisms</h2>
            <p>
              We stand firmly committed to a zero-tracking profile. We do not use advertising profile cookies, behavioral tracking pixels, or cross-site commercial monetization scripts. The storage allocations initialized when you interact with our tools fall exclusively into the following strictly necessary and functional classifications:
            </p>
            <ul className="mt-3 list-disc space-y-3 pl-5">
              <li>
                <strong>Essential Interface Preferences:</strong> We use local browser memory configurations to remember UI settings. This allows us to retain your dark mode or light mode appearance selections across separate sessions or browser refreshes without asking you to reconfigure the interface on every visit.
              </li>
              <li>
                <strong>Network Security Operations (Cloudflare):</strong> Our security proxy layer utilizes minimal operational data markers to confirm security integrity. These data checks evaluate request signals to shield our platform bandwidth limits against malicious automated script injections, DDoS spikes, and looping scraping networks.
              </li>
              <li>
                <strong>Anonymized Platform Telemetry (Vercel Analytics):</strong> To monitor system stability, asset delivery speeds, and general performance profiles across global edge nodes, anonymized performance metrics may be tracked. This processing does not isolate personal identifiers, maintain permanent profile histories, or log metadata back to a specific individual browser.
              </li>
            </ul>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>3. Controlling and Managing Storage Configurations</h2>
            <p>
              You maintain total dominion over how your browser caches and handles web storage metrics. You can choose to audit, drop, block, or clear cookies and local storage maps at any time directly through your local web browser's built-in preference menus:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>To restrict or alter these states, navigate to your respective browser's <strong>Settings &gt; Privacy & Security &gt; Cookies and Site Data</strong> panels.</li>
              <li>Alternatively, accessing our conversion tools through your browser's <strong>Incognito or Private Browsing Mode</strong> will ensure all session preferences, local data stores, and functional cookies are automatically wiped clean the exact moment you shut down your browser window.</li>
            </ul>
            <p className="mt-3">
              <em>Please Note:</em> If you choose to completely block all web storage and client-side memory tokens in your application settings, certain automated layout selections (such as your dynamic theme toggle configuration) will reset back to default styles upon navigating away from the web toolkit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}