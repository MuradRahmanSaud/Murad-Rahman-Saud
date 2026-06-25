import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Search, Code, GraduationCap, ChevronRight, HelpCircle, FileText, Lightbulb } from 'lucide-react';

interface SkillsMaterialProps {
  onBack: () => void;
}

export function SkillsMaterial({ onBack }: SkillsMaterialProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('HTML');

  const topics = [
    { id: 'HTML', name: 'HTML Tutorial', icon: Code, count: 0 },
    { id: 'CSS', name: 'CSS Tutorial', icon: Code, count: 0 },
    { id: 'JavaScript', name: 'JavaScript Tutorial', icon: Code, count: 0 },
    { id: 'React', name: 'React.js Tutorial', icon: GraduationCap, count: 0 },
    { id: 'Node', name: 'Node.js Tutorial', icon: GraduationCap, count: 0 },
  ];

  const filteredTopics = topics.filter(topic => 
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="shrink-0 border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center"
            title="Go back to Skills"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="h-5 w-[1px] bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#004a6c]" />
            <h1 className="text-sm font-bold text-[#041e49] tracking-wider uppercase">
              Skill Tutorial Materials
            </h1>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar for tutorials */}
        <div className="w-64 border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/20">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 text-gray-400" size={13} />
              <input 
                type="text" 
                placeholder="Search tutorials..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-md py-1.5 pl-7 pr-3 text-xs outline-none focus:border-[#004a6c] focus:ring-1 focus:ring-[#004a6c]/20 transition-all font-medium placeholder-gray-400"
              />
            </div>
          </div>

          {/* Topics List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                    isSelected 
                      ? 'bg-[#d3e3fd] text-[#041e49] font-bold' 
                      : 'text-[#444746] hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={14} className={isSelected ? 'text-[#004a6c]' : 'text-gray-400'} />
                    <span className="text-xs truncate font-medium">{topic.name}</span>
                  </div>
                  <ChevronRight size={12} className={isSelected ? 'text-[#041e49]' : 'text-gray-300'} />
                </button>
              );
            })}

            {filteredTopics.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400 italic">
                No tutorials found
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col bg-white relative">
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-12">
            {/* Elegant Blank State Dashboard */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d3e3fd]/40 rounded-full flex items-center justify-center mx-auto mb-6 text-[#004a6c] border border-[#d3e3fd]/60 shadow-inner">
                <BookOpen size={28} className="animate-pulse" />
              </div>

              <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-2">
                {selectedTopic} Tutorial Content
              </h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed mb-8">
                Welcome to the skill development playground. Interactive examples, reference codes, and hands-on developer guidelines will be curated here shortly.
              </p>

              {/* Bento styled decorative placeholder cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex gap-3">
                  <div className="p-2 bg-blue-50 text-[#004a6c] rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                    <Code size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-1">Hands-on Editor</h4>
                    <p className="text-[10px] text-gray-400 leading-snug">Interactive playground and interactive compiler.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-1">Reference Guide</h4>
                    <p className="text-[10px] text-gray-400 leading-snug">Complete reference listings, properties, syntaxes and developer best practices.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                    <Lightbulb size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-1">Tips & Tricks</h4>
                    <p className="text-[10px] text-gray-400 leading-snug">Performance optimizations, accessibility guidelines, and structural design hacks.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                    <HelpCircle size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-1">Quiz Challenges</h4>
                    <p className="text-[10px] text-gray-400 leading-snug">Multiple choice questionnaires to test your knowledge retention and get certified.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
