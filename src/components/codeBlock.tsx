import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  value: {
    code: string
    language?: string
    filename?: string
  }
}

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    tsx:        '#3178c6',
    jsx:        '#61dafb',
    python:     '#3572A5',
    html:       '#e34c26',
    css:        '#563d7c',
    scss:       '#c6538c',
    bash:       '#89e051',
    shell:      '#89e051',
    powershell: '#012456',
    json:       '#40d47e',
    yaml:       '#cb171e',
    sql:        '#e38c00',
    graphql:    '#e10098',
    rust:       '#dea584',
    go:         '#00add8',
    php:        '#4F5D95',
    java:       '#b07219',
    csharp:     '#178600',
    cpp:        '#f34b7d',
    c:          '#555555',
    ruby:       '#701516',
    swift:      '#F05138',
    kotlin:     '#A97BFF',
    docker:     '#0db7ed',
    markdown:   '#083fa1',
    text:       '#888888',
  }
  return colors[language] ?? '#888888'
}

export default function CodeBlock({ value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { code, language = 'text', filename } = value
  const label = filename ? filename : language

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-slate-700">

      {/* Top bar */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">

        {/* Left — dot + filename or language */}
        <span className="flex items-center gap-2 font-mono text-sm text-slate-300">
          <span
            style={{ background: getLanguageColor(language) }}
            className="inline-block h-2.5 w-2.5 rounded-full"
          />
          {label}
        </span>

        {/* Right — copy button */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-all duration-200 border
            ${copied
              ? 'border-green-500 bg-green-500/20 text-green-400'
              : 'border-slate-600 bg-transparent text-slate-400 hover:border-slate-400 hover:text-slate-200'
            }`}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={true}
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          background: '#1e1e1e',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
        lineNumberStyle={{
          color: '#4a4a4a',
          minWidth: '2.5em',
          paddingRight: '1em',
          userSelect: 'none',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}