import React, { useState, useEffect } from 'react';
import { Folder, FileText, MoreVertical, Plus, Search, ChevronRight, Grid, List as ListIcon, Copy, Trash2, Edit2, X, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { api } from '../services/api';

export default function Files() {
  const [meetings, setMeetings] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [movingMeeting, setMovingMeeting] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', folder_id: '' });
  const [isCreatingInlineFolder, setIsCreatingInlineFolder] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');

  const fetchMeetings = async () => {
    try {
      const data = await api.getMeetings();
      setMeetings(data.meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const data = await api.getFolders();
      setFolders(data.folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchFolders();
  }, []);

  const handleDuplicateMeeting = async (meeting) => {
    try {
      await api.addMeeting({
        title: `${meeting.title} (Copy)`,
        duration: meeting.duration,
        audio_url: meeting.audio_url,
        folder_id: meeting.folder_id || 'General'
      });
      fetchMeetings();
    } catch (error) {
      console.error('Duplicate failed:', error);
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      await api.deleteMeeting(id);
      fetchMeetings();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.updateMeeting(selectedMeeting.id, {
        title: editData.title,
        folder_id: editData.folder_id
      });
      await fetchMeetings();
      setIsEditing(false);
      const updated = (await api.getMeetings()).meetings.find(m => m.id === selectedMeeting.id);
      setSelectedMeeting(updated);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleCreateFolderInline = async (e) => {
    e.preventDefault();
    if (inlineFolderName && !folders.find(f => f.name === inlineFolderName)) {
      try {
        await api.addFolder(inlineFolderName);
        await fetchFolders();
        setEditData({ ...editData, folder_id: inlineFolderName });
        setInlineFolderName('');
        setIsCreatingInlineFolder(false);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (newFolderName && !folders.find(f => f.name === newFolderName)) {
      try {
        await api.addFolder(newFolderName);
        await fetchFolders();
        setNewFolderName('');
        setIsCreatingFolder(false);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  const handleEditFolder = async (e) => {
    e.preventDefault();
    if (editFolderName && editingFolder) {
      try {
        await api.editFolder(editingFolder.id, editFolderName);
        await fetchFolders();
        setEditingFolder(null);
        setEditFolderName('');
      } catch (error) {
        console.error('Error editing folder:', error);
      }
    }
  };

  const handleDeleteFolder = async (id) => {
    if (window.confirm('Are you sure you want to delete this folder? Meetings in this folder will be moved to General.')) {
      try {
        await api.deleteFolder(id);
        await fetchFolders();
        if (selectedFolder === folders.find(f => f.id === id)?.name) {
          setSelectedFolder('All');
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const handleMoveMeeting = async (folder_id) => {
    try {
      await api.updateMeeting(movingMeeting.id, { folder_id });
      fetchMeetings();
      setMovingMeeting(null);
    } catch (error) {
      console.error('Move failed:', error);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesFolder = selectedFolder === 'All' || m.folder_id === selectedFolder;
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
          <button 
            onClick={() => setIsCreatingFolder(true)}
            className="bg-brand-ink text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
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
          {!folders.find(f => f.name === 'General') && (
            <FolderButton 
              active={selectedFolder === 'General'}
              onClick={() => setSelectedFolder('General')}
              label="General"
              count={meetings.filter(m => m.folder_id === 'General' || !m.folder_id).length}
            />
          )}
          {folders.map(folder => (
            <div key={folder.id} className="relative group/folder-item">
              <FolderButton 
                active={selectedFolder === folder.name}
                onClick={() => setSelectedFolder(folder.name)}
                label={folder.name}
                count={meetings.filter(m => m.folder_id === folder.name).length}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover/folder-item:flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                    setEditFolderName(folder.name);
                  }}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors text-white/60 hover:text-white"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors text-white/60 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
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
                    <td className="px-6 py-4" onClick={() => setSelectedMeeting(meeting)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-muted rounded-lg group-hover:bg-brand-ink group-hover:text-white transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-brand-ink">{meeting.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-ink/50">
                      {format(new Date(meeting.created_at || new Date()), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-ink/50">
                      {meeting.duration}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group/folder">
                        <span className="px-2 py-1 bg-brand-muted rounded-md text-[10px] font-black uppercase text-brand-ink/60 hover:bg-brand-accent hover:text-white transition-colors">
                          {meeting.folder_id || 'General'}
                        </span>
                        <div className="absolute left-0 top-full mt-1 hidden group-hover/folder:block z-20 bg-white border border-brand-border rounded-xl shadow-xl p-2 min-w-[120px]">
                          <p className="text-[10px] font-black uppercase text-brand-ink/30 px-2 mb-1">Move to:</p>
                          {meeting.folder_id !== 'General' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovingMeeting(meeting);
                                handleMoveMeeting('General');
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs font-bold hover:bg-brand-muted rounded-md transition-colors"
                            >
                              General
                            </button>
                          )}
                          {folders.filter(f => f.name !== meeting.folder_id && f.name !== 'General').map(f => (
                            <button 
                              key={f.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovingMeeting(meeting);
                                handleMoveMeeting(f.name);
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs font-bold hover:bg-brand-muted rounded-md transition-colors"
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative group/actions">
                        <button className="p-2 hover:bg-brand-muted rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5 text-brand-ink/30" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover/actions:block z-30 bg-white border border-brand-border rounded-xl shadow-xl p-2 min-w-[140px]">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMeeting(meeting);
                              setEditData({ title: meeting.title, folder_id: meeting.folder_id || '' });
                              setIsEditing(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-brand-muted rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Details
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateMeeting(meeting);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-brand-muted rounded-md transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeeting(meeting.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-brand-muted rounded-md transition-colors text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
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

      {/* Meeting Details Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedMeeting(null);
                setIsEditing(false);
                setIsCreatingInlineFolder(false);
              }}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-muted/30">
                <div className="flex-1 mr-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Edit Details</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-brand-ink/40">Title</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-brand-muted rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-accent"
                            value={editData.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-widest text-brand-ink/40">Folder</label>
                            <button 
                              onClick={() => setIsCreatingInlineFolder(true)}
                              className="text-[10px] font-bold text-brand-accent hover:underline"
                            >
                              + New Folder
                            </button>
                          </div>
                          {isCreatingInlineFolder ? (
                            <div className="flex gap-2">
                              <input 
                                autoFocus
                                type="text" 
                                className="flex-1 px-3 py-1.5 bg-brand-muted rounded-lg border border-brand-border outline-none text-sm"
                                placeholder="Folder name..."
                                value={inlineFolderName}
                                onChange={(e) => setInlineFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCreateFolderInline(e);
                                  if (e.key === 'Escape') setIsCreatingInlineFolder(false);
                                }}
                              />
                              <button 
                                onClick={handleCreateFolderInline}
                                className="px-3 py-1.5 bg-brand-ink text-white rounded-lg text-xs font-bold"
                              >
                                Add
                              </button>
                            </div>
                          ) : (
                            <select 
                              className="w-full px-4 py-2 bg-brand-muted rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-accent"
                              value={editData.folder_id}
                              onChange={(e) => setEditData({...editData, folder_id: e.target.value})}
                            >
                              <option value="General">General</option>
                              {folders.filter(f => f.name !== 'General').map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveEdit}
                          className="bg-brand-ink text-white px-6 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                        >
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 rounded-xl font-bold text-sm border border-brand-border hover:bg-brand-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-1">
                        <h2 className="text-2xl font-bold">{selectedMeeting.title}</h2>
                        <button 
                          onClick={() => {
                            setEditData({ title: selectedMeeting.title, folder_id: selectedMeeting.folder_id || '' });
                            setIsEditing(true);
                          }}
                          className="text-xs font-bold text-brand-accent hover:underline"
                        >
                          Edit Details
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-brand-ink/50 font-medium">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {format(new Date(selectedMeeting.created_at || new Date()), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedMeeting.duration}</span>
                        <span className="px-2 py-0.5 bg-brand-muted rounded-md text-[10px] font-black uppercase">{selectedMeeting.folder_id || 'General'}</span>
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setSelectedMeeting(null);
                    setIsEditing(false);
                    setIsCreatingInlineFolder(false);
                  }}
                  className="p-3 hover:bg-brand-muted rounded-2xl transition-colors self-start"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-accent font-bold uppercase tracking-widest text-xs">
                    <Sparkles className="w-4 h-4" />
                    AI Summary
                  </div>
                  <div className="p-6 bg-brand-muted rounded-3xl border border-brand-border text-brand-ink/80 leading-relaxed">
                    {selectedMeeting.summary}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-ink/40 font-bold uppercase tracking-widest text-xs">
                    <FileText className="w-4 h-4" />
                    Transcript
                  </div>
                  <div className="text-brand-ink/60 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {selectedMeeting.transcript}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {isCreatingFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingFolder(false)}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">Create New Folder</h2>
              <form onSubmit={handleCreateFolder} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-ink/40">Folder Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    className="w-full px-4 py-3 bg-brand-muted rounded-2xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                    placeholder="e.g. Design Syncs"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 bg-brand-ink text-white py-3 rounded-2xl font-bold hover:scale-[1.02] transition-transform"
                  >
                    Create Folder
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="flex-1 py-3 rounded-2xl font-bold border border-brand-border hover:bg-brand-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Folder Modal */}
      <AnimatePresence>
        {editingFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingFolder(null)}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">Edit Folder</h2>
              <form onSubmit={handleEditFolder} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-ink/40">Folder Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    className="w-full px-4 py-3 bg-brand-muted rounded-2xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 bg-brand-ink text-white py-3 rounded-2xl font-bold hover:scale-[1.02] transition-transform"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingFolder(null)}
                    className="flex-1 py-3 rounded-2xl font-bold border border-brand-border hover:bg-brand-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
