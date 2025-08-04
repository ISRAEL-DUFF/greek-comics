import { ScrollArea } from './ui/scroll-area';

interface MarkdownDisplayProps {
  markdown: string;
}

function parseMarkdownTable(markdown: string): string {
    const lines = markdown.split('\n');
    let html = '';
    let inTable = false;
    let headerParsed = false;

    for (const line of lines) {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            if (!inTable) {
                html += '<table class="w-full my-4 text-sm border-collapse border border-border">';
                inTable = true;
                headerParsed = false;
            }
            
            const cells = line.trim().split('|').slice(1, -1);

            if (!headerParsed) {
                // This is the header row
                html += '<thead class="bg-muted/50"><tr>';
                for (const cell of cells) {
                    html += `<th class="border border-border px-2 py-1 text-left font-semibold">${cell.trim()}</th>`;
                }
                html += '</tr></thead><tbody>';
                headerParsed = true;
            } else if (!line.match(/^[|\s-:]+$/)) { // This is a content row, not the separator
                html += '<tr>';
                for (const cell of cells) {
                    html += `<td class="border border-border px-2 py-1">${cell.trim()}</td>`;
                }
                html += '</tr>';
            }
        } else {
            if (inTable) {
                html += '</tbody></table>';
                inTable = false;
            }
            // Add the line back, it will be processed for <br> tags later
            html += line + '\n';
        }
    }
    if (inTable) {
        html += '</tbody></table>'; // Close table if file ends
    }
    return html;
}


// A component to render markdown with basic styling.
export function MarkdownDisplay({ markdown }: MarkdownDisplayProps) {
  
  let styledMarkdown = parseMarkdownTable(markdown);

  styledMarkdown = styledMarkdown
    .replace(/---/g, '<hr class="my-4 border-border" />')
    .replace(/^## (.*$)/gim, '<h2 class="font-headline text-2xl font-bold mt-6 mb-2 text-primary">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="font-headline text-xl font-bold mt-4 mb-2">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="font-headline text-lg font-semibold mt-3 mb-1">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />'); // Convert all newlines to <br> tags

  return (
    <ScrollArea className="h-full max-h-[75vh] pr-4">
        <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: styledMarkdown }}
        />
    </ScrollArea>
  );
}
