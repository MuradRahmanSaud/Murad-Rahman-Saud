import React, { useState, useMemo, useRef, useEffect, Suspense, lazy } from 'react';
import { Plus, Edit2, Trash2, GripVertical, GraduationCap, Award, Loader2 } from 'lucide-react';
const JoditEditor = lazy(() => import('jodit-react'));
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const INFOGRAPHIC_COLORS = [
  { main: '#26c6da', dark: '#0097a7', light: '#e0f7fa' }, // Teal
  { main: '#5c6bc0', dark: '#3949ab', light: '#e8eaf6' }, // Indigo
  { main: '#7e57c2', dark: '#5e35b1', light: '#f3e5f5' }, // Purple
  { main: '#ab47bc', dark: '#8e24aa', light: '#fce4ec' }, // Magenta
];

export const getYearOnly = (dateStr: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (trimmed.toLowerCase() === 'present') {
    return 'Present';
  }
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.getFullYear().toString();
    }
    const match = trimmed.match(/\b(19\d\d|20\d\d)\b/);
    if (match) return match[1];
    return trimmed;
  } catch (e) {
    return trimmed;
  }
};

const formatDate = (dateStr: string) => {
  return getYearOnly(dateStr);
};

const getToDateDisplay = (toDate: string | null | undefined): string => {
  if (!toDate || !toDate.trim() || toDate.trim().toLowerCase() === 'present') {
    return 'Present';
  }
  return formatDate(toDate.trim());
};

export interface EducationEntry {
  id: string;
  degree: string;
  result: string;
  institution: string;
  fromDate: string;
  toDate: string;
  description: string;
}

export function parseEducation(text: string): EducationEntry[] {
  if (!text || !text.trim()) return [];
  try {
    if (text.includes('\n\n---\n\n')) {
      const parts = text.split('\n\n---\n\n').filter(p => p.trim());
      return parts.map((p, i) => {
        const lines = p.split('\n');
        return {
          id: `edu-${i}-${Date.now()}-${Math.random()}`,
          degree: lines[0] || '',
          result: lines[1] || '',
          institution: lines[2] || '',
          fromDate: lines[3] ? getYearOnly(lines[3]) : '',
          toDate: lines[4] ? getYearOnly(lines[4]) : '',
          description: lines.slice(5).join('\n') || ''
        };
      });
    } else {
      const parts = text.split('\n\n').filter(p => p.trim());
      return parts.map((p, i) => {
        const lines = p.split('\n');
        
        const firstLine = lines[0] || '';
        const durationLine = lines[1] || '';
        const institution = lines[2] || '';
        
        const match = firstLine.match(/^(.*) \((.*)\)$/);
        const degree = match ? match[1].trim() : firstLine.trim();
        const result = match ? match[2].trim() : '';
        
        const [start, end] = durationLine.split(' - ').map(s => s.trim());
        const fromDate = start ? getYearOnly(start) : '';
        const toDate = end === 'Present' ? 'Present' : (end ? getYearOnly(end) : '');
        
        return {
          id: `edu-${i}-${Date.now()}-${Math.random()}`,
          degree,
          result,
          institution,
          fromDate,
          toDate,
          description: ''
        };
      });
    }
  } catch (e) {
    console.error("Failed to parse education background", e);
    return [];
  }
}

interface EducationBackgroundManagerProps {
  initialData: string;
  onSave: (newData: string) => void;
}

interface SortableEduItemProps {
  edu: EducationEntry;
  index: number;
  activeEduId: string;
  isEditing: boolean;
  tempData: Partial<EducationEntry>;
  setTempData: (data: Partial<EducationEntry>) => void;
  onSelect: (id: string) => void;
  getCategoryIcon: (idx: number) => React.ReactNode;
}

const SortableEduItem: React.FC<SortableEduItemProps> = ({ 
  edu, 
  index, 
  activeEduId, 
  isEditing,
  tempData,
  setTempData,
  onSelect,
  getCategoryIcon
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: edu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/item relative w-full flex items-center min-h-[2.5rem] py-2 pl-1 cursor-pointer transition-all pr-2 rounded-r-full ${
        activeEduId === edu.id 
          ? 'bg-[#d3e3fd] text-[#041e49] font-bold' 
          : 'text-[#444746] hover:bg-[#e9eaeb]'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={(e) => {
        if (isEditing) return;
        if ((e.target as HTMLElement).closest('.drag-handle')) return;
        onSelect(edu.id);
      }}
    >
      <div className="flex items-center gap-1 w-full min-w-0">
        <div 
          {...attributes} 
          {...listeners} 
          className="drag-handle p-0.5 cursor-grab active:cursor-grabbing hover:bg-gray-200/50 rounded flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
        >
          <GripVertical size={13} className="text-gray-400" />
        </div>
        
        {isEditing ? (
          <div className="flex flex-col flex-1 gap-2 pr-4 pl-1">
            <input
              placeholder="Degree*"
              value={tempData.degree}
              onChange={e => setTempData({...tempData, degree: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49] border-b border-[#041e49]/30 py-0.5 text-[14px] font-bold"
              autoFocus
            />
            <input
              placeholder="Result (e.g., CGPA: 3.8/4.0)"
              value={tempData.result}
              onChange={e => setTempData({...tempData, result: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
            />
            <input
              placeholder="Institution*"
              value={tempData.institution}
              onChange={e => setTempData({...tempData, institution: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
            />
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-0.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">From</label>
                <input
                  type="text"
                  placeholder="YYYY"
                  maxLength={4}
                  value={tempData.fromDate}
                  onChange={e => setTempData({...tempData, fromDate: e.target.value})}
                  className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[10px]"
                />
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">To</label>
                <input
                  type="text"
                  placeholder="YYYY or Present"
                  maxLength={10}
                  value={tempData.toDate}
                  onChange={e => setTempData({...tempData, toDate: e.target.value})}
                  className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[10px]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full min-w-0 pl-1">
            <span className="shrink-0 scale-90">
              {getCategoryIcon(index)}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-[13px] leading-tight pr-2">{edu.degree}</span>
              <div className="truncate text-[10px] opacity-70 font-normal">
                {(edu.fromDate || edu.toDate) && (
                  <>{formatDate(edu.fromDate)} - {getToDateDisplay(edu.toDate)}</>
                )}
                {edu.result && ` (${edu.result})`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function EducationBackgroundManager({ initialData, onSave }: EducationBackgroundManagerProps) {
  const [educations, setEducations] = useState<EducationEntry[]>([]);
  const [activeEduId, setActiveEduId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eduToDeleteId, setEduToDeleteId] = useState<string | null>(null);
  
  // Temporary form state
  const [tempData, setTempData] = useState<Partial<EducationEntry>>({
    degree: '',
    result: '',
    institution: '',
    fromDate: '',
    toDate: '',
    description: ''
  });

  useEffect(() => {
    try {
      const parsedEdu = parseEducation(initialData);
      
      const simplify = (list: EducationEntry[]) => list.map(e => ({ d: e.degree, r: e.result, inst: e.institution, fd: e.fromDate, td: e.toDate, desc: e.description }));
      const currentSnapshot = JSON.stringify(simplify(educations));
      const incomingSnapshot = JSON.stringify(simplify(parsedEdu));

      if (incomingSnapshot !== currentSnapshot) {
        setEducations(parsedEdu);
        if (parsedEdu.length > 0 && (!activeEduId || !parsedEdu.find(e => e.id === activeEduId))) {
          setActiveEduId(parsedEdu[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to parse initial education data", e);
    }
  }, [initialData]);

  const activeEdu = educations.find(e => e.id === activeEduId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = educations.findIndex((i) => i.id === active.id);
      const newIndex = educations.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(educations, oldIndex, newIndex) as EducationEntry[];
      setEducations(newItems);
      saveToParent(newItems);
    }
  };

  const saveToParent = (updatedEducations: EducationEntry[]) => {
    const serialized = updatedEducations.map(e => 
      `${e.degree}\n${e.result}\n${e.institution}\n${e.fromDate}\n${e.toDate}\n${e.description}`
    ).join('\n\n---\n\n');
    onSave(serialized);
  };

  const handleCreate = () => {
    if (!tempData.degree || !tempData.institution) return;
    const newEntry: EducationEntry = {
      id: `edu-${Date.now()}`,
      degree: tempData.degree,
      result: tempData.result || '',
      institution: tempData.institution,
      fromDate: tempData.fromDate || '',
      toDate: tempData.toDate || '',
      description: tempData.description || ''
    };
    const updated = [...educations, newEntry];
    setEducations(updated);
    saveToParent(updated);
    setIsAdding(false);
    setTempData({ degree: '', result: '', institution: '', fromDate: '', toDate: '', description: '' });
    setActiveEduId(newEntry.id);
  };

  const handleUpdate = () => {
    if (!editingEduId) return;
    const updated = educations.map(e => e.id === editingEduId ? { ...e, ...tempData } as EducationEntry : e);
    setEducations(updated);
    saveToParent(updated);
    setEditingEduId(null);
    setTempData({ degree: '', result: '', institution: '', fromDate: '', toDate: '', description: '' });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = educations.filter(e => e.id !== id);
    setEducations(updated);
    saveToParent(updated);
    if (activeEduId === id) {
      setActiveEduId(updated[0]?.id || '');
    }
  };

  const startEditingSidebar = (edu: EducationEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEduId(edu.id);
    setTempData(edu);
    setIsAdding(false);
  };

  const getCategoryIcon = (index: number) => {
    const color = INFOGRAPHIC_COLORS[index % INFOGRAPHIC_COLORS.length];
    return <GraduationCap className="w-4 h-4 shrink-0" style={{ color: color.main }} />;
  };

  const editor = useRef(null);
  const latestDescRef = useRef(tempData.description || '');

  useEffect(() => {
    if (tempData.description !== undefined) {
      latestDescRef.current = tempData.description;
    }
  }, [tempData.description]);

  const handleSaveDescription = () => {
    if (!activeEduId) return;
    const finalDescription = latestDescRef.current || (editor.current ? (editor.current as any).value : '') || tempData.description || '';
    const updated = educations.map(e => e.id === activeEduId ? { ...e, description: finalDescription } : e);
    setEducations(updated);
    saveToParent(updated);
    setIsEditingContent(false);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-[#f6f8fc] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="flex flex-1 min-h-0 gap-0">
        {/* SIDEBAR */}
        <div className="group relative flex flex-col w-80 flex-shrink-0 min-h-0 pt-4">
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between text-[#444746] mb-2 px-3">
              <span className="text-[14px] font-medium">Education Background</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setTempData({ degree: '', result: '', institution: '', fromDate: '', toDate: '', description: '' });
                    setIsAdding(true);
                    setEditingEduId(null);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-[#444746]"
                  title="Add Education"
                >
                  <Plus size={16} />
                </button>
                {activeEdu && (
                  <>
                    <button 
                      onClick={(e) => startEditingSidebar(activeEdu, e)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                      title="Edit Entry Metadata"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEduToDeleteId(activeEduId);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-600"
                      title="Delete Entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-0.5">
            {isAdding && (
              <div className="w-full h-auto flex flex-col pr-4 pl-14 py-3 bg-blue-50/50 rounded-r-2xl gap-3">
                <div className="space-y-2">
                  <input
                    placeholder="Degree*"
                    value={tempData.degree}
                    onChange={e => setTempData({...tempData, degree: e.target.value})}
                    className="w-full bg-transparent outline-none text-[#041e49] border-b border-[#041e49]/30 py-0.5 text-[14px] font-bold"
                    autoFocus
                  />
                  <input
                    placeholder="Result (e.g. CGPA: 3.8/4.0)"
                    value={tempData.result}
                    onChange={e => setTempData({...tempData, result: e.target.value})}
                    className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
                  />
                  <input
                    placeholder="Institution*"
                    value={tempData.institution}
                    onChange={e => setTempData({...tempData, institution: e.target.value})}
                    className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-0.5">
                      <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">From</label>
                      <input
                        type="text"
                        placeholder="YYYY"
                        maxLength={4}
                        value={tempData.fromDate}
                        onChange={e => setTempData({...tempData, fromDate: e.target.value})}
                        className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[10px]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">To</label>
                      <input
                        type="text"
                        placeholder="YYYY or Present"
                        maxLength={10}
                        value={tempData.toDate}
                        onChange={e => setTempData({...tempData, toDate: e.target.value})}
                        className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={educations.map(e => e.id)} strategy={verticalListSortingStrategy}>
                {educations.map((e, idx) => (
                  <SortableEduItem
                    key={e.id}
                    edu={e}
                    index={idx}
                    activeEduId={activeEduId}
                    isEditing={editingEduId === e.id}
                    tempData={tempData}
                    setTempData={setTempData}
                    onSelect={setActiveEduId}
                    getCategoryIcon={getCategoryIcon}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {(isAdding || editingEduId) && (
            <div className="p-4 flex gap-2 border-t border-gray-100 bg-white">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingEduId(null);
                  setTempData({ degree: '', result: '', institution: '', fromDate: '', toDate: '', description: '' });
                }}
                className="flex-1 py-1.5 px-3 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-md transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={isAdding ? handleCreate : handleUpdate}
                disabled={isAdding ? (!tempData.degree || !tempData.institution) : (!tempData.degree || !tempData.institution)}
                className="flex-1 py-1.5 px-3 text-xs font-bold bg-[#041e49] text-white rounded-md hover:bg-[#001d35] transition-all shadow-sm disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="relative flex-1 flex flex-col min-h-0 bg-white border-l border-gray-200 group/content">
          {isEditingContent ? (
            <div className="flex flex-col h-full relative">
              <div className="flex-1 min-h-0 bg-white overflow-hidden relative">
                <div className="h-full [&>div]:h-full [&_.jodit-container]:!h-full [&_.jodit-container]:!flex [&_.jodit-container]:!flex-col [&_.jodit-workplace]:!flex-1 [&_.jodit-workplace]:!min-h-0 [&_.jodit-workplace]:!overflow-y-auto [&_.jodit-toolbar__box]:!flex-none [&_.jodit-toolbar__box]:!static !outline-none [&_.jodit-status-bar]:!flex-none [&_.jodit-container]:!border-none [&_.jodit-workplace]:!border-none pb-14 flex items-center justify-center">
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500 font-medium">
                      <Loader2 className="w-8 h-8 animate-spin text-[#004a6c]" />
                      <span className="text-sm">Loading rich text editor...</span>
                    </div>
                  }>
                    <JoditEditor
                      ref={editor}
                      value={tempData.description || ''}
                      config={{
                        readonly: false,
                        autofocus: true,
                        placeholder: 'Describe your learning, major achievements, projects inside the academy...',
                        height: '100%',
                        toolbarSticky: false,
                        buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|', 'table', 'link', '|', 'align', 'undo', 'redo'],
                        askBeforePasteHTML: false,
                        askBeforePasteFromWord: false,
                        defaultActionOnPaste: 'insert_as_html'
                      }}
                      onChange={newContent => {
                        latestDescRef.current = newContent;
                      }}
                      onBlur={newContent => {
                        latestDescRef.current = newContent;
                        setTempData(prev => ({...prev, description: newContent}));
                      }}
                    />
                  </Suspense>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                <button 
                  onClick={() => setIsEditingContent(false)}
                  className="px-5 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveDescription}
                  className="px-6 py-2 text-sm font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                >
                  Save Description
                </button>
              </div>
            </div>
          ) : activeEdu ? (
            <div className="flex flex-col h-full min-h-0 group relative">
              {/* Compact Header for Education metadata */}
              <div className="shrink-0 border-b border-gray-100 bg-gray-50/10 px-6 py-3.5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                  <div className="min-w-0">
                    <h1 className="text-xs md:text-sm font-bold text-[#041e49] tracking-wider truncate">
                      {activeEdu.degree}
                    </h1>
                    <div className="text-[10px] md:text-xs text-blue-600 font-bold tracking-wider truncate mt-0.5">
                      {activeEdu.institution}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-medium text-gray-400 whitespace-nowrap md:text-right shrink-0 mt-0.5 md:mt-0">
                    {(activeEdu.fromDate || activeEdu.toDate) && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[9px] uppercase tracking-wider">
                        {formatDate(activeEdu.fromDate)} - {getToDateDisplay(activeEdu.toDate)}
                      </span>
                    )}
                    {activeEdu.result && (
                      <span className="text-[#041e49] font-bold bg-[#d3e3fd]/40 px-2 py-0.5 rounded-md border border-blue-100/30 text-[9px] uppercase tracking-wider">
                        {activeEdu.result}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Description Container */}
              <div className="flex-1 overflow-y-auto px-6 pt-1.5 pb-6 min-h-0">
                <div className="prose prose-blue max-w-none prose-sm text-slate-600 [&_>div>*:first-child]:mt-0 [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:mt-2 [&_h3]:mb-0.5 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                   <div dangerouslySetInnerHTML={{ __html: activeEdu.description || '<p class="italic text-gray-400">No details provided for this education entry.</p>' }} />
                </div>
              </div>

              {/* Edit Details Action Trigger overlay */}
              <div className="absolute bottom-4 right-4 p-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setTempData(activeEdu); setIsEditingContent(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                  <Edit2 size={12} /> Edit Details
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-gray-50/30">
              <div className="bg-white p-8 rounded-full mb-6 shadow-sm border border-gray-100">
                <GraduationCap size={56} className="opacity-20 text-[#041e49]" />
              </div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Education Entry Selected</h3>
              <p className="max-w-xs text-sm leading-relaxed">Select an entry from the list or click the plus icon to add your academic background.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-[#041e49]/30 backdrop-blur-[2px] z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full p-5 transform transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3 animate-none">
              <div className="p-2 bg-red-50 rounded-full">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Delete Educational History</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to delete the educational history for{' '}
              <strong className="text-gray-800">
                {educations.find((e) => e.id === (eduToDeleteId || activeEduId))?.degree || 'this entry'}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setEduToDeleteId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded transition-all"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const targetId = eduToDeleteId || activeEduId;
                  if (targetId) {
                    handleDelete(targetId, e);
                  }
                  setShowDeleteConfirm(false);
                  setEduToDeleteId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded shadow-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
