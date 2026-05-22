import React, { useState } from 'react';
import { Plus, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JoditEditor from 'jodit-react';
import { SHEET_GID, SPREADSHEET_ID } from '../lib/sheet';

interface JobExperienceProps {
  onSuccess: (newExperience: string) => void;
  currentExperience: string;
  fullName: string;
  editingIndex: number | null;
  onCancelEdit: () => void;
}

export function JobExperience({ onSuccess, currentExperience, fullName, editingIndex, onCancelEdit }: JobExperienceProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  
  // Use a separate state for isEditing to control the animation and form visibility
  // If editingIndex changes from null to something, we should show the form.
  const isEditing = editingIndex !== null;

  const [formData, setFormData] = useState({
    title: '',
    org: '',
    employmentType: '',
    fromDate: '',
    toDate: '',
    description: ''
  });

  // Effect to pre-fill form when editingIndex changes
  React.useEffect(() => {
    if (editingIndex !== null) {
      const entries = currentExperience.split('\n\n').filter(e => e.trim());
      const entryToEdit = entries[editingIndex];
      if (entryToEdit) {
        const lines = entryToEdit.split('\n').filter(l => l.trim());
        const titleLine = lines[0] || '';
        const durationLine = lines[1] || '';
        const orgLine = lines[2] || '';
        const descriptionText = lines.slice(3).join('\n').trim();

        // Extract Title and Employment Type
        let title = titleLine;
        let employmentType = '';
        const typeMatch = titleLine.match(/(.*)\s\((.*)\)/);
        if (typeMatch) {
          title = typeMatch[1];
          employmentType = typeMatch[2];
        }

        // Helper to parse "Jun 2024" to "2024-06-01"
        const parseMonthYear = (str: string) => {
          if (!str || str.toLowerCase() === 'present') return '';
          const parts = str.trim().split(' ');
          if (parts.length < 2) return '';
          
          const monthMap: { [key: string]: string } = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          
          const month = monthMap[parts[0]];
          const year = parts[1];
          if (month && year) return `${year}-${month}-01`;
          return '';
        };

        // Parse dates from "Jun 2024 - Sep 2025 · 1 yr"
        const datePart = durationLine.split('·')[0].trim();
        const dateRange = datePart.split(/[-—]/); // Support both hyphen and en-dash
        const fromStr = dateRange[0]?.trim();
        const toStr = dateRange[1]?.trim();

        setFormData({
          title,
          org: orgLine,
          employmentType,
          fromDate: parseMonthYear(fromStr),
          toDate: parseMonthYear(toStr),
          description: descriptionText
        });
        setIsAdding(true);
      }
    }
  }, [editingIndex, currentExperience]);

  const handleCancel = () => {
    setIsAdding(false);
    onCancelEdit();
    setFormData({ title: '', org: '', employmentType: '', fromDate: '', toDate: '', description: '' });
  };

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Additional', 'Internship'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.org) return;

    setIsSaving(true);
    
    // Helper to format date to MMMM YYYY if it's a date string
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'Present';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Helper to calculate tenure (years and months)
    const calculateTenure = (from: string, to: string) => {
      console.log('calculateTenure input:', { from, to });
      if (!from) return '';
      
      const start = new Date(from);
      const end = !to ? new Date() : new Date(to);
      
      console.log('calculateTenure parsed:', { start: start.toISOString(), end: end.toISOString() });
      
      if (isNaN(start.getTime())) return '';
      // If end date is invalid, treat as present or just return empty
      const endDate = isNaN(end.getTime()) ? new Date() : end;

      let years = endDate.getFullYear() - start.getFullYear();
      let months = endDate.getMonth() - start.getMonth();

      if (months < 0) {
        years--;
        months += 12;
      }
      
      console.log('calculateTenure result:', { years, months });
      
      // Safety check: if years are absurd, return empty
      if (years < 0 || years > 100) return '';

      const parts = [];
      if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
      if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
      
      return parts.length ? parts.join(' ') : '0 mos';
    };

    const fromDateFormatted = formatDate(formData.fromDate);
    const toDateFormatted = formatDate(formData.toDate);
    const tenure = calculateTenure(formData.fromDate, formData.toDate);

    // Combine dates into a duration string: Jun 2024 - Sep 2025 · 1 yr 4 mos
    const durationStr = fromDateFormatted && toDateFormatted 
      ? `${fromDateFormatted} - ${toDateFormatted}${tenure ? ` · ${tenure}` : ''}`
      : fromDateFormatted || toDateFormatted || '';
      
    console.log('handleSave - tenure:', tenure);
    console.log('handleSave - durationStr:', durationStr);

    // New format: Title (Employment Type) \n Duration \n Organization \n Description
    const titleWithType = formData.employmentType ? `${formData.title} (${formData.employmentType})` : formData.title;
    const newEntry = `${titleWithType}\n${durationStr}\n${formData.org}${formData.description ? '\n' + formData.description : ''}`;
    
    let entries = currentExperience.split('\n\n').filter(e => e.trim());
    
    if (editingIndex !== null) {
      entries[editingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }

    // SORTING LOGIC: Sort entries by End Date (Present first), then Start Date
    const sortEntries = (entriesToSort: string[]) => {
      const getSortDate = (entry: string) => {
        const lines = entry.split('\n');
        const duration = lines[1] || '';
        const datePart = duration.split('·')[0].trim();
        const dateRange = datePart.split(/[-—]/);
        
        const fromStr = dateRange[0]?.trim();
        const toStr = dateRange[1]?.trim();

        const parseDate = (str: string) => {
          if (!str || str.toLowerCase() === 'present') return new Date(8640000000000000); // Max date for 'Present'
          const parts = str.trim().split(' ');
          const monthMap: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          
          let monthIndex = 0;
          if (parts[0]) {
            const shortMonth = parts[0].substring(0, 3);
            const normalizedMonth = shortMonth.charAt(0).toUpperCase() + shortMonth.substring(1).toLowerCase();
            monthIndex = monthMap[normalizedMonth] ?? 0;
          }
          
          const year = parseInt(parts[1] || parts[0]); // Fallback to parts[0] if parts[1] missing
          if (!isNaN(year)) return new Date(year, monthIndex, 1);
          return new Date(0);
        };

        return {
          to: parseDate(toStr),
          from: parseDate(fromStr)
        };
      };

      return [...entriesToSort].sort((a, b) => {
        const datesA = getSortDate(a);
        const datesB = getSortDate(b);
        
        // Primary sort: To Date (desc)
        if (datesB.to.getTime() !== datesA.to.getTime()) {
          return datesB.to.getTime() - datesA.to.getTime();
        }
        // Secondary sort: From Date (desc)
        return datesB.from.getTime() - datesA.from.getTime();
      });
    };

    const sortedEntries = sortEntries(entries);
    const updatedExperience = sortedEntries.join('\n\n') + (sortedEntries.length > 0 ? '\n\n' : '');

    // OPTIMISTIC UPDATE
    onSuccess(updatedExperience);
    setIsAdding(false);
    onCancelEdit();
    setFormData({ title: '', org: '', employmentType: '', fromDate: '', toDate: '', description: '' });

    try {
      const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
      const payload = {
        action: "UPDATE",
        gid: SHEET_GID,
        spreadsheetId: SPREADSHEET_ID,
        data: { 'Job Experiance': updatedExperience },
        idKey: "Name",
        idValue: fullName
      };

      await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain" }
      });
    } catch (e) {
      console.error("Failed to add job experience in background", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="leading-none">
      <button
        onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
        className={`p-1.5 rounded-full transition-all ${isAdding ? 'bg-white text-[#004a6c] rotate-90 shadow-lg' : 'hover:bg-white/10 text-white rotate-0'}`}
        title={isAdding ? "Cancel" : "Add Experience"}
      >
        {isAdding ? <X className="w-5 h-5 pointer-events-none" /> : <Plus className="w-5 h-5 pointer-events-none" />}
      </button>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-12 left-0 right-0 bg-[#2A3B4C] border border-white/20 rounded-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 text-white origin-top"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                {editingIndex !== null ? 'Edit Experience' : 'Add New Experience'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">Job Title</label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. Lead Product Designer"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="text-xs p-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-white/40 text-white placeholder:text-white/20 transition-all font-light"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">Employment Type</label>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 gap-1 overflow-x-auto no-scrollbar">
                  {employmentTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, employmentType: type })}
                      className={`text-[9px] px-3 py-1.5 rounded-md transition-all shrink-0 whitespace-nowrap ${
                        formData.employmentType === type 
                        ? 'bg-white text-[#004a6c] font-bold shadow-sm' 
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">Organization</label>
                <input
                  required
                  placeholder="e.g. Acme Studio"
                  value={formData.org}
                  onChange={e => setFormData({ ...formData, org: e.target.value })}
                  className="text-xs p-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-white/40 text-white placeholder:text-white/20 transition-all font-light"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">From</label>
                  <input
                    required
                    type="date"
                    value={formData.fromDate}
                    onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
                    className="text-xs p-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-white/40 text-white placeholder:text-white/20 transition-all font-light w-full [color-scheme:dark]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">To</label>
                  <input
                    type="date"
                    value={formData.toDate}
                    onChange={e => setFormData({ ...formData, toDate: e.target.value })}
                    className="text-xs p-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-white/40 text-white placeholder:text-white/20 transition-all font-light w-full [color-scheme:dark]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDescriptionOpen(true)}
                className="text-[10px] uppercase tracking-wider text-white/60 font-bold ml-1 text-left flex items-center gap-1 hover:text-white transition-all"
              >
                + Add Responsibilities / Achievements
              </button>

              {isDescriptionOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#2A3B4C] border border-white/20 rounded-xl p-5 shadow-2xl w-full max-w-4xl"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Responsibilities / Achievements</h3>
                      <button onClick={() => setIsDescriptionOpen(false)} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-black bg-white rounded-lg overflow-hidden border border-white/10">
                      <JoditEditor
                        value={formData.description}
                        config={{
                          readonly: false,
                          placeholder: 'Add details...',
                          statusbar: false,
                          height: 300,
                          buttons: ['bold', 'italic', 'underline', 'ul', 'ol', 'paragraph', 'undo', 'redo'],
                          askBeforePasteHTML: false,
                          askBeforePasteFromWord: false,
                          defaultActionOnPaste: 'insert_as_html',
                        }}
                        onBlur={newContent => setFormData({ ...formData, description: newContent })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDescriptionOpen(false)}
                      className="w-full mt-4 bg-white text-[#004a6c] hover:bg-white/90 text-[10px] font-bold py-3 rounded-lg transition-all"
                    >
                      OK
                    </button>
                  </motion.div>
                </div>
              )}

              <button
                disabled={isSaving}
                type="submit"
                className="flex items-center justify-center gap-2 bg-white text-[#004a6c] hover:bg-white/90 text-[10px] font-bold py-3 rounded-lg transition-all disabled:opacity-50 mt-2 shadow-lg active:scale-[0.98]"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                SAVE EXPERIENCE
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
