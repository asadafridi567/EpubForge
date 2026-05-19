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
        <p className={`mt-3 text-sm ${textMuted}`}>Last updated: May 2024</p>

        <div className={`mt-10 space-y-8 text-base leading-relaxed ${bodyText}`}>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>1. Introduction</h2>
            <p>
              Welcome to EPUBForge. We respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you about how we look after your personal data when you visit
              our website and tell you about your privacy rights and how the law protects you.
            </p>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>2. Data We Collect</h2>
            <p>
              EPUBForge is a local-first application. All file conversions happen directly in your browser.
              We do not upload, store, or process your files on any server.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li><strong>Files:</strong> Your ebooks and documents never leave your device.</li>
              <li><strong>Usage Data:</strong> We may collect anonymous usage statistics via Vercel Analytics to improve our service.</li>
            </ul>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>3. How We Use Your Data</h2>
            <p>
              Since we do not collect personal files, we do not use your data for any purpose other than
              providing the conversion functionality within your browser session.
            </p>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>4. Cookies</h2>
            <p>
              We use minimal cookies strictly necessary for the functioning of the site (e.g., remembering
              your theme preference). Please see our Cookie Policy for more details.
            </p>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>5. Contact Us</h2>
            <p>If you have any questions about this privacy policy, please contact us at support@epubforge.app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
