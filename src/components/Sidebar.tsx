import React, { useState, useMemo } from 'react';
import { Phone, Mail, Link as LinkIcon, MapPin, Edit2, ImagePlus, Check, X, Loader2, RefreshCw, Briefcase, GraduationCap, Contact as ContactIcon, Star, Code } from 'lucide-react';
import { FormattedText } from './FormattedText';
import { ExperienceTimeline } from './ExperienceTimeline';
import { parseEducation, getYearOnly } from './EducationBackgroundManager';
import type { PortfolioData } from '../lib/sheet';
import { updateSheetValue } from '../lib/sheet';
import { calculateTotalExperience } from '../lib/experience';

import { ContactEdit } from './ContactEdit';

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

interface SidebarProps {
  data: PortfolioData;
  profilePic: string | undefined;
  coverPhoto: string | undefined;
  name: string;
  title: string;
  onUpdateField: (key: string, value: string) => void;
  currentExperience: string;
  currentEducation: string;
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
  isSyncing: boolean;
  onSync: () => void;
}

export function Sidebar({ 
  data, 
  profilePic, 
  coverPhoto, 
  name, 
  title,
  onUpdateField, 
  currentExperience,
  currentEducation, 
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
  isSyncing,
  onSync
}: SidebarProps) {
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [coverInput, setCoverInput] = useState('');
  const [profileInput, setProfileInput] = useState('');
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Parse Job Experience exactly like how JobExperienceManager does
  const jobEntries = useMemo(() => {
    if (!currentExperience || !currentExperience.trim()) return [];
    try {
      const parts = currentExperience.split('\n\n---\n\n').filter(p => p.trim());
      return parts.map((p, i) => {
        const lines = p.split('\n');
        return {
          title: lines[0] || '',
          employmentType: lines[1] || '',
          organization: lines[2] || '',
          fromDate: lines[3] || '',
          toDate: lines[4] || '',
          description: lines.slice(5).join('\n') || ''
        };
      });
    } catch (e) {
      console.error("Failed to parse experiences in Sidebar", e);
      return [];
    }
  }, [currentExperience]);

  // Parse Education Background exactly like how EducationBackgroundManager does
  const eduEntries = useMemo(() => {
    return parseEducation(currentEducation);
  }, [currentEducation]);

  // Try to get from individual fields first, then fallback to parsing 'Contact' field
  const contactRaw = data['Contact'] || '';
  
  const parseFromContact = (label: string) => {
    if (!contactRaw) return undefined;
    const lines = contactRaw.split('\n');
    const line = lines.find(l => l.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return line ? line.substring(line.indexOf(':') + 1).trim() : undefined;
  };

  const mobile = data['Mobile'] || parseFromContact('Phone');
  const email = data['E-mail'] || parseFromContact('Email');
  const social = data['Social Media'] || parseFromContact('LinkedIn');
  const address = data['Address'] || parseFromContact('Location');

  const handleUpdateCover = async () => {
    if (!coverInput.trim()) return;
    setIsUpdatingCover(true);
    try {
      await updateSheetValue(fullName, 'Cover Photo', coverInput);
      onUpdateField('Cover Photo', coverInput);
      setIsEditingCover(false);
      setCoverInput('');
    } catch (e) {
      console.error("Failed to update cover photo", e);
    } finally {
      setIsUpdatingCover(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileInput.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await updateSheetValue(fullName, 'Profile Picture', profileInput);
      onUpdateField('Profile Picture', profileInput);
      setIsEditingProfile(false);
      setProfileInput('');
    } catch (e) {
      console.error("Failed to update profile picture", e);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="w-full md:w-[300px] lg:w-[340px] xl:w-[380px] bg-[#004a6c] text-white flex flex-col relative shrink-0 h-screen overflow-y-auto no-scrollbar overflow-x-hidden">
      
      {/* COVER & PROFILE HEADER */}
      <div className="relative z-10 w-full mb-16 sm:mb-20">
        {/* Sync Button - Top Left */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="absolute top-3 left-3 p-1.5 bg-[#f1b700] text-[#004a6c] rounded-md shadow-lg hover:bg-[#ffe05c] transition-all disabled:opacity-75 z-50 flex items-center justify-center group outline-none focus:ring-2 focus:ring-[#f1b700]/50"
          title="Sync Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>

        {/* COVER PHOTO */}
        <div className="relative w-full h-32 sm:h-40 bg-[#2A3B4C] overflow-hidden group/cover">
          {coverPhoto ? (
            <img 
              src={coverPhoto} 
              alt="Cover" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-700/30">
               <ImagePlus className="w-8 h-8 text-white/20" />
            </div>
          )}
          
          {/* Cover Edit Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity">
            <button 
              onClick={() => { setIsEditingCover(true); setCoverInput(data['Cover Photo'] || ''); }}
              className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-all"
              title="Update Cover Photo"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {/* Cover Input Modal */}
          {isEditingCover && (
            <div className="absolute inset-0 bg-[#004a6c] z-50 p-4 flex flex-col gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#f1b700]">Update Cover Photo</h3>
              <input 
                type="text"
                placeholder="Google Drive Photo Link..."
                value={coverInput}
                onChange={(e) => setCoverInput(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded p-2 text-xs outline-none focus:border-[#f1b700]"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-1">
                <button onClick={() => setIsEditingCover(false)} className="text-[10px] uppercase font-bold hover:text-red-400">Cancel</button>
                <button 
                  onClick={handleUpdateCover}
                  disabled={isUpdatingCover}
                  className="bg-[#f1b700] text-[#004a6c] px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"
                >
                  {isUpdatingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE PICTURE & INFO - OVERLAPPING */}
        <div className="absolute top-full -mt-10 sm:-mt-12 left-5 right-0 flex items-start gap-4 z-20">
          <div className="relative group/profile shrink-0">
            {profilePic ? (
              <img 
                src={profilePic} 
                alt={name} 
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full border-[3px] border-white shadow-xl bg-slate-200"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[3px] border-white bg-slate-300 flex items-center justify-center text-[#004a6c] text-xl sm:text-2xl font-bold shadow-xl">
                {name.charAt(0) || 'U'}
              </div>
            )}
            
            {/* Profile Edit Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/profile:opacity-100 transition-opacity flex items-center justify-center rounded-full pointer-events-none">
              <Edit2 className="w-4 h-4 text-white" />
            </div>
            <button 
              onClick={() => { setIsEditingProfile(true); setProfileInput(data['Profile Picture'] || ''); }}
              className="absolute inset-0 z-10"
              title="Update Profile Picture"
            />

            {/* Profile Input Modal (contextual) */}
            {isEditingProfile && (
              <div className="absolute bottom-full left-0 mb-4 bg-[#2A3B4C] border border-white/20 rounded-lg p-3 shadow-2xl z-50 w-48 sm:w-56">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#f1b700] mb-2">Update Profile Picture</h3>
                <input 
                  type="text"
                  placeholder="Photo Link..."
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-[10px] outline-none focus:border-[#f1b700] mb-2"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingProfile(false)} className="text-[9px] uppercase font-bold hover:text-red-400">Cancel</button>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                    className="bg-[#f1b700] text-[#004a6c] px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1"
                  >
                    {isUpdatingProfile ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COMPACT CONTACT INFO */}
          <div className="flex-1 min-w-0 flex flex-col gap-1 p-2 pr-4 sm:p-2 sm:pr-5 bg-[#004a6c] rounded-tl-2xl mt-3 sm:mt-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1 group/contact-edit">
              <div className="flex items-center gap-1.5 text-white">
                <ContactIcon className="w-3.5 h-3.5" />
                <span className="text-[0.75rem] font-bold uppercase tracking-widest whitespace-nowrap">Contact</span>
              </div>
              <ContactEdit 
                data={{ mobile, email, address, social }} 
                fullName={fullName} 
                onSuccess={onUpdateField} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {mobile && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Phone className="w-2.5 h-2.5 text-[#f1b700] shrink-0" />
                  <span className="text-[0.625rem] text-gray-200 break-words">{mobile}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-2.5 h-2.5 text-[#f1b700] shrink-0" />
                  <span className="text-[0.625rem] text-gray-200 break-all">{email}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-2.5 h-2.5 text-[#f1b700] shrink-0" />
                  <span className="text-[0.625rem] text-gray-200 break-words">{address}</span>
                </div>
              )}
              {social && (
                <div className="flex items-start gap-1.5 min-w-0">
                  <LinkIcon className="w-2.5 h-2.5 text-[#f1b700] shrink-0 mt-0.5" />
                  <a 
                    href={social.startsWith('http') ? social : `https://${social}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[0.625rem] text-gray-200 break-words hover:text-[#f1b700] hover:underline"
                  >
                    {social}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="px-5 lg:px-6 pb-6 flex flex-col gap-4">
        
        {/* EXPERIENCE DISLPAY IN SIDEBAR */}
        {jobEntries.length > 0 && (
          <div className="flex flex-col gap-1 text-white relative mt-12">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  <h2 className="text-[0.75rem] font-bold tracking-widest uppercase whitespace-nowrap">Job Experience</h2>
                </div>
                {currentExperience && (
                  <span className="text-[0.5625rem] text-[#f1b700] font-bold uppercase tracking-tight italic truncate">
                    ({calculateTotalExperience(currentExperience)})
                  </span>
                )}
              </div>
            </div>
            
            <div className="relative pl-6 space-y-4 mt-4">
              {jobEntries.map((job, idx) => {
                const dateDisplay = (job.fromDate || job.toDate) ? (
                  `${formatDate(job.fromDate)} - ${getToDateDisplay(job.toDate)}`
                ) : '';

                return (
                  <div key={idx} className="relative group/job-side">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[21px] top-1.5 w-[8px] h-[8px] rounded-full border-2 bg-slate-300 ring-2 border-[#004a6c] ring-white/10 group-hover/job-side:bg-[#f1b700] transition-colors z-20"></div>
                    
                    {/* Connecting Line (except for last item) */}
                    {idx < jobEntries.length - 1 && (
                      <div className="absolute -left-[18px] top-[14px] bottom-[-22px] w-[2px] bg-white/10 z-10 transition-colors group-hover/job-side:bg-white/20"></div>
                    )}

                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-bold text-white group-hover/job-side:text-[#f1b700] transition-colors">{job.title}</span>
                        {dateDisplay && (
                          <span className="text-[11px] text-gray-400 group-hover/job-side:text-white/80 transition-colors font-medium mt-0.5">
                            {dateDisplay}
                            {job.employmentType && ` (${job.employmentType})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SKILLS DISPLAY IN SIDEBAR */}
        {data['My Skills'] && (
          <div className="flex flex-col gap-1 text-white relative mt-6">
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-1">
              <Star className="w-3 h-3 text-[#f1b700]" />
              <h2 className="text-[0.75rem] font-bold tracking-widest uppercase whitespace-nowrap">Skills</h2>
            </div>
            <div className="relative pl-6 space-y-4 mt-4">
              {(() => {
                try {
                  const skills = JSON.parse(data['My Skills'] || '[]');
                  return skills.map((skill: any, idx: number) => (
                    <div key={idx} className="relative group/skill">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[21px] top-1.5 w-[8px] h-[8px] rounded-full border-2 bg-slate-300 ring-2 border-[#004a6c] ring-white/10 group-hover/skill:bg-[#f1b700] transition-colors z-20"></div>
                      
                      {/* Connecting Line (except for last item) */}
                      {idx < skills.length - 1 && (
                        <div className="absolute -left-[18px] top-[14px] bottom-[-22px] w-[2px] bg-white/10 z-10 transition-colors group-hover/skill:bg-white/20"></div>
                      )}

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold leading-tight text-white group-hover/skill:text-[#f1b700] transition-colors">{skill.type}</span>
                          {skill.rating > 0 && (
                            <div className="flex gap-0.5 shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={7} 
                                  className={i < skill.rating ? "fill-[#f1b700] text-[#f1b700]" : "text-white/20"} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          </div>
        )}

        {/* EDUCATION DISPLAY IN SIDEBAR */}
        {eduEntries.length > 0 && (
          <div className="flex flex-col gap-1 text-white relative mt-6" data-edu-section-marker="true">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <h2 className="text-[0.75rem] font-bold tracking-widest uppercase whitespace-nowrap">Education Background</h2>
              </div>
            </div>
            
            <div className="relative pl-6 space-y-4 mt-4">
              {eduEntries.map((edu, idx) => {
                const getEduToDateDisplay = (toDate: string | null | undefined): string => {
                  if (!toDate || !toDate.trim() || toDate.trim().toLowerCase() === 'present') {
                    return 'Present';
                  }
                  return getYearOnly(toDate.trim());
                };

                const dateDisplay = (edu.fromDate || edu.toDate) ? (
                  `${getYearOnly(edu.fromDate)} - ${getEduToDateDisplay(edu.toDate)}`
                ) : '';

                return (
                  <div key={idx} className="relative group/edu-side">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[21px] top-1.5 w-[8px] h-[8px] rounded-full border-2 bg-slate-300 ring-2 border-[#004a6c] ring-white/10 group-hover/edu-side:bg-[#f1b700] transition-colors z-20"></div>
                    
                    {/* Connecting Line (except for last item) */}
                    {idx < eduEntries.length - 1 && (
                      <div className="absolute -left-[18px] top-[14px] bottom-[-22px] w-[2px] bg-white/10 z-10 transition-colors group-hover/edu-side:bg-white/20"></div>
                    )}

                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-bold text-white group-hover/edu-side:text-[#f1b700] transition-colors">{edu.degree}</span>
                        {edu.institution && (
                          <span className="text-[12px] text-gray-300 font-medium group-hover/edu-side:text-white/90 transition-colors">{edu.institution}</span>
                        )}
                        {dateDisplay && (
                          <span className="text-[11px] text-gray-400 group-hover/edu-side:text-white/80 transition-colors font-medium mt-0.5">
                            {dateDisplay}
                            {edu.result && ` (${edu.result})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PROJECT CONTRIBUTIONS DISPLAY IN SIDEBAR */}
        {(data['Project Contributions'] || data['Tools & Technologies']) && (
          <div className="flex flex-col gap-1 text-white relative mt-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-1">
              <Code className="w-3.5 h-3.5 text-[#26c6da]" />
              <h2 className="text-[0.75rem] font-bold tracking-widest uppercase whitespace-nowrap">Projects</h2>
            </div>
            <div className="relative pl-6 space-y-3 mt-4">
              {(() => {
                try {
                  const text = data['Project Contributions'] || data['Tools & Technologies'] || '';
                  if (!text.trim()) return <p className="text-[10px] text-gray-400 italic">No projects listed.</p>;
                  
                  // Fallback for legacy text which is not formatted as structured Project Contribution entries (doesn't contain --- or has simple format)
                  if (!text.includes('\n') || (!text.includes('\n\n') && !text.includes('---'))) {
                    return (
                      <div className="text-[0.6875rem] text-gray-200 font-light leading-snug">
                        <FormattedText text={text} />
                      </div>
                    );
                  }

                  let parts = [];
                  if (text.includes('\n\n---\n\n')) {
                    parts = text.split('\n\n---\n\n').filter(p => p.trim());
                  } else {
                    parts = text.split('\n\n').filter(p => p.trim());
                  }
                  
                  if (parts.length === 0 || parts[0].split('\n').length < 3) {
                    // Let's safe-check to see if it's bullet lists or similar
                    return (
                      <div className="text-[0.6875rem] text-gray-200 font-light leading-snug">
                        <FormattedText text={text} />
                      </div>
                    );
                  }

                  const projects = parts.map((p, i) => {
                    const lines = p.split('\n');
                    return {
                      title: lines[0] || '',
                      role: lines[1] || '',
                      technologies: lines[2] || '',
                    };
                  });

                  return projects.map((proj, idx) => (
                    <div key={idx} className="relative group/proj text-left">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[21px] top-1.5 w-[8px] h-[8px] rounded-full border-2 bg-slate-400 ring-2 border-[#004a6c] ring-white/10 group-hover/proj:bg-[#26c6da] transition-colors z-20"></div>
                      
                      {/* Connecting Line (except for last item) */}
                      {idx < projects.length - 1 && (
                        <div className="absolute -left-[18px] top-[14px] bottom-[-18px] w-[2px] bg-white/10 z-10 transition-colors group-hover/proj:bg-white/20"></div>
                      )}

                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[12px] font-bold leading-tight text-white group-hover/proj:text-[#26c6da] transition-colors truncate block" title={proj.title}>
                          {proj.title}
                        </span>
                        {proj.role && (
                          <span className="text-[10px] text-gray-300 truncate block">
                            {proj.role}
                          </span>
                        )}
                        {proj.technologies && (
                          <span className="text-[9px] text-[#26c6da]/80 uppercase font-semibold tracking-wider truncate block" title={proj.technologies}>
                            {proj.technologies}
                          </span>
                        )}
                      </div>
                    </div>
                  ));
                } catch (e) {
                  return (
                    <div className="text-[0.6875rem] text-gray-200 font-light leading-snug">
                      <FormattedText text={data['Project Contributions'] || data['Tools & Technologies'] || ''} />
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {/* HOBBIES / INTERESTS */}
        {data['Interests'] && (
          <div className="flex flex-col gap-1">
            <h2 className="text-[0.75rem] font-bold tracking-widest border-b border-white/10 pb-0.5 uppercase text-white">Hobbies</h2>
            <div className="text-[0.6875rem] text-gray-200 font-light leading-snug">
              <FormattedText text={data['Interests']} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
