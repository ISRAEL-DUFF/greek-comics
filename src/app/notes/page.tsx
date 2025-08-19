import { getNotes } from './actions';
import { NoteEditor } from './components/note-editor';

export default async function NotesPage() {
  const notes = await getNotes();
  const latestNote = notes[0] || null;

  return <NoteEditor note={latestNote} isLoading={false} />;
}
