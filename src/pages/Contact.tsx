import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Contact() {
  const { isDark } = useApp();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  
  // Status states to handle the Formspree submission lifecycle
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const bg = isDark ? "bg-[#09090e] text-slate-100" : "bg-[#f8f7f4] text-slate-900";
  const heroBg = isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200";
  const textMuted = isDark ? "text-slate-300" : "text-slate-600";
  const textStrong = isDark ? "text-white" : "text-slate-900";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const inputClass = isDark
    ? "border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-indigo-500"
    : "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-500";

  // The updated submit handler that talks to Formspree
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("https://formspree.io/f/mnjrjjgq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      <section className={`border-b py-16 sm:py-24 ${heroBg}`}>
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className={`text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl ${textStrong}`}>
            Contact Us
          </h1>
          <p className={`mx-auto mt-4 max-w-2xl text-lg ${textMuted}`}>
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className={`space-y-6 rounded-2xl border p-8 shadow-sm ${cardBg}`}
          >
            {/* Success Message Banner */}
            {status === "success" && (
              <div className="rounded-lg bg-green-500/10 p-4 text-sm font-semibold text-green-500 border border-green-500/20">
                Thank you! Your message has been sent successfully.
              </div>
            )}

            {/* Error Message Banner */}
            {status === "error" && (
              <div className="rounded-lg bg-red-500/10 p-4 text-sm font-semibold text-red-500 border border-red-500/20">
                Oops! Something went wrong. Please try again.
              </div>
            )}

            <div>
              <label htmlFor="name" className={`mb-2 block text-sm font-bold ${textStrong}`}>Name</label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="email" className={`mb-2 block text-sm font-bold ${textStrong}`}>Email</label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="message" className={`mb-2 block text-sm font-bold ${textStrong}`}>Message</label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we help?"
                className={`w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${inputClass}`}
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}