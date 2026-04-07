'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Send, MessageSquare, CalendarDays,
  Clock, User, CheckCircle2, Zap, BookOpen,
  Lock, AlertTriangle, Users, MessageCircle, Search,
  Filter, MoreVertical, Star, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// ─── Custom scrollbar ───────────────────────────────────────────────────
const ScrollStyles = () => (
  <style jsx global>{`
    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: rgba(203, 213, 225, 0.4);
      border-radius: 20px;
    }
    .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 185, 0, 0.4);
    }
  `}</style>
);

// ─── Types ──────────────────────────────────────────────────────────────
type Message = { id: number; sender: 'tutor' | 'student'; text: string; time: string };
type ClassSlot = {
  id: number;
  studentName: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
};

type StudentProfile = {
  id: string;
  roomId: string;
  name: string;
  subject: string;
  initial: string;
  lastMsg: string;
  status: 'active' | 'pending';
  lastActive: string;
};

// ─── Utilities ──────────────────────────────────────────────────────────
const toDate = (dateStr: string, timeStr: string) => new Date(`${dateStr}T${timeStr}:00`);
const hasConflict = (ns: Date, ne: Date, es: Date, ee: Date) => ns < ee && ne > es;
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};
const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ─── Tab type ───────────────────────────────────────────────────────────
type Tab = 'discussion' | 'schedule' | 'class';
const MAX_CLASSES = 5;

// ─── Shared Components ──────────────────────────────────────────────
const ChatBubble = ({ msg, selectedStudent }: { msg: Message, selectedStudent: StudentProfile | null }) => (
  <div className={`flex gap-3 ${msg.sender === 'tutor' ? 'flex-row-reverse' : 'flex-row'}`}>
    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${msg.sender === 'tutor' ? 'bg-brand-primary text-brand-dark' : 'bg-slate-200 text-slate-600'}`}>
      {msg.sender === 'tutor' ? 'T' : (selectedStudent?.initial || 'S')}
    </div>
    <div className={`max-w-[75%] ${msg.sender === 'tutor' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
      <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.sender === 'tutor' ? 'bg-brand-dark text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-brand-dark rounded-tl-sm shadow-sm'}`}>{msg.text}</div>
      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{msg.time}</span>
    </div>
  </div>
);

const ChatInput = ({ value, onChange, onSend, placeholder }: any) => (
  <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-lg ring-1 ring-slate-100 mt-auto">
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSend()}
      placeholder={placeholder || "Type your message..."}
      className="flex-1 bg-transparent px-6 py-4 text-sm font-medium focus:outline-none placeholder:text-slate-300"
    />
    <button 
      onClick={onSend}
      className="p-4 bg-brand-dark text-brand-primary rounded-xl hover:bg-brand-primary hover:text-brand-dark transition-all active:scale-95 shadow-md flex items-center justify-center shrink-0"
    >
      <Send className="w-5 h-5 -rotate-12" />
    </button>
  </div>
);

export default function SessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('discussion');
  const [now, setNow] = useState(new Date());

  const [allDiscMsgs, setAllDiscMsgs] = useState<Record<string, Message[]>>({});
  const [allClassMsgs, setAllClassMsgs] = useState<Record<string, Message[]>>({});
  
  const discMsgs = selectedStudent ? (allDiscMsgs[selectedStudent.id] || []) : [];
  const classMsgs = selectedStudent ? (allClassMsgs[selectedStudent.id] || []) : [];

  const [discInput, setDiscInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [lawrenceSlot, setLawrenceSlot] = useState<ClassSlot | null>(null);
  
  const [formDate, setFormDate] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const discBottomRef = useRef<HTMLDivElement>(null);
  const classBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);
      fetchSessions(session.user.id);
    };
    init();

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchSessions = async (userId: string) => {
    try {
      const { data: rooms, error: roomErr } = await supabase
        .from('chat_rooms')
        .select(`id, student_id, profiles:student_id (full_name, avatar_url)`)
        .eq('tutor_id', userId);

      if (roomErr) throw roomErr;

      const { data: sessData } = await supabase
        .from('tutoring_sessions')
        .select(`student_id, help_requests (subject)`)
        .eq('tutor_id', userId);

      const studentList: StudentProfile[] = rooms.map(room => {
        const session = sessData?.find(s => s.student_id === room.student_id);
        const name = room.profiles?.full_name || 'Anonymous Student';
        return {
          id: room.student_id,
          roomId: room.id,
          name: name,
          subject: (session?.help_requests as any)?.subject || 'General Discussion',
          initial: name.charAt(0).toUpperCase(),
          lastMsg: '...', 
          status: 'active',
          lastActive: 'Just now'
        };
      });

      setStudents(studentList);
      if (studentList.length > 0) setSelectedStudent(studentList[0]);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStudent?.roomId) return;
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', selectedStudent.roomId)
        .order('created_at', { ascending: true });

      if (data) {
        const mapped: Message[] = data.map((m: any) => ({
          id: m.id,
          sender: (m.sender_id === currentUser?.id ? 'tutor' : 'student') as 'tutor' | 'student',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setAllDiscMsgs(prev => ({ ...prev, [selectedStudent.id]: mapped }));
      }
    };
    fetchMsgs();

    const channel = supabase
      .channel(`room-${selectedStudent.roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${selectedStudent.roomId}` }, (payload) => {
        const m = payload.new as any;
        const msg: Message = {
          id: m.id,
          sender: m.sender_id === currentUser?.id ? 'tutor' : 'student',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAllDiscMsgs(prev => ({ ...prev, [selectedStudent.id]: [...(prev[selectedStudent.id] || []), msg] }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent, currentUser]);

  useEffect(() => { 
    discBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [discMsgs.length]);

  useEffect(() => { 
    classBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [classMsgs.length]);

  const isClassLocked = () => {
    if (!selectedStudent || !lawrenceSlot) return true;
    const start = toDate(lawrenceSlot.date, lawrenceSlot.startTime), end = toDate(lawrenceSlot.date, lawrenceSlot.endTime);
    return now < start || now > end;
  };

  const getCountdown = () => {
    if (!selectedStudent || !lawrenceSlot) return '';
    const start = toDate(lawrenceSlot.date, lawrenceSlot.startTime), diff = start.getTime() - now.getTime();
    if (diff <= 0) return '';
    const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const isClassEnded = () => selectedStudent && lawrenceSlot && now > toDate(lawrenceSlot.date, lawrenceSlot.endTime);

  const scheduleClass = async () => {
    if (!formDate || !formStart || !formEnd || !selectedStudent) return;
    if (formEnd <= formStart) { setConflictError('End time must be after start time.'); return; }
    const ns = toDate(formDate, formStart), ne = toDate(formDate, formEnd);
    const conflicts = slots.filter(s => s.date === formDate && hasConflict(ns, ne, toDate(s.date, s.startTime), toDate(s.date, s.endTime)));
    if (conflicts.length > 0) { setConflictError(`Conflict: ${conflicts[0].studentName} is scheduled then.`); return; }

    const newSlot: ClassSlot = { id: Date.now(), studentName: selectedStudent.name, subject: selectedStudent.subject, date: formDate, startTime: formStart, endTime: formEnd };
    setSlots(p => [...p, newSlot]); setLawrenceSlot(newSlot); setFormDate(''); setFormStart(''); setFormEnd('');
    await supabase.from('chat_messages').insert({ room_id: selectedStudent.roomId, sender_id: currentUser?.id, content: `Scheduled for ${fmtDate(formDate)} at ${fmtTime(formStart)}.` });
  };

  const sendDiscMsg = async () => {
    if (!discInput.trim() || !selectedStudent?.roomId) return;
    const content = discInput.trim(); setDiscInput('');
    await supabase.from('chat_messages').insert({ room_id: selectedStudent.roomId, sender_id: currentUser?.id, content });
  };

  const sendClassMsg = () => {
    if (!classInput.trim() || isClassLocked() || !selectedStudent) return;
    const msg: Message = { id: Date.now(), sender: 'tutor', text: classInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAllClassMsgs(prev => ({ ...prev, [selectedStudent.id]: [...(prev[selectedStudent.id] || []), msg] }));
    setClassInput('');
  };

  if (loading) return (
    <div className="h-screen bg-white flex items-center justify-center text-brand-primary">
      <Zap className="w-10 h-10 animate-pulse" />
    </div>
  );

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.subject.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-screen bg-white font-sans flex overflow-hidden">
      <ScrollStyles />
      <aside className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-brand-dark mb-6">Sessions</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-brand-primary transition-all shadow-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll px-3 space-y-1">
          <p className="px-4 text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-3">Active Students</p>
          {filteredStudents.map(s => (
            <button key={s.id} onClick={() => setSelectedStudent(s)} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all relative ${selectedStudent?.id === s.id ? 'bg-white shadow-md border border-slate-100' : 'hover:bg-slate-100/80'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black ${selectedStudent?.id === s.id ? 'bg-brand-primary text-brand-dark' : 'bg-slate-200 text-slate-600'}`}>{s.initial}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5"><p className="text-sm font-black uppercase italic truncate text-brand-dark">{s.name}</p><span className="text-[8px] font-bold text-slate-300 uppercase">{s.lastActive}</span></div>
                <p className="text-[10px] font-bold uppercase tracking-widest truncate text-brand-primary leading-none">{s.subject}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center text-white font-black">T</div>
          <div className="flex-1 text-left"><p className="text-xs font-black text-brand-dark uppercase italic leading-none">Specialist Tutor</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Expert</p></div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/20">
        <header className="bg-white border-b border-slate-100 px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/missions" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-brand-dark transition-colors"><ChevronLeft className="w-3.5 h-3.5" />Back</Link>
            <div className="h-6 w-px bg-slate-100" />
            <div className="flex flex-col items-start leading-none">
              <p className="text-[11px] font-black text-brand-dark uppercase italic ">{selectedStudent?.name || 'No Student'}</p>
              <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mt-1">{selectedStudent?.subject || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Users className="w-3 h-3 text-slate-400" /><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{slots.length}/{MAX_CLASSES} Slots</span></div>
        </header>

        <div className="bg-white border-b border-slate-100 px-8 flex shrink-0">
          {(['discussion', 'schedule', 'class'] as const).map(k => (
            <button key={k} onClick={() => setActiveTab(k)} className={`relative flex items-center gap-3 px-8 py-5 transition-all ${activeTab === k ? 'text-brand-dark' : 'text-slate-400'}`}>
              <div className="text-left font-black uppercase leading-none">
                <p className="text-[10px] tracking-[2px]">{k}</p>
                <p className="text-[8px] tracking-widest opacity-60 mt-1">{k === 'class' && isClassLocked() ? 'Locked' : 'Access'}</p>
              </div>
              {activeTab === k && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'discussion' && (
              <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col max-w-4xl mx-auto px-8 pt-8 pb-4">
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
                  {discMsgs.map(m => <ChatBubble key={m.id} msg={m} selectedStudent={selectedStudent} />)}
                  <div ref={discBottomRef} />
                </div>
                <ChatInput value={discInput} onChange={setDiscInput} onSend={sendDiscMsg} placeholder="Negotiate timing..." />
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto px-10 py-10 space-y-10 custom-scroll text-left">
                <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm space-y-8">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-dark">Schedule {selectedStudent?.name || 'Session'}</h2>
                  {conflictError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{conflictError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Date</p><input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-brand-primary" /></div>
                    <div className="space-y-2"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">Start Time</p><input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-brand-primary" /></div>
                    <div className="space-y-2"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">End Time</p><input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-brand-primary" /></div>
                  </div>
                  <button onClick={scheduleClass} className="w-full md:w-auto px-10 py-5 bg-brand-dark text-white rounded-2xl font-black uppercase tracking-[3px] hover:bg-brand-primary hover:text-brand-dark transition-all shadow-xl">Lock Schedule</button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Scheduled Sessions</p>
                  {slots.length === 0 ? (
                    <div className="p-12 text-center text-[10px] font-black uppercase tracking-[3px] text-slate-300 italic bg-white rounded-2xl border border-dashed border-slate-200">No sessions manifest yet...</div>
                  ) : (
                    slots.map(s => (
                      <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-6 flex justify-between items-center shadow-sm">
                        <div><p className="font-black italic text-brand-dark uppercase">{s.studentName}</p><p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{s.subject}</p></div>
                        <div className="text-right text-xs font-bold"><p className="text-brand-dark">{fmtDate(s.date)}</p><p className="text-slate-400">{fmtTime(s.startTime)} - {fmtTime(s.endTime)}</p></div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'class' && (
              <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col p-8">
                {isClassLocked() ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div className="max-w-md">
                      <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-amber-500" /></div>
                      <h3 className="text-2xl font-black uppercase italic text-brand-dark mb-2">{isClassEnded() ? 'Session Terminated' : 'Terminal Locked'}</h3>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-widest leading-relaxed">
                        {isClassEnded() 
                          ? 'This session has reached its full duration. Archive data is being processed.' 
                          : 'Live instruction terminal will unlock automatically at the scheduled time.'}
                      </p>
                      {!isClassEnded() && getCountdown() && (
                        <div className="mt-8 px-8 py-4 bg-brand-dark text-brand-primary rounded-2xl inline-block shadow-2xl">
                          <p className="text-[10px] font-black uppercase tracking-[4px] mb-1 opacity-50">Activation In</p>
                          <p className="text-3xl font-black">{getCountdown()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
                      {classMsgs.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase tracking-[3px] italic">Live Stream Active: No data manifest yet...</div>}
                      {classMsgs.map(m => <ChatBubble key={m.id} msg={m} selectedStudent={selectedStudent} />)}
                      <div ref={classBottomRef} />
                    </div>
                    <ChatInput value={classInput} onChange={setClassInput} onSend={sendClassMsg} placeholder="Execute live instruction..." />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
