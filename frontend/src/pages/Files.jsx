import React, { useState, useEffect } from 'react';
import { Folder, FileText, MoreVertical, Plus, Search, ChevronRight, Grid, List as ListIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Files() {
  const [meetings, setMeetings] = useState([]);
  const [folders, setFolders] = useState(['General', 'Product', 'Marketing', 'Sales', 'Personal']);
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const storedMeetings = localStorage.getItem('aura_meetings');
    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings));
    }
  }, []);

  const filteredMeetings = meetings.filter(m => {
    const matchesFolder = selectedFolder === 'All' || m.folder === selectedFolder;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-ink/30" />
          <input 
            type="text" 
            placeholder="Search meetings, transcripts, summaries..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-brand-border focus:ring-2 focus:ring-brand-accent outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 bg-white border border-brand-border rounded-xl hover:bg-brand-muted transition-colors">
            <Grid className="w-5 h-5" />
          </button>
          <button className="p-3 bg-white border border-brand-border rounded-xl hover:bg-brand-muted transition-colors">
            <ListIcon className="w-5 h-5" />
          </button>
          <button className="bg-brand-ink text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
            New Folder
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Folders */}
        <div className="w-full md:w-64 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-ink/40 px-4 mb-4">Folders</h3>
          <FolderButton 
            active={selectedFolder === 'All'} 
            onClick={() => setSelectedFolder('All')}
            label="All Meetings"
            count={meetings.length}
          />
          {folders.map(folder => (
            <FolderButton 
              key={folder}
              active={selectedFolder === folder}
              onClick={() => setSelectedFolder(folder)}
              label={folder}
              count={meetings.filter(m => m.folder === folder).length}
            />
          ))}
        </div>

        {/* Files List */}
        <div className="flex-1">
          <div className="bg-white rounded-[2rem] border border-brand-border overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-muted/30 border-b border-brand-border">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-ink/40">Name</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-ink/40">Date</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-ink/40">Duration</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-ink/40">Folder</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-brand-muted/20 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-muted rounded-lg group-hover:bg-brand-ink group-hover:text-white transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-brand-ink">{meeting.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-ink/50">
                      {format(new Date(meeting.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-ink/50">
                      {meeting.duration}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-brand-muted rounded-md text-[10px] font-black uppercase text-brand-ink/60">
                        {meeting.folder}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-brand-muted rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-brand-ink/30" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMeetings.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-brand-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-brand-ink/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">No meetings found</h3>
                <p className="text-brand-ink/50">Try adjusting your search or folder filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderButton({ active, onClick, label, count }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all",
        active 
          ? "bg-brand-ink text-white shadow-lg" 
          : "text-brand-ink/60 hover:bg-brand-muted hover:text-brand-ink"
      )}
    >
      <div className="flex items-center gap-3">
        <Folder className={cn("w-5 h-5", active ? "text-white/60" : "text-brand-ink/30")} />
        {label}
      </div>
      <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-md", active ? "bg-white/20" : "bg-brand-muted")}>
        {count}
      </span>
    </button>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
