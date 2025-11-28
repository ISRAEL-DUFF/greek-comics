import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownMathjaxDisplayProps {
  markdown: string;
}

export function MarkdownMathjaxDisplay({ markdown }: MarkdownMathjaxDisplayProps) {
  return (
    <div className="prose prose-sm sm:prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        className="w-full overflow-x-auto"
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
