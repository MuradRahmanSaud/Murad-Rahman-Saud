import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Briefcase, Award } from 'lucide-react';
import JoditEditor from 'jodit-react';
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
      className={`group/item relative w-full flex items-center min-h-[2.5rem] py-1.5 cursor-pointer transition-all pr-4 rounded-r-full ${
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
          className="drag-handle p-1 cursor-grab active:cursor-grabbing hover:bg-gray-200/50 rounded flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
        >
          <GripVertical size={14} className="text-gray-400" />
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
          <div className="flex items-center gap-3 w-full min-w-0 pl-1">
            <span className="shrink-0">
              {getCategoryIcon(index)}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-[14px] leading-tight pr-2">{job.title}</span>
              <div className="truncate text-[11px] opacity-70 font-normal">
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

  const handleSaveDescription = () => {
    if (!activeJobId) return;
    const updated = jobs.map(j => j.id === activeJobId ? { ...j, description: tempData.description || '' } : j);
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
                      onClick={(e) => handleDelete(activeJobId, e)}
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
                <div className="h-full [&>div]:h-full [&_.jodit-container]:!h-full [&_.jodit-container]:!flex [&_.jodit-container]:!flex-col [&_.jodit-workplace]:!flex-1 [&_.jodit-workplace]:!min-h-0 [&_.jodit-workplace]:!overflow-y-auto [&_.jodit-toolbar__box]:!flex-none [&_.jodit-toolbar__box]:!static !outline-none [&_.jodit-status-bar]:!flex-none [&_.jodit-container]:!border-none [&_.jodit-workplace]:!border-none pb-14">
                  <JoditEditor
                    ref={editor}
                    value={tempData.description || ''}
                    config={{
                      readonly: false,
                      placeholder: 'Describe your role and achievements...',
                      height: '100%',
                      toolbarSticky: false,
                      buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|', 'table', 'link', '|', 'align', 'undo', 'redo']
                    }}
                    onBlur={newContent => setTempData({...tempData, description: newContent})}
                  />
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
            <div className="flex flex-col h-full min-h-0 group">
              <div className="flex-1 overflow-y-auto px-8 py-10">
                <div className="mb-10 text-center flex flex-col items-center">
                  <h1 className="text-[clamp(1.2rem,2.5vw,2rem)] font-black text-[#041e49] mb-2 uppercase tracking-tight">{activeJob.title}</h1>
                  <div className="flex items-center gap-3 text-blue-600 font-bold text-sm md:text-base">
                    <span className="uppercase tracking-widest">{activeJob.organization}</span>
                    {(activeJob.fromDate || activeJob.toDate) && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500 font-medium">
                          {formatDate(activeJob.fromDate)} - {getToDateDisplay(activeJob.toDate)}
                          {activeJob.employmentType && <span className="text-gray-400 font-medium italic ml-1.5">({activeJob.employmentType})</span>}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="h-[1px] w-[clamp(1.5rem,5vw,6rem)] bg-gray-200 rounded-full" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#26c6da]" />
                      <div className="w-2 h-2 rounded-full bg-[#5c6bc0]" />
                      <div className="w-2 h-2 rounded-full bg-[#7e57c2]" />
                      <div className="w-2 h-2 rounded-full bg-[#ab47bc]" />
                    </div>
                    <div className="h-[1px] w-[clamp(1.5rem,5vw,6rem)] bg-gray-200 rounded-full" />
                  </div>
                </div>
                
                <div className="prose prose-blue max-w-none prose-sm md:prose-base bg-blue-50/10 p-8 rounded-3xl border border-blue-50/50 shadow-sm transition-all hover:bg-blue-50/20">
                   <div dangerouslySetInnerHTML={{ __html: activeJob.description || '<p class="italic text-gray-400">No details provided for this role.</p>' }} />
                </div>
              </div>

              <div className="absolute bottom-4 right-4 p-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setTempData(activeJob); setIsEditingContent(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                  <Edit2 size={12} /> Edit Description
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
    </div>
  );
}
