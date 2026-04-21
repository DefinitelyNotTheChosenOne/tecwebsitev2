'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Heart, Clock, 
  ChevronRight, Shield, Send, 
  FileText, LogOut, User, ShieldCheck,
  BookOpen, RefreshCcw, Search, Zap,
  MessageCircle, CheckCircle2, History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Types ──────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string;
  role: 'user' | 'seller' | 'admin';
  avatar_url?: string;
}

interface HelpRequest {
  id: string;
  subject: string;
  status: string;
  student_id: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  link?: string;
  created_at: string;
}

const DashboardStyles = () => (
  <style jsx global>{`
    .signal-unread {
      background: linear-gradient(to right, #27374d, #27374d) padding-box,
                  linear-gradient(135deg, #ffb900 0%, transparent 100%) border-box !important;
      border: 1px solid transparent !important;
      box-shadow: 0 10px 30px -10px rgba(255, 185, 0, 0.15) !important;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 185, 0, 0.2);
      border-radius: 20px;
    }
  `}</style>
);

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readSignals, setReadSignals] = useState<Set<string>>(new Set());
  const [signalFilter, setSignalFilter] = useState<'MESSAGE' | 'SCHEDULE'>('MESSAGE');
  const [unreadCounts, setUnreadCounts] = useState<{MESSAGE: number, SCHEDULE: number}>({MESSAGE: 0, SCHEDULE: 0});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    setUnreadCounts(prev => ({ ...prev, [signalFilter]: 0 }));
  }, [signalFilter]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          setProfile(data);

          if (data?.role === 'admin') {
            router.replace('/admin/dashboard');
            return;
          }
          if (data?.role === 'seller') {
            router.replace('/seller');
            return;
          }

          fetchNotifications(user.id);
          subscribeToSignals(user.id);

          const { data: reqs } = await supabase.from('help_requests').select('*').eq('student_id', user.id);
          setMyRequests((reqs as unknown as HelpRequest[]) || []);
          
          const { data: sessions } = await supabase.from('tutoring_sessions').select('*').eq('student_id', user.id).eq('status', 'completed');
          setCompletedSessions(sessions || []);
          const total = (sessions || [])?.reduce((acc: number, curr: any) => acc + (Number(curr.agreed_price) || 0), 0);
          setTotalSpent(total || 0);
        } else {
          router.push('/auth');
        }
      } catch (err) {
        console.error("Dashboard Intelligence Failure:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [router]);

  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) {
      const typedData = data as unknown as Notification[];
      setNotifications(typedData);
      
      const counts = { MESSAGE: 0, SCHEDULE: 0 };
      typedData.forEach(n => {
        if (!readSignals.has(n.id)) {
          const isSched = n.title?.toLowerCase().includes('schedule') || n.title?.toLowerCase().includes('class');
          if (isSched) counts.SCHEDULE++;
          else counts.MESSAGE++;
        }
      });
      setUnreadCounts(counts);
    }
  };

  const subscribeToSignals = (uid: string) => {
    const channelId = `signals-${uid}-${Math.random()}`;
    const channel = supabase.channel(channelId);
    
    channel.on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications', 
      filter: `user_id=eq.${uid}` 
    }, (payload) => {
      const newNotif = payload.new as Notification;
      setNotifications(prev => [newNotif, ...prev].slice(0, 10));
      
      const isSched = newNotif.title?.toLowerCase().includes('schedule') || newNotif.title?.toLowerCase().includes('class');
      const type: 'MESSAGE' | 'SCHEDULE' = isSched ? 'SCHEDULE' : 'MESSAGE';
      
      if (type !== signalFilter) {
        setUnreadCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));
      }
    });
    
    channel.subscribe();
    channelRef.current = channel;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <div className="w-12 h-12 border-[3px] border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-brand-dark overflow-x-hidden pb-24">
      <DashboardStyles />
      <div className="bg-[#0f172a] relative overflow-hidden pt-8 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent opacity-50" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-[9px] font-black uppercase tracking-[4px] text-brand-primary mb-1.5 opacity-80">My TutorMatch</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white italic uppercase leading-[0.9] mb-4">
              {profile?.full_name?.split(' ')[0] || 'Student'} <span className="text-brand-primary block not-italic">Dashboard</span>
            </h1>
            <div className="flex items-center gap-4 mt-4">
               <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-[2px] text-white/50">
                    ₱{totalSpent.toLocaleString()} Investment
                  </span>
               </div>
            </div>
          </motion.div>
          <div className="flex items-center gap-3">
            <Link href="/subjects" className="px-6 py-3.5 bg-brand-primary text-brand-dark rounded-xl font-black text-[9px] uppercase tracking-[2px] shadow-lg hover:bg-white hover:-translate-y-0.5 transition-all">
              Browse Tutors
            </Link>
            <button onClick={handleSignOut} className="px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-red-400 flex items-center gap-2 transition-all">
              <span className="text-[8px] font-black uppercase tracking-[2px] hidden sm:block">Logout</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Post Mission', sub: 'Recruit Experts', icon: PlusCircle, color: 'indigo', href: '/user/help-wanted/new' },
                { label: 'Active Requests', sub: 'Inbound Signals', icon: Zap, color: 'pink', href: '/user/help-wanted' },
                { label: 'Chat Terminal', sub: 'Secure Comms', icon: MessageSquare, color: 'emerald', href: '/user/sessions' }
              ].map((tile, i) => (
                <Link key={i} href={tile.href}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-primary/30 transition-all group overflow-hidden relative">
                    <div className={`w-12 h-12 rounded-2xl bg-slate-50 text-brand-dark flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}><tile.icon className="w-6 h-6" /></div>
                    <h4 className="text-[11px] font-black text-brand-dark uppercase tracking-wide mb-0.5">{tile.label}</h4>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{tile.sub}</p>
                  </motion.div>
                </Link>
              ))}
            </div>

            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-400 flex items-center gap-4"><RefreshCcw className="w-4 h-4 text-brand-primary animate-spin" /> Operational Mission Clearances</h3>
                  <div className="h-[1px] bg-slate-200 flex-1 ml-6" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myRequests.length === 0 ? (
                    <div className="md:col-span-2 p-16 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center"><Shield className="w-12 h-12 text-slate-100 mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-[3px] text-slate-300 italic">No handshake signals manifest.</p></div>
                  ) : (
                    myRequests.map((req) => (
                      <motion.div key={req.id} whileHover={{ y: -5 }} className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all relative overflow-hidden">
                        <div className="flex items-center gap-5 mb-8">
                          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform"><User className="w-8 h-8 animate-pulse" /></div>
                          <div><h4 className="text-2xl font-black uppercase italic tracking-tighter text-brand-dark mb-1 leading-none">{req.subject}</h4><span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest rounded">{req.status}</span></div>
                        </div>
                        <div className="flex gap-3">
                           <Link href="/user/sessions" className="flex-[2] py-4 bg-brand-dark text-white rounded-2xl text-[9px] font-black text-center uppercase tracking-[2px] transition-all hover:bg-brand-primary hover:text-brand-dark">Enter Terminal</Link>
                           <button onClick={async () => { await supabase.from('help_requests').delete().eq('id', req.id); setMyRequests(prev => prev.filter(r => r.id !== req.id)); }} className="flex-1 py-4 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl text-[9px] font-black uppercase tracking-[2px] hover:bg-red-500 hover:text-white transition-all">Abort</button>
                        </div>
                      </motion.div>
                    ))
                  )}
               </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#27374d] border border-white/5 rounded-[40px] p-8 flex flex-col h-[480px] shadow-2xl">
              <div className="flex flex-col mb-8 gap-4">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                   {(['MESSAGE', 'SCHEDULE'] as const).map(f => (
                     <button
                       key={f}
                       onClick={() => setSignalFilter(f)}
                       className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all relative flex items-center justify-center gap-2 ${signalFilter === f ? 'bg-brand-primary text-brand-dark shadow-lg' : 'text-white/40 hover:text-white'}`}
                     >
                       {f === 'MESSAGE' ? 'Messages' : 'Mission Schedule'}
                       {unreadCounts[f] > 0 && (
                         <span className="bg-red-500 text-white text-[7px] font-black h-4 px-1.5 rounded-full flex items-center justify-center min-w-[16px] animate-bounce shadow-lg">
                           {unreadCounts[f]}
                         </span>
                       )}
                     </button>
                   ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scroll">
                {notifications.filter(n => {
                  const isSchedule = n.title?.toLowerCase().includes('schedule') || n.title?.toLowerCase().includes('class');
                  return signalFilter === 'SCHEDULE' ? isSchedule : !isSchedule;
                }).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20"><p className="text-[10px] font-black uppercase tracking-[4px] text-white">No {signalFilter === 'MESSAGE' ? 'messages' : 'schedules'} manifest...</p></div>
                ) : (
                  notifications.filter(n => {
                    const isSchedule = n.title?.toLowerCase().includes('schedule') || n.title?.toLowerCase().includes('class');
                    return signalFilter === 'SCHEDULE' ? isSchedule : !isSchedule;
                  }).map((notif) => (
                    <motion.div 
                      key={notif.id} 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className={`p-4 rounded-2xl transition-all cursor-pointer group border ${!readSignals.has(notif.id) ? 'signal-unread' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      onClick={() => {
                        setReadSignals(prev => new Set([...prev, notif.id]));
                        if (notif.link) router.push(notif.link);
                      }}
                    >
                       <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/20`}>
                             <Zap className="w-4 h-4 text-brand-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-black text-white leading-tight mb-1">{notif.title}</h4>
                             <p className="text-[11px] text-white/60 font-medium truncate">{notif.content}</p>
                          </div>
                       </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group text-center">
               <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-400 mb-6 flex items-center justify-center gap-3"><ShieldCheck className="w-4 h-4 text-brand-primary" /> Dossier Support</h3>
               <Link href="/user/support" className="w-full py-5 bg-slate-50 border border-slate-200 rounded-3xl block text-center font-black text-[9px] uppercase tracking-[3px] text-slate-400 hover:bg-brand-dark hover:text-white transition-all shadow-sm">Open Support Signal</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const PlusCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
