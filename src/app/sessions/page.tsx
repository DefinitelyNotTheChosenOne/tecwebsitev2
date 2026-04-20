'use client';
import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Send, CalendarDays, Clock,
  CheckCircle2, Check, CheckCheck, Zap, BookOpen, Lock, Users,
  MessageCircle, Search, Bell, ArrowRight,
  Timer, Wifi, Shield, X, History, RefreshCcw
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
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';
type Message = { id: string; sender: 'student' | 'tutor'; text: string; time: string; status?: MessageStatus; };
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
  tutorAvatar?: string;
  subject: string;
  status: 'pending' | 'accepted' | 'declined';
  lastMsg: string;
  lastActive: string;
  hasUnread: boolean;
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

type Tab = 'updates' | 'discussion' | 'class' | 'history';



// ─── Message Status Icon ────────────────────────────────────────────────
const MessageStatusIcon = memo(({ status, recipientInitial, recipientAvatar }: { status?: MessageStatus; recipientInitial?: string, recipientAvatar?: string }) => {
  if (!status) return null;
  
  // 1. Sending: A hollow, light-gray circle
  if (status === 'sending') return (
    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 relative overflow-hidden">
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 bg-slate-200"
      />
    </div>
  );
  
  // 2. Sent: A single check icon
  if (status === 'sent') return <Check className="w-3.5 h-3.5 text-blue-500" strokeWidth={3} />;
  
  // 3. Delivered: A double check icon
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={3} />;
  
  // 4. Seen: recipient's avatar
  if (status === 'seen') return (
    <div className="w-4 h-4 rounded-full bg-brand-primary overflow-hidden flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white">
      {recipientAvatar ? (
        <img src={recipientAvatar} className="w-full h-full object-cover" alt="" />
      ) : (
        <span className="text-[7px] font-black text-brand-dark">{(recipientInitial || 'T').charAt(0)}</span>
      )}
    </div>
  );
  
  return null;
});

MessageStatusIcon.displayName = 'MessageStatusIcon';

// ─── Shared Components ──────────────────────────────────────────────
const ChatBubble = memo(({ msg, tutorInitial, tutorAvatar, isReportingMode, isSelected, toggleSelect, onVisible }: any) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msg.sender === 'student' || !onVisible || msg.id.toString().startsWith('opt-')) return;
    
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
    <div 
      ref={bubbleRef}
      onClick={() => isReportingMode && toggleSelect?.(msg.id)}
      className={`flex items-start gap-3 w-full ${msg.sender === 'student' ? 'flex-row-reverse' : 'flex-row'} ${isReportingMode ? 'cursor-pointer p-2 rounded-xl transition-all hover:bg-slate-50' : ''} ${isSelected ? 'bg-red-50 ring-1 ring-red-200' : ''}`}
    >
      {isReportingMode && (
        <div className="flex items-center justify-center shrink-0 mt-2">
          <div className={`w-5 h-5 rounded border border-slate-300 ${isSelected ? 'bg-red-500 border-red-500' : 'bg-white'} flex items-center justify-center`}>
            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
      )}
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black ring-1 ring-slate-100 overflow-hidden ${msg.sender === 'student' ? 'bg-blue-600 text-white' : 'bg-brand-primary text-brand-dark'}`}>
        {msg.sender === 'student' ? 'Y' : (tutorAvatar ? <img src={tutorAvatar} className="w-full h-full object-cover" alt="" /> : tutorInitial)}
      </div>
      <div className={`max-w-[75%] ${msg.sender === 'student' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.sender === 'student' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-brand-dark rounded-tl-sm shadow-sm'}`}>{msg.text}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{msg.time}</span>
          {msg.sender === 'student' && <MessageStatusIcon status={msg.status} recipientInitial={tutorInitial} recipientAvatar={tutorAvatar} />}
        </div>
      </div>
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';

const ChatInput = ({ value, onChange, onSend, placeholder }: any) => (
  <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-lg ring-1 ring-slate-100 mt-auto">
    <input 
      type="text" 
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); onSend(); } }}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const channelRef = useRef<any>(null);
  const globalWatchChannelRef = useRef<any>(null);
  const selectedSessionRef = useRef<TutorSession | null>(null);
  const currentUserRef = useRef<any>(null);
  const sessionsRef = useRef<TutorSession[]>([]);
  const [isTutorTyping, setIsTutorTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'OFFLINE'>('CONNECTING');
  const [isTutorOnline, setIsTutorOnline] = useState(false);
  const tutorOnlineRef = useRef(false);
  const typingTimeoutRef = useRef<any>(null);

  // ─── Report States ────────────────────────────────────────────────
  const [isReportingMode, setIsReportingMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

      // Check which rooms have signals to extract subjects
      const { data: allMessages } = await supabase
        .from('chat_messages')
        .select('room_id, sender_id, content, created_at')
        .in('room_id', roomIds)
        .order('created_at', { ascending: true });

      const sessionList: TutorSession[] = rooms.map((room: any) => {
        const tutorProfile = Array.isArray(room.profiles) ? room.profiles[0] : room.profiles;
        const name = tutorProfile?.full_name || 'Tutor';
        const avatar = tutorProfile?.avatar_url;
        const roomSchedules = (schedules || []).filter(s => s.room_id === room.id);
        const roomMessages = (allMessages || []).filter(m => m.room_id === room.id);
        const hasTutorResponse = roomMessages.some(m => m.sender_id === room.tutor_id);

        const initiatingMsg = roomMessages.find(m => m.content.startsWith('SIGNAL INITIATED:'));
        const extractedSubject = initiatingMsg 
          ? initiatingMsg.content.match(/requesting a (.+) session/)?.[1] || 'General Session'
          : 'General Session';

        const unreadCount = roomMessages.filter(m => m.sender_id === room.tutor_id && !m.read_at).length;

        return {
          id: room.tutor_id,
          roomId: room.id,
          tutorName: name,
          tutorInitial: name.charAt(0).toUpperCase(),
          tutorAvatar: avatar,
          subject: extractedSubject,
          status: hasTutorResponse ? 'accepted' : 'pending',
          lastMsg: roomMessages[roomMessages.length - 1]?.content || 'Signal established...',
          lastActive: roomMessages[roomMessages.length - 1]?.created_at || room.created_at,
          hasUnread: unreadCount > 0,
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

  // Always keep refs in sync so realtime callbacks never read stale closure values
  useEffect(() => { selectedSessionRef.current = selectedSession; }, [selectedSession]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  // GLOBAL SIDEBAR WATCHER: Real-time updates for session status and activity
  useEffect(() => {
    if (!currentUser?.id) return;
    if (globalWatchChannelRef.current) return;

    const globalChannel = supabase
      .channel(`student-global-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const m = payload.new as any;
        const currentSessions = sessionsRef.current;
        const sessionIndex = currentSessions.findIndex(s => s.roomId === m.room_id);
        if (sessionIndex === -1) return;

        setSessions(prev => {
          const newList = [...prev];
          if (newList[sessionIndex]) {
            const isTutor = m.sender_id !== currentUser.id;
            const isViewing = selectedSessionRef.current?.roomId === m.room_id && activeTab === 'discussion';
            newList[sessionIndex] = {
              ...newList[sessionIndex],
              status: isTutor ? 'accepted' : newList[sessionIndex].status,
              lastActive: 'Just Now',
              hasUnread: isTutor && !isViewing
            };
          }
          return newList;
        });
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const m = payload.payload;
        const currentSessions = sessionsRef.current;
        const sessionIndex = currentSessions.findIndex(s => s.roomId === m.room_id);
        if (sessionIndex === -1) return;

        setSessions(prev => {
          const newList = [...prev];
          if (newList[sessionIndex]) {
            const isTutor = m.sender_id !== currentUser.id;
            const isViewing = selectedSessionRef.current?.roomId === m.room_id && activeTab === 'discussion';
            newList[sessionIndex] = {
              ...newList[sessionIndex],
              status: isTutor ? 'accepted' : newList[sessionIndex].status,
              lastActive: 'Just Now',
              hasUnread: isTutor && !isViewing
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

  // ─── Fetch messages for selected session ──────────────────────────
  useEffect(() => {
    if (!selectedSession?.roomId || !currentUser) return;

    // Clear unread dot instantly when selecting
    setSessions(prev => prev.map(s => s.roomId === selectedSession.roomId ? { ...s, hasUnread: false } : s));

    // Smart merge: only add truly new messages, never wipe (prevents polling duplicates)
    const mergeMsgs = (fetched: Message[], setter: React.Dispatch<React.SetStateAction<Message[]>>) => {
      setter(prev => {
        const existingIds = new Set(prev.filter(m => !String(m.id).startsWith('opt-')).map(m => m.id));
        const newOnes = fetched.filter(m => !existingIds.has(m.id));
        if (newOnes.length === 0) return prev;
        return [...prev.filter(m => String(m.id).startsWith('opt-')), ...fetched];
      });
    };

    const fetchMsgs = async () => {
      const { data: dData, error: dErr } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', selectedSession.roomId)
        .order('created_at', { ascending: true });

      if (dErr) console.error('[STUDENT POLL] chat_messages error:', dErr.message, dErr.code);

      if (dData) {
        mergeMsgs(
          dData
            .filter((m: any) => !m.content.startsWith('SIGNAL INITIATED:') && !m.content.startsWith('SIGNAL ACCEPTED:') && !m.content.startsWith('SIGNAL REJECTED:'))
            .map((m: any) => ({
              id: m.id,
              sender: (m.sender_id === currentUser.id ? 'student' : 'tutor') as 'student' | 'tutor',
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: m.sender_id === currentUser.id
                ? (m.read_at ? 'seen' : m.delivered_at ? 'delivered' : 'sent') as MessageStatus
                : undefined
            })),
          setMessages
        );
      }

      const { data: cData } = await supabase
        .from('live_class_messages')
        .select('*')
        .eq('room_id', selectedSession.roomId)
        .order('created_at', { ascending: true });

      if (cData) {
        mergeMsgs(
          cData.map((m: any) => ({
            id: m.id,
            sender: (m.sender_id === currentUser.id ? 'student' : 'tutor') as 'student' | 'tutor',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.sender_id === currentUser.id
              ? (m.read_at ? 'seen' : m.delivered_at ? 'delivered' : 'sent') as MessageStatus
              : undefined
          })),
          setClassMessages
        );
      }
    };

    fetchMsgs();
    const pollInterval = setInterval(fetchMsgs, 2500);

    const channel = supabase.channel(`session:${selectedSession.roomId}`, {
      config: { broadcast: { ack: true } },
    });
    channelRef.current = channel;

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        console.log("[STUDENT REALTIME] Incoming Message:", payload);
        const m = payload.new as any;
        const sess = selectedSessionRef.current;
        const user = currentUserRef.current;
        if (!sess || m.room_id !== sess.roomId) return;

        // ── Auto-update Delivered Status in DB ───────────────────────
        if (m.sender_id !== user?.id && !m.delivered_at) {
          supabase.from('chat_messages').update({ delivered_at: new Date().toISOString() }).eq('id', m.id).then();
        }

        if (m.content.startsWith('SIGNAL INITIATED:') || m.content.startsWith('SIGNAL ACCEPTED:') || m.content.startsWith('SIGNAL REJECTED:') || m.content.startsWith('Discussion Started')) return;
        setMessages(prev => {
          if (prev.some(existing => existing.id === m.id)) return prev;
          const status: MessageStatus | undefined = m.sender_id === user?.id ? (isTutorOnline ? 'delivered' : 'sent') : undefined;
          return [...prev, {
            id: m.id,
            sender: m.sender_id === user?.id ? 'student' : 'tutor',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status
          } as Message];
        });
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const m = payload.payload;
        const sess = selectedSessionRef.current;
        const user = currentUserRef.current;
        if (!sess || m.room_id !== sess.roomId) return;
        setMessages(prev => {
          if (prev.some(existing => existing.id === m.id)) return prev;
          const status: MessageStatus | undefined = m.sender_id === user?.id ? (isTutorOnline ? 'delivered' : 'sent') : undefined;
          return [...prev, {
            id: m.id,
            sender: m.sender_id === user?.id ? 'student' : 'tutor',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status
          } as Message];
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_class_messages' }, (payload) => {
        const m = payload.new as any;
        const sess = selectedSessionRef.current;
        const user = currentUserRef.current;
        if (!sess || m.room_id !== sess.roomId) return;
        setClassMessages(prev => {
          if (prev.some(existing => existing.id === m.id)) return prev;
          return [...prev, {
            id: m.id,
            sender: m.sender_id === user?.id ? 'student' : 'tutor',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.sender_id === user?.id ? 'sent' : undefined
          } as Message];
        });
      })
      .on('broadcast', { event: 'new_class_message' }, (payload) => {
        const m = payload.payload;
        const sess = selectedSessionRef.current;
        const user = currentUserRef.current;
        if (!sess || m.room_id !== sess.roomId) return;
        setClassMessages(prev => {
          if (prev.some(existing => existing.id === m.id)) return prev;
          return [...prev, {
            id: m.id,
            sender: m.sender_id === user?.id ? 'student' : 'tutor',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.sender_id === user?.id ? 'sent' : undefined
          } as Message];
        });
      })
      // ── Tutor read our messages → upgrade to Seen ─────────────────────
      .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
        const sess = selectedSessionRef.current;
        if (!sess || payload.roomId !== sess.roomId) return;
        
        const { msgId } = payload;
        
        setMessages(prev => prev.map(m => (m.id === msgId || !msgId) && m.sender === 'student' ? { ...m, status: 'seen' as MessageStatus } : m));
        setClassMessages(prev => prev.map(m => (m.id === msgId || !msgId) && m.sender === 'student' ? { ...m, status: 'seen' as MessageStatus } : m));
      })
      // ── Presence: detect if tutor is online → upgrade to Delivered ───
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const user = currentUserRef.current;
        const others = Object.values(state).flat() as any[];
        const tutorOnline = others.some((u: any) => u.user_id !== user?.id);
        setIsTutorOnline(tutorOnline);
        tutorOnlineRef.current = tutorOnline;
        if (tutorOnline) {
          setMessages(prev => prev.map(m => m.sender === 'student' && m.status === 'sent' ? { ...m, status: 'delivered' as MessageStatus } : m));
          setClassMessages(prev => prev.map(m => m.sender === 'student' && m.status === 'sent' ? { ...m, status: 'delivered' as MessageStatus } : m));
        }
        const otherTyping = others.some((u: any) => u.user_id !== user?.id && u.typing);
        setIsTutorTyping(otherTyping);
      })
      .subscribe(async (status) => {
        console.log(`[STUDENT REALTIME] Status: ${status} for Room: ${selectedSession?.roomId}`);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('CONNECTED');
          await channel.track({ user_id: currentUserRef.current?.id, typing: false, chat_active: true });
        } else {
          setConnectionStatus('OFFLINE');
        }
      });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedSession?.roomId, currentUser?.id]);

  // ── Mark messages as read when Student opens the Discussion tab ─────
  useEffect(() => {
    if (activeTab !== 'discussion' || !selectedSession?.roomId || !currentUser?.id) return;
    supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('room_id', selectedSession.roomId)
      .neq('sender_id', currentUser.id)
      .is('read_at', null)
      .then(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'messages_read',
          payload: { room_id: selectedSession.roomId }
        });
      });
  }, [activeTab, selectedSession, currentUser]);

  const markAsRead = useCallback((msgId: string | number) => {
    const sess = selectedSessionRef.current;
    if (!sess || !currentUser) return;
    
    supabase.from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', msgId)
      .eq('room_id', sess.roomId)
      .then(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'messages_read',
          payload: { roomId: sess.roomId, msgId }
        });
      });
  }, [currentUser]);

  const markClassAsRead = useCallback((msgId: string | number) => {
    const sess = selectedSessionRef.current;
    if (!sess || !currentUser) return;
    
    supabase.from('live_class_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', msgId)
      .eq('room_id', sess.roomId)
      .then(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'messages_read',
          payload: { roomId: sess.roomId, msgId }
        });
      });
  }, [currentUser]);

  const handleTyping = () => {
    if (!channelRef.current) return;
    channelRef.current.track({ user_id: currentUser?.id, typing: true, chat_active: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ user_id: currentUser?.id, typing: false, chat_active: true });
    }, 2000);
  };

  // ─── Auto-scroll Logic ──────────────────────────────────────────
  useEffect(() => {
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      if (activeTab === 'discussion') {
        msgBottomRef.current?.scrollIntoView({ behavior });
      } else if (activeTab === 'class') {
        classBottomRef.current?.scrollIntoView({ behavior });
      }
    };

    // Immediate jump on tab/session change
    const t1 = setTimeout(() => scrollToBottom('auto'), 100);
    // Backup scroll after animation
    const t2 = setTimeout(() => scrollToBottom('auto'), 400);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeTab, selectedSession]);

  useEffect(() => {
    // Smooth scroll for new messages
    if (activeTab === 'discussion') {
      msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'class') {
      classBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, classMessages]);

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

  const getTimeRemaining = (sc: ScheduledClass | null): string => {
    if (!sc) return '';
    const end = toDateTime(sc.class_date, sc.end_time);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return '00:00';
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isSessionEnded = (session: TutorSession) => {
    const schedules = session.scheduledClasses || [];
    if (schedules.length === 0) return false;
    const last = schedules[schedules.length - 1];
    return now > toDateTime(last.class_date, last.end_time);
  };

  // ─── Send messages ────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!msgInput.trim() || !selectedSession?.roomId || !currentUser) return;
    const content = msgInput.trim();
    setMsgInput('');

    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      sender: 'student',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase.from('chat_messages').insert({
      room_id: selectedSession.roomId,
      sender_id: currentUser.id,
      content
    }).select().single();

    if (error) {
      console.error("Transmission Error:", error.message);
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    } else if (data) {
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'new_message', payload: data });
      }

      // ── Implicit Read: Sending a message proves we saw their messages ──
      supabase.from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', selectedSession.roomId)
        .neq('sender_id', currentUser.id)
        .is('read_at', null)
        .then();

      const finalStatus: MessageStatus = isTutorOnline ? 'delivered' : 'sent';
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id, status: finalStatus } : m));
    }
  };

  const sendClassMsg = async () => {
    if (!classInput.trim() || !isClassActive() || !selectedSession || !currentUser) return;
    const content = classInput.trim();
    setClassInput('');

    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      sender: 'student',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setClassMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase.from('live_class_messages').insert({
      room_id: selectedSession.roomId,
      sender_id: currentUser.id,
      content
    }).select().single();

    if (error) {
      console.error("Signal Failed:", error.message);
      setClassMessages(prev => prev.filter(m => m.id !== optimisticId));
    } else if (data) {
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'new_class_message', payload: data });
      }

      // ── Implicit Read: Sending a message proves we saw their messages ──
      supabase.from('live_class_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', selectedSession.roomId)
        .neq('sender_id', currentUser.id)
        .is('read_at', null)
        .then();

      const finalStatus: MessageStatus = isTutorOnline ? 'delivered' : 'sent';
      setClassMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id, status: finalStatus } : m));
    }
  };

  // ─── Report Submission ────────────────────────────────────────────
  const submitReport = async () => {
    if (!reportReason || selectedMessages.length === 0 || !currentUser || !selectedSession) return;
    setIsSubmittingReport(true);
    
    const evidence = messages
      .filter(m => selectedMessages.includes(m.id))
      .map(m => `[${m.sender.toUpperCase()}] ${m.text}`)
      .join('\n');

    const { error } = await supabase.from('flagged_content').insert({
      sender_id: selectedSession.id, 
      content: evidence,
      reason: reportReason,
      status: 'pending'
    });

    if (error) {
      alert("Failed to submit report. Please try again.");
    } else {
      setShowReportModal(false);
      setIsReportingMode(false);
      setSelectedMessages([]);
      setReportReason('');
      alert("Report submitted successfully. We will review this shortly.");
    }
    setIsSubmittingReport(false);
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Loading Sessions...</p>
    </div>
  );

  const filteredSessions = sessions.filter(s => {
    const nameMatch = s.tutorName.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch && !isSessionEnded(s);
  });

  // ─── Empty state ──────────────────────────────────────────────────
  if (sessions.length === 0) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 font-sans text-center px-4">
      <ScrollStyles />
      <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center">
        <MessageCircle className="w-10 h-10 text-blue-400" />
      </div>
      <div className="max-w-sm">
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

      {/* ── Mobile Sidebar Overlay ──────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className={`fixed md:relative z-50 md:z-auto h-full w-72 md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black italic uppercase tracking-tighter text-brand-dark">My Sessions</h1>
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={connectionStatus}></div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all md:hidden">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" placeholder="Search tutors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400 transition-all shadow-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll px-3 space-y-1">
          <p className="px-4 text-[9px] font-black uppercase tracking-[3px] text-slate-400 mb-3">Active Tutors</p>
          {filteredSessions.map(s => (
            <button key={s.roomId} onClick={() => { setSelectedSession(s); setActiveTab('updates'); setSidebarOpen(false); }} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all relative ${selectedSession?.roomId === s.roomId ? 'bg-white shadow-md border border-slate-100' : 'hover:bg-slate-100/80'}`}>
              <div className="relative">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black ${selectedSession?.roomId === s.roomId ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{s.tutorInitial}</div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${s.status === 'accepted' ? 'bg-emerald-400' : s.status === 'declined' ? 'bg-red-400' : 'bg-amber-400'}`}>
                  {s.status === 'accepted' ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <Clock className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black uppercase italic truncate text-brand-dark">{s.tutorName}</p>
                    {s.hasUnread && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                      />
                    )}
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 uppercase shrink-0">{s.lastActive}</span>
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest truncate leading-none ${s.status === 'accepted' ? 'text-emerald-500' : s.status === 'declined' ? 'text-red-400' : 'text-amber-500'}`}>
                  {s.status === 'accepted' ? (s.scheduledClasses.length > 0 ? 'Class Ongoing' : 'Discussion') : s.status === 'declined' ? 'Declined' : 'Awaiting Response'}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 truncate leading-none">
                  {s.subject}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-sm">
            {profile?.full_name?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-black text-brand-dark uppercase italic leading-none">{profile?.full_name || 'Student'}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Student</p>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/20 w-full">
        <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-3 md:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all md:hidden">
              <Search className="w-4 h-4 text-slate-500" />
            </button>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${selectedSession?.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {selectedSession?.tutorInitial || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-brand-dark uppercase italic leading-none">{selectedSession?.tutorName || 'No Tutor'}</p>
                <div className={`w-1.5 h-1.5 rounded-full ${isTutorOnline ? 'bg-green-500 animate-pulse ring-4 ring-green-500/20' : 'bg-slate-300'}`} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-[9px] font-bold uppercase tracking-widest ${isTutorOnline ? 'text-green-600' : 'text-slate-400'}`}>
                  {isTutorOnline ? 'Online Now' : 'Offline'} — {selectedSession?.status === 'accepted' ? 'Engaged' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
          {selectedSession && selectedSession.scheduledClasses.length > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
              <CalendarDays className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 hidden sm:inline">{selectedSession.scheduledClasses.length} Class{selectedSession.scheduledClasses.length > 1 ? 'es' : ''} Scheduled</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 sm:hidden">{selectedSession.scheduledClasses.length}</span>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-100 px-2 md:px-8 flex shrink-0 overflow-x-auto">
          {([
            { key: 'updates' as Tab, label: 'Updates', icon: Bell },
            { key: 'discussion' as Tab, label: 'Discussion', icon: MessageCircle },
            { key: 'class' as Tab, label: 'Live Class', icon: BookOpen },
            { key: 'history' as Tab, label: 'History', icon: History },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-2 px-4 md:px-6 py-4 transition-all shrink-0 ${activeTab === tab.key ? 'text-brand-dark' : 'text-slate-400'}`}>
              <tab.icon className="w-4 h-4" />
              <div className="text-left font-black uppercase leading-none hidden sm:block">
                <p className="text-[10px] tracking-[2px]">{tab.label}</p>
                <p className="text-[8px] tracking-widest opacity-60 mt-1">
                  {tab.key === 'class' ? (isClassActive() ? 'Live' : 'Locked') : 
                   tab.key === 'history' ? 'Past' : 'View'}
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
              <motion.div key="updates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto px-4 md:px-10 py-6 md:py-10 space-y-6 md:space-y-8 custom-scroll">
                
                {/* Connection Status Card */}
                {selectedSession && (
                  <div className={`rounded-[2rem] border p-8 ${selectedSession?.status === 'accepted' ? 'bg-emerald-50/50 border-emerald-200' : selectedSession?.status === 'declined' ? 'bg-red-50/50 border-red-200' : 'bg-amber-50/50 border-amber-200 shadow-sm shadow-amber-100'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedSession?.status === 'accepted' ? 'bg-emerald-100' : selectedSession?.status === 'declined' ? 'bg-red-100' : 'bg-amber-100'}`}>
                          {selectedSession?.status === 'accepted' ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : selectedSession?.status === 'declined' ? <X className="w-7 h-7 text-red-500" /> : <Zap className="w-7 h-7 text-amber-600 animate-pulse" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-black uppercase italic tracking-tighter text-brand-dark">
                            {selectedSession?.status === 'accepted' ? 'Operational Line Active' : selectedSession?.status === 'declined' ? 'Request Declined' : 'Tunnel Signal Dispatched'}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            {selectedSession?.status === 'accepted' ? `${selectedSession.tutorName} is officially engaged. High-security communication is now active.` : selectedSession?.status === 'declined' ? 'Specialist choice is restricted. Re-evaluate your mission requirements.' : `Your tunnel request to ${selectedSession?.tutorName} is manifesting. Specialist review in progress.`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {selectedSession?.status === 'accepted' ? (
                          <button onClick={() => setActiveTab('discussion')} className="flex items-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
                            <MessageCircle className="w-3.5 h-3.5" /> Start Discussion
                          </button>
                        ) : selectedSession?.status === 'pending' ? (
                          <div className="flex items-center gap-2 px-6 py-4 bg-white/50 border border-amber-200 rounded-xl">
                            <Clock className="w-4 h-4 text-amber-500 rotate-12" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Awaiting Handshake</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scheduled Classes */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Upcoming Missions</p>
                  
                  {(!selectedSession || selectedSession.scheduledClasses.filter(sc => now <= toDateTime(sc.class_date, sc.end_time)).length === 0) ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-300 italic">
                        {selectedSession?.status === 'accepted' ? 'Tutor hasn\'t scheduled a class yet. Check the discussion tab.' : 'No upcoming classes.'}
                      </p>
                    </div>
                  ) : (
                    selectedSession.scheduledClasses
                    .filter(sc => now <= toDateTime(sc.class_date, sc.end_time))
                    .map(sc => {
                      const isLive = now >= toDateTime(sc.class_date, sc.start_time) && now <= toDateTime(sc.class_date, sc.end_time);
                      const countdown = getCountdown(sc);

                      return (
                        <div key={sc.id} className={`bg-white rounded-2xl border p-6 flex items-center justify-between shadow-sm transition-all ${isLive ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-100'}`}>
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLive ? 'bg-emerald-100' : 'bg-blue-50'}`}>
                              {isLive ? <Wifi className="w-6 h-6 text-emerald-600 animate-pulse" /> : <CalendarDays className="w-6 h-6 text-blue-500" />}
                            </div>
                            <div>
                              <p className="font-black italic text-brand-dark uppercase text-sm">{fmtDate(sc.class_date)}</p>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">{fmtTime(sc.start_time)} — {fmtTime(sc.end_time)}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isLive ? 'text-emerald-500' : 'text-blue-500'}`}>{isLive ? 'Mission Active' : `Class in ${countdown}`}</p>
                              </div>
                            </div>
                          </div>
                          {isLive && (
                             <button onClick={() => setActiveTab('class')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                               Enter Class <ArrowRight className="w-3 h-3" />
                             </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Mission Logs */}
                <div className="space-y-4 pt-6 md:pt-10">
                   <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Mission Logs</p>
                   <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                      <div className="space-y-4">
                        {messages.filter(m => m.text.toLowerCase().includes('📅 class scheduled') || m.text.toLowerCase().includes('discussion started'))
                          .map(m => (
                            <div key={m.id} className="flex gap-4 items-start group">
                              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                                <Bell className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                              </div>
                              <div className="flex-1 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{m.time}</p>
                                <p className="text-sm font-medium text-brand-dark leading-relaxed">{m.text}</p>
                              </div>
                            </div>
                          ))}
                        {messages.filter(m => m.text.toLowerCase().includes('📅 class scheduled') || m.text.toLowerCase().includes('discussion started')).length === 0 && (
                          <div className="py-12 text-center opacity-30">
                            <History className="w-10 h-10 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[3px]">No communication logs yet</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ── DISCUSSION TAB ────────────────────────────────────── */}
            {activeTab === 'discussion' && selectedSession && (
              <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col w-full px-4 md:px-12 pt-8 pb-4">
                <div className="flex-1 overflow-y-auto space-y-6 md:space-y-6 pr-4 custom-scroll relative">
                  {messages.length === 0 && (
                     <div className="py-20 text-center">
                       <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-slate-300 font-black uppercase tracking-[3px] italic text-sm">Start the conversation...</p>
                     </div>
                  )}
                  {messages.map(m => (
                    <ChatBubble 
                      key={m.id} 
                      msg={m} 
                      tutorInitial={selectedSession?.tutorInitial || 'T'} 
                      tutorAvatar={selectedSession?.tutorAvatar}
                      isReportingMode={isReportingMode}
                      isSelected={selectedMessages.includes(m.id)}
                      toggleSelect={(id: string) => setSelectedMessages(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                      onVisible={markAsRead}
                    />
                  ))}
                  <div ref={msgBottomRef} />
                </div>
                
                {isReportingMode ? (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      disabled={selectedMessages.length === 0}
                      onClick={() => setShowReportModal(true)}
                      className="px-6 py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] disabled:opacity-50 hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Shield className="w-4 h-4" /> Review Report
                    </button>
                  </div>
                ) : selectedSession?.status !== 'accepted' ? (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Pending Specialist Confirmation</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">This communication line will unlock automatically when the specialist officially engages.</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <ChatInput 
                      value={msgInput} 
                      onChange={(val: string) => { setMsgInput(val); handleTyping(); }} 
                      onSend={sendMsg} 
                      placeholder="Message your tutor..." 
                    />
                  </div>
                )}
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
                  <div className="h-full flex flex-col w-full px-4 md:px-12">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-6 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-emerald-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Session Active</p>
                          <p className="text-sm font-black text-brand-dark uppercase italic">{selectedSession?.tutorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right min-w-[80px]">
                          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600/50 mb-0.5">Ending In</p>
                          <p className="text-xl font-black text-emerald-700 font-mono tracking-tighter">{getTimeRemaining(getActiveClass())}</p>
                        </div>
                      </div>
                    </div>
                     <div className="flex-1 overflow-y-auto space-y-6 md:space-y-6 pr-4 custom-scroll">
                      {classMessages.map(m => <ChatBubble key={m.id} msg={m} tutorInitial={selectedSession?.tutorInitial || 'T'} tutorAvatar={selectedSession?.tutorAvatar} onVisible={markClassAsRead} />)}
                      <div ref={classBottomRef} />
                    </div>
                    <ChatInput value={classInput} onChange={setClassInput} onSend={sendClassMsg} placeholder="Ask a question..." />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* ── Report Modal ────────────────────────────────────────────── */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-brand-dark/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                       <Shield className="w-6 h-6 text-red-500" />
                     </div>
                     <div>
                       <h3 className="text-xl font-black italic text-brand-dark uppercase">Report Violation</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">High Command Review</p>
                     </div>
                   </div>
                   <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                     <X className="w-5 h-5 text-slate-500" />
                   </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto custom-scroll">
                   <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-4">Reason for reporting</p>
                   <select 
                     value={reportReason}
                     onChange={(e) => setReportReason(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-brand-dark outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all mb-8 appearance-none cursor-pointer"
                   >
                     <option value="" disabled>Select a reason...</option>
                     <option value="Sexually Explicit / Nudity">Sexually Explicit / Nudity</option>
                     <option value="Harassment or Hate Speech">Harassment or Hate Speech</option>
                     <option value="Spam or Scam">Spam or Scam</option>
                     <option value="Off-platform Transaction">Off-platform Transaction</option>
                     <option value="Other">Other</option>
                   </select>

                   <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-4">Selected Evidence</p>
                   <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     {messages.filter(m => selectedMessages.includes(m.id)).map(m => (
                       <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{m.sender === 'student' ? 'You' : selectedSession?.tutorName}</p>
                         <p className="text-sm font-medium text-brand-dark">{m.text}</p>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                  <button 
                   onClick={() => setShowReportModal(false)}
                   className="flex-1 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                   onClick={submitReport}
                   disabled={!reportReason || isSubmittingReport}
                   className="flex-1 flex justify-center items-center py-4 bg-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 hover:bg-red-600 transition-all shadow-lg"
                  >
                    {isSubmittingReport ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Submit to Admin'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
