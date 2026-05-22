import { motion } from 'motion/react';
import React from 'react';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Section({ title, icon, children, delay = 0, className = "" }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay }}
      className={`bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-1.5 mb-2 border-b border-slate-100 pb-1">
        {icon && <span className="text-slate-500 w-3 h-3 flex items-center justify-center shrink-0">{icon}</span>}
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">{title}</h2>
      </div>
      <div className="text-[11px] text-slate-700 leading-snug flex-1">
        {children}
      </div>
    </motion.section>
  );
}
