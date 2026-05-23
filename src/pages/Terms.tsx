import { useApp } from "../context/AppContext";

export default function Terms() {
  const { isDark } = useApp();
  const bg = isDark ? "bg-[#09090e] text-slate-100" : "bg-white text-slate-900";
  const textStrong = isDark ? "text-white" : "text-slate-950";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const bodyText = isDark ? "text-slate-300" : "text-slate-700";
  const h2 = isDark ? "text-slate-100" : "text-slate-900";

  return (
    <div className={`min-h-screen py-20 transition-colors duration-300 ${bg}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className={`text-4xl font-black tracking-tight ${textStrong}`}>Terms of Service</h1>
        <p className={`mt-3 text-sm ${textMuted}`}>Last updated: May 2024</p>

        <div className={`mt-10 space-y-8 text-base leading-relaxed ${bodyText}`}>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>1. Acceptance of Terms</h2>
            <p>
              By accessing and using EPUBForge, you accept and agree to be bound by the terms and
              provisions of this agreement.
            </p>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>2. Use License</h2>
            <p>
              Permission is granted to temporarily use EPUBForge for personal, non-commercial transitory
              viewing only. This is the grant of a license, not a transfer of title, and under this license
              you may not:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software contained on the website</li>
            </ul>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>3. Disclaimer</h2>
            <p>
              The materials on EPUBForge's website are provided on an 'as is' basis. EPUBForge makes no
              warranties, expressed or implied, and hereby disclaims and negates all other warranties
              including, without limitation, implied warranties or conditions of merchantability, fitness
              for a particular purpose, or non-infringement of intellectual property or other violation
              of rights.
            </p>
          </div>
          <div>
            <h2 className={`mb-3 text-xl font-bold ${h2}`}>4. Limitations</h2>
            <p>
              In no event shall EPUBForge or its suppliers be liable for any damages (including, without
              limitation, damages for loss of data or profit, or due to business interruption) arising
              out of the use or inability to use the materials on EPUBForge's website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
