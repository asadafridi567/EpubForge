import { useApp } from "../context/AppContext";

export default function Privacy() {
  const { isDark } = useApp();
  const bg = isDark ? "bg-[#09090e] text-slate-100" : "bg-white text-slate-900";
  const textStrong = isDark ? "text-white" : "text-slate-950";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const bodyText = isDark ? "text-slate-300" : "text-slate-700";
  const h2 = isDark ? "text-slate-100" : "text-slate-900";

  return (
    <div className={`min-h-screen py-20 transition-colors duration-300 ${bg}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className={`text-4xl font-black tracking-tight ${textStrong}`}>Privacy Policy</h1>
        <p className={`mt-3 text-sm ${textMuted}`}>Last updated: May 2026</p>

        <div className={`mt-10 space-y-8 text-base leading-relaxed ${bodyText}`}>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>1. Introduction</h2>
            <p>
              Welcome to EPUBForge (referred to as "we", "us", or "our"). We respect your privacy and are committed to protecting your personal data. This privacy policy informs you about how we handle your personal data when you visit our website (regardless of where you visit it from) and details your privacy rights and how global laws protect you.
            </p>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>2. Data We Collect and Our Local-First Architecture</h2>
            <p>
              EPUBForge is explicitly designed as a local-first application. All document and ebook conversions take place directly within your web browser using client-side execution models. 
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Your Files:</strong> Your uploaded documents, ebook files, or generated outputs never leave your physical device. We do not upload, store, or process your structural content files on any external servers.</li>
              <li><strong>Personal Data:</strong> We do not require account registration, names, billing systems, or contact details to utilize our core file utility conversion features.</li>
              <li><strong>Technical and Usage Data:</strong> When navigating our platform, technical identifiers may be automatically collected via integrated service nodes to maintain infrastructural stability. This details IP addresses, browser variants, operational systems, and device categories.</li>
            </ul>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>3. Third-Party Services and Analytics</h2>
            <p>
              To ensure our digital infrastructure remains operational, secure, and performant, we contract with network service infrastructure providers who handle data processing according to strict privacy criteria:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Hosting & Edge Delivery (Vercel):</strong> Our system frontend runs on the Vercel edge network. Vercel collects metadata and deployment telemetry to serve network packages and evaluate traffic metrics.</li>
              <li><strong>Security & Traffic Control (Cloudflare):</strong> We use Cloudflare proxying to guard our network boundaries. Cloudflare captures structural request paths, IP indicators, and machine patterns to deploy defense structures (e.g., Bot Fight Mode) and optimize cache pipelines.</li>
            </ul>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>4. Cookies and Local Browser State</h2>
            <p>
              We prioritize zero-tracking configurations. We do not integrate marketing trackers or cross-site advertising networks. We rely strictly on essential internal memory markers:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Functional Cookies:</strong> Technical browser memory triggers may be initialized to preserve core state parameters, such as retaining your dark mode/light mode presentation selections across browser tabs.</li>
            </ul>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>5. Global Legal Compliance (GDPR & CCPA Rights)</h2>
            <p>
              Depending on your geographic residency, you are granted structural legal rights under protection rules like the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). This includes the right to request access to, clear, or restrict the tiny footprint of functional usage datasets we maintain. Because our system stores zero document data or personal database user profiles, we do not have files to expose, sell, or modify.
            </p>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>6. Children's Privacy Protection</h2>
            <p>
              Our processing architecture does not structurally collect data from, target, or intentionally appeal to children under the age of 13 (or under 16 within applicable European economic zones). If you suspect a minor has compromised your personal endpoints and transmitted metadata identifiers to our framework, please notify our team instantly.
            </p>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>7. Modifications to This Document</h2>
            <p>
              We reserve the absolute right to alter this privacy specification text at our discretion. Any structural amendments will immediately display on this relative view alongside a modified date record. Your ongoing interaction with our application following modifications constitutes a technical acceptance of these modified principles.
            </p>
          </div>

          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>8. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or wish to submit an infrastructure query, please contact us at <a href="mailto:alexmercer@epubforge.com" className="font-semibold text-sky-500 hover:underline">alexmercer@epubforge.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}