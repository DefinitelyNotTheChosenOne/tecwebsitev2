'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Send, MessageSquare, CalendarDays,
  Clock, User, CheckCircle2, Zap, BookOpen,
  Lock, AlertTriangle, Users, MessageCircle, Search,
  Filter, MoreVertical, Star, Shield, Wifi, X, Trash2
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
  start_time: string;
  end_time: string;
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
  isAccepted: boolean;
  schedules?: any[];
  latestSignalTime?: number | null;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('discussion');
  const [sidebarFilter, setSidebarFilter] = useState<'active' | 'past'>('active');
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
  const channelRef = useRef<any>(null);
  const syncChannelRef = useRef<any>(null);
  const globalWatchChannelRef = useRef<any>(null);
  const selectedStudentRef = useRef<StudentProfile | null>(null);
  const currentUserRef = useRef<any>(null);
  const studentsRef = useRef<StudentProfile[]>([]);
  const [isStudentTyping, setIsStudentTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  const deleteSession = async (roomId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete the mission with ${studentName}? This will be reflected on all your devices.`)) return;
    
    try {
      // 1. CLEAR SCHEDULES (Child of Room/Session)
      await supabase.from('scheduled_classes').delete().eq('room_id', roomId);
      
      // 2. CLEAR SESSION (Linked to Room)
      await supabase.from('tutoring_sessions').delete().eq('room_id', roomId);
      
      // 3. CLEAR MESSAGES (Linked to Room) - Must go before Room deletion
      await supabase.from('chat_messages').delete().eq('room_id', roomId);
      
      // 4. TERMINATE TUNNEL (The Root Record)
      const { error: roomErr } = await supabase.from('chat_rooms').delete().eq('id', roomId);
      
      if (roomErr) {
        console.error("Database Rejection:", roomErr);
        throw new Error(`DB RESTRICTION: ${roomErr.message}`);
      }

      setStudents(prev => prev.filter(s => s.roomId !== roomId));
      if (selectedStudent?.roomId === roomId) {
        setSelectedStudent(null);
      }
      alert(`GLOBAL PURGE COMPLETE: "${studentName}" has been removed from all systems.`);
    } catch (err: any) {
      console.error("Purge Error:", err);
      alert(`PURGE FAILED: ${err.message || "Database constraint violation."}`);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);
      
      const searchParams = new URLSearchParams(window.location.search);
      const roomParam = searchParams.get('room');
      await fetchSessions(session.user.id, roomParam);
    };
    init();

    const interval = setInterval(() => setNow(new Date()), 1000);

    // REAL-TIME PURGE SYNC: Singleton pattern — only create once, never re-create on re-render
    if (!syncChannelRef.current) {
      const syncChannel = supabase
        .channel(`purge-sync-${Math.random().toString(36).substring(7)}`)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_rooms' }, (payload) => {
           const deletedId = payload.old.id;
           setStudents(prev => prev.filter(s => s.roomId !== deletedId));
           setSelectedStudent(curr => curr?.roomId === deletedId ? null : curr);
        });
      syncChannel.subscribe();
      syncChannelRef.current = syncChannel;
    }

    // Anti-Snoop Protocol
    const handleContext = (e: MouseEvent) => {
      if (process.env.NODE_ENV === 'production') e.preventDefault();
    };
    const handleKeydown = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'production') {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('contextmenu', handleContext);
    window.addEventListener('keydown', handleKeydown);

    return () => {
      clearInterval(interval);
      if (syncChannelRef.current) {
        supabase.removeChannel(syncChannelRef.current);
        syncChannelRef.current = null;
      }
      window.removeEventListener('contextmenu', handleContext);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [router]);

  const fetchSessions = async (userId: string, targetRoomId?: string | null) => {
    try {
      const { data: rooms, error: roomErr } = await supabase
        .from('chat_rooms')
        .select(`id, student_id, profiles:student_id (full_name, avatar_url)`)
        .eq('tutor_id', userId);

      if (roomErr) throw roomErr;

      // Handle the "no rooms" case early
      if (!rooms || rooms.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const { data: sessData } = await supabase
        .from('tutoring_sessions')
        .select(`student_id, status, help_requests (subject)`)
        .eq('tutor_id', userId);

      const { data: schedules } = await supabase
        .from('scheduled_classes')
        .select('*')
        .eq('tutor_id', userId);

      // Map rooms to StudentProfile objects
      // RUTHLESS FILTER: Only show students who have actually sent a tunnel message
      const { data: firstMsgs } = await supabase
        .from('chat_messages')
        .select('room_id')
        .in('room_id', rooms.map(r => r.id));

      const activeRoomIds = new Set(firstMsgs?.map(m => m.room_id) || []);

      const studentList = await Promise.all((rooms || [])
        .filter((room: any) => activeRoomIds.has(room.id) || room.id === targetRoomId) 
        .map(async (room: any) => {
          const session = sessData?.find(s => s.student_id === room.student_id) as any;
          const name = (Array.isArray(room.profiles) ? room.profiles[0] : room.profiles)?.full_name || 'Anonymous Student';
          const roomSchedules = (schedules || []).filter(s => s.room_id === room.id);
          
          let subject = session?.help_requests?.subject;
          
          // Always fetch the latest discussion signal to check for re-opened sessions
          // We broaden the filter to catch ANY form of accept/initiate signal sent by the tutor or student to re-open the negotiation
          const { data: signalMsgs } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false });
            
          let latestSignalTime = null;
          if (signalMsgs && signalMsgs.length > 0) {
             const latestSystemMsg = signalMsgs.find(m => 
               m.content.toLowerCase().includes('discussion started') || 
               m.content.toLowerCase().includes('signal ')
             );
             
             if (latestSystemMsg) {
                if (!subject) {
                  subject = latestSystemMsg.content.split('"')[1] || latestSystemMsg.content.split('for ')[1];
                }
                latestSignalTime = new Date(latestSystemMsg.created_at).getTime();
             }
          }

          return {
            id: room.student_id,
            roomId: room.id,
            name: name,
            subject: subject || 'General Discussion',
            initial: name.charAt(0).toUpperCase(),
            lastMsg: '...', 
            status: (session?.status === 'accepted' ? 'active' : 'pending') as 'active' | 'pending',
            lastActive: 'Just now',
            schedules: roomSchedules,
            latestSignalTime,
            isAccepted: session?.status === 'accepted' || !!session || !!latestSignalTime
          };
        }));

      setStudents(studentList);
      
      // Critical Fix: Sync the selected student with the fresh data
      if (studentList.length > 0) {
        if (targetRoomId) {
          const target = studentList.find(s => s.roomId === targetRoomId);
          if (target) setSelectedStudent(target);
        } else if (selectedStudent) {
          const fresh = studentList.find(s => s.id === selectedStudent.id);
          if (fresh) setSelectedStudent(fresh);
        }
      }
      
      // Map raw schedules to expected ClassSlot format to prevent render crashes
      const mappedSlots = (schedules || []).map((s: any) => {
        const matchingStudent = studentList.find(st => st.roomId === s.room_id);
        return {
          id: s.id,
          studentName: matchingStudent?.name || 'Unknown',
          subject: matchingStudent?.subject || 'Session',
          date: s.class_date,
          start_time: s.start_time,
          end_time: s.end_time
        };
      });
      setSlots(mappedSlots);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  // Always keep refs in sync so realtime callbacks never read stale closure values
  useEffect(() => { selectedStudentRef.current = selectedStudent; }, [selectedStudent]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { studentsRef.current = students; }, [students]);

  // GLOBAL SIDEBAR WATCHER: Real-time dynamic updates for all student rows
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Only create one global listener for the entire sidebar
    if (globalWatchChannelRef.current) return;

    const globalChannel = supabase
      .channel(`specialist-global-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const m = payload.new as any;
        const currentStudents = studentsRef.current;
        const studentIndex = currentStudents.findIndex(s => s.roomId === m.room_id);
        if (studentIndex === -1) return;

        // Skip signal messages for lastMsg preview
        if (m.content.startsWith('SIGNAL') || m.content.startsWith('Discussion Started')) return;

        setStudents(prev => {
          const newList = [...prev];
          if (newList[studentIndex]) {
            newList[studentIndex] = {
              ...newList[studentIndex],
              lastMsg: m.content,
              lastActive: 'Just Now'
            };
          }
          return newList;
        });
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const m = payload.payload;
        const currentStudents = studentsRef.current;
        const studentIndex = currentStudents.findIndex(s => s.roomId === m.room_id);
        if (studentIndex === -1) return;
        if (m.content.startsWith('SIGNAL') || m.content.startsWith('Discussion Started')) return;

        setStudents(prev => {
          const newList = [...prev];
          if (newList[studentIndex]) {
            newList[studentIndex] = {
              ...newList[studentIndex],
              lastMsg: m.content,
              lastActive: 'Just Now'
            };
          }
          return newList;
        });
      })
      .subscribe();

    globalWatchChannelRef.current = globalChannel;

    return () => {
      supabase.removeChannel(globalChannel);
      globalWatchChannelRef.current = null;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!selectedStudent?.roomId) return;
    const fetchMsgs = async () => {
      // Discussion Messages
      const { data: dData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', selectedStudent.roomId)
        .order('created_at', { ascending: true });

      if (dData) {
        const mapped = dData
          .filter((m: any) => !m.content.startsWith('SIGNAL INITIATED:') && !m.content.startsWith('SIGNAL ACCEPTED:') && !m.content.startsWith('SIGNAL REJECTED:'))
          .map((m: any) => ({
            id: m.id,
            sender: (m.sender_id === currentUser?.id ? 'tutor' : 'student') as 'tutor' | 'student',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        setAllDiscMsgs(prev => ({ ...prev, [selectedStudent.id]: mapped }));
      }

      // Live Class Messages
      const { data: cData } = await supabase
        .from('live_class_messages')
        .select('*')
        .eq('room_id', selectedStudent.roomId)
        .order('created_at', { ascending: true });

      if (cData) {
        const mapped = cData.map((m: any) => ({
          id: m.id,
          sender: (m.sender_id === currentUser?.id ? 'tutor' : 'student') as 'tutor' | 'student',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setAllClassMsgs(prev => ({ ...prev, [selectedStudent.id]: mapped }));
      }
    };
    fetchMsgs();

    const channel = supabase.channel(`session:${selectedStudent.roomId}`, {
      config: {
        broadcast: { ack: true },
      },
    });
    channelRef.current = channel;

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const m = payload.new as any;
        const student = selectedStudentRef.current;
        const user = currentUserRef.current;
        if (!student || m.room_id !== student.roomId) return;
        if (m.content.startsWith('SIGNAL INITIATED:') || m.content.startsWith('SIGNAL ACCEPTED:') || m.content.startsWith('SIGNAL REJECTED:') || m.content.startsWith('Discussion Started')) return;
        setAllDiscMsgs(prev => {
          const studentMsgs = prev[student.id] || [];
          if (studentMsgs.some(existing => existing.id === m.id)) return prev;
          const msg: Message = {
            id: m.id,
            sender: m.sender_id === user?.id ? 'tutor' : 'student',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return { ...prev, [student.id]: [...studentMsgs, msg] };
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_class_messages'
      }, (payload) => {
        const m = payload.new as any;
        const student = selectedStudentRef.current;
        const user = currentUserRef.current;
        if (!student || m.room_id !== student.roomId) return;
        setAllClassMsgs(prev => {
          const studentMsgs = prev[student.id] || [];
          if (studentMsgs.some(existing => existing.id === m.id)) return prev;
          const msg: Message = {
            id: m.id,
            sender: m.sender_id === user?.id ? 'tutor' : 'student',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return { ...prev, [student.id]: [...studentMsgs, msg] };
        });
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const m = payload.payload;
        const student = selectedStudentRef.current;
        const user = currentUserRef.current;
        if (!student || m.room_id !== student.roomId) return;
        setAllDiscMsgs(prev => {
          const studentMsgs = prev[student.id] || [];
          if (studentMsgs.some(existing => existing.id === m.id)) return prev;
          const msg: Message = {
            id: m.id,
            sender: m.sender_id === user?.id ? 'tutor' : 'student',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return { ...prev, [student.id]: [...studentMsgs, msg] };
        });
      })
      .on('broadcast', { event: 'new_class_message' }, (payload) => {
        const m = payload.payload;
        const student = selectedStudentRef.current;
        const user = currentUserRef.current;
        if (!student || m.room_id !== student.roomId) return;
        setAllClassMsgs(prev => {
          const studentMsgs = prev[student.id] || [];
          if (studentMsgs.some(existing => existing.id === m.id)) return prev;
          const msg: Message = {
            id: m.id,
            sender: m.sender_id === user?.id ? 'tutor' : 'student',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return { ...prev, [student.id]: [...studentMsgs, msg] };
        });
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const user = currentUserRef.current;
        const otherTyping = Object.values(state).flat().some((u: any) => u.user_id !== user?.id && u.typing);
        setIsStudentTyping(otherTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserRef.current?.id, typing: false });
        }
      });

    return () => { 
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel); 
      channelRef.current = null;
    };
  }, [selectedStudent?.roomId, currentUser?.id]);

  const handleTyping = () => {
    if (!channelRef.current) return;
    channelRef.current.track({ user_id: currentUser?.id, typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ user_id: currentUser?.id, typing: false });
    }, 2000);
  };

  // ─── Auto-scroll Logic ──────────────────────────────────────────
  useEffect(() => {
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      if (activeTab === 'discussion') {
        discBottomRef.current?.scrollIntoView({ behavior });
      } else if (activeTab === 'class') {
        classBottomRef.current?.scrollIntoView({ behavior });
      }
    };

    // Immediate jump on tab/student change
    const t1 = setTimeout(() => scrollToBottom('auto'), 100);
    // Backup scroll after animation
    const t2 = setTimeout(() => scrollToBottom('auto'), 400);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeTab, selectedStudent]);

  useEffect(() => {
    // Smooth scroll for new messages
    if (activeTab === 'discussion') {
      discBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'class') {
      classBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allDiscMsgs, allClassMsgs]);

  const getActiveSlot = () => {
    if (!selectedStudent) return null;
    const studentSchedules = (selectedStudent as any).schedules || [];
    return studentSchedules.find((s: any) => {
      const start = toDate(s.class_date, s.start_time);
      const end = toDate(s.class_date, s.end_time);
      return now >= start && now <= end;
    });
  };

  const isClassLocked = () => {
    if (!selectedStudent) return true;
    const active = getActiveSlot();
    if (active) return false;
    
    // It's locked if it's in the future and NOT ended
    return !isClassEnded(selectedStudent);
  };

  const getCountdown = () => {
    if (!selectedStudent) return '';
    const studentSchedules = (selectedStudent as any).schedules || [];
    const next = studentSchedules.find((s: any) => toDate(s.class_date, s.start_time) > now);
    if (!next) return '';
    const start = toDate(next.class_date, next.start_time), diff = start.getTime() - now.getTime();
    if (diff <= 0) return '';
    const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const isClassEnded = (student: any) => {
    if (!student) return false;
    const studentSchedules = [...(student.schedules || [])];
    if (studentSchedules.length === 0) return false; 
    
    // Ensure chronological sorting of schedules
    studentSchedules.sort((a, b) => {
       const aTime = toDate(a.class_date, a.end_time).getTime();
       const bTime = toDate(b.class_date, b.end_time).getTime();
       return aTime - bTime;
    });

    const last = studentSchedules[studentSchedules.length - 1];
    const lastEndTime = toDate(last.class_date, last.end_time).getTime();
    
    // If we have a newer signal AFTER the last class ended, they are active.
    if (student.latestSignalTime && student.latestSignalTime > lastEndTime) {
       return false;
    }

    // Otherwise, check if the last schedule's time is in the past
    return now.getTime() > lastEndTime;
  };

  const getTimeLeft = () => {
    const slot = getActiveSlot();
    if (!slot) return '00:00';
    const end = toDate(slot.class_date, slot.end_time);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return '00:00';
    const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const scheduleClass = async () => {
    if (!formDate || !formStart || !formEnd || !selectedStudent) return;
    setConflictError(null);
    if (formEnd <= formStart) { setConflictError('End time must be after start time.'); return; }
    const ns = toDate(formDate, formStart), ne = toDate(formDate, formEnd);
    const conflicts = slots.filter(s => s.date === formDate && hasConflict(ns, ne, toDate(s.date, s.start_time), toDate(s.date, s.end_time)));
    if (conflicts.length > 0) { setConflictError(`Conflict: ${conflicts[0].studentName} is scheduled then.`); return; }
    
    const { error: schedErr } = await supabase.from('scheduled_classes').insert({
      room_id: selectedStudent.roomId,
      tutor_id: currentUser?.id,
      student_id: selectedStudent.id,
      class_date: formDate,
      start_time: formStart,
      end_time: formEnd,
    });
    
    if (schedErr) { setConflictError('Failed to save schedule. Try again.'); console.error(schedErr); return; }
    await supabase.from('chat_messages').insert({ room_id: selectedStudent.roomId, sender_id: currentUser?.id, content: `📅 Class scheduled: ${fmtDate(formDate)} at ${fmtTime(formStart)} - ${fmtTime(formEnd)}` });
    
    const dbFormatSchedule = { class_date: formDate, start_time: formStart, end_time: formEnd };
    const updatedStudent = { ...selectedStudent, schedules: [...(selectedStudent as any).schedules || [], dbFormatSchedule] };
    setSelectedStudent(updatedStudent);
    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
    
    setSlots(p => [...p, { id: Date.now(), studentName: selectedStudent.name, subject: selectedStudent.subject, date: formDate, start_time: formStart, end_time: formEnd }]);
    setFormDate(''); setFormStart(''); setFormEnd('');
  };

  const sendDiscMsg = async () => {
    if (!discInput.trim() || !selectedStudent?.roomId || !currentUser) return;
    const content = discInput.trim(); 
    setDiscInput('');

    // Optimistic update — show immediately without waiting for realtime echo
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId as any,
      sender: 'tutor',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAllDiscMsgs(prev => ({
      ...prev,
      [selectedStudent.id]: [...(prev[selectedStudent.id] || []), optimisticMsg]
    }));

    const { data, error } = await supabase.from('chat_messages').insert({ 
      room_id: selectedStudent.roomId, 
      sender_id: currentUser.id, 
      content 
    }).select().single();

    if (error) {
      console.error("Signal Failed:", error.message);
      // Rollback optimistic message on failure
      setAllDiscMsgs(prev => ({
        ...prev,
        [selectedStudent.id]: (prev[selectedStudent.id] || []).filter(m => m.id !== (optimisticId as any))
      }));
    } else if (data) {
      // Direct Broadcast Fallback: Send message directly through websocket in case Postgres replication lags
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: data
        });
      }
      
      // Replace optimistic ID with real DB ID to prevent duplicates from realtime echo
      setAllDiscMsgs(prev => ({
        ...prev,
        [selectedStudent.id]: (prev[selectedStudent.id] || []).map(m => 
          m.id === (optimisticId as any) ? { ...m, id: data.id } : m
        )
      }));
    }
  };

  const sendClassMsg = async () => {
    if (!classInput.trim() || isClassLocked() || !selectedStudent || !currentUser) return;
    const content = classInput.trim(); 
    setClassInput('');

    // Optimistic update
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId as any,
      sender: 'tutor',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAllClassMsgs(prev => ({
      ...prev,
      [selectedStudent.id]: [...(prev[selectedStudent.id] || []), optimisticMsg]
    }));

    const { data, error } = await supabase.from('live_class_messages').insert({
      room_id: selectedStudent.roomId,
      sender_id: currentUser.id,
      content
    }).select().single();

    if (error) {
      console.error("Signal Failed:", error.message);
      setAllClassMsgs(prev => ({
        ...prev,
        [selectedStudent.id]: (prev[selectedStudent.id] || []).filter(m => m.id !== (optimisticId as any))
      }));
    } else if (data) {
      // Direct Broadcast Fallback
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_class_message',
          payload: data
        });
      }

      setAllClassMsgs(prev => ({
        ...prev,
        [selectedStudent.id]: (prev[selectedStudent.id] || []).map(m => 
          m.id === (optimisticId as any) ? { ...m, id: data.id } : m
        )
      }));
    }
  };

  if (loading) return (
    <div className="h-screen bg-white flex items-center justify-center text-brand-primary">
      <Zap className="w-10 h-10 animate-pulse" />
    </div>
  );

  const filteredStudents = students.filter(s => {
    const nameMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch && !isClassEnded(s);
  });

  return (
    <div className="h-screen bg-white font-sans flex overflow-hidden">
      <ScrollStyles />
      {/* ── Mobile Overlay ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 bg-slate-50 border-r border-slate-100 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <ScrollStyles />
        <div className="p-8 pb-4">
           <h2 className="text-xl font-black text-brand-dark uppercase italic tracking-tighter mb-8 flex items-center justify-between">
              Students
              <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
                <button onClick={() => { setSidebarFilter('active'); }} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sidebarFilter === 'active' ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400 hover:text-brand-dark'}`}>Active</button>
                <button onClick={() => { setSidebarFilter('past'); setActiveTab('class'); setSelectedStudent(null); }} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sidebarFilter === 'past' ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400 hover:text-brand-dark'}`}>Past</button>
              </div>
           </h2>
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
              <input type="text" placeholder="Search missions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-100 py-3.5 pl-12 pr-6 rounded-2xl text-xs font-bold outline-none focus:border-brand-primary transition-all shadow-sm" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scroll">
          {students.filter(s => {
            const finished = isClassEnded(s);
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.subject.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (sidebarFilter === 'active') {
               return !finished && s.isAccepted && matchesSearch;
            } else {
               return (finished || !s.isAccepted) && matchesSearch;
            }
          }).map(s => (
            <div key={s.id} className="relative group/item">
              <button onClick={() => { setSelectedStudent(s); setActiveTab('discussion'); setSidebarOpen(false); }} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all relative ${selectedStudent?.id === s.id ? 'bg-white shadow-md border border-slate-100' : 'hover:bg-slate-100/80'}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black ${selectedStudent?.id === s.id ? 'bg-brand-primary text-brand-dark' : 'bg-slate-200 text-slate-600'}`}>{s.initial}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-black uppercase italic truncate text-brand-dark">{s.name}</p>
                    {isClassEnded(s) && (
                      <span className="text-[7px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded uppercase">FIN</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest truncate text-brand-primary leading-none">{s.subject}</p>
                </div>
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); deleteSession(s.roomId, s.name); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10"
                title="Delete Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-dark flex items-center justify-center text-white font-black text-sm">{currentUser?.email?.charAt(0).toUpperCase() || 'T'}</div>
          <div className="flex-1 text-left"><p className="text-xs font-black text-brand-dark uppercase italic leading-none">Specialist Tutor</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Expert</p></div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/20 md:ml-80">
        {selectedStudent && (
          <>
            <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-3 md:py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 md:gap-6">
                <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all md:hidden">
                  <Search className="w-4 h-4 text-slate-500" />
                </button>
                <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-brand-dark transition-colors"><ChevronLeft className="w-3.5 h-3.5" />Back</Link>
                <div className="hidden md:block h-6 w-px bg-slate-100" />
                <div className="flex flex-col items-start leading-none">
                  <p className="text-[11px] font-black text-brand-dark uppercase italic">{selectedStudent.name}</p>
                  <p className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mt-1">{selectedStudent.subject}</p>
                </div>
              </div>
            </header>

            {selectedStudent && !isClassEnded(selectedStudent) && (
              <div className="bg-white border-b border-slate-100 flex shrink-0 justify-center md:justify-start md:px-12">
                {(['discussion', 'schedule', 'class'] as const).map(k => (
                  <button key={k} onClick={() => setActiveTab(k)} className={`relative flex items-center gap-3 px-8 md:px-10 py-5 transition-all ${activeTab === k ? 'text-brand-dark' : 'text-slate-400'}`}>
                    <div className="text-left font-black uppercase leading-none">
                      <p className="text-[10px] tracking-[2px]">{k}</p>
                      <p className="text-[8px] tracking-widest opacity-60 mt-1">Access</p>
                    </div>
                    {activeTab === k && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!selectedStudent ? (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 px-10"
              >
                <div className="p-8 bg-slate-100 rounded-full">
                  <User className="w-16 h-16 text-slate-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-brand-dark">Select Mission Dossier</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400 mt-2">Active telemetry requires student selection from the sidebar.</p>
                </div>
              </motion.div>
) : isClassEnded(selectedStudent) ? (
              /* ── ARCHIVE VIEW: Read-only chat history for past sessions ── */
              <motion.div key="class-archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-6 px-8 md:px-12 pt-8 pb-4 custom-scroll">
                  {classMsgs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4">
                      <BookOpen className="w-12 h-12 text-slate-400" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">No class history recorded</p>
                    </div>
                  ) : classMsgs.map(m => <ChatBubble key={m.id} msg={m} selectedStudent={selectedStudent} />)}
                  <div ref={classBottomRef} />
                </div>
              </motion.div>
            ) : activeTab === 'schedule' ? (
              <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto px-10 py-10 space-y-10 custom-scroll text-left">
                <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm space-y-8">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-dark">Schedule {selectedStudent.name}</h2>
                  {conflictError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{conflictError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-brand-primary transition-all font-bold text-sm" />
                    <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-brand-primary transition-all font-bold text-sm" />
                    <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-brand-primary transition-all font-bold text-sm" />
                  </div>
                  <button onClick={scheduleClass} className="px-10 py-5 bg-brand-dark text-white rounded-2xl font-black uppercase tracking-[3px] hover:bg-brand-primary hover:text-brand-dark transition-all shadow-xl">Lock Schedule</button>
                </div>
                <div className="space-y-4">
                  {slots.map(s => (
                    <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-6 flex justify-between items-center shadow-sm">
                      <div><p className="font-black italic text-brand-dark uppercase">{s.studentName}</p><p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{s.subject}</p></div>
                      <div className="text-right text-xs font-bold"><p className="text-brand-dark">{fmtDate(s.date)}</p><p className="text-slate-400">{fmtTime(s.start_time)} - {fmtTime(s.end_time)}</p></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeTab === 'discussion' ? (
               <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col w-full px-8 md:px-12 pt-8 pb-4">
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
                  {discMsgs.map(m => <ChatBubble key={m.id} msg={m} selectedStudent={selectedStudent} />)}
                  <div ref={discBottomRef} />
                </div>
                <ChatInput 
                  value={discInput} 
                  onChange={(val: string) => { setDiscInput(val); handleTyping(); }} 
                  onSend={sendDiscMsg} 
                  placeholder="Negotiate timing..." 
                />
              </motion.div>
            ) : (
              <motion.div key="class" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col p-8">
                {isClassLocked() ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div className="max-w-md">
                      <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-amber-500" /></div>
                      <h3 className="text-2xl font-black uppercase italic text-brand-dark mb-2">Terminal Locked</h3>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col w-full px-8 md:px-12">
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
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
