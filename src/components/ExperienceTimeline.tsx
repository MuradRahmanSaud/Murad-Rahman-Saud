import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExperienceTimelineProps {
  text: string;
  isDark?: boolean;
  onEdit?: (index: number) => void;
  isJob?: boolean;
}

interface ExperienceTimelineItemProps {
  key?: React.Key;
  entry: string;
  idx: number;
  isDark: boolean;
  onEdit?: (index: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isJob?: boolean;
}

function ExperienceTimelineItem({ 
  entry, 
  idx, 
  isDark, 
  onEdit,
  isExpanded,
  onToggle,
  isLast,
  isJob
}: ExperienceTimelineItemProps & { isLast: boolean }) {
  const lines = entry.split('\n');
  
  let title = '';
  let duration = '';
  let org = '';
  let detailsRaw = '';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const isJobEntry = isJob !== undefined ? isJob : (lines.length >= 5 && !lines[1].includes(' - '));

  // Detect Job format vs Education/Simple format
  if (isJobEntry) {
    title = lines[0] || '';
    const employmentType = lines[1] || '';
    org = lines[2] || '';
    const fromDate = lines[3] || '';
    const toDate = lines[4] || '';
    detailsRaw = lines.slice(5).join('\n').trim();
    
    // Check if toDate is empty/null/present, show 'Present' instead
    const isToDateEmpty = !toDate || !toDate.trim() || toDate.trim().toLowerCase() === 'present';
    const toDateDisplay = isToDateEmpty ? "Present" : formatDate(toDate.trim());
    duration = `${formatDate(fromDate)} - ${toDateDisplay}`;
    if (employmentType) {
      duration = `${duration} (${employmentType})`;
    }
  } else {
    title = lines[0] || '';
    duration = lines[1] || '';
    org = lines[2] || '';
    detailsRaw = lines.slice(3).join('\n').trim();
  }

  // Special handling for Education: If title has (Result), move it to duration
  let result = '';
  const resultMatch = title.match(/^(.*) \((.*)\)$/);
  if (resultMatch) {
    title = resultMatch[1];
    result = resultMatch[2];
  }

  return (
    <div className="relative group/exp">
      {/* Timeline Dot */}
      <div className={`absolute -left-[21px] top-1.5 w-[8px] h-[8px] rounded-full border-2 bg-slate-300 ring-2 transition-colors z-20 
        ${isDark ? 'border-[#004a6c] ring-white/10 group-hover/exp:bg-[#f1b700]' : 'border-white ring-slate-100 group-hover/exp:bg-[#f1b700]'}`}
      ></div>

      {/* Connecting Line (except for last item) */}
      {!isLast && (
        <div className={`absolute -left-[18px] top-[14px] bottom-[-22px] w-[2px] z-10 transition-colors 
           ${isDark ? 'bg-white/10 group-hover/exp:bg-white/20' : 'bg-slate-100 group-hover/exp:bg-slate-200'}`}
        ></div>
      )}
      
      <div className="flex flex-col gap-0 pr-4 relative">
        {onEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(idx);
            }}
            className="absolute right-0 top-0 opacity-0 group-hover/exp:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded text-white/50 hover:text-white z-20"
            title="Edit Experience"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
        )}
        <div 
          onClick={onToggle}
          title={isExpanded ? 'Click to hide details' : 'Click to view details'}
          className="cursor-pointer group/clickable"
        >
          <h3 className={`text-[13px] font-bold leading-tight ${isDark ? 'text-white' : 'text-[#004a6c]'} group-hover/clickable:text-[#f1b700] transition-colors`}>{title}</h3>
          {duration && (
            <p className={`text-[12px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-400'} group-hover/clickable:text-[#f1b700]/80 transition-colors`}>
              {duration} {result && <span className="opacity-80 ml-0.5">({result})</span>}
            </p>
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-1">
                {org && (
                  <p className={`text-[11px] font-semibold mt-0.5 mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    {org}
                  </p>
                )}
                
                {detailsRaw && (
                  <div className={`mt-1 space-y-0.5 text-[11.5px] leading-relaxed [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {detailsRaw.trim().startsWith('<') ? (
                      <div dangerouslySetInnerHTML={{ __html: detailsRaw }} />
                    ) : (
                      // Fallback for old formatting (text-based lists)
                      <div className="mt-1 space-y-0.5">
                        {detailsRaw.split('\n').filter(l => l.trim()).map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-1.5 text-[11.5px] leading-relaxed">
                            <span className={`mt-1.5 w-1 h-[1px] shrink-0 ${isDark ? 'bg-white/20' : 'bg-slate-300'}`}></span>
                            <span>{detail.replace(/^[-•*]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ExperienceTimeline({ text, isDark = false, onEdit, isJob }: ExperienceTimelineProps) {
  if (!text || text.trim() === '') return null;
  const entries = text.includes('---') 
    ? text.split('\n\n---\n\n').filter(e => e.trim())
    : text.split('\n\n').filter(e => e.trim());
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null);
  
  return (
    <div className="relative pl-6 space-y-4 mt-4">
      {entries.map((entry, idx) => (
        <ExperienceTimelineItem 
          key={idx} 
          entry={entry} 
          idx={idx} 
          isDark={isDark} 
          onEdit={onEdit}
          isExpanded={expandedIdx === idx}
          onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          isLast={idx === entries.length - 1}
          isJob={isJob}
        />
      ))}
    </div>
  );
}
