import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Play, FileText, Sparkles, Clock, Calendar as CalendarIcon, ChevronRight, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../services/api';

export default function Dashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', folder_id: '' });
  const [folders, setFolders] = useState([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

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

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFolderName = (id) => {
    const folder = folders.find(f => f.id === id);
    return folder ? folder.name : 'General';
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (event) => audioChunks.current.push(event.data);

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const duration = formatTime(recordTime);
        
        try {
          const publicAudioUrl = await api.uploadAudio(audioBlob);
          const result = await api.addMeeting({
            title: 'New Meeting',
            duration: duration,
            audio_url: publicAudioUrl,
            folder_id: null
          });

          await fetchMeetings();
          const data = await api.getMeetings();
          const created = data.meetings.find(m => m.id === result.meeting_id);
          
          if (created) {
            setSelectedMeeting(created);
            setEditData({ title: created.title || '', folder_id: created.folder_id || '' });
            setIsEditing(true);
          }
        } catch (err) {
          console.error("Processing failed:", err);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Please allow microphone access to record meetings.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.updateMeeting(selectedMeeting.id, {
        title: editData.title,
        folder_id: editData.folder_id === '' ? null : editData.folder_id
      });
      await fetchMeetings();
      setIsEditing(false);
      const data = await api.getMeetings();
      setSelectedMeeting(data.meetings.find(m => m.id === selectedMeeting.id));
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleCreateFolderInline = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.addFolder(newFolderName);
      const data = await api.getFolders();
      setFolders(data.folders);
      const newlyCreated = data.folders.find(f => f.name.toLowerCase() === newFolderName.toLowerCase());
      if (newlyCreated) setEditData(prev => ({ ...prev, folder_id: newlyCreated.id }));
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 px-4 sm:px-6">
      {/* Recording Section */}
      <section className="relative">
        <div className={cn(
          "p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-6 sm:gap-8",
          isRecording ? "bg-brand-ink border-brand-ink shadow-2xl scale-[1.01]" : "bg-white border-brand-border"
        )}>
          <div className="relative">
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.2 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="absolute inset-0 bg-red-500 rounded-full"
                />
              )}
            </AnimatePresence>
            <button 
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isProcessing}
              className={cn(
                "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all active:scale-95 z-10",
                isRecording ? "bg-red-500 text-white" : "bg-brand-ink text-white hover:scale-105",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            >
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : (isRecording ? <Square className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Mic className="w-8 h-8 sm:w-10 sm:h-10" />)}
            </button>
          </div>

          <div className="text-center">
            <h3 className={cn(
              "text-xl sm:text-3xl font-bold mb-2",
              isRecording ? "text-white" : "text-brand-ink"
            )}>
              {isProcessing ? "AI is analyzing..." : (isRecording ? "Recording..." : "Ready to record?")}
            </h3>
            <p className={cn(
              "text-sm sm:text-lg",
              isRecording ? "text-white/60" : "text-brand-ink/50"
            )}>
              {isRecording ? formatTime(recordTime) : "Tap the mic to start capturing"}
            </p>
          </div>
        </div>
      </section>

      {/* Recent Meetings */}
      <section>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">Recent Meetings</h2>
          <button className="text-xs sm:text-sm font-bold text-brand-accent hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {meetings.map((meeting) => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting} 
              folderName={getFolderName(meeting.folder_id)}
              onClick={() => setSelectedMeeting(meeting)} 
            />
          ))}
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedMeeting(null); setIsEditing(false); }}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 sm:p-8 border-b border-brand-border flex items-start justify-between bg-brand-muted/30">
                <div className="flex-1 mr-2">
                  {isEditing ? (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold">Edit Details</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-brand-ink/40">Title</label>
                          <input 
                            className="w-full px-4 py-2 bg-brand-muted rounded-xl border border-brand-border text-sm"
                            value={editData.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><label className="text-[10px] font-black uppercase text-brand-ink/40">Folder</label></div>
                          {isCreatingFolder ? (
                            <div className="flex gap-2">
                              <input autoFocus className="flex-1 px-3 py-2 bg-brand-muted rounded-lg border border-brand-border text-sm" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
                              <button onClick={handleCreateFolderInline} className="px-3 bg-brand-ink text-white rounded-lg text-xs font-bold">Add</button>
                            </div>
                          ) : (
                            <select 
                              className="w-full px-4 py-2 bg-brand-muted rounded-xl border border-brand-border text-sm"
                              value={editData.folder_id ?? ""}
                              onChange={(e) => setEditData({...editData, folder_id: parseInt(e.target.value) || ""})}
                            >
                              <option value="">General</option>
                              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                          )}
                          {!isCreatingFolder && <button onClick={() => setIsCreatingFolder(true)} className="text-[10px] font-bold text-brand-accent mt-1">+ New Folder</button>}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveEdit} className="bg-brand-ink text-white px-4 py-2 rounded-lg font-bold text-xs">Save</button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg font-bold text-xs border border-brand-border">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-lg sm:text-2xl font-bold">{selectedMeeting.title}</h2>
                        <button onClick={() => { setEditData({ title: selectedMeeting.title, folder_id: selectedMeeting.folder_id ?? "" }); setIsEditing(true); }} className="text-[10px] font-bold text-brand-accent px-2 py-1 bg-brand-accent/10 rounded-md">Edit</button>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-brand-ink/50 font-medium">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {format(new Date(selectedMeeting.created_at || new Date()), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedMeeting.duration}</span>
                        <span className="px-2 py-0.5 bg-brand-muted rounded-md font-black uppercase">{getFolderName(selectedMeeting.folder_id)}</span>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => { setSelectedMeeting(null); setIsEditing(false); }} className="p-2 hover:bg-brand-muted rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-accent font-bold uppercase tracking-widest text-[10px] sm:text-xs"><Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />AI Summary</div>
                  <div className="p-4 sm:p-6 bg-brand-muted rounded-2xl sm:rounded-3xl border border-brand-border text-brand-ink/80 text-sm sm:text-base leading-relaxed">{selectedMeeting.summary}</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-ink/40 font-bold uppercase tracking-widest text-[10px] sm:text-xs"><FileText className="w-3 h-3 sm:w-4 sm:h-4" />Transcript</div>
                  <div className="text-brand-ink/60 leading-relaxed whitespace-pre-wrap font-mono text-xs sm:text-sm">{selectedMeeting.transcript}</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MeetingCard({ meeting, folderName, onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-brand-border hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-brand-muted rounded-xl group-hover:bg-brand-ink group-hover:text-white transition-colors"><FileText className="w-5 h-5 sm:w-6 sm:h-6" /></div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider"><Clock className="w-3 h-3" />{meeting.duration}</div>
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 group-hover:text-brand-accent transition-colors line-clamp-1">{meeting.title}</h3>
      <div className="flex items-center gap-3 text-[10px] sm:text-sm text-brand-ink/50 mb-3 sm:mb-4">
        <div className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{format(new Date(meeting.created_at || new Date()), 'MMM d, yy')}</div>
        <div className="px-2 py-0.5 bg-brand-muted rounded-md font-black uppercase">{folderName}</div>
      </div>
      <div className="p-3 sm:p-4 bg-brand-muted/50 rounded-xl sm:rounded-2xl border border-brand-border/50">
        <p className="text-xs sm:text-sm text-brand-ink/60 line-clamp-2 leading-relaxed">{meeting.summary}</p>
      </div>
    </motion.div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}