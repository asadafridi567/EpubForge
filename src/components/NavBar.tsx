import { useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  isDark: boolean;
  theme: "dark" | "light";
  setTheme: (v: "dark" | "light") => void;
  c: {
    headerBorder: string;
    textSoft: string;
  };
};

const NAV_LINKS = [
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function NavBar({ isDark, theme, setTheme, c }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`relative mx-auto flex max-w-7xl items-center justify-between gap-4 border-b px-4 py-4 sm:px-6 lg:px-8 ${c.headerBorder}`}
    >
      {/* Logo + brand – links to home */}
      <Link
        to="/"
        className="flex shrink-0 items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
        aria-label="EPUBForge home"
      >
        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[1px]"
        >
          <div
            className={`flex h-full w-full items-center justify-center rounded-[7px] ${isDark ? "bg-[#09090e]" : "bg-white"}`}
          >
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-base font-black text-transparent">
              E
            </span>
          </div>
        </div>
        <span
          className={`bg-gradient-to-r ${isDark ? "from-white via-slate-100 to-slate-300" : "from-slate-900 via-slate-700 to-slate-500"} bg-clip-text text-[16px] font-extrabold tracking-[0.2em] text-transparent`}
        >
          EPUBFORGE
        </span>
      </Link>

      {/* Right-hand controls */}
      <div className="ml-auto flex items-center gap-3">
        {/* Desktop nav links — visible at md+ */}
        <nav className={`hidden items-center gap-6 text-[16px] font-semibold normal-case tracking-normal md:flex ${c.textSoft}`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="whitespace-nowrap transition-colors hover:text-indigo-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
            isDark
              ? "border-slate-700 bg-slate-900/90 text-yellow-300 hover:bg-slate-800"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* Hamburger — visible below md */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition md:hidden ${
            isDark
              ? "border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className={`absolute left-0 right-0 top-full z-50 flex flex-col border-b shadow-lg md:hidden ${
            isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
          }`}
          role="menu"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={`px-6 py-4 text-[16px] font-semibold transition-colors hover:text-indigo-400 ${
                isDark ? "text-slate-300 hover:bg-slate-900" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
