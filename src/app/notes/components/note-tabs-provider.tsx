'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

// Type defs
type Note = {
  id: number;
  title: string;
  content: string | null;
};

type NoteTabsContextValue = {
  openTabs: Note[];
  activeTabId: number | null;
  openTab: (note: Note) => void;
  closeTab: (id: number) => void;
  setActiveTabId: (id: number | null) => void;
};

const NoteTabsContext = createContext<NoteTabsContextValue | null>(null);

const LS_KEY = 'notes.openTabs.v1';

export function useNoteTabs() {
  const ctx = useContext(NoteTabsContext);
  if (!ctx) throw new Error('useNoteTabs must be used within NoteTabsProvider');
  return ctx;
}

export function NoteTabsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [openTabs, setOpenTabs] = useState<Note[]>([]);
  const [activeTabId, setActiveTabIdState] = useState<number | null>(null);

  // restore persisted tabs on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((p: any) => p && typeof p.id === 'number' && typeof p.title === 'string');
          if (valid.length) {
            setOpenTabs(valid);
            setActiveTabIdState(valid[valid.length - 1].id ?? null);
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to restore note tabs', err);
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist tabs
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(openTabs));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist note tabs', err);
    }
  }, [openTabs]);

  const openTab = useCallback(
    (note: Note) => {
      setOpenTabs((prev) => {
        const exists = prev.find((p) => p.id === note.id);
        if (exists) return prev;
        return [...prev, note];
      });
      setActiveTabIdState(note.id);
      // navigate to the note route so the children route renders the note content
      router.push(`/notes/${note.id}`);
    },
    [router]
  );

  const closeTab = useCallback(
    (id: number) => {
      setOpenTabs((prev) => {
        const next = prev.filter((p) => p.id !== id);
        // if active closed, pick previous or next
        setActiveTabIdState((currentActive) => {
          if (currentActive !== id) return currentActive;
          const idx = prev.findIndex((p) => p.id === id);
          const newActive = idx > 0 ? prev[idx - 1] : prev[idx + 1] ?? null;
          if (newActive) {
            router.push(`/notes/${newActive.id}`);
            return newActive.id;
          } else {
            router.push(`/notes`);
            return null;
          }
        });
        return next;
      });
    },
    [router]
  );

  const setActiveTabId = useCallback(
    (id: number | null) => {
      setActiveTabIdState(id);
      if (id === null) {
        router.push('/notes');
      } else {
        router.push(`/notes/${id}`);
      }
    },
    [router]
  );

  // Route-sync: when navigating to /notes/:id open a tab (and fetch metadata)
  useEffect(() => {
    if (!pathname) return;
    const match = pathname.match(/^\/notes\/(\d+)$/);
    if (!match) return;
    const id = Number(match[1]);
    if (Number.isNaN(id)) return;

    const exists = openTabs.find((t) => t.id === id);
    if (exists) {
      setActiveTabIdState(id);
      return;
    }

    // create a placeholder tab and activate it
    const placeholder: Note = { id, title: 'Loading…', content: '' };
    setOpenTabs((prev) => [...prev, placeholder]);
    setActiveTabIdState(id);

    // fetch note metadata (server endpoint expected at /api/notes/:id or adapt as needed)
    (async () => {
      try {
        const res = await fetch(`/api/notes/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          // leave placeholder title if fetch failed
          // eslint-disable-next-line no-console
          console.warn('Failed to fetch note metadata', res.status);
          return;
        }
        const data: Note = await res.json();
        setOpenTabs((prev) => prev.map((t) => (t.id === id ? { ...t, title: data.title ?? t.title, content: data.content ?? t.content } : t)));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch note metadata', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <NoteTabsContext.Provider value={{ openTabs, activeTabId, openTab, closeTab, setActiveTabId }}>
      <div className="flex flex-col h-full">
        {/* Tab bar
            - sticky so it stays under the app chrome
            - higher z so it sits above the sidebar
            - on large screens add left padding equal to common sidebar width (16rem) so tabs are not covered */}
        {/* tab bar: on large screens shift right to clear the sidebar (lg:ml-64) */}
        <div className="w-full border-b bg-background/60 sticky top-0 z-40 lg:ml-64">
          <div className="flex items-center gap-2 px-3 py-2 min-h-[44px]">
            {/* sidebar trigger for mobile */}
            <div className="lg:hidden mr-2">
              <SidebarTrigger className="p-2 -m-2 rounded-md hover:bg-accent/10 transition-colors" />
            </div>

            {/* flexible tabs area — takes remaining space and scrolls horizontally when needed */}
            <div className="flex-1 min-w-0 overflow-x-auto">
              {openTabs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No open notes</div>
              ) : (
                <div className="flex gap-2">
                  {openTabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={[
                        'flex items-center gap-2 px-3 py-1 rounded-md border min-w-0',
                        tab.id === activeTabId ? 'bg-accent/10 border-accent' : 'bg-transparent border-transparent',
                      ].join(' ')}
                    >
                      <button
                        className="text-sm font-medium max-w-[22ch] truncate"
                        onClick={() => setActiveTabId(tab.id)}
                      >
                        {tab.title}
                      </button>
                      <button
                        className="text-xs text-muted-foreground ml-1"
                        onClick={() => closeTab(tab.id)}
                        aria-label={`Close ${tab.title}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* content: offset on large screens so it doesn't sit under the sidebar */}
        <div className="flex-1 min-h-0 overflow-auto pt-[44px] lg:ml-64">{children}</div>
       </div>
     </NoteTabsContext.Provider>
   );
 }