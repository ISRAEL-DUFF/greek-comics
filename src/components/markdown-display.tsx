import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownDisplayProps {
  markdown: string;
  className: string;
  markdownClassName?: string;
}

import { MermaidDiagram } from './mermaid-diagram';

// A component to render markdown with basic styling.
export function MarkdownDisplay({ markdown, className, markdownClassName }: MarkdownDisplayProps) {
  return (
    <div
      className={markdownClassName ?? "prose prose-sm prose-p:font-body prose-headings:font-headline prose-headings:text-primary max-w-none prose-table:border prose-th:border prose-td:border prose-td:p-2 prose-th:p-2 overflow-x-auto"}
    >
      {/* PLEASE DON'T MODIFY THE WIDTH OF THIS COMPONENT*/}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // className="w-[89vw] overflow-x-auto"
        className={className}
        components={{
          pre({ node, inline, className, children, ...props }: any) {
            return (
              <pre {...props} style={{ backgroundColor: 'transparent' }}>
                {children}
              </pre>
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (!inline && language === 'mermaid') {
              return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
            }

            return !inline && match ? (
              <SyntaxHighlighter
                // style={oneDark}
                language={match[1]}
                PreTag="div"
                // className="rounded-md !bg-muted/50 border p-4"
                // showLineNumbers={true}
                // useInlineStyles={false}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
