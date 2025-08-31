

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    // The SidebarProvider and other layout components have been moved to the page.tsx
    // to allow for client-side state management of the notes list and active note.
    // This layout file is now just a pass-through.
    <>
        {children}
    </>
  );
}
