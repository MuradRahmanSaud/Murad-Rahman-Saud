import { useEffect, useState, useRef, useMemo } from 'react';
import { fetchPortfolioData, type PortfolioData, SHEET_GID, SPREADSHEET_ID } from './lib/sheet';
import { FormattedText } from './components/FormattedText';
import { Sidebar } from './components/Sidebar';
import { Body } from './components/Body';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

const DARK_BLUE = '#004a6c';
const YELLOW = '#f1b700';

export default function App() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isUpdatingSummary, setIsUpdatingSummary] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editedSkills, setEditedSkills] = useState('');
  const [isUpdatingSkills, setIsUpdatingSkills] = useState(false);

  const [isUpdatingExperience, setIsUpdatingExperience] = useState(false);
  const [isUpdatingEducation, setIsUpdatingEducation] = useState(false);

  const handleUpdateData = (key: string, value: string) => {
    setData(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSaveSkills = (newSkillsText: string) => {
    const originalName = data?.['Name'] || '';
    
    setIsUpdatingSkills(true);
    handleUpdateData('My Skills', newSkillsText);
    
    const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
    const payload = {
      action: "UPDATE",
      gid: SHEET_GID,
      spreadsheetId: SPREADSHEET_ID,
      data: { 'My Skills': newSkillsText },
      idKey: "Name",
      idValue: originalName
    };
    
    fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    }).then(() => {
        setIsUpdatingSkills(false);
    }).catch(e => {
      console.error("Failed to update skills", e);
      // Revert state if needed, but data is already updated in sheet and local state is just for reload.
      // Actually loadData is called only on mount or sync.
      setIsUpdatingSkills(false);
      alert("Failed to update skills. Please try again.");
    });
  };

  const handleSaveExperience = (newData: string) => {
    const originalName = data?.['Name'] || '';
    const key = data?.['Job Experiance'] !== undefined ? 'Job Experiance' : 'Job Experience';
    
    setIsUpdatingExperience(true);
    handleUpdateData(key, newData);
    
    const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
    const payload = {
      action: "UPDATE",
      gid: SHEET_GID,
      spreadsheetId: SPREADSHEET_ID,
      data: { [key]: newData },
      idKey: "Name",
      idValue: originalName
    };
    
    fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    }).then(() => {
        setIsUpdatingExperience(false);
    }).catch(e => {
      console.error("Failed to update experience", e);
      setIsUpdatingExperience(false);
      alert("Failed to update job experience. Please try again.");
    });
  };

  const handleSaveEducation = (newData: string) => {
    const originalName = data?.['Name'] || '';
    
    setIsUpdatingEducation(true);
    handleUpdateData('Education Background', newData);
    
    const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
    const payload = {
      action: "UPDATE",
      gid: SHEET_GID,
      spreadsheetId: SPREADSHEET_ID,
      data: { 'Education Background': newData },
      idKey: "Name",
      idValue: originalName
    };
    
    fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    }).then(() => {
        setIsUpdatingEducation(false);
    }).catch(e => {
      console.error("Failed to update education", e);
      setIsUpdatingEducation(false);
      alert("Failed to update education background. Please try again.");
    });
  };

  const loadData = (showSyncState = false) => {
    if (showSyncState) setIsSyncing(true);
    fetchPortfolioData()
      .then((parsed) => {
        if (parsed) {
          // Sort Job Experience if it exists
          const rawExperience = parsed['Job Experiance'] || parsed['Job Experience'] || '';
          if (rawExperience) {
            const hasSeparator = rawExperience.includes('---');
            const entries = hasSeparator 
              ? rawExperience.split('\n\n---\n\n').filter((e: string) => e.trim())
              : rawExperience.split('\n\n').filter((e: string) => e.trim());
            
            const getSortDate = (entry: string) => {
              const lines = entry.split('\n');
              let fromStr = '';
              let toStr = '';
              
              if (lines.length >= 5 && !lines[1].includes(' - ')) {
                // Modern Job format: lines[3] is fromDate, lines[4] is toDate
                fromStr = lines[3]?.trim() || '';
                toStr = lines[4]?.trim() || '';
              } else {
                // Old/Simple format: lines[1] is duration
                const duration = lines[1] || '';
                const datePart = duration.split('·')[0].trim();
                const dateRange = datePart.split(/[-—]/);
                fromStr = dateRange[0]?.trim() || '';
                toStr = dateRange[1]?.trim() || '';
              }

              const parseDate = (str: string) => {
                if (!str || str.toLowerCase() === 'present') return new Date(8640000000000000);
                
                if (str.includes('-')) {
                  const d = new Date(str);
                  if (!isNaN(d.getTime())) return d;
                }
                
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
                
                const year = parseInt(parts[1] || parts[0]);
                if (!isNaN(year)) return new Date(year, monthIndex, 1);
                return new Date(0);
              };

              return {
                to: parseDate(toStr),
                from: parseDate(fromStr)
              };
            };

            entries.sort((a: string, b: string) => {
              const datesA = getSortDate(a);
              const datesB = getSortDate(b);
              if (datesB.to.getTime() !== datesA.to.getTime()) {
                return datesB.to.getTime() - datesA.to.getTime();
              }
              return datesB.from.getTime() - datesA.from.getTime();
            });

            const sortedExperience = entries.join(hasSeparator ? '\n\n---\n\n' : '\n\n') + (entries.length > 0 ? (hasSeparator ? '\n\n---\n\n' : '\n\n') : '');
            if (parsed['Job Experiance']) parsed['Job Experiance'] = sortedExperience;
            else if (parsed['Job Experience']) parsed['Job Experience'] = sortedExperience;
          }

          setData(parsed);
          setEditedName((parsed['Name'] || '').split('\n')[0]);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => {
        if (showSyncState) setIsSyncing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = () => {
    loadData(true);
  };

  const handleSaveSummary = () => {
    const originalName = data?.['Name'] || '';
    const originalSummary = data?.['Professional Summary'] || '';
    if (editedSummary === originalSummary) {
      setIsEditingSummary(false);
      return;
    }
    
    setIsEditingSummary(false);
    handleUpdateData('Professional Summary', editedSummary);
    
    const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
    const payload = {
      action: "UPDATE",
      gid: SHEET_GID,
      spreadsheetId: SPREADSHEET_ID,
      data: { 'Professional Summary': editedSummary },
      idKey: "Name",
      idValue: originalName
    };
    
    fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    }).catch(e => {
      console.error("Failed to update summary", e);
      handleUpdateData('Professional Summary', originalSummary);
      alert("Failed to update summary in background.");
    });
  };

  const handleSaveName = () => {
    const originalNameData = data?.['Name'] || '';
    const nameParts = originalNameData.split('\n');
    const oldTitle = nameParts.slice(1).join('\n');
    const newNameData = oldTitle ? `${editedName}\n${oldTitle}` : editedName;

    if (newNameData === originalNameData) {
      setIsEditingName(false);
      return;
    }
    
    setIsEditingName(false);
    handleUpdateData('Name', newNameData);
    
    const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
    const payload = {
      action: "UPDATE",
      gid: SHEET_GID,
      spreadsheetId: SPREADSHEET_ID,
      data: { Name: newNameData },
      idKey: "Name",
      idValue: originalNameData
    };
    
    fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    }).catch(e => {
      console.error("Failed to update name", e);
      handleUpdateData('Name', originalNameData);
      alert("Failed to update name in background.");
    });
  };

  const handleSaveTitle = () => {
    const originalNameData = data?.['Name'] || '';
    const nameParts = originalNameData.split('\n');
    const oldName = nameParts[0] || 'Your Name';
    const newNameData = editedTitle ? `${oldName}\n${editedTitle}` : oldName;

    if (newNameData === originalNameData) {
      setIsEditingTitle(false);
      return;
    }
    
    setIsEditingTitle(false);
    handleUpdateData('Name', newNameData);
    
    const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
    const payload = {
      action: "UPDATE",
      gid: SHEET_GID,
      spreadsheetId: SPREADSHEET_ID,
      data: { Name: newNameData },
      idKey: "Name",
      idValue: originalNameData
    };
    
    fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" }
    }).catch (e => {
      console.error("Failed to update title", e);
      handleUpdateData('Name', originalNameData);
      alert("Failed to update title in background.");
    });
  };

  const parseGoogleDriveImage = (url: string | undefined) => {
    if (!url) return undefined;
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    } else if (idMatch) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
    return url;
  };

  const sortEducation = (text: string) => {
    if (!text) return '';
    if (text.includes('---')) return text;
    const getStartYear = (entry: string) => {
        const lines = entry.split('\n');
        const durationLine = lines[1] || '';
        const [start] = durationLine.split(' - ').map(s => s.trim());
        return parseInt(start) || 0;
    };
    return text.split('\n\n').filter(e => e.trim()).sort((a,b) => getStartYear(b) - getStartYear(a)).join('\n\n') + (text.split('\n\n').filter(e => e.trim()).length > 0 ? '\n\n' : '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E5E7EB]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-[#004a6c] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E5E7EB] p-4">
        <div className="bg-white p-6 rounded shadow-sm w-full max-w-md text-center border-t-4 border-red-500">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Failed to load data</h2>
          <p className="text-slate-600 text-sm">Could not fetch portfolio information from the Google Sheet.</p>
          <button onClick={handleSync} className="mt-4 px-4 py-2 bg-[#004a6c] text-white rounded">Retry</button>
        </div>
      </div>
    );
  }

  const profilePic = parseGoogleDriveImage(data['Profile Picture']);
  const coverPhoto = parseGoogleDriveImage(data['Cover Photo']);
  const nameData = data['Name'] || 'Your Name';
  const nameParts = nameData.split('\n');
  const name = nameParts[0];
  const title = nameParts.slice(1).join('\n').trim();
  const summary = data['Professional Summary'];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-200 flex flex-col">
      
      <div className="w-full bg-white flex flex-col md:flex-row h-screen overflow-hidden relative">
        
        <Sidebar 
          data={data} 
          profilePic={profilePic} 
          coverPhoto={coverPhoto}
          name={name} 
          title={title}
          onUpdateField={handleUpdateData}
          currentExperience={data['Job Experiance'] || data['Job Experience'] || ''}
          currentEducation={sortEducation(data['Education Background'] || '')}
          fullName={data['Name'] || ''}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          editedName={editedName}
          setEditedName={setEditedName}
          handleSaveName={handleSaveName}
          isUpdatingName={isUpdating}
          isEditingTitle={isEditingTitle}
          setIsEditingTitle={setIsEditingTitle}
          editedTitle={editedTitle}
          setEditedTitle={setEditedTitle}
          handleSaveTitle={handleSaveTitle}
          isUpdatingTitle={isUpdatingTitle}
          isSyncing={isSyncing}
          onSync={handleSync}
        />

        {/* RIGHT MAIN CONTENT */}
        <Body
          data={data}
          name={name}
          title={title}
          summary={summary}
          currentExperience={data['Job Experiance'] || data['Job Experience'] || ''}
          onUpdateField={handleUpdateData}
          fullName={data['Name'] || ''}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          editedName={editedName}
          setEditedName={setEditedName}
          handleSaveName={handleSaveName}
          isUpdatingName={isUpdating}
          isEditingTitle={isEditingTitle}
          setIsEditingTitle={setIsEditingTitle}
          editedTitle={editedTitle}
          setEditedTitle={setEditedTitle}
          handleSaveTitle={handleSaveTitle}
          isUpdatingTitle={isUpdatingTitle}
          isEditingSummary={isEditingSummary}
          setIsEditingSummary={setIsEditingSummary}
          editedSummary={editedSummary}
          setEditedSummary={setEditedSummary}
          handleSaveSummary={handleSaveSummary}
          isUpdatingSummary={isUpdatingSummary}
          handleSaveSkills={handleSaveSkills}
          isUpdatingSkills={isUpdatingSkills}
          handleSaveExperience={handleSaveExperience}
          isUpdatingExperience={isUpdatingExperience}
          handleSaveEducation={handleSaveEducation}
          isUpdatingEducation={isUpdatingEducation}
        />

      </div>
    </div>
  );
}

