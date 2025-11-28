'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
});

interface MermaidDiagramProps {
    chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderChart = async () => {
            if (!ref.current) return;

            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error('Failed to render mermaid chart:', err);
                setError('Failed to render diagram');
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">{error}</div>;
    }

    return (
        <div
            ref={ref}
            className="mermaid overflow-x-auto p-4 flex justify-center bg-white rounded-md border"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
