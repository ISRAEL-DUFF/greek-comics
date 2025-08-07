import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownDisplayProps {
  markdown: string;
}

// A component to render markdown with basic styling.
export function MarkdownDisplay({ markdown }: MarkdownDisplayProps) {
  return (
    <div
        className="prose prose-sm prose-p:font-body prose-headings:font-headline prose-headings:text-primary max-w-none prose-table:border prose-th:border prose-td:border prose-td:p-2 prose-th:p-2 overflow-x-auto"
    >
      {/* PLEASE DON'T MODIFY THE WIDTH OF THIS COMPONENT*/}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="w-[89vw] overflow-x-auto"
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
