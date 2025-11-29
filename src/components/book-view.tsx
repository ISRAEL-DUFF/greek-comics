'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Note, NotebookBook, createNote, getBookPages, updateNote, deleteNote } from '@/app/notes/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MarkdownDisplay } from '@/components/markdown-display';
import { MarkdownMathjaxDisplay } from '@/components/markdown-mathjax-display';
import { Plus, ChevronLeft, ChevronRight, Edit3, Trash2, Save, Loader2, FileText, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface BookViewProps {
    book: NotebookBook;
    onUpdateBook: (book: NotebookBook) => void;
    editorType: 'math' | 'default' | 'book';
}

export function BookView({ book, onUpdateBook, editorType }: BookViewProps) {
    const { toast } = useToast();
    const [pages, setPages] = useState<Note[]>([]);
    const [activePage, setActivePage] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [pageContent, setPageContent] = useState('');
    const [pageTitle, setPageTitle] = useState('');
    const [isSaving, startSaving] = useTransition();

    useEffect(() => {
        loadPages();
    }, [book.id]);

    const loadPages = async () => {
        setIsLoading(true);
        const list = await getBookPages(book.id);
        setPages(list);
        if (list.length > 0 && !activePage) {
            setActivePage(list[0]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (activePage) {
            setPageTitle(activePage.title);
            setPageContent(activePage.content || '');
            setIsEditingPage(false);
        } else {
            setPageTitle('');
            setPageContent('');
        }
    }, [activePage]);

    const handleAddPage = async () => {
        const newPage = await createNote('Untitled Page', null, 'default', book.id);
        if (newPage) {
            setPages(prev => [...prev, newPage]);
            setActivePage(newPage);
            setIsEditingPage(true);
            toast({ title: 'Page created' });
        }
    };

    const handleSavePage = async () => {
        if (!activePage) return;
        startSaving(async () => {
            await updateNote({ id: activePage.id, title: pageTitle, content: pageContent });
            const updated = { ...activePage, title: pageTitle, content: pageContent };
            setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
            setActivePage(prev => (prev?.id === updated.id ? updated : prev));
            setIsEditingPage(false);
            toast({ title: 'Page saved' });
        });
    };

    const handleDeletePage = async (pageId: number) => {
        await deleteNote(pageId);
        setPages(prev => prev.filter(p => p.id !== pageId));
        setActivePage(prev => (prev?.id === pageId ? null : prev));
        toast({ title: 'Page deleted' });
    };

    const activeIndex = activePage ? pages.findIndex(p => p.id === activePage.id) : -1;

    return (
        <div className="flex h-full flex-col md:flex-row gap-4">
            {/* Table of Contents Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 border-r pr-4 flex flex-col h-[calc(100vh-200px)]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Table of Contents</h3>
                    <Button size="sm" variant="outline" onClick={handleAddPage}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="space-y-1">
                        {pages.map((page, index) => (
                            <button
                                key={page.id}
                                onClick={() => setActivePage(page)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                                    activePage?.id === page.id
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <span className="text-xs opacity-50 w-4">{index + 1}.</span>
                                <span className="truncate flex-1">{page.title || 'Untitled Page'}</span>
                            </button>
                        ))}
                        {pages.length === 0 && !isLoading && (
                            <div className="text-sm text-muted-foreground text-center py-4">
                                No pages yet.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Page Content Area */}
            <div className="flex-1 flex flex-col h-full min-h-[500px]">
                {activePage ? (
                    <>
                        <div className="flex items-center justify-between mb-4 border-b pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Page {activeIndex + 1} of {pages.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isEditingPage ? (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingPage(false)}>Cancel</Button>
                                        <Button size="sm" onClick={handleSavePage} disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingPage(true)}>
                                            <Edit3 className="h-4 w-4 mr-2" /> Edit
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePage(activePage.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Page
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isEditingPage ? (
                                <div className="space-y-4">
                                    <Input
                                        value={pageTitle}
                                        onChange={e => setPageTitle(e.target.value)}
                                        className="text-xl font-bold border-none px-0 focus-visible:ring-0"
                                        placeholder="Page Title"
                                    />
                                    <MarkdownEditor
                                        value={pageContent}
                                        onChange={v => setPageContent(v || '')}
                                        className="min-h-[400px]"
                                    />
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <h1 className="mb-4">{activePage.title}</h1>
                                    {/* <MarkdownDisplay markdown={activePage.content || ''} className="w-full" /> */}
                                    {
                                        editorType === 'math' ? (
                                            <MarkdownMathjaxDisplay markdown={activePage.content || ''} className="w-full overflow-x-auto" markdownClassName="prose max-w-none" />
                                        ) : (
                                            <MarkdownDisplay markdown={activePage.content || ''} className="w-full overflow-x-auto" markdownClassName="prose max-w-none" />
                                        )
                                    }
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        {!isEditingPage && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    disabled={activeIndex <= 0}
                                    onClick={() => setActivePage(pages[activeIndex - 1])}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    disabled={activeIndex >= pages.length - 1}
                                    onClick={() => setActivePage(pages[activeIndex + 1])}
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Select a page or create one to begin."}
                    </div>
                )}
            </div>
        </div>
    );
}
