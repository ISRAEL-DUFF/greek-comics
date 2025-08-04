import { ScrollArea } from './ui/scroll-area';

interface MarkdownDisplayProps {
  markdown: string;
}

// A simple component to render markdown with basic styling for tables.
// For a full solution, a library like react-markdown would be used.
export function MarkdownDisplay({ markdown }: MarkdownDisplayProps) {
  // This is a basic way to add some styling to the markdown tables.
  const styledMarkdown = markdown
    .replace(/<table>/g, '<table class="w-full text-sm border-collapse border border-border">')
    .replace(/<thead>/g, '<thead class="bg-muted/50">')
    .replace(/<th>/g, '<th class="border border-border px-2 py-1 text-left">')
    .replace(/<td>/g, '<td class="border border-border px-2 py-1">')
    .replace(/---/g, '<hr class="my-4 border-border" />')
    .replace(/<h2>/g, '<h2 class="font-headline text-2xl font-bold mt-6 mb-2 text-primary">')
    .replace(/<h3>/g, '<h3 class="font-headline text-xl font-bold mt-4 mb-2">')
    .replace(/<h4>/g, '<h4 class="font-headline text-lg font-semibold mt-3 mb-1">');

  return (
    <ScrollArea className="h-full max-h-[75vh] pr-4">
        <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: styledMarkdown }}
        />
    </ScrollArea>
  );
}
