import React, { useState, useMemo, useRef, useEffect, Suspense, lazy } from 'react';
import { Plus, Edit2, Trash2, Star, Award, Trophy, Heart, Circle, Layers, GripVertical, Loader2 } from 'lucide-react';
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

export interface Application {
  id: string;
  name: string;
  image: string;
  description: string;
}

const getDirectImageUrl = (url: string) => {
  if (!url) return url;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const idMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  } else if (idMatch && url.includes('drive.google.com')) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  return url;
};

const INFOGRAPHIC_COLORS = [
  { main: '#26c6da', dark: '#0097a7', light: '#e0f7fa' }, // Teal
  { main: '#5c6bc0', dark: '#3949ab', light: '#e8eaf6' }, // Indigo
  { main: '#7e57c2', dark: '#5e35b1', light: '#f3e5f5' }, // Purple
  { main: '#ab47bc', dark: '#8e24aa', light: '#fce4ec' }, // Magenta
];

const hasCleanDescription = (html: string | undefined): boolean => {
  if (!html) return false;
  const noTags = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
  return noTags.length > 0 || html.includes('<img');
};

interface Skill {
  type: string;
  rating?: number;
  description: string;
  applications?: Application[];
}

interface SkillManagerProps {
  initialSkillsText: string;
  onSave: (newSkillsText: string) => void;
}

interface SortableSkillItemProps {
  skill: Skill;
  index: number;
  activeSkillType: string;
  editingSkill: Skill | null;
  newType: string;
  setNewType: (val: string) => void;
  handleTabChange: (type: string) => void;
  handleUpdateSkill: () => void;
  getCategoryIcon: (idx: number) => React.ReactNode;
  newRating: number;
  setNewRating: (val: number) => void;
}

const SortableSkillItem: React.FC<SortableSkillItemProps> = ({ 
  skill, 
  index, 
  activeSkillType, 
  editingSkill, 
  newType, 
  setNewType, 
  handleTabChange, 
  handleUpdateSkill, 
  getCategoryIcon,
  newRating,
  setNewRating
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: skill.type });

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
        activeSkillType === skill.type 
          ? 'bg-[#d3e3fd] text-[#041e49] font-bold' 
          : 'text-[#444746] hover:bg-[#e9eaeb]'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={editingSkill?.type !== skill.type ? (e) => {
        // Prevent tab change if clicking on drag handle or its children
        if ((e.target as HTMLElement).closest('.drag-handle')) return;
        handleTabChange(skill.type);
      } : undefined}
    >
      <div className="flex items-center gap-1 w-full min-w-0">
        <div 
          {...attributes} 
          {...listeners} 
          className="drag-handle p-0.5 cursor-grab active:cursor-grabbing hover:bg-gray-200/50 rounded flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
        >
          <GripVertical size={13} className="text-gray-400" />
        </div>
        
        {editingSkill?.type === skill.type ? (
           <div className="flex flex-col flex-1 gap-2 pr-4 pl-1">
             <div className="flex items-center gap-2">
               <input
                 value={newType}
                 onChange={e => setNewType(e.target.value)}
                 className="flex-1 bg-transparent outline-none font-bold text-[#041e49] border-b border-[#041e49]/30 py-0.5 text-[14px]"
                 autoFocus
                 onKeyDown={e => { if(e.key === 'Enter') handleUpdateSkill(); }}
               />
               <select 
                value={newRating}
                onChange={e => setNewRating(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded text-[11px] px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
              >
                {[0,1,2,3,4,5].map(v => (
                   <option key={v} value={v}>{v === 0 ? 'No Rate' : `${v} Stars`}</option>
                ))}
              </select>
             </div>
           </div>
        ) : (
           <div className="flex items-center gap-2 w-full min-w-0 pl-1">
             <span className="shrink-0 scale-90">
               {getCategoryIcon(index)}
             </span>
             <div className="flex flex-col min-w-0 flex-1">
               <span className="truncate text-[13px] leading-tight pr-2">{skill.type}</span>
               {skill.rating && skill.rating > 0 ? (
                 <div className="flex gap-0.5 mt-0.5">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} size={8} className={i < skill.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                   ))}
                 </div>
               ) : null}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}

export function SkillManager({ initialSkillsText, onSave }: SkillManagerProps) {
  const [skills, setSkills] = useState<Skill[]>(() => {
    try {
      return JSON.parse(initialSkillsText || '[]');
    } catch (e) {
      return [];
    }
  });

  const [activeSkillType, setActiveSkillType] = useState<string>(skills[0]?.type || '');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editTab, setEditTab] = useState<'text' | 'applications'>('text');
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newType, setNewType] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [tempDescription, setTempDescription] = useState('');
  const [tempApplications, setTempApplications] = useState<Application[]>([]);
  const [newApp, setNewApp] = useState<Partial<Application>>({});

  useEffect(() => {
    try {
      const parsed = JSON.parse(initialSkillsText || '[]');
      // Simple deep comparison using stringify to avoid unnecessary state updates
      const currentSkillsJson = JSON.stringify(skills);
      const incomingSkillsJson = JSON.stringify(parsed);
      
      if (incomingSkillsJson !== currentSkillsJson) {
        setSkills(parsed);
      }
      
      if (parsed.length > 0) {
        if (!activeSkillType || !parsed.find(s => s.type === activeSkillType)) {
          setActiveSkillType(parsed[0].type);
        }
      } else if (activeSkillType !== '') {
        setActiveSkillType('');
      }
    } catch (e) {
      console.error("Failed to parse initial skills", e);
    }
  }, [initialSkillsText]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = skills.findIndex((i) => i.type === active.id);
      const newIndex = skills.findIndex((i) => i.type === over.id);
      const newItems = arrayMove(skills, oldIndex, newIndex);
      setSkills(newItems);
      onSave(JSON.stringify(newItems));
    }
  };

  const activeSkill = skills.find(s => s.type === activeSkillType);

  const handleAddSkill = () => {
    if (!newType.trim()) return;
    const updatedSkills = [...skills, { type: newType, rating: newRating, description: '' }];
    setSkills(updatedSkills);
    onSave(JSON.stringify(updatedSkills));
    setIsAdding(false);
    setNewType('');
    setNewRating(0);
    if (!activeSkillType) setActiveSkillType(newType);
  };

  const handleDeleteSkill = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSkills = skills.filter(s => s.type !== type);
    setSkills(updatedSkills);
    onSave(JSON.stringify(updatedSkills));
    if (activeSkillType === type) {
        setActiveSkillType(updatedSkills[0]?.type || '');
    }
  };

  const startEditing = (skill: Skill, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSkill(skill);
    setNewType(skill.type);
    setNewRating(skill.rating || 0);
  };

  const handleUpdateSkill = () => {
    if (!editingSkill || !newType.trim()) return;
    const updatedSkills = skills.map(s => 
        s.type === editingSkill.type ? { ...s, type: newType, rating: newRating } : s
    );
    setSkills(updatedSkills);
    onSave(JSON.stringify(updatedSkills));
    setEditingSkill(null);
    setNewType('');
    setNewRating(0);
    setActiveSkillType(newType);
  };

  const editor = useRef(null);
  const latestDescRef = useRef(tempDescription);

  useEffect(() => {
    latestDescRef.current = tempDescription;
  }, [tempDescription]);

  const config = useMemo(() => ({
    readonly: false,
    autofocus: true,
    placeholder: `Describe your ${activeSkillType} skills...`,
    height: '100%',
    minHeight: 300,
    showCharsCounter: true,
    showWordsCounter: true,
    showStatusbar: true, // This enables the "Powered by Jodit" section
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'lineHeight', 'brush', 'paragraph', '|',
      'image', 'file', 'link', 'symbol', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html'
  }), [activeSkillType]);

  const handleSaveContent = () => {
    if (!activeSkillType) return;
    
    const finalDescription = latestDescRef.current || (editor.current ? (editor.current as any).value : '') || tempDescription;
    // Transform Google Drive links to robust direct image URLs and ensure referrerpolicy is set
    // We use lh3.googleusercontent.com/d/ID which is often more reliable than uc?id=ID
    const transformedDescription = finalDescription
      .replace(
        /src="https?:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=)([^/?#&"]+)[^"]*"/g,
        'src="https://lh3.googleusercontent.com/d/$1"'
      )
      // Also catch any uc links and convert them to the more reliable lh3 format
      .replace(
        /src="https?:\/\/drive\.google\.com\/uc\?export=view&id=([^/?#&"]+)[^"]*"/g,
        'src="https://lh3.googleusercontent.com/d/$1"'
      )
      // Ensure all images have no-referrer policy
      .replace(/<img (?!.*?referrerpolicy)/g, '<img referrerpolicy="no-referrer" ');

    const updatedSkills = skills.map(s => 
        s.type === activeSkillType ? { ...s, description: transformedDescription, applications: tempApplications } : s
    );
    setSkills(updatedSkills);
    onSave(JSON.stringify(updatedSkills));
    setIsEditingContent(false);
  };

  const startEditingContent = () => {
    setTempDescription(activeSkill?.description || '');
    setTempApplications(activeSkill?.applications || []);
    setEditTab('text');
    setNewApp({});
    setIsEditingContent(true);
  };

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDeleteContent = () => {
    if (!activeSkillType) return;
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setIsConfirmingDelete(false), 3000);
      return;
    }
    
    const updatedSkills = skills.map(s => 
        s.type === activeSkillType ? { ...s, description: '', applications: [] } : s
    );
    setSkills(updatedSkills);
    onSave(JSON.stringify(updatedSkills));
    setIsConfirmingDelete(false);
  };

  const handleTabChange = (type: string) => {
    setActiveSkillType(type);
    setIsConfirmingDelete(false);
  };

  const getCategoryIcon = (index: number) => {
    const color = INFOGRAPHIC_COLORS[index % INFOGRAPHIC_COLORS.length];
    return <Award className="w-4 h-4 shrink-0" style={{ color: color.main }} />;
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-[#f6f8fc] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="flex flex-1 min-h-0 gap-0">
        {/* SIDEBAR - Gmail style */}
        <div className="group relative flex flex-col w-80 flex-shrink-0 min-h-0 pt-4" id="skill-tabs-column">
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between text-[#444746] mb-2 px-3">
              <span className="text-[14px] font-medium">Categories</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsAdding(true)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-[#444746]"
                  title="Add Category"
                >
                  <Plus size={16} />
                </button>
                {activeSkill && (
                  <>
                    <button 
                      onClick={(e) => startEditing(activeSkill, e)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                      title="Edit Category Name"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteSkill(activeSkill.type, e)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-600"
                      title="Delete Category"
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
              <div className="w-full h-auto flex flex-col pr-4 pl-14 py-2 bg-blue-50/50 rounded-r-full gap-2">
                <div className="flex items-center gap-2">
                  <input
                    placeholder="New Category..."
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-[#041e49] border-b border-[#041e49]/30 py-0.5 text-[14px]"
                    autoFocus
                    onKeyDown={e => { if(e.key === 'Enter') handleAddSkill(); }}
                  />
                  <select 
                    value={newRating}
                    onChange={e => setNewRating(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded text-[11px] px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {[0,1,2,3,4,5].map(v => (
                       <option key={v} value={v}>{v === 0 ? 'No Rate' : `${v} Stars`}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={skills.map(s => s.type)}
                strategy={verticalListSortingStrategy}
              >
                {skills.map((s, idx) => (
                  <SortableSkillItem
                    key={s.type}
                    skill={s}
                    index={idx}
                    activeSkillType={activeSkillType}
                    editingSkill={editingSkill}
                    newType={newType}
                    setNewType={setNewType}
                    handleTabChange={handleTabChange}
                    handleUpdateSkill={handleUpdateSkill}
                    getCategoryIcon={getCategoryIcon}
                    newRating={newRating}
                    setNewRating={setNewRating}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {(isAdding || editingSkill) && (
            <div className="p-4 flex gap-2">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingSkill(null);
                  setNewType('');
                }}
                className="flex-1 py-1.5 px-3 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-md transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={isAdding ? handleAddSkill : handleUpdateSkill}
                className="flex-1 py-1.5 px-3 text-xs font-bold bg-[#041e49] text-white rounded-md hover:bg-[#001d35] transition-all shadow-sm"
              >
                Save
              </button>
            </div>
          )}
        </div>
        
        {/* CONTENT AREA - White space with left border */}
        <div className="relative flex-1 flex flex-col min-h-0 bg-white border-l border-gray-200 group/content" id="skill-content-column">
          {isEditingContent ? (
            <div className="flex flex-col h-full relative">
              <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-4 bg-gray-50 shrink-0">
                <button 
                  onClick={() => setEditTab('text')}
                  className={`text-sm font-bold pb-2 border-b-2 transition-colors ${editTab === 'text' ? 'border-[#004a6c] text-[#004a6c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Text Content
                </button>
                <button 
                  onClick={() => setEditTab('applications')}
                  className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${editTab === 'applications' ? 'border-[#004a6c] text-[#004a6c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <Layers size={14} /> Applications
                </button>
              </div>

              <div className="flex-1 min-h-0 bg-white overflow-hidden relative">
                {editTab === 'text' ? (
                  <div className="h-full [&>div]:h-full [&_.jodit-container]:!h-full [&_.jodit-container]:!flex [&_.jodit-container]:!flex-col [&_.jodit-workplace]:!flex-1 [&_.jodit-workplace]:!min-h-0 [&_.jodit-workplace]:!overflow-y-auto [&_.jodit-toolbar__box]:!flex-none [&_.jodit-toolbar__box]:!static !outline-none [&_.jodit-status-bar]:!flex-none [&_.jodit-container]:!border-none [&_.jodit-workplace]:!border-none pb-14 flex items-center justify-center bg-white">
                    <Suspense fallback={
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 font-medium">
                        <Loader2 className="w-8 h-8 animate-spin text-[#004a6c]" />
                        <span className="text-sm">Loading rich text editor...</span>
                      </div>
                    }>
                      <JoditEditor
                        ref={editor}
                        value={tempDescription}
                        config={{...config, height: '100%', minHeight: undefined, toolbarSticky: false}}
                        onChange={newContent => {
                          latestDescRef.current = newContent;
                        }}
                        onBlur={newContent => {
                          latestDescRef.current = newContent;
                          setTempDescription(newContent);
                        }}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto p-4 pb-20 bg-gray-50">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      {/* LEFT COLUMN: Edit/Add Form (Compact, narrower, sticky) */}
                      <div className="w-full lg:w-[260px] xl:w-[290px] shrink-0 order-1 lg:order-1 bg-white p-3 rounded-lg border border-gray-200 shadow-sm sticky top-0">
                        <h3 className="text-xs font-bold text-gray-800 mb-3">{newApp.id ? 'Edit Application' : 'Add Application'}</h3>
                        <div className="flex flex-col gap-2.5 mb-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Application Name</label>
                            <input 
                              placeholder="Application Name" 
                              className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs outline-none focus:border-[#004a6c] focus:ring-1 focus:ring-[#004a6c]/20 transition-all font-medium"
                              value={newApp.name || ''}
                              onChange={e => setNewApp({...newApp, name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Image Link (URL) - Optional</label>
                            <input 
                              placeholder="Image Link (URL) - Optional" 
                              className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs outline-none focus:border-[#004a6c] focus:ring-1 focus:ring-[#004a6c]/20 transition-all"
                              value={newApp.image || ''}
                              onChange={e => setNewApp({...newApp, image: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Short Description - Optional</label>
                            <input 
                              placeholder="Short Description - Optional" 
                              className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs outline-none focus:border-[#004a6c] focus:ring-1 focus:ring-[#004a6c]/20 transition-all"
                              value={newApp.description || ''}
                              onChange={e => setNewApp({...newApp, description: e.target.value})}
                              onKeyDown={e => {
                                 if(e.key === 'Enter' && newApp.name) {
                                   if (newApp.id) {
                                     setTempApplications(tempApplications.map(a => a.id === newApp.id ? newApp as Application : a));
                                   } else {
                                     setTempApplications([...tempApplications, { ...newApp, id: Date.now().toString() } as Application]);
                                   }
                                   setNewApp({});
                                 }
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (newApp.name) {
                                if (newApp.id) {
                                  setTempApplications(tempApplications.map(a => a.id === newApp.id ? newApp as Application : a));
                                } else {
                                  setTempApplications([...tempApplications, { ...newApp, id: Date.now().toString() } as Application]);
                                }
                                setNewApp({});
                              }
                            }}
                            disabled={!newApp.name}
                            className="bg-[#004a6c] text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-[#003752] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center flex-1 flex items-center justify-center gap-1.5"
                          >
                            {newApp.id ? 'Save Changes' : 'Add Application'}
                          </button>
                          {newApp.id && (
                            <button 
                              onClick={() => setNewApp({})}
                              className="bg-gray-100 text-gray-700 px-2.5 py-2 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Saved Grid */}
                      <div className="flex-1 w-full order-2 lg:order-2">
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-gray-800">Saved Applications</h3>
                          <p className="text-xs text-gray-500">The applications grid is shown below. Hover over any to edit or delete.</p>
                        </div>
                        {tempApplications.length > 0 ? (
                          <div className="grid gap-x-3 gap-y-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mt-8">
                            {tempApplications.map((app, idx) => {
                               const color = INFOGRAPHIC_COLORS[idx % INFOGRAPHIC_COLORS.length];
                               return (
                                 <div key={app.id} className="relative group flex items-center transition-all">
                                    {/* Action Buttons overlap */}
                                    <div className="absolute -top-3 right-0 flex gap-1 z-40 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => setNewApp(app)}
                                        className="p-1 px-1.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                                      >
                                        EDIT
                                      </button>
                                      <button 
                                        onClick={() => setTempApplications(tempApplications.filter(a => a.id !== app.id))}
                                        className="p-1 px-1.5 bg-red-50 text-red-600 rounded text-[8px] font-black border border-red-100 shadow-sm hover:bg-red-600 hover:text-white transition-all"
                                      >
                                        DEL
                                      </button>
                                    </div>

                                    {/* Circle Icon Part */}
                                    <div className="shrink-0 relative z-20">
                                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center p-0.5 border border-gray-100">
                                         <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden border" style={{ borderColor: color.main }}>
                                            {app.image ? (
                                               <img 
                                                  src={getDirectImageUrl(app.image)} 
                                                  referrerPolicy="no-referrer" 
                                                  className="w-2/3 h-2/3 object-contain" 
                                                  alt="" 
                                               />
                                            ) : (
                                               <Layers className="w-4 h-4" style={{ color: color.main }} />
                                            )}
                                         </div>
                                      </div>
                                      {/* Arrow Triangle */}
                                      <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[4px] z-30" style={{ borderLeftColor: color.main }}></div>
                                    </div>

                                    {/* Description Pill Part */}
                                    <div className="flex-1 -ml-4 bg-white border border-gray-100 rounded-r-xl shadow-sm py-1.5 pl-6 pr-2 min-h-[3rem] flex flex-col justify-center">
                                       <h4 className="font-black text-[0.5625rem] text-[#004a6c] mb-0 uppercase tracking-tight line-clamp-1">{app.name}</h4>
                                       {app.description && (
                                          <p className="text-[0.4375rem] text-gray-400 leading-tight line-clamp-2 italic">
                                             {app.description}
                                          </p>
                                       )}
                                    </div>
                                 </div>
                               );
                            })}
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center flex flex-col items-center justify-center">
                            <Layers className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm font-medium">No applications added yet.</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs leading-normal">Use the form on the left side of the panel to start populating your technology stack.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                <button 
                  onClick={() => setIsEditingContent(false)}
                  className="px-5 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveContent}
                  className="px-6 py-2 text-sm font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0 group relative" id="skill-content-container">
              {activeSkillType && (
                /* Compact Header for Skill metadata, matching Job Experience Header style */
                <div className="shrink-0 border-b border-gray-100 bg-gray-50/10 px-6 py-3.5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xs md:text-sm font-bold text-[#041e49] tracking-wider truncate">
                        {activeSkillType}
                      </h1>
                      <div className="flex items-center gap-1 text-blue-600 font-bold text-[10px] md:text-xs tracking-wider truncate mt-0.5">
                        <span className="text-gray-400 font-medium text-[9px] uppercase tracking-wider mr-1">Skill Rating:</span>
                        {activeSkill?.rating && activeSkill.rating > 0 ? (
                          <div className="flex gap-0.5 items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={i < activeSkill.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium italic text-[9px] lowercase">unrated</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-medium text-gray-400 whitespace-nowrap md:text-right shrink-0 mt-0.5 md:mt-0">
                      <span className="text-[#041e49] font-bold bg-[#d3e3fd]/40 px-2 py-0.5 rounded-md border border-blue-100/30 text-[9px] uppercase tracking-wider">
                        Professional Skill Group
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto px-6 pt-3 pb-10 prose prose-sm max-w-none prose-slate prose-img:rounded-xl prose-img:mx-auto prose-img:max-h-[350px] prose-img:object-contain [&_>div>*:first-child]:mt-0 [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:mt-2 [&_h3]:mb-0.5 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5" id="skill-content-body">
                {hasCleanDescription(activeSkill?.description) && (
                  <div className="skill-content-html prose prose-blue max-w-none prose-sm text-slate-600 mb-6" dangerouslySetInnerHTML={{ __html: activeSkill.description }} />
                )}

                  {activeSkill?.applications && activeSkill.applications.length > 0 && (
                    <div className="mt-0">
                     <div className="grid gap-x-4 gap-y-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 w-full max-w-none not-prose mt-2 pb-6 px-0">
                       {activeSkill.applications.map((app, idx) => {
                          const color = INFOGRAPHIC_COLORS[idx % INFOGRAPHIC_COLORS.length];
                          return (
                            <div key={app.id} className="relative group flex items-center transition-all hover:scale-[1.01]">
                               {/* Circle Icon Part */}
                               <div className="shrink-0 relative z-20">
                                 <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white shadow-sm flex items-center justify-center p-0.5 border border-gray-50/50">
                                    <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 border" style={{ borderColor: color.main }}>
                                       {app.image ? (
                                          <img 
                                             src={getDirectImageUrl(app.image)} 
                                             referrerPolicy="no-referrer" 
                                             className="w-2/3 h-2/3 object-contain" 
                                             alt={app.name} 
                                          />
                                       ) : (
                                          <Layers className="w-4 h-4" style={{ color: color.main }} />
                                       )}
                                    </div>
                                 </div>
                                 {/* Arrow Triangle */}
                                 <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[4px] z-30" style={{ borderLeftColor: color.main }}></div>
                               </div>

                               {/* Description Pill Part */}
                               <div className="flex-1 -ml-3 bg-white border border-gray-100 rounded-r-xl shadow-sm py-1 pl-4 pr-3 min-h-[2.5rem] md:min-h-[2.75rem] flex flex-col justify-center">
                                  <h4 className="font-bold text-[0.625rem] md:text-[0.6875rem] text-[#004a6c] mb-0 uppercase tracking-tight line-clamp-1">{app.name}</h4>
                                  {app.description && (
                                     <p className="text-[0.5rem] md:text-[0.5625rem] text-gray-400 leading-tight line-clamp-2 italic">
                                        {app.description}
                                     </p>
                                  )}
                               </div>
                            </div>
                          );
                       })}
                     </div>
                    </div>
                 )}

                {!hasCleanDescription(activeSkill?.description) && (!activeSkill?.applications || activeSkill.applications.length === 0) && (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <p className="text-gray-400 italic mb-4">No content added for this skill yet.</p>
                  </div>
                )}
              </div>

              {activeSkillType && (
                <div className="absolute bottom-4 right-4 p-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" id="skill-content-footer">
                  <button 
                    onClick={startEditingContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                    id="add-content-button"
                  >
                    <Edit2 size={12} /> {(hasCleanDescription(activeSkill?.description) || (activeSkill?.applications && activeSkill.applications.length > 0)) ? 'Edit Content' : 'Add Content'}
                  </button>
                  {(hasCleanDescription(activeSkill?.description) || (activeSkill?.applications && activeSkill.applications.length > 0)) && (
                    <button 
                        onClick={handleDeleteContent}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all shadow-sm ${isConfirmingDelete ? 'bg-red-500 text-white' : 'text-red-500 bg-white border border-red-100 hover:bg-red-50'}`}
                        title={isConfirmingDelete ? "Click again to confirm" : "Delete content"}
                        id="delete-content-button"
                    >
                        <Trash2 size={12} /> {isConfirmingDelete ? 'Confirm?' : 'Clear'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
