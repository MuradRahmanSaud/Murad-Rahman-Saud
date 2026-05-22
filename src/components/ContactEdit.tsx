import React, { useState, useRef } from 'react';
import { Plus, X, Loader2, Check, Phone, Mail, MapPin, Link as LinkIcon, Edit2 } from 'lucide-react';
import { updateSheetValue } from '../lib/sheet';

interface ContactEditProps {
  data: {
    mobile?: string;
    email?: string;
    address?: string;
    social?: string;
  };
  fullName: string;
  onSuccess: (field: string, value: string) => void;
}

export function ContactEdit({ data, fullName, onSuccess }: ContactEditProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const mobileRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const socialRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsLoading(true);
    
    const formData = {
      mobile: mobileRef.current?.value || '',
      email: emailRef.current?.value || '',
      address: addressRef.current?.value || '',
      social: socialRef.current?.value || ''
    };

    // Format all data into a single string for the 'Contact' column
    const contactInfo = [
      formData.mobile ? `Phone: ${formData.mobile}` : '',
      formData.email ? `Email: ${formData.email}` : '',
      formData.address ? `Location: ${formData.address}` : '',
      formData.social ? `LinkedIn: ${formData.social}` : '',
    ].filter(Boolean).join('\n');

    // Optimistically update UI first to make it feel instant
    onSuccess('Contact', contactInfo);
    onSuccess('Mobile', formData.mobile);
    onSuccess('E-mail', formData.email);
    onSuccess('Address', formData.address);
    onSuccess('Social Media', formData.social);
    
    setIsOpen(false);
    setIsLoading(false);

    // Perform API call in background without blocking UI
    updateSheetValue(fullName, 'Contact', contactInfo).catch(error => {
      console.error('Error updating contact info:', error);
    });
  };

  const hasContactInfo = !!(data.mobile || data.email || data.address || data.social);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white pb-1"
        title={hasContactInfo ? "Edit contact info" : "Add contact info"}
        id="edit-contact-btn"
      >
        {hasContactInfo ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="absolute top-6 right-0 w-[260px] bg-[#2A3B4C] border border-white/20 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 text-white origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Update Contact Info
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1 flex items-center gap-1.5">
                <Phone className="w-2.5 h-2.5 text-[#f1b700]" /> Phone Number
              </label>
                <input
                name="mobile"
                ref={mobileRef}
                defaultValue={data.mobile || ''}
                type="text"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#f1b700] transition-colors"
                placeholder="+880 1XXX XXXXXX"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1 flex items-center gap-1.5">
                <Mail className="w-2.5 h-2.5 text-[#f1b700]" /> Email Address
              </label>
              <input
                name="email"
                ref={emailRef}
                defaultValue={data.email || ''}
                type="email"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#f1b700] transition-colors"
                placeholder="example@mail.com"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1 flex items-center gap-1.5">
                <MapPin className="w-2.5 h-2.5 text-[#f1b700]" /> Location / Address
              </label>
              <input
                name="address"
                ref={addressRef}
                defaultValue={data.address || ''}
                type="text"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#f1b700] transition-colors"
                placeholder="Dhaka, Bangladesh"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1 flex items-center gap-1.5">
                <LinkIcon className="w-2.5 h-2.5 text-[#f1b700]" /> LinkedIn / Social
              </label>
              <input
                name="social"
                ref={socialRef}
                defaultValue={data.social || ''}
                type="text"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#f1b700] transition-colors"
                placeholder="linkedin.com/in/username"
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="bg-[#f1b700] text-[#004a6c] px-4 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-[#d9b42c] disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
