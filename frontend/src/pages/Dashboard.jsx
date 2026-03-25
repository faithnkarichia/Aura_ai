import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Play, FileText, Sparkles, Clock, Calendar as CalendarIcon, ChevronRight, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { transcribeAudio, summarizeTranscript } from '../services/ai';

export default function Dashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    const storedMeetings = localStorage.getItem('aura_meetings');
    // i should get the meeting from the backend
    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings));
    } else {
      const initialMeetings = [
        {
          id: '1',
          title: 'Product Sync - Q2 Roadmap',
          date: new Date().toISOString(),
          duration: '45:20',
          summary: 'Discussed the upcoming features for Q2, focusing on AI integration and user experience improvements.',
          transcript: 'Speaker 1: Welcome everyone. Today we are looking at the Q2 roadmap...',
          folder: 'Product'
        },
        {
          id: '2',
          title: 'Marketing Brainstorm',
          date: new Date(Date.now() - 86400000).toISOString(),
          duration: '32:15',
          summary: 'Brainstormed new campaign ideas for the summer launch. Decided on a "Simplify Your Life" theme.',
          transcript: 'Speaker 1: Let\'s start with some wild ideas...',
          folder: 'Marketing'
        }
      ];
      setMeetings(initialMeetings);
      localStorage.setItem('aura_meetings', JSON.stringify(initialMeetings));
    }
  }, []);
// calculating time of record
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

  const handleStartRecording = async () => {
    try {
      // ask the user to allow mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      // where the audio data will be stored while recording
      audioChunks.current = [];
// pushing the audio data  to the array
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
// once the recording is stopped set isProcessing to be true and create a blob from the audio data(like joining the chunks together)
      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        
        // Convert to base64
        // base64 turns a file in to text,
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          
          // Real AI processing
          // transcribe the audio to text and then summarize the transcript using the ai services we created
          const transcript = await transcribeAudio(base64Audio);
          const summary = await summarizeTranscript(transcript);
// creating a new meeting object with the transcript and summary and adding it to the meetings array and local storage
          const newMeeting = {
            id: Date.now().toString(),
            title: `Meeting ${format(new Date(), 'MMM d, HH:mm')}`,
            date: new Date().toISOString(),
            duration: formatTime(recordTime),
            summary: summary,
            transcript: transcript,
            folder: 'General'
          };
// we add the new meeting to the top of the meetings array and update the state and local storage
          const updatedMeetings = [newMeeting, ...meetings];
          setMeetings(updatedMeetings);
          localStorage.setItem('aura_meetings', JSON.stringify(updatedMeetings));
          setIsProcessing(false);
          setSelectedMeeting(newMeeting);
        };
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record meetings.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Recording Section */}
      <section className="relative">
        <div className={cn(
          "p-12 rounded-[3rem] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-8",
          isRecording ? "bg-brand-ink border-brand-ink shadow-2xl scale-[1.02]" : "bg-white border-brand-border"
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
                "relative w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 z-10",
                isRecording ? "bg-red-500 text-white" : "bg-brand-ink text-white hover:scale-110",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            >
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : (isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />)}
            </button>
          </div>

          <div className="text-center">
            <h3 className={cn(
              "text-3xl font-bold mb-2",
              isRecording ? "text-white" : "text-brand-ink"
            )}>
              {isProcessing ? "AI is analyzing your meeting..." : (isRecording ? "Recording in progress..." : "Ready to record?")}
            </h3>
            <p className={cn(
              "text-lg",
              isRecording ? "text-white/60" : "text-brand-ink/50"
            )}>
              {isRecording ? formatTime(recordTime) : "Tap the mic to start capturing your meeting"}
            </p>
          </div>

          {isRecording && (
            <div className="flex gap-2">
              {[...Array(12)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                  className="w-1.5 bg-white/40 rounded-full"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Meetings */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Recent Meetings</h2>
          <button className="text-sm font-bold text-brand-accent hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onClick={() => setSelectedMeeting(meeting)} />
          ))}
        </div>
      </section>

      {/* Meeting Details Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMeeting(null)}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-muted/30">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedMeeting.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-brand-ink/50 font-medium">
                    <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {format(new Date(selectedMeeting.date), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedMeeting.duration}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMeeting(null)}
                  className="p-3 hover:bg-brand-muted rounded-2xl transition-colors"
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
    </div>
  );
}

function MeetingCard({ meeting, onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="p-6 bg-white rounded-3xl border border-brand-border hover:shadow-lg transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-brand-muted rounded-2xl group-hover:bg-brand-ink group-hover:text-white transition-colors">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-brand-ink/40 uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          {meeting.duration}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2 group-hover:text-brand-accent transition-colors">{meeting.title}</h3>
      <div className="flex items-center gap-4 text-sm text-brand-ink/50 mb-4">
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-4 h-4" />
          {format(new Date(meeting.date), 'MMM d, yyyy')}
        </div>
        <div className="px-2 py-0.5 bg-brand-muted rounded-md text-[10px] font-black uppercase">
          {meeting.folder}
        </div>
      </div>

      <div className="p-4 bg-brand-muted/50 rounded-2xl border border-brand-border/50">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-brand-ink/70">
          <Sparkles className="w-3 h-3 text-brand-accent" />
          AI SUMMARY
        </div>
        <p className="text-sm text-brand-ink/60 line-clamp-2 leading-relaxed">
          {meeting.summary}
        </p>
      </div>
    </motion.div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
