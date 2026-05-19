import { useState } from "react";
import { useApp } from "../context/AppContext";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  title: string;
  items: FaqItem[];
};

const faqSections: FaqSection[] = [
  {
    title: "General",
    items: [
      {
        question: "What is EPub Forge?",
        answer:
          "EPub Forge is a free online ebook conversion tool that lets you convert files between EPUB, PDF, MOBI, and other formats instantly — no signup or installation required.",
      },
      {
        question: "Is EPub Forge completely free?",
        answer:
          "Yes, the core converter is completely free to use. We also offer a Pro tier for users who need batch conversions and larger file sizes.",
      },
      {
        question: "Do I need to create an account to convert files?",
        answer:
          "No. Just upload your file, select your output format, and download the result. No email or account required.",
      },
      {
        question: "What devices does EPub Forge work on?",
        answer:
          "EPub Forge works on any device with a browser — Windows, Mac, Linux, iPhone, iPad, and Android.",
      },
    ],
  },
  {
    title: "File formats",
    items: [
      {
        question: "What file formats does EPub Forge support?",
        answer:
          "We support EPUB, PDF, MOBI, AZW3, DOCX, TXT, and more. We're continuously adding new formats.",
      },
      {
        question: "Can I convert PDF to EPUB for free?",
        answer:
          "Yes. Upload your PDF, select EPUB as the output format, and download your converted file — completely free.",
      },
      {
        question: "Can I convert EPUB to PDF?",
        answer:
          "Yes. EPUB to PDF conversion is fully supported. The output PDF preserves your formatting and is ready to print or share.",
      },
      {
        question: "Can I read the converted EPUB on my Kindle?",
        answer:
          "Kindle devices don't natively support EPUB. We recommend converting to MOBI or AZW3 format for Kindle, which EPub Forge also supports.",
      },
      {
        question: "Can I convert EPUB to PDF on my phone?",
        answer:
          "Yes. EPub Forge is fully mobile-friendly and works directly in your phone's browser — no app download needed.",
      },
      {
        question: "What is the maximum file size I can upload?",
        answer: "Free users can upload files up to [X]MB. Pro users get increased file size limits.",
      },
    ],
  },
  {
    title: "Privacy and security",
    items: [
      {
        question: "Is it safe to upload my files to EPub Forge?",
        answer:
          "Yes. Your files are processed securely and automatically deleted from our servers after conversion. We never store, read, or share your files.",
      },
      {
        question: "Does EPub Forge store my uploaded files?",
        answer:
          "No. Files are deleted automatically after your conversion is complete. We do not keep copies of any uploaded content.",
      },
      {
        question: "Is my personal data safe?",
        answer:
          "We take privacy seriously. Please read our Privacy Policy for full details on what data we collect and how it is used.",
      },
    ],
  },
  {
    title: "Conversion quality",
    items: [
      {
        question: "Will my formatting be preserved after conversion?",
        answer:
          "We do our best to preserve formatting, fonts, and images. However some complex PDF layouts may not convert perfectly due to differences between formats — EPUB is a reflowable format while PDF is fixed layout.",
      },
      {
        question: "Why does my converted EPUB look different from the original PDF?",
        answer:
          "PDF is a fixed-layout format and EPUB is designed to reflow text across different screen sizes. Some formatting differences are expected, especially with multi-column PDFs or image-heavy documents.",
      },
      {
        question: "Can I convert a scanned PDF to EPUB?",
        answer:
          "Scanned PDFs are images rather than text, which makes conversion more challenging. For best results your PDF should contain selectable text rather than scanned pages.",
      },
    ],
  },
  {
    title: "What is EPUB",
    items: [
      {
        question: "What is an EPUB file?",
        answer:
          "EPUB (Electronic Publication) is the most widely used open ebook format. It is supported by Apple Books, Kobo, Google Play Books, and most ebook readers except Kindle.",
      },
      {
        question: "What is the difference between EPUB and PDF?",
        answer:
          "PDF preserves exact page layout and is ideal for printing. EPUB is a reflowable format designed for reading on screens — text adjusts to fit any screen size making it better for ebooks and mobile reading.",
      },
      {
        question: "How do I open an EPUB file?",
        answer:
          "EPUB files can be opened with Apple Books (iPhone/iPad/Mac), Google Play Books, Kobo, Adobe Digital Editions, or any browser with an EPUB extension installed.",
      },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      {
        question: "My conversion failed — what should I do?",
        answer:
          "Try the following: make sure your file is not password protected, check that the file is not corrupted, and ensure it is under the maximum file size limit. If the issue persists contact us at [your email] and we'll help resolve it.",
      },
    ],
  },
];

export default function FAQ() {
  const [openKey, setOpenKey] = useState<string | null>("General-0");
  const { isDark } = useApp();

  const bg = isDark ? "bg-[#09090e] text-slate-100" : "bg-[#f8f7f4] text-slate-900";
  const heroBg = isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200";
  const textStrong = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-300" : "text-slate-600";
  const cardBg = isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      <section className={`border-b py-16 sm:py-24 ${heroBg}`}>
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className={`text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl ${textStrong}`}>
            Frequently Asked Questions
          </h1>
          <p className={`mx-auto mt-4 max-w-2xl text-lg ${textMuted}`}>
            Answers about EPub Forge, supported formats, privacy, conversion quality, and troubleshooting.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {faqSections.map((section) => (
              <section key={section.title} aria-labelledby={`${section.title}-heading`}>
                <h2
                  id={`${section.title}-heading`}
                  className={`mb-4 text-2xl font-black tracking-tight ${textStrong}`}
                >
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.items.map((faq, index) => {
                    const key = `${section.title}-${index}`;
                    const isOpen = openKey === key;
                    return (
                      <div key={key} className={`overflow-hidden rounded-xl border ${cardBg}`}>
                        <button
                          type="button"
                          onClick={() => setOpenKey(isOpen ? null : key)}
                          className="flex w-full items-center justify-between p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          <span className={`text-lg font-bold ${textStrong}`}>{faq.question}</span>
                          <span className="ml-6 flex-shrink-0 text-2xl text-slate-400">{isOpen ? "-" : "+"}</span>
                        </button>
                        {isOpen ? (
                          <div className={`px-6 pb-6 leading-relaxed ${textMuted}`}>
                            {faq.answer}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}