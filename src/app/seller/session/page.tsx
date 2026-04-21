'use client';
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { usePresence, UserStatus } from '@/hooks/usePresence';
import { 
  Users, CalendarDays, History, BookOpen, Clock, 
  CheckCircle2, Search, MessageCircle, 
  Send, Bell, Filter, MoreVertical, X, Check, CheckCheck, Zap, User,
  Trash2, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendMessage as libSendMessage } from '@/lib/messages';

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
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
type Message = { id: number | string; sender: 'tutor' | 'student'; text: string; time: string; status?: MessageStatus; };
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
  avatar_url?: string;
  lastMsg: string;
  status: 'active' | 'pending';
  lastActive: string;
  isAccepted: boolean;
  hasUnread: boolean;
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

// ─── Message Status Icon ────────────────────────────────────────────────
const MessageStatusIcon = memo(({ status, recipientInitial, recipientAvatar }: { status?: MessageStatus; recipientInitial?: string, recipientAvatar?: string }) => {
  if (!status) return null;
  
  if (status === 'sending') return (
    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 relative overflow-hidden">
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 bg-slate-200"
      />
    </div>
  );
  
  if (status === 'sent') return <Check className="w-3.5 h-3.5 text-blue-500" strokeWidth={3} />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={3} />;
  if (status === 'read') return (
    <motion.div 
      layoutId="seen-avatar"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-4 h-4 rounded-full bg-brand-primary overflow-hidden flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white"
    >
      {recipientAvatar ? (
        <img src={recipientAvatar} className="w-full h-full object-cover" alt="" />
      ) : (
        <span className="text-[7px] font-black text-brand-dark">{(recipientInitial || 'S').charAt(0)}</span>
      )}
    </motion.div>
  );
  
  return null;
});

MessageStatusIcon.displayName = 'MessageStatusIcon';

// ─── Shared Components ──────────────────────────────────────────────
const ChatBubble = memo(({ msg, selectedStudent, onVisible, showStatus }: { msg: Message, selectedStudent: StudentProfile | null, onVisible?: (msgId: string | number) => void, showStatus?: boolean }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msg.sender === 'tutor' || !onVisible || msg.id.toString().startsWith('opt-') || msg.status === 'seen') return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onVisible(msg.id);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (bubbleRef.current) observer.observe(bubbleRef.current);
    return () => observer.disconnect();
  }, [msg.id, msg.sender, onVisible]);

  return (
    <div ref={bubbleRef} className={`flex gap-3 ${msg.sender === 'tutor' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black ring-1 ring-slate-100 overflow-hidden ${msg.sender === 'tutor' ? 'bg-brand-primary text-brand-dark' : 'bg-slate-200 text-slate-600'}`}>
        {msg.sender === 'tutor' ? 'T' : (selectedStudent?.avatar_url ? <img src={selectedStudent.avatar_url} className="w-full h-full object-cover" alt="" /> : (selectedStudent?.initial || 'S'))}
      </div>
      <div className={`max-w-[75%] ${msg.sender === 'tutor' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.sender === 'tutor' ? 'bg-brand-dark text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-brand-dark rounded-tl-sm shadow-sm'}`}>{msg.text}</div>
        <div className="flex items-center gap-1.5 h-4">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{msg.time}</span>
          {msg.sender === 'tutor' && showStatus && <MessageStatusIcon status={msg.status} recipientInitial={selectedStudent?.initial} recipientAvatar={selectedStudent?.avatar_url} />}
        </div>
      </div>
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';

const ChatInput = ({ value, onChange, onSend, placeholder }: { 
  value: string; 
  onChange: (val: string) => void; 
  onSend: () => void; 
  placeholder?: string; 
}) => (
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
  const [currentUser, setCurrentUser] = useState<any>(null); // Keeping as any or use User from supabase-js
  
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Robust Presence System ──────────────────────────────────────
  const { 
    onlineStatus,
    getRemoteStatus, 
    emitTyping 
  } = usePresence(currentUser?.id, selectedStudent?.roomId || null);

  const studentState = selectedStudent ? getRemoteStatus(selectedStudent.id) : { status: 'offline' as UserStatus, typing: false };
  const isStudentOnline = studentState.status !== 'offline';
  const isStudentTyping = studentState.typing;
  const studentStatus = studentState.status;

  const handleTyping = () => {
    emitTyping(true);
  };

  // ─── Singleton Status IDs — Discussion Tab (Messenger-style) ───────────
  const discLastMsgIsFromStudent = discMsgs.length > 0 && discMsgs[discMsgs.length - 1].sender === 'student';

  const discLastSeenId = useMemo(() => {
    if (discLastMsgIsFromStudent) return null;
    for (let i = discMsgs.length - 1; i >= 0; i--) {
      if (discMsgs[i].sender === 'tutor' && discMsgs[i].status === 'seen') return discMsgs[i].id;
    }
    return null;
  }, [discMsgs, discLastMsgIsFromStudent]);

  const discLastDeliveredId = useMemo(() => {
    if (discLastMsgIsFromStudent || discLastSeenId) return null;
    for (let i = discMsgs.length - 1; i >= 0; i--) {
      if (discMsgs[i].sender === 'tutor' && discMsgs[i].status === 'delivered') return discMsgs[i].id;
    }
    return null;
  }, [discMsgs, discLastSeenId, discLastMsgIsFromStudent]);

  const discLastSentId = useMemo(() => {
    if (discLastMsgIsFromStudent || discLastSeenId || discLastDeliveredId) return null;
    for (let i = discMsgs.length - 1; i >= 0; i--) {
      if (discMsgs[i].sender === 'tutor' && (discMsgs[i].status === 'sent' || discMsgs[i].status === 'sending')) return discMsgs[i].id;
    }
    return null;
  }, [discMsgs, discLastSeenId, discLastDeliveredId, discLastMsgIsFromStudent]);

  // ─── Singleton Status IDs — Class Tab (Messenger-style) ──────────────
  const classLastMsgIsFromStudent = classMsgs.length > 0 && classMsgs[classMsgs.length - 1].sender === 'student';

  const classLastSeenId = useMemo(() => {
    if (classLastMsgIsFromStudent) return null;
    for (let i = classMsgs.length - 1; i >= 0; i--) {
      if (classMsgs[i].sender === 'tutor' && classMsgs[i].status === 'seen') return classMsgs[i].id;
    }
    return null;
  }, [classMsgs, classLastMsgIsFromStudent]);

  const classLastDeliveredId = useMemo(() => {
    if (classLastMsgIsFromStudent || classLastSeenId) return null;
    for (let i = classMsgs.length - 1; i >= 0; i--) {
      if (classMsgs[i].sender === 'tutor' && classMsgs[i].status === 'delivered') return classMsgs[i].id;
    }
    return null;
  }, [classMsgs, classLastSeenId, classLastMsgIsFromStudent]);

  const classLastSentId = useMemo(() => {
    if (classLastMsgIsFromStudent || classLastSeenId || classLastDeliveredId) return null;
    for (let i = classMsgs.length - 1; i >= 0; i--) {
      if (classMsgs[i].sender === 'tutor' && (classMsgs[i].status === 'sent' || classMsgs[i].status === 'sending')) return classMsgs[i].id;
    }
    return null;
  }, [classMsgs, classLastSeenId, classLastDeliveredId, classLastMsgIsFromStudent]);

  const deleteSession = async (roomId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete the mission with ${studentName}? This will be reflected on all your devices.`)) return;
    
    try {
      await supabase.from('scheduled_classes').delete().eq('room_id', roomId);
      await supabase.from('tutoring_sessions').delete().eq('room_id', roomId);
      await supabase.from('chat_messages').delete().eq('room_id', roomId);
      const { error: roomErr } = await supabase.from('chat_rooms').delete().eq('id', roomId);
      
      if (roomErr) throw new Error(`DB RESTRICTION: ${roomErr.message}`);

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

    if (!syncChannelRef.current) {
      const syncChannel = supabase
        .channel(`purge-sync-${Math.random().toString(36).substring(7)}`)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_rooms' }, (payload: { old: any }) => {
           const deletedId = payload.old.id;
           setStudents(prev => prev.filter(s => s.roomId !== deletedId));
           setSelectedStudent(curr => curr?.roomId === deletedId ? null : curr);
        });
      syncChannel.subscribe();
      syncChannelRef.current = syncChannel;
    }

    return () => {
      clearInterval(interval);
      if (syncChannelRef.current) {
        supabase.removeChannel(syncChannelRef.current);
        syncChannelRef.current = null;
      }
    };
  }, [router]);

  const fetchSessions = async (userId: string, targetRoomId?: string | null) => {
    try {
      const { data: rooms, error: roomErr } = await supabase
        .from('chat_rooms')
        .select(`id, student_id, profiles:student_id (full_name, avatar_url)`)
        .eq('tutor_id', userId);

      if (roomErr) throw roomErr;

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

      const { data: firstMsgs } = await supabase
        .from('chat_messages')
        .select('room_id')
        .in('room_id', (rooms as any[]).map((r: any) => r.id));

      const activeRoomIds = new Set((firstMsgs as any[] || []).map((m: any) => m.room_id) || []);

      const studentList = await Promise.all((rooms || [])
        .filter((room: any) => activeRoomIds.has(room.id) || room.id === targetRoomId) 
        .map(async (room: any) => {
          const session = sessData?.find(s => s.student_id === room.student_id) as any;
          const { data: studentProfile } = await supabase
            .from('profiles')
            .select('online_status, last_seen')
            .eq('id', room.student_id)
            .single();

          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', userId)
            .is('read_at', null);

          const name = (Array.isArray(room.profiles) ? room.profiles[0] : room.profiles)?.full_name || 'Anonymous Student';
          const roomSchedules = (schedules as any[] || []).filter((s: any) => s.room_id === room.id);
          
          let subject = session?.help_requests?.subject;
          
          const { data: signalMsgs } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false });
            
          let latestSignalTime = null;
          if (signalMsgs && signalMsgs.length > 0) {
             // Look for ANY message that signals an active session/discussion/unlock
             const latestUnlockMsg = (signalMsgs as any[]).find((m: any) => {
                const c = m.content.toLowerCase();
                return c.startsWith('signal: unlock') || 
                       c.startsWith('signal initiated:') || 
                       c.startsWith('discussion started');
             });
             
             if (latestUnlockMsg) {
                // Dynamic Subject Sync: Update subject if we find a signal with subject info
                if (!subject || subject === 'General Discussion' || subject === 'Direct Handshake') {
                  const c = latestUnlockMsg.content;
                  if (c.toLowerCase().includes('requesting a ')) {
                    const match = c.match(/requesting a (.+) session/i);
                    if (match) subject = match[1];
                  } else if (c.includes('"')) {
                    subject = c.split('"')[1];
                  } else if (c.includes('for ')) {
                    subject = c.split('for ')[1];
                  }
                }
                latestSignalTime = new Date(latestUnlockMsg.created_at).getTime();
             }
          }

          return {
            id: room.student_id,
            roomId: room.id,
            name: name,
            avatar_url: (Array.isArray(room.profiles) ? room.profiles[0] : room.profiles)?.avatar_url,
            subject: subject || 'General Discussion',
            initial: name.charAt(0).toUpperCase(),
            lastMsg: '...', 
            status: (session?.status === 'accepted' ? 'active' : 'pending') as 'active' | 'pending',
            lastActive: 'Just now',
            schedules: roomSchedules,
            latestSignalTime,
            isAccepted: session?.status === 'accepted' || !!session || !!latestSignalTime,
            hasUnread: (unreadCount || 0) > 0,
            onlineStatus: studentProfile?.online_status as UserStatus || 'offline',
            lastSeen: studentProfile?.last_seen || null
          };
        }));

      setStudents(studentList);
      
      if (studentList.length > 0) {
        if (targetRoomId) {
          const target = studentList.find((s: StudentProfile) => s.roomId === targetRoomId);
          if (target) setSelectedStudent(target);
        } else if (selectedStudent) {
          const fresh = studentList.find((s: StudentProfile) => s.id === selectedStudent.id);
          if (fresh) setSelectedStudent(fresh);
        }
      }
      
      const mappedSlots = (schedules as any[] || []).map((s: any) => {
        const matchingStudent = studentList.find((st: StudentProfile) => st.roomId === s.room_id);
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

  useEffect(() => { selectedStudentRef.current = selectedStudent; }, [selectedStudent]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { studentsRef.current = students; }, [students]);

  useEffect(() => {
    if (!currentUser?.id) return;
    if (globalWatchChannelRef.current) return;

    const channelName = `specialist-global-${currentUser.id}`;
    supabase.removeChannel(supabase.channel(channelName));

    const globalChannel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: { new: any }) => {
        const m = payload.new;
        const currentStudents = studentsRef.current;
        const studentIndex = currentStudents.findIndex(s => s.roomId === m.room_id);
        if (studentIndex === -1) return;
        if (m.content.startsWith('SIGNAL') || m.content.startsWith('Discussion Started')) return;

        setStudents(prev => {
          const newList = [...prev];
          if (newList[studentIndex]) {
            const isViewing = selectedStudentRef.current?.roomId === m.room_id;
            newList[studentIndex] = { 
              ...newList[studentIndex], 
              lastMsg: m.content, 
              lastActive: 'Just Now',
              hasUnread: !isViewing
            };
          }
          return newList;
        });
      })
      .subscribe();

    globalWatchChannelRef.current = globalChannel;
    return () => { supabase.removeChannel(globalChannel); globalWatchChannelRef.current = null; };
  }, [currentUser]);

  // ─── Automatic Read Triggers ──────────────────────────
  useEffect(() => {
    if (activeTab === 'discussion' && selectedStudent?.roomId) {
      supabase.from('chat_messages')
        .update({ status: 'seen', read_at: new Date().toISOString() })
        .eq('room_id', selectedStudent.roomId)
        .neq('sender_id', currentUser?.id)
        .neq('status', 'seen')
        .then(() => {
          if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'messages_read', payload: { roomId: selectedStudent.roomId, msgId: null } });
        });
    }
  }, [activeTab, selectedStudent?.roomId, currentUser?.id, discMsgs]);

  useEffect(() => {
    if (activeTab === 'class' && selectedStudent?.roomId) {
      supabase.from('live_class_messages')
        .update({ status: 'seen', read_at: new Date().toISOString() })
        .eq('room_id', selectedStudent.roomId)
        .neq('sender_id', currentUser?.id)
        .neq('status', 'seen')
        .then(() => {
          if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'messages_read', payload: { roomId: selectedStudent.roomId, msgId: null } });
        });
    }
  }, [activeTab, selectedStudent?.roomId, currentUser?.id, classMsgs]);

  useEffect(() => {
    if (!selectedStudent?.roomId) return;
    const mergeDiscMsgs = (fetched: Message[]) => {
      setAllDiscMsgs(prev => {
        const existing = prev[selectedStudent.id] || [];
        const existingIds = new Set(existing.filter(m => !String(m.id).startsWith('opt-')).map(m => m.id));
        const newOnes = fetched.filter(m => !existingIds.has(m.id));
        // Always apply: merge new messages AND update statuses of existing ones
        const hasStatusChanges = fetched.some(f => {
          const ex = existing.find(e => e.id === f.id);
          return ex && ex.status !== f.status;
        });
        if (newOnes.length === 0 && !hasStatusChanges) return prev;
        const merged = [...existing.filter(m => String(m.id).startsWith('opt-')), ...fetched];
        return { ...prev, [selectedStudent.id]: merged };
      });
    };

    const fetchMsgs = async () => {
      const { data: dData } = await supabase.from('chat_messages').select('*').eq('room_id', selectedStudent.roomId).order('created_at', { ascending: true });
      if (dData) {
        const mapped: Message[] = dData
          .filter((m: any) => !m.content.startsWith('SIGNAL INITIATED:') && !m.content.startsWith('SIGNAL ACCEPTED:') && !m.content.startsWith('SIGNAL REJECTED:'))
          .map((m: any) => ({
            id: m.id,
            sender: (m.sender_id === currentUser?.id ? 'tutor' : 'student') as 'tutor' | 'student',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.sender_id === currentUser?.id ? (m.read_at ? 'read' : m.delivered_at ? 'delivered' : (m.status || 'sent')) as MessageStatus : undefined
          }));
        mergeDiscMsgs(mapped);
      }

      const { data: cData } = await supabase.from('live_class_messages').select('*').eq('room_id', selectedStudent.roomId).order('created_at', { ascending: true });
      if (cData) {
        const mapped: Message[] = cData.map((m: any) => ({
          id: m.id,
          sender: (m.sender_id === currentUser?.id ? 'tutor' : 'student') as 'tutor' | 'student',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: m.sender_id === currentUser?.id ? (m.read_at ? 'seen' : m.delivered_at ? 'delivered' : (m.status || 'sent')) as MessageStatus : undefined
        }));
        setAllClassMsgs(prev => {
          const existing = prev[selectedStudent.id] || [];
          const existingIds = new Set(existing.filter(m => !String(m.id).startsWith('opt-')).map(m => m.id));
          const newOnes = mapped.filter(m => !existingIds.has(m.id));
          const hasStatusChanges = mapped.some(f => {
            const ex = existing.find(e => e.id === f.id);
            return ex && ex.status !== f.status;
          });
          if (newOnes.length === 0 && !hasStatusChanges) return prev;
          return { ...prev, [selectedStudent.id]: [...existing.filter(m => String(m.id).startsWith('opt-')), ...mapped] };
        });
      }
    };

    fetchMsgs();
    const pollInterval = setInterval(fetchMsgs, 2500);

    // ── Login Catch-Up ──
    supabase.from('chat_messages').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('room_id', selectedStudent.roomId).neq('sender_id', currentUser.id).eq('status', 'sent').then();
    supabase.from('live_class_messages').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('room_id', selectedStudent.roomId).neq('sender_id', currentUser.id).eq('status', 'sent').then();

    const channelName = `session:${selectedStudent.roomId}`;
    supabase.removeChannel(supabase.channel(channelName));

    const channel = supabase.channel(channelName, { config: { broadcast: { ack: true } } });
    channelRef.current = channel;

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload: { new: any, eventType: string }) => {
        const m = payload.new;
        const type = payload.eventType;
        const student = selectedStudentRef.current;
        const user = currentUserRef.current;
        if (!student || m.room_id !== student.roomId) return;
        
        const status: MessageStatus | undefined = m.sender_id === user?.id ? (m.read_at ? 'seen' : m.delivered_at ? 'delivered' : (m.status || 'sent')) : undefined;

        if (type === 'INSERT') {
          if (m.sender_id !== user?.id && m.status === 'sent') {
             supabase.from('chat_messages').update({ delivered_at: new Date().toISOString(), status: 'delivered' }).eq('id', m.id).then();
             if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'message_delivered', payload: { roomId: student.roomId, msgId: m.id } });
          }
          if (m.content.startsWith('SIGNAL') || m.content.startsWith('Discussion Started')) return;
          
          setAllDiscMsgs(prev => {
            const studentMsgs = prev[student.id] || [];
            if (m.sender_id === user?.id) {
              const hasOptimistic = studentMsgs.some(existing => String(existing.id).startsWith('opt-') && existing.text === m.content);
              if (hasOptimistic) return prev;
            }
            if (studentMsgs.some(existing => existing.id === m.id)) return prev;
            
            const list = m.sender_id !== user?.id 
              ? studentMsgs.map(old => old.sender === 'tutor' ? { ...old, status: 'read' as MessageStatus } : old)
              : studentMsgs;

            return { ...prev, [student.id]: [...list, { id: m.id, sender: m.sender_id === user?.id ? 'tutor' : 'student', text: m.content, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status }] };
          });
        } else if (type === 'UPDATE') {
          setAllDiscMsgs(prev => {
            const studentMsgs = prev[student.id] || [];
            return { ...prev, [student.id]: studentMsgs.map(old => old.id === m.id ? { ...old, status } : old) };
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_class_messages' }, (payload: { new: any, eventType: string }) => {
        const m = payload.new;
        const type = payload.eventType;
        const student = selectedStudentRef.current;
        const user = currentUserRef.current;
        if (!student || m.room_id !== student.roomId) return;
        
        const status: MessageStatus | undefined = m.sender_id === user?.id ? (m.read_at ? 'seen' : m.delivered_at ? 'delivered' : (m.status || 'sent')) : undefined;

        if (type === 'INSERT') {
          if (m.sender_id !== user?.id && m.status === 'sent') {
             supabase.from('live_class_messages').update({ delivered_at: new Date().toISOString(), status: 'delivered' }).eq('id', m.id).then();
             if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'message_delivered', payload: { roomId: student.roomId, msgId: m.id } });
          }
          setAllClassMsgs(prev => {
            const studentMsgs = prev[student.id] || [];
            if (m.sender_id === user?.id) {
              const hasOptimistic = studentMsgs.some(existing => String(existing.id).startsWith('opt-') && existing.text === m.content);
              if (hasOptimistic) return prev;
            }
            if (studentMsgs.some(existing => existing.id === m.id)) return prev;

            const list = m.sender_id !== user?.id 
              ? studentMsgs.map(old => old.sender === 'tutor' ? { ...old, status: 'read' as MessageStatus } : old)
              : studentMsgs;

            return { ...prev, [student.id]: [...list, { id: m.id, sender: m.sender_id === user?.id ? 'tutor' : 'student', text: m.content, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status }] };
          });
        } else if (type === 'UPDATE') {
          setAllClassMsgs(prev => {
            const studentMsgs = prev[student.id] || [];
            return { ...prev, [student.id]: studentMsgs.map(old => old.id === m.id ? { ...old, status } : old) };
          });
        }
      })
      .on('broadcast', { event: 'messages_read' }, ({ payload }: { payload: any }) => {
        const student = selectedStudentRef.current;
        if (!student || payload.roomId !== student.roomId) return;

        const { msgId } = payload;
        setAllDiscMsgs(prev => ({
          ...prev,
          [student.id]: (prev[student.id] || []).map(m => (m.id === msgId || !msgId) && m.sender === 'tutor' ? { ...m, status: 'seen' as MessageStatus } : m)
        }));
        setAllClassMsgs(prev => ({
          ...prev,
          [student.id]: (prev[student.id] || []).map(m => (m.id === msgId || !msgId) && m.sender === 'tutor' ? { ...m, status: 'seen' as MessageStatus } : m)
        }));
      })
      .on('broadcast', { event: 'message_delivered' }, ({ payload }: { payload: any }) => {
        const student = selectedStudentRef.current;
        if (!student || payload.roomId !== student.roomId) return;
        const { msgId } = payload;
        setAllDiscMsgs(prev => ({
          ...prev,
          [student.id]: (prev[student.id] || []).map(m => (m.id === msgId && m.sender === 'tutor' && m.status === 'sent') ? { ...m, status: 'delivered' as MessageStatus } : m)
        }));
        setAllClassMsgs(prev => ({
          ...prev,
          [student.id]: (prev[student.id] || []).map(m => (m.id === msgId && m.sender === 'tutor' && m.status === 'sent') ? { ...m, status: 'delivered' as MessageStatus } : m)
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      clearInterval(pollInterval);
    };
  }, [selectedStudent?.roomId, currentUser?.id]);

  const markAsRead = useCallback((msgId: string | number) => {
    const student = selectedStudentRef.current;
    if (!student || !currentUser) return;
    supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).eq('id', msgId).eq('room_id', student.roomId).then(() => {
      channelRef.current?.send({ type: 'broadcast', event: 'messages_read', payload: { roomId: student.roomId, msgId } });
    });
  }, [currentUser]);

  const markClassAsRead = useCallback((msgId: string | number) => {
    const student = selectedStudentRef.current;
    if (!student || !currentUser) return;
    supabase.from('live_class_messages').update({ read_at: new Date().toISOString() }).eq('id', msgId).eq('room_id', student.roomId).then(() => {
      channelRef.current?.send({ type: 'broadcast', event: 'messages_read', payload: { roomId: student.roomId, msgId } });
    });
  }, [currentUser]);

  useEffect(() => {
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      if (activeTab === 'discussion') discBottomRef.current?.scrollIntoView({ behavior });
      else if (activeTab === 'class') classBottomRef.current?.scrollIntoView({ behavior });
    };
    const t1 = setTimeout(() => scrollToBottom('auto'), 100);
    const t2 = setTimeout(() => scrollToBottom('auto'), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeTab, selectedStudent]);

  useEffect(() => {
    if (activeTab === 'discussion') discBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    else if (activeTab === 'class') classBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allDiscMsgs, allClassMsgs]);

  const isClassLocked = () => {
    if (!selectedStudent) return true;
    const studentSchedules = [...(selectedStudent.schedules || [])];
    
    // 1. Manual Signal Override: Force unlock regardless of schedule
    // This allows tutors to open the terminal for emergency discussions
    if (selectedStudent.latestSignalTime) {
      // Check if the signal was sent recently (e.g., within last 24h) to avoid stale unlocks
      const signalAgeHours = (now.getTime() - selectedStudent.latestSignalTime) / 3600000;
      if (signalAgeHours < 1) return false;
    }

    if (studentSchedules.length === 0) return true;

    // 2. Schedule Check: Unlock ONLY if current time is within ANY scheduled window
    const currentTime = now.getTime();
    const hasActiveWindow = studentSchedules.some(s => {
      const start = toDate(s.class_date, s.start_time).getTime();
      const end = toDate(s.class_date, s.end_time).getTime();
      return currentTime >= start && currentTime <= end;
    });

    return !hasActiveWindow;
  };

  const isClassEnded = (student: any) => {
    // 1. If not accepted (pending), it's not "ended", it's just not started
    if (!student.isAccepted) return false;

    const studentSchedules = [...(student.schedules || [])];
    
    // 2. If no schedules, an accepted session is definitely NOT ended (it's in discussion/prep phase)
    if (studentSchedules.length === 0) return false;

    // 3. Sort schedules to find the definitive end of the last planned mission
    studentSchedules.sort((a, b) => toDate(a.class_date, a.end_time).getTime() - toDate(b.class_date, b.end_time).getTime());
    const last = studentSchedules[studentSchedules.length - 1];
    const lastEndTime = toDate(last.class_date, last.end_time).getTime();
    
    // 4. Strategic Override: If a new signal (handshake/unlock) happened AFTER the last scheduled class ended, 
    // it means a new engagement has started and we are NO LONGER in the "past".
    if (student.latestSignalTime && (student.latestSignalTime + 1000) > lastEndTime) return false;
    
    // 5. Final check against wall clock
    return now.getTime() > lastEndTime;
  };

  const scheduleClass = async () => {
    if (!formDate || !formStart || !formEnd || !selectedStudent) return;
    setConflictError(null);
    
    // 1. Basic time sequence validation
    if (formEnd <= formStart) { 
      setConflictError('Mission failure: End time must be after start time.'); 
      return; 
    }
    
    const ns = toDate(formDate, formStart);
    const ne = toDate(formDate, formEnd);
    const now = new Date();

    // 2. Prevent scheduling in the past (ruthless check)
    if (ns < now) {
      setConflictError('Operation Redline: You cannot schedule a mission in the past. Select a future window.');
      return;
    }

    // 3. Prevent micro-sessions (min 5 mins)
    const durationMin = (ne.getTime() - ns.getTime()) / 60000;
    if (durationMin < 5) {
      setConflictError('Strategic Error: Minimum mission duration is 5 minutes.');
      return;
    }

    // 4. Conflict check across all slots
    const conflicts = slots.filter(s => 
      s.date === formDate && 
      hasConflict(ns, ne, toDate(s.date, s.start_time), toDate(s.date, s.end_time))
    );
    
    if (conflicts.length > 0) { 
      setConflictError(`Conflict Detected: ${conflicts[0].studentName} occupies this tactical window.`); 
      return; 
    }
    
    const { error: schedErr } = await supabase.from('scheduled_classes').insert({
      room_id: selectedStudent.roomId,
      tutor_id: currentUser?.id,
      student_id: selectedStudent.id,
      class_date: formDate,
      start_time: formStart,
      end_time: formEnd,
    });
    
    if (schedErr) { 
      console.error('DB_LOCK_FAILURE:', schedErr);
      setConflictError(`Tactical Shutdown: ${schedErr.message || 'Database rejection.'} (Error ${schedErr.code || 'UNKNOWN'})`); 
      return; 
    }
    await supabase.from('chat_messages').insert({ room_id: selectedStudent.roomId, sender_id: currentUser?.id, content: `📅 Class scheduled: ${fmtDate(formDate)} at ${fmtTime(formStart)} - ${fmtTime(formEnd)}` });
    
    const updatedStudent = { ...selectedStudent, schedules: [...(selectedStudent as any).schedules || [], { class_date: formDate, start_time: formStart, end_time: formEnd }] };
    setSelectedStudent(updatedStudent);
    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
    setSlots(p => [...p, { id: Date.now(), studentName: selectedStudent.name, subject: selectedStudent.subject, date: formDate, start_time: formStart, end_time: formEnd }]);
    setFormDate(''); setFormStart(''); setFormEnd('');
  };

  const sendDiscMsg = async () => {
    if (!discInput.trim() || !selectedStudent?.roomId || !currentUser) return;
    const content = discInput.trim();
    setDiscInput('');
    const optimisticId = `opt-${Date.now()}`;
    setAllDiscMsgs(prev => ({ ...prev, [selectedStudent.id]: [...(prev[selectedStudent.id] || []), { id: optimisticId, sender: 'tutor', text: content, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'sending' }] }));
    
    try {
      const data = await libSendMessage(selectedStudent.roomId, currentUser.id, selectedStudent.id, content, 'chat_messages');
      if (data) {
        if (channelRef.current) {
          channelRef.current.send({ type: 'broadcast', event: 'new_message', payload: data });
          channelRef.current.send({ type: 'broadcast', event: 'messages_read', payload: { roomId: selectedStudent.roomId, msgId: null } });
        }
        setAllDiscMsgs(prev => ({ ...prev, [selectedStudent.id]: (prev[selectedStudent.id] || []).map(m => m.id === optimisticId ? { ...m, id: data.id, status: data.status } : m) }));
      }
    } catch (err) {
      console.error("Transmission Error:", err);
    }
  };

  const sendClassMsg = async () => {
    if (!classInput.trim() || isClassLocked() || !selectedStudent || !currentUser) return;
    const content = classInput.trim();
    setClassInput('');
    const optimisticId = `opt-${Date.now()}`;
    setAllClassMsgs(prev => ({ ...prev, [selectedStudent.id]: [...(prev[selectedStudent.id] || []), { id: optimisticId, sender: 'tutor', text: content, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'sending' }] }));
    
    try {
      const data = await libSendMessage(selectedStudent.roomId, currentUser.id, selectedStudent.id, content, 'live_class_messages');
      if (data) {
        if (channelRef.current) {
          channelRef.current.send({ type: 'broadcast', event: 'new_class_message', payload: data });
          channelRef.current.send({ type: 'broadcast', event: 'messages_read', payload: { roomId: selectedStudent.roomId, msgId: null } });
        }
        setAllClassMsgs(prev => ({ ...prev, [selectedStudent.id]: (prev[selectedStudent.id] || []).map(m => m.id === optimisticId ? { ...m, id: data.id, status: data.status } : m) }));
      }
    } catch (err) {
      console.error("Transmission Error:", err);
    }
  };

  if (loading) return <div className="h-screen bg-white flex items-center justify-center text-brand-primary"><Zap className="w-10 h-10 animate-pulse" /></div>;

  return (
    <div className="h-screen bg-white font-sans flex overflow-hidden">
      <ScrollStyles />
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 bg-slate-50 border-r border-slate-100 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-4">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-brand-dark uppercase italic tracking-tighter flex items-center gap-2">Students</h2>
              <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
                <button onClick={() => setSidebarFilter('active')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sidebarFilter === 'active' ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400'}`}>Active</button>
                <button onClick={() => { setSidebarFilter('past'); setActiveTab('class'); setSelectedStudent(null); }} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sidebarFilter === 'past' ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400'}`}>Past</button>
              </div>
           </div>
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="text" placeholder="Search missions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-100 py-3.5 pl-12 pr-6 rounded-2xl text-xs font-bold outline-none focus:border-brand-primary transition-all shadow-sm" />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scroll">
          {students.filter(s => {
            const finished = isClassEnded(s);
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.subject.toLowerCase().includes(searchQuery.toLowerCase());
            return sidebarFilter === 'active' ? (!finished && s.isAccepted && matchesSearch) : ((finished || !s.isAccepted) && matchesSearch);
          }).map(s => (
            <div key={s.id} className="relative group/item">
              <button onClick={() => { setSelectedStudent(s); setActiveTab('discussion'); setSidebarOpen(false); }} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all ${selectedStudent?.id === s.id ? 'bg-white shadow-md border border-slate-100' : 'hover:bg-slate-100/80'}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black ${selectedStudent?.id === s.id ? 'bg-brand-primary text-brand-dark' : 'bg-slate-200 text-slate-600'}`}>{s.initial}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mr-1">
                    <p className="text-sm font-black uppercase italic truncate text-brand-dark">{s.name}</p>
                    {s.hasUnread && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(255,185,0,0.6)]"
                      />
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest truncate text-brand-primary">{s.subject}</p>
                </div>
              </button>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.roomId, s.name); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/20 md:ml-80">
        {selectedStudent && (
          <>
            <header className="bg-white border-b border-slate-100 px-4 md:px-12 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg md:hidden hover:bg-slate-200 transition-all">
                  <Search className="w-4 h-4 text-slate-500" />
                </button>
                <div className="flex flex-col items-start leading-none">
                  <p className="text-[11px] font-black text-brand-dark uppercase italic tracking-tighter">{selectedStudent.name}</p>
                  <p className={`text-[8px] font-black uppercase tracking-[2px] mt-1.5 ${
                    studentStatus === 'online' ? 'text-green-500' : 
                    studentStatus === 'idle' ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {studentStatus === 'online' ? 'Online Now' : 
                     studentStatus === 'idle' ? 'Idle System' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  studentStatus === 'online' ? 'bg-green-500 animate-pulse ring-4 ring-green-500/20' : 
                  studentStatus === 'idle' ? 'bg-amber-500 ring-4 ring-amber-500/20' : 'bg-slate-300'
                }`} title={`Status: ${studentStatus}`} />
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Last Seen: {selectedStudent.lastActive}
                  </span>
                </div>
              </div>
            </header>
            {!isClassEnded(selectedStudent) && (
              <div className="bg-white border-b border-slate-100 flex justify-center md:justify-start md:px-12">
                {(['discussion', 'schedule', 'class'] as const).map(k => (
                  <button key={k} onClick={() => setActiveTab(k)} className={`relative px-8 py-5 ${activeTab === k ? 'text-brand-dark' : 'text-slate-400'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[2px]">{k}</p>
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
              <motion.div key="placeholder" className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                <User className="w-16 h-16 text-slate-400" />
                <h3 className="text-xl font-black uppercase italic text-brand-dark">Select Mission Dossier</h3>
              </motion.div>
            ) : isClassEnded(selectedStudent) ? (
              <motion.div key="archive" className="h-full flex flex-col pt-8 px-8 md:px-12">
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
                   {classMsgs.map(m => <ChatBubble key={m.id} msg={m} selectedStudent={selectedStudent} />)}
                   <div ref={classBottomRef} />
                </div>
              </motion.div>
            ) : activeTab === 'schedule' ? (
              <motion.div key="schedule" className="h-full overflow-y-auto px-10 py-10 space-y-10 custom-scroll">
                <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm space-y-8">
                  <h2 className="text-2xl font-black uppercase italic text-brand-dark">Schedule {selectedStudent.name}</h2>
                  {conflictError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{conflictError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-sm" />
                    <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-sm" />
                    <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-sm" />
                  </div>
                  <button onClick={scheduleClass} className="px-10 py-5 bg-brand-dark text-white rounded-2xl font-black uppercase tracking-[3px] hover:bg-brand-primary hover:text-brand-dark transition-all">Lock Schedule</button>
                </div>
              </motion.div>
            ) : activeTab === 'discussion' ? (
              <motion.div key="discussion" className="h-full flex flex-col w-full px-8 md:px-12 pt-8 pb-4">
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scroll">
                  {discMsgs.map(m => {
                    let showStatus = false;
                    if (m.sender === 'tutor') {
                      if (m.id === discLastSeenId) showStatus = true;
                      else if (m.id === discLastDeliveredId) showStatus = true;
                      else if (m.id === discLastSentId) showStatus = true;
                    }
                    return (
                      <ChatBubble 
                        key={m.id} 
                        msg={m} 
                        selectedStudent={selectedStudent} 
                        onVisible={markAsRead} 
                        showStatus={showStatus}
                      />
                    );
                  })}
                  <div ref={discBottomRef} />
                </div>
                <ChatInput value={discInput} onChange={(val: string) => { setDiscInput(val); handleTyping(); }} onSend={sendDiscMsg} placeholder="Negotiate timing..." />
              </motion.div>
            ) : (
              <motion.div key="class" className="h-full flex flex-col p-8">
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
                      {classMsgs.map(m => {
                        let showStatus = false;
                        if (m.sender === 'tutor') {
                          if (m.id === classLastSeenId) showStatus = true;
                          else if (m.id === classLastDeliveredId) showStatus = true;
                          else if (m.id === classLastSentId) showStatus = true;
                        }
                        return (
                          <ChatBubble 
                            key={m.id} 
                            msg={m} 
                            selectedStudent={selectedStudent} 
                            onVisible={markClassAsRead} 
                            showStatus={showStatus}
                          />
                        );
                      })}
                      <div ref={classBottomRef} />
                    </div>
                    <ChatInput value={classInput} onChange={(val: string) => { setClassInput(val); handleTyping(); }} onSend={sendClassMsg} placeholder="Execute live instruction..." />
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
