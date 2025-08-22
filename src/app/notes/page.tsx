import { getNotes } from './actions';
import { NoteEditor } from './components/note-editor';

export default async function NotesPage() {
  const notes = await getNotes();
  const latestNote = notes[0] || null;
  // const [isEditMode, setIsEditMode] = useState(false);

  // const handleChangeEditMode = (isEdit: boolean) => {
  //   setIsEditMode(isEdit)
  // }

  return <NoteEditor note={latestNote} isLoading={false} />;
}
