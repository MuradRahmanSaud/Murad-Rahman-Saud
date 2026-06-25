import React, { useState, useMemo, useRef, useEffect, Suspense, lazy } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Code, FolderDot, Loader2 } from 'lucide-react';
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

export interface ProjectContributionEntry {
  id: string;
  title: string;
  role: string;
  technologies: string;
  fromDate: string;
  toDate: string;
  description: string;
}

export function parseProjectContributions(text: string): ProjectContributionEntry[] {
  if (!text || !text.trim()) return [];
  try {
    if (text.includes('\n\n---\n\n')) {
      const parts = text.split('\n\n---\n\n').filter(p => p.trim());
      return parts.map((p, i) => {
        const lines = p.split('\n');
        return {
          id: `proj-${i}-${Date.now()}-${Math.random()}`,
          title: lines[0] || '',
          role: lines[1] || '',
          technologies: lines[2] || '',
          fromDate: lines[3] ? getYearOnly(lines[3]) : '',
          toDate: lines[4] ? getYearOnly(lines[4]) : '',
          description: lines.slice(5).join('\n') || ''
        };
      });
    } else {
      const parts = text.split('\n\n').filter(p => p.trim());
      return parts.map((p, i) => {
        const lines = p.split('\n');
        return {
          id: `proj-${i}-${Date.now()}-${Math.random()}`,
          title: lines[0] || '',
          role: lines[1] || '',
          technologies: lines[2] || '',
          fromDate: lines[3] ? getYearOnly(lines[3]) : '',
          toDate: lines[4] ? getYearOnly(lines[4]) : '',
          description: lines.slice(5).join('\n') || ''
        };
      });
    }
  } catch (e) {
    console.error('Failed to parse project contributions text', e);
    return [];
  }
}

interface ProjectContributionManagerProps {
  initialData: string;
  onSave: (newData: string) => void;
}

interface SortableProjectItemProps {
  project: ProjectContributionEntry;
  index: number;
  activeProjId: string;
  isEditing: boolean;
  tempData: Partial<ProjectContributionEntry>;
  setTempData: (data: Partial<ProjectContributionEntry>) => void;
  onSelect: (id: string) => void;
  getCategoryIcon: (idx: number) => React.ReactNode;
}

const SortableProjectItem: React.FC<SortableProjectItemProps> = ({ 
  project, 
  index, 
  activeProjId, 
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
  } = useSortable({ id: project.id });

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
        activeProjId === project.id 
          ? 'bg-[#d3e3fd] text-[#041e49] font-bold' 
          : 'text-[#444746] hover:bg-[#e9eaeb]'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={(e) => {
        if (isEditing) return;
        if ((e.target as HTMLElement).closest('.drag-handle')) return;
        onSelect(project.id);
      }}
    >
      <div className="flex items-center gap-1 w-full min-w-0 font-normal">
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
              placeholder="Project Title*"
              value={tempData.title}
              onChange={e => setTempData({...tempData, title: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49] border-b border-[#041e49]/30 py-0.5 text-[14px] font-bold"
              autoFocus
            />
            <input
              placeholder="Role"
              value={tempData.role}
              onChange={e => setTempData({...tempData, role: e.target.value})}
              className="w-full bg-transparent outline-none text-[#041e49]/70 border-b border-[#041e49]/20 py-0.5 text-[11px]"
            />
            <input
              placeholder="Technologies Used"
              value={tempData.technologies}
              onChange={e => setTempData({...tempData, technologies: e.target.value})}
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
              <span className="truncate text-[13px] leading-tight pr-2">{project.title}</span>
              <div className="truncate text-[10px] opacity-70 font-normal">
                {(project.fromDate || project.toDate) && (
                  <>{formatDate(project.fromDate)} - {getToDateDisplay(project.toDate)}</>
                )}
                {project.role && ` (${project.role})`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function ProjectContributionManager({ initialData, onSave }: ProjectContributionManagerProps) {
  const [projects, setProjects] = useState<ProjectContributionEntry[]>([]);
  const [activeProjId, setActiveProjId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projToDeleteId, setProjToDeleteId] = useState<string | null>(null);
  
  // Temporary form state
  const [tempData, setTempData] = useState<Partial<ProjectContributionEntry>>({
    title: '',
    role: '',
    technologies: '',
    fromDate: '',
    toDate: '',
    description: ''
  });

  useEffect(() => {
    try {
      const parsed = parseProjectContributions(initialData);
      
      const simplify = (list: ProjectContributionEntry[]) => list.map(p => ({ t: p.title, r: p.role, tc: p.technologies, fd: p.fromDate, td: p.toDate, desc: p.description }));
      const currentSnapshot = JSON.stringify(simplify(projects));
      const incomingSnapshot = JSON.stringify(simplify(parsed));

      if (incomingSnapshot !== currentSnapshot) {
        setProjects(parsed);
        if (parsed.length > 0 && (!activeProjId || !parsed.find(p => p.id === activeProjId))) {
          setActiveProjId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to parse initial data", e);
    }
  }, [initialData]);

  const activeProj = projects.find(p => p.id === activeProjId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((i) => i.id === active.id);
      const newIndex = projects.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(projects, oldIndex, newIndex) as ProjectContributionEntry[];
      setProjects(newItems);
      saveToParent(newItems);
    }
  };

  const saveToParent = (updated: ProjectContributionEntry[]) => {
    const serialized = updated.map(p => 
      `${p.title}\n${p.role}\n${p.technologies}\n${p.fromDate}\n${p.toDate}\n${p.description}`
    ).join('\n\n---\n\n');
    onSave(serialized);
  };

  const handleCreate = () => {
    if (!tempData.title) return;
    const newEntry: ProjectContributionEntry = {
      id: `proj-${Date.now()}`,
      title: tempData.title,
      role: tempData.role || '',
      technologies: tempData.technologies || '',
      fromDate: tempData.fromDate || '',
      toDate: tempData.toDate || '',
      description: tempData.description || ''
    };
    const updated = [...projects, newEntry];
    setProjects(updated);
    saveToParent(updated);
    setIsAdding(false);
    setTempData({ title: '', role: '', technologies: '', fromDate: '', toDate: '', description: '' });
    setActiveProjId(newEntry.id);
  };

  const handleUpdate = () => {
    if (!editingProjId) return;
    const updated = projects.map(p => p.id === editingProjId ? { ...p, ...tempData } as ProjectContributionEntry : p);
    setProjects(updated);
    saveToParent(updated);
    setEditingProjId(null);
    setTempData({ title: '', role: '', technologies: '', fromDate: '', toDate: '', description: '' });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveToParent(updated);
    if (activeProjId === id) {
      setActiveProjId(updated[0]?.id || '');
    }
  };

  const startEditingSidebar = (proj: ProjectContributionEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjId(proj.id);
    setTempData(proj);
  };

  const colors = INFOGRAPHIC_COLORS;
  
  const getCategoryIcon = (idx: number) => {
    const color = colors[idx % colors.length];
    return (
      <div 
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-sm shrink-0" 
        style={{ backgroundColor: color.main }}
      >
        <Code size={11} className="text-white shrink-0" />
      </div>
    );
  };

  // Keep a Ref to prevent re-initializing editor on single keystroke
  const editor = useRef(null);
  const latestDescRef = useRef(tempData.description || '');

  const joditConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing contribution details...',
    statusbar: false,
    minHeight: 280,
    maxHeight: 500,
    buttons: ['bold', 'italic', 'underline', 'strikethrough', 'fontsize', 'brush', 'align', 'ul', 'ol', 'outdent', 'indent', 'link', 'undo', 'redo'],
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html',
    events: {
      keydown: function(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.readText().then(text => {
            const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            // @ts-ignore
            this.focus();
            try {
              // @ts-ignore
              const sObj = this.s || this.selection;
              if (sObj && typeof sObj.insertHTML === 'function') {
                sObj.insertHTML(escapedText);
              } else {
                // @ts-ignore
                this.value += escapedText;
              }
            } catch (err) {
              console.warn('Fallback paste:', err);
              // @ts-ignore
              this.value += escapedText;
            }
          }).catch(err => {
            console.error('Clipboard read failed: ', err);
          });
        }
      }
    }
  }), []);

  useEffect(() => {
    if (editor.current) {
      latestDescRef.current = tempData.description;
    }
  }, [tempData.description]);

  const handleSaveDescription = () => {
    if (!activeProjId) return;
    const finalDescription = latestDescRef.current || (editor.current ? (editor.current as any).value : '') || tempData.description || '';
    const updated = projects.map(p => p.id === activeProjId ? { ...p, description: finalDescription } : p);
    setProjects(updated);
    saveToParent(updated);
    setIsEditingContent(false);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-[#f6f8fc] rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative">
      <div className="flex flex-1 min-h-0 gap-0">
        {/* SIDEBAR LIST */}
        <div className="group relative flex flex-col w-80 flex-shrink-0 min-h-0 pt-4">
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between text-[#444746] mb-2 px-3">
              <span className="text-[14px] font-medium">Project Contributions</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setTempData({ title: '', role: '', technologies: '', fromDate: '', toDate: '', description: '' });
                    setIsAdding(true);
                    setEditingProjId(null);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-[#444746]"
                  title="Add Project Contribution"
                >
                  <Plus size={16} />
                </button>
                {activeProj && (
                  <>
                    <button 
                      onClick={(e) => startEditingSidebar(activeProj, e)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                      title="Edit Entry Metadata"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjToDeleteId(activeProjId);
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

          <div className="flex-1 overflow-y-auto pr-2 pb-6 min-h-0 space-y-0.5">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-0.5">
                  {projects.map((p, idx) => (
                    <SortableProjectItem
                      key={p.id}
                      project={p}
                      index={idx}
                      activeProjId={activeProjId}
                      isEditing={editingProjId === p.id}
                      tempData={tempData}
                      setTempData={setTempData}
                      onSelect={setActiveProjId}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {isAdding && (
              <div className="bg-white m-2 p-3.5 rounded-xl shadow-lg border border-gray-100 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-4 duration-200">
                <h4 className="text-[11px] uppercase font-bold text-gray-400">Add Contribution Entry</h4>
                <div className="flex flex-col gap-2.5">
                  <input
                    placeholder="Project / Contribution Title*"
                    value={tempData.title}
                    onChange={e => setTempData({...tempData, title: e.target.value})}
                    className="w-full bg-slate-50 border border-gray-100 px-2.5 py-1.5 rounded outline-none text-slate-800 text-[12px] font-semibold"
                    autoFocus
                  />
                  <input
                    placeholder="Role (e.g. Lead Backend Engineer)"
                    value={tempData.role}
                    onChange={e => setTempData({...tempData, role: e.target.value})}
                    className="w-full bg-slate-50 border border-gray-100 px-2.5 py-1.5 rounded outline-none text-slate-800 text-[11px]"
                  />
                  <input
                    placeholder="Technologies (e.g. React, Python)"
                    value={tempData.technologies}
                    onChange={e => setTempData({...tempData, technologies: e.target.value})}
                    className="w-full bg-slate-50 border border-gray-100 px-2.5 py-1.5 rounded outline-none text-slate-800 text-[11px]"
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
                        className="w-full bg-slate-50 border border-gray-100 px-2.5 py-1.5 rounded outline-none text-slate-800 text-[11px]"
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
                        className="w-full bg-slate-50 border border-gray-100 px-2.5 py-1.5 rounded outline-none text-slate-800 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-1.5">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-3 border border-gray-200 hover:bg-slate-50 rounded text-[11px] py-1 text-slate-500 font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreate}
                    disabled={!tempData.title}
                    className="px-3.5 bg-green-500 hover:bg-green-600 rounded text-[11px] py-1 text-white font-bold disabled:opacity-50"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            )}

            {editingProjId && (
              <div className="flex gap-1.5 justify-end p-2 border-t border-gray-100 mt-2">
                <button 
                  onClick={() => setEditingProjId(null)}
                  className="px-3 border border-gray-250 hover:bg-slate-50 rounded text-[11px] py-1 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdate}
                  className="px-3.5 bg-[#004a6c] text-white hover:bg-[#003752] rounded text-[11px] py-1 font-bold"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DETAILED VIEW OR EDIT VIEW */}
        <div className="flex-1 min-h-0 flex flex-col bg-white border-l border-gray-100">
          {isEditingContent ? (
            <div className="flex flex-col h-full min-h-0 relative">
              <div className="shrink-0 border-b border-gray-100 bg-gray-50/10 px-6 py-3.5">
                <div className="min-w-0">
                  <h1 className="text-xs md:text-sm font-bold text-[#041e49]">
                    Edit Contribution Details
                  </h1>
                  <span className="text-[10px] text-gray-400 truncate">
                    Specify key metrics, milestones, or libraries implemented
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="border border-slate-200 rounded-lg overflow-hidden min-h-[300px]">
                  <Suspense fallback={
                    <div className="flex justify-center items-center p-12 text-slate-400 font-medium text-xs gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#004a6c]" /> Loading Editor...
                    </div>
                  }>
                    <JoditEditor
                      ref={editor}
                      value={tempData.description || ''}
                      config={joditConfig}
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
          ) : activeProj ? (
            <div className="flex flex-col h-full min-h-0 group relative">
              {/* Compact Header for metadata */}
              <div className="shrink-0 border-b border-gray-100 bg-gray-50/10 px-6 py-3.5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                  <div className="min-w-0">
                    <h1 className="text-xs md:text-sm font-bold text-[#041e49] tracking-wider truncate">
                      {activeProj.title}
                    </h1>
                    <div className="text-[10px] md:text-xs text-blue-600 font-bold tracking-wider truncate mt-0.5">
                      {activeProj.role || 'Contributor'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-medium text-gray-400 whitespace-nowrap md:text-right shrink-0 mt-0.5 md:mt-0">
                    {(activeProj.fromDate || activeProj.toDate) && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[9px] uppercase tracking-wider">
                        {formatDate(activeProj.fromDate)} - {getToDateDisplay(activeProj.toDate)}
                      </span>
                    )}
                    {activeProj.technologies && (
                      <span className="text-[#041e49] font-bold bg-[#d3e3fd]/40 px-2 py-0.5 rounded-md border border-blue-100/30 text-[9px] uppercase tracking-wider max-w-[200px] truncate" title={activeProj.technologies}>
                        {activeProj.technologies}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Description Container */}
              <div className="flex-1 overflow-y-auto px-6 pt-1.5 pb-6 min-h-0">
                <div className="prose prose-blue max-w-none prose-sm text-slate-600 [&_>div>*:first-child]:mt-0 [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:mt-2 [&_h3]:mb-0.5 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                   <div dangerouslySetInnerHTML={{ __html: activeProj.description || '<p class="italic text-gray-400">No details provided for this project contribution.</p>' }} />
                </div>
              </div>

              <div className="absolute bottom-4 right-4 p-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setTempData(activeProj); setIsEditingContent(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                  <Edit2 size={12} /> Edit Details
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-gray-50/30">
              <div className="bg-white p-8 rounded-full mb-6 shadow-sm border border-gray-100">
                <Code size={56} className="opacity-20 text-[#041e49]" />
              </div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Project Contribution Selected</h3>
              <p className="max-w-xs text-sm leading-relaxed">Select an entry from the list or click the plus icon to add your work on key systems or client projects.</p>
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
              <h3 className="text-sm font-bold text-gray-900">Delete Project Contribution</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to delete the project contribution entry for{' '}
              <strong className="text-gray-800">
                {projects.find((p) => p.id === (projToDeleteId || activeProjId))?.title || 'this entry'}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProjToDeleteId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded transition-all"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const targetId = projToDeleteId || activeProjId;
                  if (targetId) {
                    handleDelete(targetId, e);
                  }
                  setShowDeleteConfirm(false);
                  setProjToDeleteId(null);
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
