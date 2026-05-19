import { useApp } from "../context/AppContext";

export default function About() {
  const { isDark } = useApp();
  const bg = isDark ? "bg-[#09090e] text-slate-100" : "bg-[#f8f7f4] text-slate-900";
  const heroBg = isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200";
  const textMuted = isDark ? "text-slate-300" : "text-slate-600";
  const textStrong = isDark ? "text-white" : "text-slate-900";
  const badge = isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      <section className={`border-b py-16 sm:py-24 ${heroBg}`}>
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className={`text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl ${textStrong}`}>
            About EPUBForge
          </h1>
          <p className={`mx-auto mt-4 max-w-2xl text-lg ${textMuted}`}>
            The private, powerful, and free ebook converter running entirely in your browser.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-16 px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className={`mb-4 text-2xl font-bold ${textStrong}`}>Our Mission</h2>
            <p className={`leading-relaxed ${textMuted}`}>
              EPUBForge was built with a simple goal: to give readers, authors, and developers a way
              to convert ebooks without sacrificing privacy. Unlike most online converters that upload
              your files to a server, EPUBForge processes everything locally in your browser. Your
              books stay on your device.
            </p>
          </div>

          <div>
            <h2 className={`mb-4 text-2xl font-bold ${textStrong}`}>Why Local-First?</h2>
            <ul className={`list-disc space-y-2 pl-6 ${textMuted}`}>
              <li><strong className={textStrong}>Privacy:</strong> Your files never leave your computer.</li>
              <li><strong className={textStrong}>Speed:</strong> No upload or download wait times for small files.</li>
              <li><strong className={textStrong}>Offline Capable:</strong> Once loaded, you can convert files without an internet connection.</li>
              <li><strong className={textStrong}>Free Forever:</strong> No server costs means no paywalls or subscription fees.</li>
            </ul>
          </div>

          <div>
            <h2 className={`mb-4 text-2xl font-bold ${textStrong}`}>Supported Formats</h2>
            <div className="grid grid-cols-3 gap-3 text-center text-sm font-medium sm:grid-cols-4 md:grid-cols-6">
              {["EPUB", "PDF", "MOBI", "AZW3", "DOCX", "HTML", "Markdown", "CBZ"].map((fmt) => (
                <div key={fmt} className={`rounded-lg p-3 ${badge}`}>{fmt}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
