import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

interface MarkdownMathjaxDisplayProps {
  markdown: string;
  className?: string;
  markdownClassName?: string;
}

import { MermaidDiagram } from './mermaid-diagram';

export function MarkdownMathjaxDisplay({ markdown, className, markdownClassName }: MarkdownMathjaxDisplayProps) {
  return (
    <div className={markdownClassName ?? "prose prose-sm prose-p:font-body prose-headings:font-headline prose-headings:text-primary max-w-none prose-table:border prose-th:border prose-td:border prose-td:p-2 prose-th:p-2 overflow-x-auto"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
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
        className={className ?? "w-full overflow-x-auto"}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
