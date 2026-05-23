import React, { useState, useMemo, useRef, useEffect, Suspense, lazy } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Briefcase, Award, Loader2 } from 'lucide-react';
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

const getToDateDisplay = (toDate: string | null | undefined): string => {
  if (!toDate || !toDate.trim() || toDate.trim().toLowerCase() === 'present') {
    return 'Present';
  }
  return formatDate(toDate.trim());
};

interface JobEntry {
  id: string;
  title: string;
  employmentType: string;
  organization: string;
  fromDate: string;
  toDate: string;
  description: string;
}

interface JobExperienceManagerProps {
  initialData: string;
  onSave: (newData: string) => void;
}

interface SortableJobItemProps {
  job: JobEntry;
  index: number;
  activeJobId: string;
  isEditing: boolean;
  tempData: Partial<JobEntry>;
  setTempData: (data: Partial<JobEntry>) => void;
  onSelect: (id: string) => void;
  getCategoryIcon: (idx: number) => React.ReactNode;
}

const SortableJobItem: React.FC<SortableJobItemProps> = ({ 
  job, 
  index, 
  activeJobId, 
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
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/item relative w-full flex items-center min-h-[2.1rem] py-1 cursor-pointer transition-all pr-4 rounded-r-full ${
        activeJobId === job.id 
          ? 'bg-[#d3e3fd] text-[#041e49] font-bold' 
          : 'text-[#444746] hover:bg-[#e9eaeb]'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={(e) => {
        if (isEditing) return;
        if ((e.target as HTMLElement).closest('.drag-handle')) return;
        onSelect(job.id);
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
              placeholder="Job Title*"
              value={tempData.title}
              onChange={e => setTempData({...tempData, title: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49] border-b border-[#041e49]/30 py-0.5 text-[14px] font-bold"
              autoFocus
            />
            <select
              value={tempData.employmentType}
              onChange={e => setTempData({...tempData, employmentType: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
            >
              <option value="">Employment Type</option>
              {['Full-time', 'Part-time', 'Self-employed', 'Freelance', 'Contract', 'Internship', 'Apprenticeship', 'Seasonal'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              placeholder="Organization"
              value={tempData.organization}
              onChange={e => setTempData({...tempData, organization: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
            />
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-0.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">From</label>
                <input
                  type="date"
                  value={tempData.fromDate}
                  onChange={e => setTempData({...tempData, fromDate: e.target.value})}
                  className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[10px]"
                />
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">To</label>
                <input
                  type="date"
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
              <span className="truncate text-[13px] leading-tight pr-2">{job.title}</span>
              <div className="truncate text-[10px] opacity-70 font-normal">
                {(job.fromDate || job.toDate) && (
                  <>{formatDate(job.fromDate)} - {getToDateDisplay(job.toDate)}</>
                )}
                {job.employmentType && ` (${job.employmentType})`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Self-employed',
  'Freelance',
  'Contract',
  'Internship',
  'Apprenticeship',
  'Seasonal'
];

export function JobExperienceManager({ initialData, onSave }: JobExperienceManagerProps) {
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDeleteId, setJobToDeleteId] = useState<string | null>(null);
  
  // Temporary form state
  const [tempData, setTempData] = useState<Partial<JobEntry>>({
    title: '',
    employmentType: '',
    organization: '',
    fromDate: '',
    toDate: '',
    description: ''
  });

  useEffect(() => {
    try {
      const parts = initialData.split('\n\n---\n\n').filter(p => p.trim());
      const parsedJobs: JobEntry[] = parts.map((p, i) => {
        const lines = p.split('\n');
        // Handle migration from old format or incomplete data
        return {
          id: `job-${i}-${Date.now()}-${Math.random()}`,
          title: lines[0] || '',
          employmentType: lines[1] || '',
          organization: lines[2] || '',
          fromDate: lines[3] || '',
          toDate: lines[4] || '',
          description: lines.slice(5).join('\n') || ''
        };
      });
      
      const simplify = (list: JobEntry[]) => list.map(j => ({ t: j.title, et: j.employmentType, o: j.organization, fd: j.fromDate, td: j.toDate, desc: j.description }));
      const currentSnapshot = JSON.stringify(simplify(jobs));
      const incomingSnapshot = JSON.stringify(simplify(parsedJobs));

      if (incomingSnapshot !== currentSnapshot) {
        setJobs(parsedJobs);
        if (parsedJobs.length > 0 && (!activeJobId || !parsedJobs.find(j => j.id === activeJobId))) {
          setActiveJobId(parsedJobs[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to parse initial data", e);
    }
  }, [initialData]);

  const activeJob = jobs.find(j => j.id === activeJobId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = jobs.findIndex((i) => i.id === active.id);
      const newIndex = jobs.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(jobs, oldIndex, newIndex) as JobEntry[];
      setJobs(newItems);
      saveToParent(newItems);
    }
  };

  const saveToParent = (updatedJobs: JobEntry[]) => {
    const serialized = updatedJobs.map(j => 
      `${j.title}\n${j.employmentType}\n${j.organization}\n${j.fromDate}\n${j.toDate}\n${j.description}`
    ).join('\n\n---\n\n');
    onSave(serialized);
  };



  const handleCreate = () => {
    if (!tempData.title) return;
    const newEntry: JobEntry = {
      id: `job-${Date.now()}`,
      title: tempData.title,
      employmentType: tempData.employmentType || '',
      organization: tempData.organization || '',
      fromDate: tempData.fromDate || '',
      toDate: tempData.toDate || '',
      description: tempData.description || ''
    };
    const updated = [...jobs, newEntry];
    setJobs(updated);
    saveToParent(updated);
    setIsAdding(false);
    setTempData({ title: '', employmentType: '', organization: '', fromDate: '', toDate: '', description: '' });
    setActiveJobId(newEntry.id);
  };

  const handleUpdate = () => {
    if (!editingJobId) return;
    const updated = jobs.map(j => j.id === editingJobId ? { ...j, ...tempData } as JobEntry : j);
    setJobs(updated);
    saveToParent(updated);
    setEditingJobId(null);
    setTempData({ title: '', employmentType: '', organization: '', fromDate: '', toDate: '', description: '' });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    saveToParent(updated);
    if (activeJobId === id) {
      setActiveJobId(updated[0]?.id || '');
    }
  };

  const startEditingSidebar = (job: JobEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJobId(job.id);
    setTempData(job);
    setIsAdding(false);
  };

  const handleClearContent = () => {
    if (!activeJobId) return;
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
      return;
    }
    const updated = jobs.map(j => j.id === activeJobId ? { ...j, description: '' } : j);
    setJobs(updated);
    saveToParent(updated);
    setIsConfirmingDelete(false);
  };

  const getCategoryIcon = (index: number) => {
    const color = INFOGRAPHIC_COLORS[index % INFOGRAPHIC_COLORS.length];
    return <Briefcase className="w-4 h-4 shrink-0" style={{ color: color.main }} />;
  };

  const editor = useRef(null);
  const latestDescRef = useRef(tempData.description || '');

  useEffect(() => {
    if (tempData.description !== undefined) {
      latestDescRef.current = tempData.description;
    }
  }, [tempData.description]);

  const handleSaveDescription = () => {
    if (!activeJobId) return;
    const finalDescription = latestDescRef.current || (editor.current ? (editor.current as any).value : '') || tempData.description || '';
    const updated = jobs.map(j => j.id === activeJobId ? { ...j, description: finalDescription } : j);
    setJobs(updated);
    saveToParent(updated);
    setIsEditingContent(false);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-[#f6f8fc] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="flex flex-1 min-h-0 gap-0">
        {/* SIDEBAR - Gmail style Match SkillManager */}
        <div className="group relative flex flex-col w-80 flex-shrink-0 min-h-0 pt-4">
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between text-[#444746] mb-2 px-3">
              <span className="text-[14px] font-medium">Experience</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setTempData({ title: '', employmentType: '', organization: '', fromDate: '', toDate: '', description: '' });
                    setIsAdding(true);
                    setEditingJobId(null);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-[#444746]"
                  title="Add Experience"
                >
                  <Plus size={16} />
                </button>
                {activeJob && (
                  <>
                    <button 
                      onClick={(e) => startEditingSidebar(activeJob, e)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                      title="Edit Entry Metadata"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setJobToDeleteId(activeJobId);
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
                    placeholder="Job Title*"
                    value={tempData.title}
                    onChange={e => setTempData({...tempData, title: e.target.value})}
                    className="w-full bg-transparent outline-none text-[#041e49] border-b border-[#041e49]/30 py-0.5 text-[14px] font-bold"
                    autoFocus
                  />
                  <select
                    value={tempData.employmentType}
                    onChange={e => setTempData({...tempData, employmentType: e.target.value})}
                    className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
                  >
                    <option value="">Employment Type</option>
                    {EMPLOYMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Organization"
                    value={tempData.organization}
                    onChange={e => setTempData({...tempData, organization: e.target.value})}
                    className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-0.5">
                      <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">From</label>
                      <input
                        type="date"
                        value={tempData.fromDate}
                        onChange={e => setTempData({...tempData, fromDate: e.target.value})}
                        className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[10px]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <label className="text-[9px] uppercase font-bold text-gray-400 pl-1">To</label>
                      <input
                        type="date"
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
              <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                {jobs.map((j, idx) => (
                  <SortableJobItem
                    key={j.id}
                    job={j}
                    index={idx}
                    activeJobId={activeJobId}
                    isEditing={editingJobId === j.id}
                    tempData={tempData}
                    setTempData={setTempData}
                    onSelect={setActiveJobId}
                    getCategoryIcon={getCategoryIcon}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {(isAdding || editingJobId) && (
            <div className="p-4 flex gap-2 border-t border-gray-100 bg-white">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingJobId(null);
                  setTempData({ title: '', employmentType: '', organization: '', fromDate: '', toDate: '', description: '' });
                }}
                className="flex-1 py-1.5 px-3 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-md transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={isAdding ? handleCreate : handleUpdate}
                className="flex-1 py-1.5 px-3 text-xs font-bold bg-[#041e49] text-white rounded-md hover:bg-[#001d35] transition-all shadow-sm"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* CONTENT AREA - White space with left border */}
        <div className="relative flex-1 flex flex-col min-h-0 bg-white border-l border-gray-200 group/content">
          {isEditingContent ? (
            <div className="flex flex-col h-full relative">
              <div className="flex-1 min-h-0 bg-white overflow-hidden relative">
                <div className="h-full [&>div]:h-full [&_.jodit-container]:!h-full [&_.jodit-container]:!flex [&_.jodit-container]:!flex-col [&_.jodit-workplace]:!flex-1 [&_.jodit-workplace]:!min-h-0 [&_.jodit-workplace]:!overflow-y-auto [&_.jodit-toolbar__box]:!flex-none [&_.jodit-toolbar__box]:!static !outline-none [&_.jodit-status-bar]:!flex-none [&_.jodit-container]:!border-none [&_.jodit-workplace]:!border-none pb-14 flex items-center justify-center bg-white">
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
                        placeholder: 'Describe your role and achievements...',
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
          ) : activeJob ? (
            <div className="flex flex-col h-full min-h-0 group relative">
              {/* Compact Header for Job metadata */}
              <div className="shrink-0 border-b border-gray-100 bg-gray-50/10 px-6 py-3.5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                  <div className="min-w-0">
                    <h1 className="text-xs md:text-sm font-bold text-[#041e49] tracking-wider truncate">
                      {activeJob.title}
                    </h1>
                    <div className="text-[10px] md:text-xs text-blue-600 font-bold tracking-wider truncate mt-0.5">
                      {activeJob.organization}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-medium text-gray-400 whitespace-nowrap md:text-right shrink-0 mt-0.5 md:mt-0">
                    {(activeJob.fromDate || activeJob.toDate) && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[9px] uppercase tracking-wider">
                        {formatDate(activeJob.fromDate)} - {getToDateDisplay(activeJob.toDate)}
                      </span>
                    )}
                    {activeJob.employmentType && (
                      <span className="text-[#041e49] font-bold bg-[#d3e3fd]/40 px-2 py-0.5 rounded-md border border-blue-100/30 text-[9px] uppercase tracking-wider">
                        {activeJob.employmentType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Description Container */}
              <div className="flex-1 overflow-y-auto px-6 pt-1.5 pb-6 min-h-0">
                <div className="prose prose-blue max-w-none prose-sm text-slate-600 [&_>div>*:first-child]:mt-0 [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:mt-2 [&_h3]:mb-0.5 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                   <div dangerouslySetInnerHTML={{ __html: activeJob.description || '<p class="italic text-gray-400">No details provided for this role.</p>' }} />
                </div>
              </div>

              <div className="absolute bottom-4 right-4 p-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setTempData(activeJob); setIsEditingContent(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                  <Edit2 size={12} /> Edit Details
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-gray-50/30">
              <div className="bg-white p-8 rounded-full mb-6 shadow-sm border border-gray-100">
                <Briefcase size={56} className="opacity-20 text-[#041e49]" />
              </div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Experience Selected</h3>
              <p className="max-w-xs text-sm leading-relaxed">Select an entry from the list or click the plus icon to add your professional journey.</p>
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
              <h3 className="text-sm font-bold text-gray-900">Delete Job Experience</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to delete the job experience entry for{' '}
              <strong className="text-gray-800">
                {jobs.find((j) => j.id === (jobToDeleteId || activeJobId))?.title || 'this entry'}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setJobToDeleteId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded transition-all"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const targetId = jobToDeleteId || activeJobId;
                  if (targetId) {
                    handleDelete(targetId, e);
                  }
                  setShowDeleteConfirm(false);
                  setJobToDeleteId(null);
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
