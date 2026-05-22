import React from 'react';

/**
 * A helper to render text that might contain line breaks (like in a cell of a Google Sheet)
 * into a proper HTML representation.
 */
export function FormattedText({ text }: { text?: string }) {
  if (!text || text.trim() === '') {
    return <div className="text-slate-400 text-[10px] italic opacity-50">No data provided</div>;
  }
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 1) {
    return <p>{text}</p>;
  }

  // If there are multiple lines, perhaps treat bullet points specifically
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 mt-1 rounded-full bg-blue-500 shrink-0"></span>
              <span>{line.replace(/^[-•*]\s*/, '')}</span>
            </div>
          );
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
}
