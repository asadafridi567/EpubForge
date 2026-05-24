import {defineType, defineArrayMember} from 'sanity'

export default defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
    }),

    // ✅ CODE BLOCK — added here
    defineArrayMember({
      type: 'code',
      title: 'Code Block',
      options: {
        language: 'bash',
        languageAlternatives: [
      // Web
      {title: 'HTML',           value: 'html'},
      {title: 'CSS',            value: 'css'},
      {title: 'SCSS',           value: 'scss'},
      {title: 'JavaScript',     value: 'javascript'},
      {title: 'TypeScript',     value: 'typescript'},
      {title: 'JSX',            value: 'jsx'},
      {title: 'TSX',            value: 'tsx'},

      // Backend
      {title: 'Python',         value: 'python'},
      {title: 'PHP',            value: 'php'},
      {title: 'Ruby',           value: 'ruby'},
      {title: 'Java',           value: 'java'},
      {title: 'C',              value: 'c'},
      {title: 'C++',            value: 'cpp'},
      {title: 'C#',             value: 'csharp'},
      {title: 'Go',             value: 'go'},
      {title: 'Rust',           value: 'rust'},
      {title: 'Swift',          value: 'swift'},
      {title: 'Kotlin',         value: 'kotlin'},

      // Data & Config
      {title: 'JSON',           value: 'json'},
      {title: 'YAML',           value: 'yaml'},
      {title: 'TOML',           value: 'toml'},
      {title: 'XML',            value: 'xml'},
      {title: 'CSV',            value: 'csv'},
      {title: 'SQL',            value: 'sql'},
      {title: 'GraphQL',        value: 'graphql'},

      // Shell & DevOps
      {title: 'Bash',           value: 'bash'},
      {title: 'Shell',          value: 'shell'},
      {title: 'PowerShell',     value: 'powershell'},
      {title: 'Docker',         value: 'docker'},

      // Docs & Markup
      {title: 'Markdown',       value: 'markdown'},
      {title: 'Plain Text',     value: 'text'},
    ],
        withFilename: true,
      },
    }),

    defineArrayMember({
      type: 'object',
      name: 'table',
      title: 'Table',
      fields: [
        {
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'row',
              title: 'Row',
              fields: [
                {
                  name: 'cells',
                  title: 'Cells',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      name: 'cell',
                      title: 'Cell',
                      fields: [
                        {
                          name: 'text',
                          title: 'Text',
                          type: 'string',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      preview: {
        select: {rows: 'rows'},
        prepare({rows}: {rows?: {cells?: {text: string}[]}[]}) {
          const count = rows?.length ?? 0
          return {
            title: `Table — ${count} rows`,
          }
        },
      },
    }),
  ],
})