
'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { type Note, createNote, deleteNote, updateNote } from '../actions';
import { Folder as FolderIcon, Trash2, FilePlus, MoreVertical, FolderPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarInput,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Type definitions for folder structure
interface FolderNode {
  name: string;
  path: string;
  notes: Note[];
  children: Record<string, FolderNode>;
}
type FolderTree = Record<string, FolderNode>;

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
  onSelectNote: (noteId: number) => void;
  onNoteCreated: (note: Note) => void;
  onNoteDeleted: (noteId: number) => void;
}

export function NoteList({ notes: initialNotes, isLoading, onSelectNote, onNoteCreated, onNoteDeleted }: NoteListProps) {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreateNote = async (folderPath: string | null = null) => {
    const newNote = await createNote('Untitled Note', folderPath);
    if (newNote) {
      toast({
        title: 'Note Created',
        description: 'A new note has been created.',
      });
      onNoteCreated(newNote);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create a new note. Ensure Supabase is configured.',
        });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    await deleteNote(noteId);
    toast({
        title: 'Note Deleted',
    });
    onNoteDeleted(noteId);
  }

  const handleMoveNote = async (noteId: number, folderPath: string | null) => {
    startTransition(async () => {
        await updateNote({ id: noteId, folder_path: folderPath });
        toast({ title: "Note Moved" });
    });
  };

  const filteredNotes = useMemo(() => 
    initialNotes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    ),
    [initialNotes, searchTerm]
  );
  
  const { unfiledNotes, folderTree, allFolderPaths } = useMemo(() => {
    const tree: FolderTree = {};
    const unfiled: Note[] = [];
    const folderPaths = new Set<string>();

    filteredNotes.forEach(note => {
        if (note.folder_path) {
            folderPaths.add(note.folder_path);
            const pathParts = note.folder_path.split(':');
            let currentNode = tree;
            let currentPath = '';

            pathParts.forEach((part, index) => {
                currentPath = index === 0 ? part : `${currentPath}:${part}`;
                if (!currentNode[part]) {
                    currentNode[part] = { name: part, path: currentPath, notes: [], children: {} };
                }
                if (index === pathParts.length - 1) {
                    currentNode[part].notes.push(note);
                }
                currentNode = currentNode[part].children;
            });
        } else {
            unfiled.push(note);
        }
    });

    // Add empty folders to the tree so they are still rendered
    filteredNotes.forEach(note => {
        if (note.folder_path) {
            const pathParts = note.folder_path.split(':');
            let currentNode = tree;
            let currentPath = '';
            for (let i = 0; i < pathParts.length -1; i++) {
                const part = pathParts[i];
                currentPath = i === 0 ? part : `${currentPath}:${part}`;
                 if (!currentNode[part]) {
                    currentNode[part] = { name: part, path: currentPath, notes: [], children: {} };
                }
                currentNode = currentNode[part].children;
            }
        }
    });

    return { unfiledNotes: unfiled, folderTree: tree, allFolderPaths: Array.from(folderPaths) };
  }, [filteredNotes]);

  const NoteListItem = ({ note }: { note: Note }) => (
    <SidebarMenuItem>
      <SidebarMenuButton
          onClick={() => onSelectNote(note.id)}
          className="h-auto flex-col items-start"
        >
          <span className="font-semibold">{note.title || 'Untitled Note'}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {note.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">{tag}</Badge>
            ))}
          </div>
          <span className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </span>
        </SidebarMenuButton>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleMoveNote(note.id, null)}>
                                Unfiled Notes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {allFolderPaths.sort().map(path => (
                                <DropdownMenuItem key={path} onClick={() => handleMoveNote(note.id, path)}>
                                    {path.replace(/:/g, ' / ')}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" />
                           <span>Delete</span>
                       </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this note.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    </SidebarMenuItem>
  );

  const FolderDialog = ({ onDone, existingPaths }: { onDone: (path: string) => void; existingPaths: string[] }) => {
    const [path, setPath] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPath = path.trim();
        if (finalPath) {
            if (existingPaths.includes(finalPath)) {
                setError('A folder with this path already exists.');
                return;
            }
             if (/[^a-zA-Z0-9_:-]/.test(finalPath)) {
                setError('Path can only contain letters, numbers, underscores, and colons.');
                return;
            }
            onDone(finalPath);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>New Folder</DialogTitle>
                <DialogDescription>
                   Enter a path for your new folder. Use colons (:) to create nested folders.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="folder-path">Path</Label>
                <Input id="folder-path" value={path} onChange={(e) => {
                    setPath(e.target.value);
                    setError('');
                }} placeholder="e.g., school:notes:science" />
                 {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={!path.trim()}>Create</Button>
            </DialogFooter>
        </form>
    );
  };

  const FolderRenderer = ({ nodes, level = 0 }: { nodes: FolderTree, level?: number }) => (
    <div className='w-full' style={{ paddingLeft: level > 0 ? '1rem' : '0' }}>
      {Object.values(nodes).sort((a,b) => a.name.localeCompare(b.name)).map(node => (
        <AccordionItem value={node.path} key={node.path}>
          <AccordionTrigger>
              <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4" />
                  <span>{node.name}</span>
              </div>
          </AccordionTrigger>
          <AccordionContent>
            {Object.keys(node.children).length > 0 && (
              <FolderRenderer nodes={node.children} level={level + 1} />
            )}
            <SidebarMenu>
              {node.notes.length > 0 ? (
                  node.notes.map(note => <NoteListItem key={note.id} note={note} />)
              ) : (
                  Object.keys(node.children).length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">Empty folder.</p>
              )}
            </SidebarMenu>
          </AccordionContent>
        </AccordionItem>
      ))}
    </div>
  );

  return (
    <SidebarGroup>
      <SidebarHeader>
        <SidebarInput 
          placeholder="Search notes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
            <Button onClick={() => handleCreateNote(null)} className="w-full">
                <FilePlus /> New Note
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="New Folder">
                        <FolderPlus />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <FolderDialog 
                        existingPaths={allFolderPaths}
                        onDone={(path) => {
                            handleCreateNote(path);
                            // This is a bit of a hack to close the dialog programmatically.
                            document.querySelector('[data-radix-dialog-close]')?.dispatchEvent(new MouseEvent('click'));
                        }} 
                    />
                </DialogContent>
            </Dialog>
        </div>
      </SidebarHeader>
      
      <ScrollArea className="flex-1 -mx-2">
        <SidebarGroupContent className="p-2">
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <SidebarMenuSkeleton key={i} />
                ))
            ) : (
            <Accordion type="multiple" defaultValue={['unfiled-notes', ...allFolderPaths]} className="w-full">
                {/* Unfiled Notes Section */}
                <AccordionItem value="unfiled-notes">
                    <AccordionTrigger>Unfiled Notes</AccordionTrigger>
                    <AccordionContent>
                      <SidebarMenu>
                          {unfiledNotes.length > 0 ? (
                            unfiledNotes.map((note) => <NoteListItem key={note.id} note={note} />)
                          ) : (
                            <p className="text-xs text-muted-foreground p-2 text-center">No unfiled notes.</p>
                          )}
                      </SidebarMenu>
                    </AccordionContent>
                </AccordionItem>
                <FolderRenderer nodes={folderTree} />
            </Accordion>
            )}
        </SidebarGroupContent>
      </ScrollArea>
    </SidebarGroup>
  );
}
