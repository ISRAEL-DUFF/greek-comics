import { getNoteById } from '../actions';
import { NoteEditor } from '../components/note-editor';

export default async function NotePage({ params }: { params: { id: string } }) {
  const noteId = parseInt(params.id, 10);
  const note = await getNoteById(noteId);

  return <NoteEditor note={note} isLoading={false} />;
}
