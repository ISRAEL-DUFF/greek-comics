
import { getNotes } from './actions';
import { NoteList } from './components/note-list';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarProvider
} from '@/components/ui/sidebar';
import './notes.css'

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notes = await getNotes(); 

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="border-r">
        <SidebarContent className='text-foreground'>
          <NoteList notes={notes} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm sm:justify-end">
          <SidebarTrigger className="md:hidden" />
          {/* Add header actions here */}
        </header>
        <main className="flex-1 overflow-auto notes-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
