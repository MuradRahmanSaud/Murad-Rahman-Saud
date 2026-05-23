import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Edit2, Check, X, Loader2, Star, Award, Trophy, Heart, Circle, Briefcase, GraduationCap, Phone, Mail, MapPin, Link as LinkIcon, Contact, Code } from 'lucide-react';

const JoditEditor = lazy(() => import('jodit-react'));
import { SkillManager } from './SkillManager';
import { JobExperienceManager } from './JobExperienceManager';
import { EducationBackgroundManager } from './EducationBackgroundManager';
import { ProjectContributionManager } from './ProjectContributionManager';
import { FormattedText } from './FormattedText';
import { type PortfolioData, updateSheetValue } from '../lib/sheet';

interface BodyProps {
  data: PortfolioData;
  name: string;
  title: string;
  summary: string | undefined;
  currentExperience: string;
  onUpdateField: (key: string, value: string) => void;
  fullName: string;
  
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

  // Project Contribution editing
  handleSaveProjectContribution: (text: string) => void;
  isUpdatingProjectContribution: boolean;
}

export function Body({
  data,
  name,
  title,
  summary,
  currentExperience,
  onUpdateField,
  fullName,
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
  isUpdatingEducation,
  handleSaveProjectContribution,
  isUpdatingProjectContribution
}: BodyProps) {
  const [activeTab, setActiveTab] = useState('Job Experience');
  const tabs = ['Job Experience', 'Education Background', 'Skills', 'Project Contributions', 'Certifications', 'Achievements', 'Interests', 'Contact'];

  const contactRaw = data['Contact'] || '';
  
  const parseFromContact = (label: string) => {
    if (!contactRaw) return '';
    const lines = contactRaw.split('\n');
    const line = lines.find(l => l.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return line ? line.substring(line.indexOf(':') + 1).trim() : '';
  };

  const mobile = data['Mobile'] || parseFromContact('Phone');
  const email = data['E-mail'] || parseFromContact('Email');
  const social = data['Social Media'] || parseFromContact('LinkedIn');
  const address = data['Address'] || parseFromContact('Location');

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ mobile, email, address, social });
  const [isSavingContact, setIsSavingContact] = useState(false);

  const handleStartEditContact = () => {
    setContactForm({
      mobile: data['Mobile'] || parseFromContact('Phone'),
      email: data['E-mail'] || parseFromContact('Email'),
      address: data['Address'] || parseFromContact('Location'),
      social: data['Social Media'] || parseFromContact('LinkedIn')
    });
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    setIsSavingContact(true);
    const contactInfo = [
      contactForm.mobile ? `Phone: ${contactForm.mobile}` : '',
      contactForm.email ? `Email: ${contactForm.email}` : '',
      contactForm.address ? `Location: ${contactForm.address}` : '',
      contactForm.social ? `LinkedIn: ${contactForm.social}` : '',
    ].filter(Boolean).join('\n');

    onUpdateField('Contact', contactInfo);
    onUpdateField('Mobile', contactForm.mobile);
    onUpdateField('E-mail', contactForm.email);
    onUpdateField('Address', contactForm.address);
    onUpdateField('Social Media', contactForm.social);

    try {
      await updateSheetValue(fullName, 'Contact', contactInfo);
      setIsEditingContact(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    } finally {
      setIsSavingContact(false);
    }
  };

  const renderTabContent = (tab: string) => {
    switch (tab) {
      case 'Job Experience':
        return (
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
        );
      case 'Education Background':
        return (
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
        );
      case 'Skills':
        return (
          <div className="relative flex-1 flex flex-col min-h-0">
            <SkillManager initialSkillsText={data['My Skills'] || '[]'} onSave={handleSaveSkills} />
            {isUpdatingSkills && (
              <div className="absolute top-0 right-0 p-2">
                <Loader2 className="w-4 h-4 text-[#004a6c] animate-spin" />
              </div>
            )}
          </div>
        );
      case 'Project Contributions':
        return (
          <div className="relative flex-1 flex flex-col min-h-0">
            <ProjectContributionManager 
              initialData={data['Project Contributions'] || data['Project Contribution'] || ''} 
              onSave={handleSaveProjectContribution} 
            />
            {isUpdatingProjectContribution && (
              <div className="absolute top-4 right-4 z-50">
                <Loader2 className="w-5 h-5 text-[#004a6c] animate-spin" />
              </div>
            )}
          </div>
        );
      case 'Certifications':
        return (
          <div className="prose prose-blue max-w-none prose-sm mt-2 text-slate-600">
            <FormattedText text={data['Certifications'] || 'No certifications listed.'} />
          </div>
        );
      case 'Achievements':
        return (
          <div className="prose prose-blue max-w-none prose-sm mt-2 text-slate-600">
            {data['Achievements'] && <FormattedText text={data['Achievements']} />}
            {data['Success Stories'] && (
              <div className="mt-3">
                <FormattedText text={data['Success Stories']} />
              </div>
            )}
            {!data['Achievements'] && !data['Success Stories'] && <p className="italic text-gray-400">No achievements listed.</p>}
          </div>
        );
      case 'Interests':
        return (
          <div className="prose prose-blue max-w-none prose-sm mt-2 text-slate-600">
            <FormattedText text={data['Interests'] || 'No interests listed.'} />
          </div>
        );
      case 'Contact':
        return (
          <div className="p-5 bg-blue-50/10 border border-blue-50/50 rounded-xl mt-2 flex flex-col gap-5 relative">
            {isEditingContact ? (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Contact className="w-4 h-4 text-[#004a6c]" />
                    Edit Contact Information
                  </h3>
                  <button 
                    onClick={() => setIsEditingContact(false)} 
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#004a6c]" /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={contactForm.mobile}
                      onChange={(e) => setContactForm(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-[#004a6c] tracking-wide"
                      placeholder="+880 1XXX XXXXXX"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#004a6c]" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-[#004a6c]"
                      placeholder="example@mail.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#004a6c]" /> Location / Address
                    </label>
                    <input
                      type="text"
                      value={contactForm.address}
                      onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-[#004a6c]"
                      placeholder="Dhaka, Bangladesh"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#004a6c]" /> LinkedIn / Social
                    </label>
                    <input
                      type="text"
                      value={contactForm.social}
                      onChange={(e) => setContactForm(prev => ({ ...prev, social: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-[#004a6c]"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3 mt-2">
                  <button 
                    onClick={() => setIsEditingContact(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#004a6c]/70 hover:text-[#004a6c] rounded-lg hover:bg-slate-100 transition-colors"
                    disabled={isSavingContact}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveContact}
                    disabled={isSavingContact}
                    className="bg-[#004a6c] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-[#003c58] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSavingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
                    <Contact className="w-4 h-4 text-[#004a6c]" />
                    Contact Details
                  </h3>
                  <button
                    onClick={handleStartEditContact}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white text-xs font-bold text-[#004a6c] transition-all"
                  >
                    <Edit2 className="w-3" /> Edit Contact
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone card */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 hover:border-slate-200/80 rounded-xl transition-all shadow-sm">
                    <div className="p-2.5 bg-blue-50 text-[#004a6c] rounded-xl shrink-0">
                      <Phone className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</span>
                      <span className="text-sm font-semibold text-slate-700 break-words">
                        {mobile || <span className="text-slate-400 italic font-normal">Not Provided</span>}
                      </span>
                    </div>
                  </div>

                  {/* Email card */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 hover:border-slate-200/80 rounded-xl transition-all shadow-sm">
                    <div className="p-2.5 bg-blue-50 text-[#004a6c] rounded-xl shrink-0">
                      <Mail className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</span>
                      {email ? (
                        <a href={`mailto:${email}`} className="text-sm font-semibold text-slate-700 break-all hover:text-[#004a6c] hover:underline">
                          {email}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400 italic font-normal">Not Provided</span>
                      )}
                    </div>
                  </div>

                  {/* Location card */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 hover:border-slate-200/80 rounded-xl transition-all shadow-sm">
                    <div className="p-2.5 bg-blue-50 text-[#004a6c] rounded-xl shrink-0">
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location / Address</span>
                      <span className="text-sm font-semibold text-slate-700 break-words">
                        {address || <span className="text-slate-400 italic font-normal">Not Provided</span>}
                      </span>
                    </div>
                  </div>

                  {/* LinkedIn card */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 hover:border-slate-200/80 rounded-xl transition-all shadow-sm">
                    <div className="p-2.5 bg-blue-50 text-[#004a6c] rounded-xl shrink-0">
                      <LinkIcon className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LinkedIn / Web Portfolio</span>
                      {social ? (
                        <a 
                          href={social.startsWith('http') ? social : `https://${social}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm font-semibold text-slate-700 break-words hover:text-[#004a6c] hover:underline"
                        >
                          {social}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400 italic font-normal">Not Provided</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const titleConfig = useMemo(() => ({
    readonly: isUpdatingTitle,
    autofocus: true,
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
  }), [isUpdatingTitle]);
  
  const summaryConfig = useMemo(() => ({
    readonly: isUpdatingSummary,
    autofocus: true,
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
              <div className="border border-slate-200 rounded overflow-hidden bg-slate-50 min-h-[120px] flex items-center justify-center">
                <Suspense fallback={
                  <div className="flex items-center gap-2 p-4 text-xs text-slate-500 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004a6c]" /> Loading Editor...
                  </div>
                }>
                  <JoditEditor
                    value={editedTitle}
                    config={titleConfig}
                    onBlur={newContent => setEditedTitle(newContent)}
                  />
                </Suspense>
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
              <div className="border border-slate-200 rounded overflow-hidden bg-slate-50 min-h-[200px] flex items-center justify-center">
                <Suspense fallback={
                  <div className="flex items-center gap-2 p-4 text-xs text-slate-500 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004a6c]" /> Loading Editor...
                  </div>
                }>
                  <JoditEditor
                    value={editedSummary}
                    config={summaryConfig}
                    onBlur={newContent => setEditedSummary(newContent)}
                  />
                </Suspense>
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
              else if (tab === 'Project Contributions') Icon = Code;
              else if (tab === 'Certifications') Icon = Award;
              else if (tab === 'Achievements') Icon = Trophy;
              else if (tab === 'Interests') Icon = Heart;
              else if (tab === 'Contact') Icon = Contact;

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
          <div className={`py-2 flex-1 min-h-0 ${['Skills', 'Job Experience', 'Education Background', 'Project Contributions'].includes(activeTab) ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
            {renderTabContent(activeTab)}
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
