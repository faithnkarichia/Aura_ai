import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Sparkles } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const storedMeetings = localStorage.getItem('aura_meetings');
    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings));
    }
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] border border-brand-border shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="p-8 border-b border-brand-border flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
          <p className="text-brand-ink/50 font-medium">You have {meetings.length} meetings scheduled this month</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-3 hover:bg-brand-muted rounded-2xl transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={nextMonth} className="p-3 hover:bg-brand-muted rounded-2xl transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-brand-border bg-brand-muted/30">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-4 text-center text-xs font-black uppercase tracking-widest text-brand-ink/40">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayMeetings = meetings.filter(m => isSameDay(new Date(m.date), day));
          return (
            <div 
              key={day.toString()}
              className={cn(
                "min-h-[160px] p-4 border-r border-b border-brand-border transition-colors hover:bg-brand-muted/20",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <span className={cn(
                "text-sm font-bold inline-flex items-center justify-center w-8 h-8 rounded-full mb-2",
                isSameDay(day, new Date()) ? "bg-brand-ink text-white" : "text-brand-ink/40"
              )}>
                {format(day, 'd')}
              </span>
              
              <div className="space-y-2">
                {dayMeetings.map(meeting => (
                  <div 
                    key={meeting.id}
                    className="p-2 bg-brand-muted rounded-xl border border-brand-border/50 text-[10px] font-bold group cursor-pointer hover:border-brand-accent transition-all"
                  >
                    <div className="flex items-center gap-1 text-brand-accent mb-1">
                      <Clock className="w-2.5 h-2.5" />
                      {format(new Date(meeting.date), 'HH:mm')}
                    </div>
                    <div className="truncate text-brand-ink leading-tight">{meeting.title}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
