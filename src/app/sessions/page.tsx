'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Send, CalendarDays, Clock,
  CheckCircle2, Zap, BookOpen, Lock, Users,
  MessageCircle, Search, Bell, ArrowRight,
  Timer, Wifi, Shield, X
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
type Message = { id: string; sender: 'student' | 'tutor'; text: string; time: string };
type ScheduledClass = {
  id: string;
  class_date: string;
  start_time: string;
  end_time: string;
  status: string;
};
type TutorSession = {
  id: string;
  roomId: string;
  tutorName: string;
  tutorInitial: string;
  subject: string;
  status: 'pending' | 'accepted' | 'declined';
  lastMsg: string;
  lastActive: string;
  scheduledClasses: ScheduledClass[];
};

// ─── Utilities ──────────────────────────────────────────────────────────
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const toDateTime = (dateStr: string, timeStr: string) => new Date(`${dateStr}T${timeStr}`);

type Tab = 'updates' | 'discussion' | 'class';

// ─── Shared Components ──────────────────────────────────────────────
const ChatBubble = ({ msg, tutorInitial }: { msg: Message; tutorInitial: string }) => (
  <div className={`flex gap-3 ${msg.sender === 'student' ? 'flex-row-reverse' : 'flex-row'}`}>
    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${msg.sender === 'student' ? 'bg-blue-500 text-white' : 'bg-brand-primary text-brand-dark'}`}>
      {msg.sender === 'student' ? 'Y' : tutorInitial}
    </div>
    <div className={`max-w-[75%] ${msg.sender === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
      <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.sender === 'student' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-brand-dark rounded-tl-sm shadow-sm'}`}>{msg.text}</div>
      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{msg.time}</span>
    </div>
  </div>
);

const ChatInput = ({ value, onChange, onSend, placeholder }: any) => (
  <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-lg ring-1 ring-slate-100 mt-auto">
    <input 
      type="text" 
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      onKeyDown={(e: any) => e.key === 'Enter' && onSend()}
      placeholder={placeholder || "Type your message..."}
      className="flex-1 bg-transparent px-6 py-4 text-sm font-medium focus:outline-none placeholder:text-slate-300"
    />
    <button 
      onClick={onSend}
      className="p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all active:scale-95 shadow-md flex items-center justify-center shrink-0"
    >
      <Send className="w-5 h-5 -rotate-12" />
    </button>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────
export default function StudentSessionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TutorSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('updates');
  const [now, setNow] = useState(new Date());

  const [messages, setMessages] = useState<Message[]>([]);
  const [classMessages, setClassMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [classInput, setClassInput] = useState('');

  const msgBottomRef = useRef<HTMLDivElement>(null);
  const classBottomRef = useRef<HTMLDivElement>(null);

  // ─── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(prof);
      
      if (prof?.role === 'seller') { router.replace('/dashboard'); return; }

      await fetchSessions(session.user.id);
    };
    init();

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [router]);

  // ─── Fetch all tutor sessions for this student ────────────────────
  const fetchSessions = async (userId: string) => {
    try {
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select(`id, tutor_id, created_at, profiles:tutor_id(full_name, avatar_url)`)
        .eq('student_id', userId);

      if (!rooms || rooms.length === 0) { setLoading(false); return; }

      // Fetch scheduled classes for all rooms
      const roomIds = rooms.map(r => r.id);
      const { data: schedules } = await supabase
        .from('scheduled_classes')
        .select('*')
        .in('room_id', roomIds)
        .order('class_date', { ascending: true });

      // Check which rooms have tutor messages (= tutor accepted/engaged)
      const { data: tutorMessages } = await supabase
        .from('chat_messages')
        .select('room_id, sender_id')
        .in('room_id', roomIds);

      const sessionList: TutorSession[] = rooms.map((room: any) => {
        const tutorProfile = Array.isArray(room.profiles) ? room.profiles[0] : room.profiles;
        const name = tutorProfile?.full_name || 'Tutor';
        const roomSchedules = (schedules || []).filter(s => s.room_id === room.id);
        const hasTutorResponse = (tutorMessages || []).some(m => m.room_id === room.id && m.sender_id === room.tutor_id);

        return {
          id: room.tutor_id,
          roomId: room.id,
          tutorName: name,
          tutorInitial: name.charAt(0).toUpperCase(),
          subject: roomSchedules.length > 0 ? 'Scheduled' : 'Pending',
          status: hasTutorResponse ? 'accepted' : 'pending',
          lastMsg: '...',
          lastActive: 'Now',
          scheduledClasses: roomSchedules,
        } as TutorSession;
      });

      setSessions(sessionList);
      if (sessionList.length > 0) setSelectedSession(sessionList[0]);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setLoading(false);
    }
  };

  // ─── Fetch messages for selected session ──────────────────────────
  useEffect(() => {
    if (!selectedSession?.roomId || !currentUser) return;

    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', selectedSession.roomId)
        .order('created_at', { ascending: true });

      if (data) {
        const mapped: Message[] = data.map((m: any) => ({
          id: m.id,
          sender: (m.sender_id === currentUser.id ? 'student' : 'tutor') as 'student' | 'tutor',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(mapped);
      }
    };
    fetchMsgs();

    const channel = supabase
      .channel(`student-room-${selectedSession.roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${selectedSession.roomId}` }, (payload) => {
        const m = payload.new as any;
        const msg: Message = {
          id: m.id,
          sender: m.sender_id === currentUser.id ? 'student' : 'tutor',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedSession, currentUser]);

  useEffect(() => { msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);
  useEffect(() => { classBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [classMessages.length]);

  // ─── Class lock logic ─────────────────────────────────────────────
  const getActiveClass = (): ScheduledClass | null => {
    if (!selectedSession) return null;
    return selectedSession.scheduledClasses.find(sc => {
      const start = toDateTime(sc.class_date, sc.start_time);
      const end = toDateTime(sc.class_date, sc.end_time);
      return now >= start && now <= end;
    }) || null;
  };

  const getNextClass = (): ScheduledClass | null => {
    if (!selectedSession) return null;
    return selectedSession.scheduledClasses.find(sc => {
      const start = toDateTime(sc.class_date, sc.start_time);
      return now < start;
    }) || null;
  };

  const getCountdown = (sc: ScheduledClass): string => {
    const start = toDateTime(sc.class_date, sc.start_time);
    const diff = start.getTime() - now.getTime();
    if (diff <= 0) return '';
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const isClassActive = () => !!getActiveClass();

  // ─── Send messages ────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!msgInput.trim() || !selectedSession?.roomId) return;
    const content = msgInput.trim(); setMsgInput('');
    await supabase.from('chat_messages').insert({ room_id: selectedSession.roomId, sender_id: currentUser?.id, content });
  };

  const sendClassMsg = () => {
    if (!classInput.trim() || !isClassActive() || !selectedSession) return;
    const msg: Message = { id: crypto.randomUUID(), sender: 'student', text: classInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setClassMessages(prev => [...prev, msg]);
    setClassInput('');
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Loading Sessions...</p>
    </div>
  );

  const filteredSessions = sessions.filter(s => s.tutorName.toLowerCase().includes(searchQuery.toLowerCase()));

  // ─── Empty state ──────────────────────────────────────────────────
  if (sessions.length === 0) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 font-sans">
      <ScrollStyles />
      <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center">
        <MessageCircle className="w-10 h-10 text-blue-400" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-dark mb-2">No Active Sessions</h2>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">You haven't connected with any tutors yet. Browse subjects or post a help request to get started.</p>
      </div>
      <div className="flex gap-3 mt-4">
        <Link href="/subjects" className="px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Browse Subjects</Link>
        <Link href="/help-wanted" className="px-6 py-3 bg-white border border-slate-200 text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Post Request</Link>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-white font-sans flex overflow-hidden">
      <ScrollStyles />

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-brand-dark">My Sessions</h1>
            <Link href="/" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" placeholder="Search tutors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400 transition-all shadow-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll px-3 space-y-1">
          <p className="px-4 text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-3">Active Tutors</p>
          {filteredSessions.map(s => (
            <button key={s.roomId} onClick={() => { setSelectedSession(s); setActiveTab('updates'); }} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all relative ${selectedSession?.roomId === s.roomId ? 'bg-white shadow-md border border-slate-100' : 'hover:bg-slate-100/80'}`}>
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black ${selectedSession?.roomId === s.roomId ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{s.tutorInitial}</div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${s.status === 'accepted' ? 'bg-emerald-400' : s.status === 'declined' ? 'bg-red-400' : 'bg-amber-400'}`}>
                  {s.status === 'accepted' ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <Clock className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-sm font-black uppercase italic truncate text-brand-dark">{s.tutorName}</p>
                  <span className="text-[8px] font-bold text-slate-300 uppercase shrink-0">{s.lastActive}</span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest truncate leading-none ${s.status === 'accepted' ? 'text-emerald-500' : s.status === 'declined' ? 'text-red-400' : 'text-amber-500'}`}>
                  {s.status === 'accepted' ? (s.scheduledClasses.length > 0 ? 'Class Scheduled' : 'Tutor Engaged') : s.status === 'declined' ? 'Declined' : 'Awaiting Response'}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-sm">
            {profile?.full_name?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-black text-brand-dark uppercase italic leading-none">{profile?.full_name || 'Student'}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Student</p>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/20">
        <header className="bg-white border-b border-slate-100 px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${selectedSession?.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {selectedSession?.tutorInitial || '?'}
            </div>
            <div>
              <p className="text-sm font-black text-brand-dark uppercase italic leading-none">{selectedSession?.tutorName || 'No Tutor Selected'}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${selectedSession?.status === 'accepted' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedSession?.status === 'accepted' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedSession?.status === 'accepted' ? 'Connected' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
          {selectedSession && selectedSession.scheduledClasses.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">{selectedSession.scheduledClasses.length} Class{selectedSession.scheduledClasses.length > 1 ? 'es' : ''} Scheduled</span>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-100 px-8 flex shrink-0">
          {([
            { key: 'updates' as Tab, label: 'Updates', icon: Bell },
            { key: 'discussion' as Tab, label: 'Discussion', icon: MessageCircle },
            { key: 'class' as Tab, label: 'Live Class', icon: BookOpen },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-3 px-8 py-5 transition-all ${activeTab === tab.key ? 'text-brand-dark' : 'text-slate-400'}`}>
              <tab.icon className="w-4 h-4" />
              <div className="text-left font-black uppercase leading-none">
                <p className="text-[10px] tracking-[2px]">{tab.label}</p>
                <p className="text-[8px] tracking-widest opacity-60 mt-1">
                  {tab.key === 'class' ? (isClassActive() ? 'Live' : 'Locked') : 'View'}
                </p>
              </div>
              {activeTab === tab.key && <motion.div layoutId="student-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">

            {/* ── UPDATES TAB ──────────────────────────────────────── */}
            {activeTab === 'updates' && (
              <motion.div key="updates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto px-10 py-10 space-y-8 custom-scroll">
                
                {/* Connection Status Card */}
                <div className={`rounded-[2rem] border p-8 ${selectedSession?.status === 'accepted' ? 'bg-emerald-50/50 border-emerald-200' : selectedSession?.status === 'declined' ? 'bg-red-50/50 border-red-200' : 'bg-amber-50/50 border-amber-200'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedSession?.status === 'accepted' ? 'bg-emerald-100' : selectedSession?.status === 'declined' ? 'bg-red-100' : 'bg-amber-100'}`}>
                      {selectedSession?.status === 'accepted' ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : selectedSession?.status === 'declined' ? <X className="w-7 h-7 text-red-500" /> : <Clock className="w-7 h-7 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-brand-dark">
                        {selectedSession?.status === 'accepted' ? 'Tutor Connected' : selectedSession?.status === 'declined' ? 'Request Declined' : 'Awaiting Response'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {selectedSession?.status === 'accepted' ? `${selectedSession.tutorName} has accepted your request. You can now discuss scheduling.` : selectedSession?.status === 'declined' ? 'This tutor has declined. Try connecting with another specialist.' : `Your request has been sent to ${selectedSession?.tutorName}. They'll respond soon.`}
                      </p>
                    </div>
                  </div>
                  {selectedSession?.status === 'accepted' && (
                    <button onClick={() => setActiveTab('discussion')} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                      <MessageCircle className="w-3.5 h-3.5" /> Open Discussion
                    </button>
                  )}
                </div>

                {/* Scheduled Classes */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Scheduled Classes</p>
                  
                  {(!selectedSession || selectedSession.scheduledClasses.length === 0) ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-300 italic">
                        {selectedSession?.status === 'accepted' ? 'Tutor hasn\'t scheduled a class yet. Check the discussion tab.' : 'No classes scheduled yet.'}
                      </p>
                    </div>
                  ) : (
                    selectedSession.scheduledClasses.map(sc => {
                      const isLive = now >= toDateTime(sc.class_date, sc.start_time) && now <= toDateTime(sc.class_date, sc.end_time);
                      const isPast = now > toDateTime(sc.class_date, sc.end_time);
                      const countdown = getCountdown(sc);

                      return (
                        <div key={sc.id} className={`bg-white rounded-2xl border p-6 flex items-center justify-between shadow-sm transition-all ${isLive ? 'border-emerald-300 ring-2 ring-emerald-100' : isPast ? 'border-slate-100 opacity-60' : 'border-slate-100'}`}>
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLive ? 'bg-emerald-100' : isPast ? 'bg-slate-100' : 'bg-blue-50'}`}>
                              {isLive ? <Wifi className="w-6 h-6 text-emerald-600 animate-pulse" /> : isPast ? <CheckCircle2 className="w-6 h-6 text-slate-400" /> : <CalendarDays className="w-6 h-6 text-blue-500" />}
                            </div>
                            <div>
                              <p className="font-black italic text-brand-dark uppercase text-sm">{fmtDate(sc.class_date)}</p>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">{fmtTime(sc.start_time)} — {fmtTime(sc.end_time)}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : isPast ? 'bg-slate-300' : 'bg-blue-400'}`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isLive ? 'text-emerald-500' : isPast ? 'text-slate-400' : 'text-blue-500'}`}>
                                  {isLive ? 'Live Now' : isPast ? 'Completed' : 'Upcoming'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {isLive ? (
                              <button onClick={() => setActiveTab('class')} className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5" /> Join Class
                              </button>
                            ) : !isPast && countdown ? (
                              <div className="bg-brand-dark px-4 py-2 rounded-xl">
                                <p className="text-[8px] font-black uppercase tracking-[3px] text-brand-primary/50 mb-0.5">Starts In</p>
                                <p className="text-lg font-black text-brand-primary">{countdown}</p>
                              </div>
                            ) : isPast ? (
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Session ended</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* ── DISCUSSION TAB ───────────────────────────────────── */}
            {activeTab === 'discussion' && (
              <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col max-w-4xl mx-auto px-8 pt-8 pb-4">
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
                  {messages.length === 0 && (
                    <div className="py-20 text-center">
                      <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-300 font-black uppercase tracking-[3px] italic text-sm">Start the conversation...</p>
                    </div>
                  )}
                  {messages.map(m => <ChatBubble key={m.id} msg={m} tutorInitial={selectedSession?.tutorInitial || 'T'} />)}
                  <div ref={msgBottomRef} />
                </div>
                <ChatInput value={msgInput} onChange={setMsgInput} onSend={sendMsg} placeholder="Message your tutor..." />
              </motion.div>
            )}

            {/* ── LIVE CLASS TAB ────────────────────────────────────── */}
            {activeTab === 'class' && (
              <motion.div key="class" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col p-8">
                {!isClassActive() ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div className="max-w-md">
                      <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-amber-500" /></div>
                      <h3 className="text-2xl font-black uppercase italic text-brand-dark mb-3">
                        {getNextClass() ? 'Class Not Started' : 'No Class Scheduled'}
                      </h3>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-widest leading-relaxed mb-6">
                        {getNextClass() ? 'This terminal will unlock automatically when your class begins.' : 'Your tutor hasn\'t scheduled a live class yet. Check the updates tab.'}
                      </p>
                      {getNextClass() && (
                        <div className="px-8 py-4 bg-brand-dark text-brand-primary rounded-2xl inline-block shadow-2xl">
                          <p className="text-[10px] font-black uppercase tracking-[4px] mb-1 opacity-50">Class In</p>
                          <p className="text-3xl font-black">{getCountdown(getNextClass()!)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
                      <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Live Session Active with {selectedSession?.tutorName}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
                      {classMessages.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase tracking-[3px] italic">Class is live. Start interacting...</div>}
                      {classMessages.map(m => <ChatBubble key={m.id} msg={m} tutorInitial={selectedSession?.tutorInitial || 'T'} />)}
                      <div ref={classBottomRef} />
                    </div>
                    <ChatInput value={classInput} onChange={setClassInput} onSend={sendClassMsg} placeholder="Ask a question..." />
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
