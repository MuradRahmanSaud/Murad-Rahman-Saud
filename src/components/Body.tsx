import React, { useState, useMemo } from 'react';
import { Edit2, Check, X, Loader2, Star, Award, Trophy, Heart, Circle, Briefcase, GraduationCap } from 'lucide-react';
import JoditEditor from 'jodit-react';
import { SkillManager } from './SkillManager';
import { JobExperienceManager } from './JobExperienceManager';
import { EducationBackgroundManager } from './EducationBackgroundManager';
import { FormattedText } from './FormattedText';
import { type PortfolioData } from '../lib/sheet';

interface BodyProps {
  data: PortfolioData;
  name: string;
  title: string;
  summary: string | undefined;
  currentExperience: string;
  
  // Name editing
  isEditingName: boolean;
  setIsEditingName: (val: boolean) => void;
  editedName: string;
  setEditedName: (val: string) => void;
  handleSaveName: () => void;
  isUpdatingName: boolean;

  // Title editing
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  editedTitle: string;
  setEditedTitle: (val: string) => void;
  handleSaveTitle: () => void;
  isUpdatingTitle: boolean;

  // Summary editing
  isEditingSummary: boolean;
  setIsEditingSummary: (val: boolean) => void;
  editedSummary: string;
  setEditedSummary: (val: string) => void;
  handleSaveSummary: () => void;
  isUpdatingSummary: boolean;

  // Skills editing
  handleSaveSkills: (text: string) => void;
  isUpdatingSkills: boolean;

  // Experience editing
  handleSaveExperience: (text: string) => void;
  isUpdatingExperience: boolean;

  // Education editing
  handleSaveEducation: (text: string) => void;
  isUpdatingEducation: boolean;
}

export function Body({
  data,
  name,
  title,
  summary,
  currentExperience,
  isEditingName,
  setIsEditingName,
  editedName,
  setEditedName,
  handleSaveName,
  isUpdatingName,
  isEditingTitle,
  setIsEditingTitle,
  editedTitle,
  setEditedTitle,
  handleSaveTitle,
  isUpdatingTitle,
  isEditingSummary,
  setIsEditingSummary,
  editedSummary,
  setEditedSummary,
  handleSaveSummary,
  isUpdatingSummary,
  handleSaveSkills,
  isUpdatingSkills,
  handleSaveExperience,
  isUpdatingExperience,
  handleSaveEducation,
  isUpdatingEducation
}: BodyProps) {
  const [activeTab, setActiveTab] = useState('Job Experience');
  const tabs = ['Job Experience', 'Education Background', 'Skills', 'Certifications', 'Achievements', 'Interests'];

  const tabContent: Record<string, React.ReactNode> = {
    'Job Experience': (
        <div className="relative flex-1 flex flex-col min-h-0">
            <JobExperienceManager 
              initialData={data['Job Experiance'] || data['Job Experience'] || ''} 
              onSave={handleSaveExperience} 
            />
            {isUpdatingExperience && (
                <div className="absolute top-4 right-4 z-50">
                    <Loader2 className="w-5 h-5 text-[#004a6c] animate-spin" />
                </div>
            )}
        </div>
    ),
    'Education Background': (
        <div className="relative flex-1 flex flex-col min-h-0">
            <EducationBackgroundManager 
              initialData={data['Education Background'] || ''} 
              onSave={handleSaveEducation} 
            />
            {isUpdatingEducation && (
                <div className="absolute top-4 right-4 z-50">
                    <Loader2 className="w-5 h-5 text-[#004a6c] animate-spin" />
                </div>
            )}
        </div>
    ),
    'Skills': (
        <div className="relative flex-1 flex flex-col min-h-0">
            <SkillManager initialSkillsText={data['My Skills'] || '[]'} onSave={handleSaveSkills} />
            {isUpdatingSkills && (
                <div className="absolute top-0 right-0 p-2">
                    <Loader2 className="w-4 h-4 text-[#004a6c] animate-spin" />
                </div>
            )}
        </div>
    ),
    'Certifications': <FormattedText text={data['Certifications'] || 'No certifications listed.'} />,
    'Achievements': (
      <div className="text-slate-600 text-sm leading-relaxed">
        {data['Achievements'] && <FormattedText text={data['Achievements']} />}
        {data['Success Stories'] && (
          <div className="mt-2">
            <FormattedText text={data['Success Stories']} />
          </div>
        )}
        {!data['Achievements'] && !data['Success Stories'] && <p>No achievements listed.</p>}
      </div>
    ),
    'Interests': <FormattedText text={data['Interests'] || 'No interests listed.'} />,
  };

  const titleConfig = useMemo(() => ({
    readonly: isUpdatingTitle,
    placeholder: 'Enter short description...',
    statusbar: false,
    height: 120,
    buttons: ['bold', 'italic', 'underline', 'strikethrough', 'fontsize', 'brush', 'align', 'ul', 'ol', 'paragraph', 'undo', 'redo'],
    colorPickerDefaultTab: 'color',
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
            this.selection.insertHTML(escapedText);
          }).catch(err => {
            console.error('Clipboard read failed: ', err);
          });
        }
      }
    }
  }), [isUpdatingTitle]);
  
  const summaryConfig = useMemo(() => ({
    readonly: isUpdatingSummary,
    placeholder: 'Enter your professional summary...',
    statusbar: false,
    height: typeof window !== 'undefined' && window.innerWidth < 640 ? 200 : 250,
    buttons: ['bold', 'italic', 'underline', 'strikethrough', 'fontsize', 'brush', 'align', 'ul', 'ol', 'paragraph', 'undo', 'redo'],
    colorPickerDefaultTab: 'color',
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
            this.selection.insertHTML(escapedText);
          }).catch(err => {
            console.error('Clipboard read failed: ', err);
          });
        }
      }
    }
  }), [isUpdatingSummary]);

  return (
    <div className="w-full h-full bg-white p-6 lg:p-8 flex flex-col overflow-hidden">
          
      {/* HEADER */}
      <div className="relative -mt-6 -mx-6 lg:-mt-8 lg:-mx-8 mb-2 bg-white shadow-none h-[100px] sm:h-[128px]">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Right Wave & Squares */}
          <div className="absolute right-0 top-0 bottom-0 w-[60%] pointer-events-none overflow-hidden">
            <svg className="absolute right-0 top-0 h-[100.5%] w-[120%]" preserveAspectRatio="none" viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#004a6c" />
                  <stop offset="100%" stopColor="#004a6c" />
                </linearGradient>
              </defs>
              <path d="M 0 220 C 150 200, 250 80, 500 120 C 700 150, 850 0, 1050 -20 L 1050 250 L 0 250 Z" fill="url(#waveGrad)" />
              {/* Floating Squares */}
              <rect x="700" y="120" width="12" height="12" rx="3" fill="none" stroke="white" strokeWidth="1.5" className="opacity-80" />
              <rect x="740" y="100" width="14" height="14" rx="3" fill="none" stroke="white" strokeWidth="1.5" className="opacity-80" />
              <rect x="730" y="140" width="22" height="22" rx="5" fill="none" stroke="white" strokeWidth="1.5" className="opacity-80" />
              <rect x="760" y="120" width="38" height="38" rx="8" fill="none" stroke="white" strokeWidth="1.5" className="opacity-40" />
              <rect x="850" y="60" width="28" height="28" rx="6" fill="none" stroke="white" strokeWidth="1.5" className="opacity-40" />
              <rect x="910" y="75" width="45" height="45" rx="10" fill="none" stroke="white" strokeWidth="1.5" className="opacity-40" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 px-6 sm:px-8 lg:px-10 h-full flex flex-col justify-center">
          {isEditingName ? (
          <div className="flex items-center gap-2 mb-1">
            <input 
              type="text" 
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              disabled={isUpdatingName}
              className="border-b-2 border-slate-400 text-[#004a6c] text-xl sm:text-2xl font-bold px-1 py-0.5 w-full max-w-[400px] outline-none bg-transparent"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            {isUpdatingName ? (
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={handleSaveName} className="p-1 hover:bg-slate-100 rounded text-green-600">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsEditingName(false); setEditedName(name); }} className="p-1 hover:bg-slate-100 rounded text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 group mb-0.5">
            <h1 className="text-[clamp(1.25rem,4vw,2.25rem)] font-bold tracking-[0.05em] bg-clip-text text-transparent bg-gradient-to-r from-[#004a6c] to-[#004a6c] uppercase leading-tight">
              {name.split(' ').map((part, i, arr) => (
                <span key={i} className={i === arr.length - 1 ? "font-light" : ""}>
                  {part} {i !== arr.length - 1 && ' '}
                </span>
              ))}
            </h1>
            <button 
              onClick={() => { setEditedName(name); setIsEditingName(true); }}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded text-[#004a6c] transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        <div className="flex flex-col gap-1 mt-0.5 group/title-body relative">
          {title ? (
            <div className="flex items-start gap-2">
              <div className="text-[clamp(0.7rem,1.5vw,0.875rem)] text-slate-500 font-medium leading-tight italic [&_p]:m-0">
                {title?.trim().startsWith('<') ? (
                  <div dangerouslySetInnerHTML={{ __html: title }} />
                ) : (
                  <FormattedText text={title} />
                )}
              </div>
              <button
                onClick={() => { setEditedTitle(title); setIsEditingTitle(true); }}
                className="p-1 opacity-0 group-hover/title-body:opacity-100 hover:bg-slate-100 rounded text-slate-400 transition-all shrink-0 mt-0"
                title="Edit Title"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditedTitle(''); setIsEditingTitle(true); }}
              className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <Edit2 className="w-2.5 h-2.5" /> Add title
            </button>
          )}

          {isEditingTitle && (
            <div className="absolute top-0 left-0 mt-6 z-50 w-[90vw] max-w-[600px] flex flex-col gap-2 bg-white p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100" style={{ transform: 'translateY(0%)' }}>
              <div className="border border-slate-200 rounded overflow-hidden">
                <JoditEditor
                  value={editedTitle}
                  config={titleConfig}
                  onBlur={newContent => setEditedTitle(newContent)}
                />
              </div>
              <div className="flex justify-end items-center gap-2">
                {isUpdatingTitle ? (
                  <Loader2 className="w-4 h-4 text-[#004a6c] animate-spin" />
                ) : (
                  <>
                    <button onClick={() => { setIsEditingTitle(false); setEditedTitle(title); }} className="px-3 py-1.5 text-xs font-medium hover:bg-slate-100 rounded text-slate-600 transition-colors">Cancel</button>
                    <button onClick={handleSaveTitle} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#004a6c] text-white rounded hover:bg-[#003752] transition-colors">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        
        {/* ABOUT */}
        <section className="group/about shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold tracking-widest text-[#004a6c] uppercase">About</h2>
            <div className="flex-1 h-[1px] bg-slate-300"></div>
            {summary && !isEditingSummary && (
              <button 
                onClick={() => {
                  setEditedSummary(summary || '');
                  setIsEditingSummary(true);
                }}
                className="p-1.5 hover:bg-slate-100 rounded text-[#004a6c] transition-all opacity-0 group-hover/about:opacity-100"
                title="Edit Professional Summary"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {isEditingSummary ? (
            <div className="flex flex-col gap-3">
              <div className="border border-slate-200 rounded overflow-hidden">
                <JoditEditor
                  value={editedSummary}
                  config={summaryConfig}
                  onBlur={newContent => setEditedSummary(newContent)}
                />
              </div>
              <div className="flex justify-end items-center gap-2">
                  {isUpdatingSummary ? (
                    <Loader2 className="w-5 h-5 text-[#004a6c] animate-spin" />
                  ) : (
                    <>
                      <button onClick={() => setIsEditingSummary(false)} className="px-4 py-2 text-sm font-medium hover:bg-slate-100 rounded text-slate-600 transition-colors">Cancel</button>
                      <button onClick={handleSaveSummary} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#004a6c] text-white rounded hover:bg-[#003752] transition-colors">
                        <Check className="w-4 h-4" /> Save Summary
                      </button>
                    </>
                  )}
              </div>
            </div>
          ) : summary ? (
            <div className="text-slate-600 text-sm leading-relaxed text-left sm:text-justify [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1">
              {summary?.trim().startsWith('<') ? (
                <div dangerouslySetInnerHTML={{ __html: summary }} />
              ) : (
                <FormattedText text={summary} />
              )}
            </div>
          ) : (
            <button 
              onClick={() => {
                setEditedSummary('');
                setIsEditingSummary(true);
              }}
              className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-[#004a6c] px-2.5 py-1 rounded transition-all"
            >
              <Edit2 className="w-3 h-3" /> Add Professional Summary
            </button>
          )}
        </section>

        {/* TABBED CONTENT */}
        <section className="mt-8 flex-1 flex flex-col min-h-0 bg-white">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              let Icon = Circle;
              if (tab === 'Job Experience') Icon = Briefcase;
              else if (tab === 'Education Background') Icon = GraduationCap;
              else if (tab === 'Skills') Icon = Star;
              else if (tab === 'Certifications') Icon = Award;
              else if (tab === 'Achievements') Icon = Trophy;
              else if (tab === 'Interests') Icon = Heart;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab
                      ? 'border-[#004a6c] text-[#004a6c]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab}
                </button>
              );
            })}
          </div>
          <div className={`py-2 flex-1 min-h-0 ${['Skills', 'Job Experience', 'Education Background'].includes(activeTab) ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
            {tabContent[activeTab]}
          </div>
        </section>


        {/* KEY PROJECTS */}
        {data['Key Projects'] && (
          <section className="shrink-0 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold tracking-widest text-[#004a6c] uppercase">Key Projects</h2>
              <div className="flex-1 h-[1px] bg-slate-300"></div>
            </div>
            <div className="text-slate-600 text-sm leading-relaxed [&_ul]:pl-4 [&_li]:mb-1">
              <FormattedText text={data['Key Projects']} />
            </div>
          </section>
        )}



      </div>
    </div>
  );
}
