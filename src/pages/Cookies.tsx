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
        <p className={`mt-3 text-sm ${textMuted}`}>Last updated: May 2024</p>

        <div className={`mt-10 space-y-8 text-base leading-relaxed ${bodyText}`}>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your machine to help the site provide a better
              user experience. In general, cookies are used to retain user preferences, store information for
              things like shopping carts, and provide anonymized tracking data to third-party applications.
            </p>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>2. How We Use Cookies</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Preference Cookies:</strong> We use cookies to remember your settings (such as
                dark/light mode and language preference).
              </li>
              <li>
                <strong>Analytics Cookies:</strong> We use Vercel Analytics to understand how visitors
                interact with the website. These cookies collect information in an anonymous form.
              </li>
            </ul>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>3. Managing Cookies</h2>
            <p>
              You can choose to disable cookies through your browser settings. However, if you choose to
              disable cookies, you may not be able to use the full functionality of this website (e.g.,
              your theme preference may not be saved between sessions).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
