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

// client component that provides tabbing (see note-tabs-provider.tsx)
import { NoteTabsProvider } from './components/note-tabs-provider';

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notes = await getNotes(); 

  return (
    <SidebarProvider>
      {/* Put NoteTabsProvider inside SidebarProvider so the tab bar can show a SidebarTrigger
          and both the SidebarContent (note list) and route children remain within the same provider. */}
      <NoteTabsProvider>
        {/* ensure sidebar sits above the main content */}
        <Sidebar side="left" collapsible="icon" className="border-r z-50">
          <SidebarContent className='text-foreground'>
            <NoteList notes={notes} />
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          {/* route children (tabs provider renders the tabs bar) */}
          <main className="flex-1 overflow-auto notes-background">
            {children}
          </main>
        </SidebarInset>
      </NoteTabsProvider>
    </SidebarProvider>
  );
}
