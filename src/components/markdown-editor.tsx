'use client';

import MDEditor from '@uiw/react-md-editor';
import { useEffect, useState } from 'react';

// Dynamically import the MDEditor to avoid SSR issues,
// as it relies on browser-specific APIs.
import dynamic from 'next/dynamic';

const Editor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    className: string;
}

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // The editor can cause hydration mismatches if not handled carefully.
    // We only render it on the client-side after mounting.
    if (!isClient) {
        return null; // or a loading skeleton
    }

    return (
        <div data-color-mode="light">
             <Editor
                value={value}
                onChange={onChange}
                height={500}
                preview="live"
                //className='w-[89vw] overflow-x-auto'
                className={className}
            />
        </div>
    );
}
