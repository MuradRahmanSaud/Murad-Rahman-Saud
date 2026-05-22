import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Link as LinkIcon, Edit2, Check, X, Loader2 } from 'lucide-react';
import { SHEET_GID, SPREADSHEET_ID, type PortfolioData } from '../lib/sheet';
import { FormattedText } from './FormattedText';

interface HeroProps {
  data: PortfolioData;
  onUpdateData?: (key: string, value: string) => void;
}

export function Hero({ data, onUpdateData }: HeroProps) {
  const name = data['Name'] || 'Your Name';
  
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

  const coverPhoto = parseGoogleDriveImage(data['Cover Photo']);
  const profilePic = parseGoogleDriveImage(data['Profile Picture']);

  const summary = data['Professional Summary'];
  const email = data['E-mail'];
  const mobile = data['Mobile'];
  const address = data['Address'];
  const social = data['Social Media'];

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveName = async () => {
    if (editedName === name) {
      setIsEditingName(false);
      return;
    }
    
    setIsUpdating(true);
    try {
      const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
      
      const payload = {
        action: "UPDATE",
        gid: SHEET_GID,
        spreadsheetId: SPREADSHEET_ID,
        data: { Name: editedName },
        idKey: "Name",
        idValue: name
      };
      
      await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain" }
      });
      
      if (onUpdateData) {
        onUpdateData('Name', editedName);
      }
      setIsEditingName(false);
    } catch (e) {
      console.error("Failed to update name", e);
      alert("Failed to update name. Check console for details.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-slate-300 shadow-sm mb-2"
    >
      {coverPhoto && (
        <img 
          src={coverPhoto} 
          alt="Cover" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-transparent opacity-90 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center md:items-start p-4 gap-4 min-h-[8rem]">
        <div className="relative inline-flex flex-shrink-0">
          {profilePic ? (
            <img 
              src={profilePic} 
              alt={name} 
              referrerPolicy="no-referrer"
              className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-2xl border-4 border-slate-100 bg-slate-200 flex-shrink-0 shadow-md transition-all hover:scale-105"
            />
          ) : (
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-slate-100 bg-slate-200 flex flex-shrink-0 items-center justify-center text-slate-400 text-3xl font-bold shadow-md">
              {name.charAt(0) || 'U'}
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left flex flex-col justify-center">
          <div className="flex items-center justify-center md:justify-start gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={isUpdating}
                  className="bg-slate-700/50 border border-slate-500 text-white text-xl md:text-2xl font-bold rounded px-2 py-0.5 w-full max-w-[200px] outline-none focus:border-blue-400"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <>
                    <button onClick={handleSaveName} className="p-1 hover:bg-slate-700 rounded text-green-400 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsEditingName(false); setEditedName(name); }} className="p-1 hover:bg-slate-700 rounded text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white m-0 leading-tight">{name || 'Your Name'}</h1>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded text-slate-300 transition-all focus:opacity-100"
                  aria-label="Edit Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <p className="text-blue-400 font-medium text-[10px] sm:text-xs uppercase tracking-widest mt-0.5">Portfolio & Resume</p>
          
          <div className="mt-2 text-slate-300 text-[10px] md:text-[11px] leading-tight max-w-2xl italic min-h-[1.5rem]">
            {summary ? <FormattedText text={`"${summary}"`} /> : <span className="opacity-50">"Professional Summary"</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-[10px] text-slate-400 mt-2 md:mt-0 text-center md:text-right w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-end gap-1.5">
            <MapPin className="w-3 h-3" />
            {address || <span className="opacity-50">Address</span>}
          </div>
          <a href={email ? `mailto:${email}` : '#'} className="flex items-center justify-center md:justify-end gap-1.5 hover:text-white transition-colors">
            <Mail className="w-3 h-3" />
            {email || <span className="opacity-50">Email</span>}
          </a>
          <a href={mobile ? `tel:${mobile}` : '#'} className="flex items-center justify-center md:justify-end gap-1.5 hover:text-white transition-colors">
            <Phone className="w-3 h-3" />
            {mobile || <span className="opacity-50">Mobile</span>}
          </a>
          <a href={social && social.startsWith('http') ? social : (social ? `https://${social}` : '#')} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-end gap-1.5 hover:text-white transition-colors">
            <LinkIcon className="w-3 h-3" />
            {social ? 'Profile Link' : <span className="opacity-50">Social Media</span>}
          </a>
        </div>
      </div>
    </motion.div>
  );
}
