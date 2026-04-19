'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, MessageSquare, Heart, Clock, 
  ChevronRight, Shield, HelpCircle, Send, 
  FileText, LogOut, User, ShieldCheck,
  BookOpen, RefreshCcw, Search, ExternalLink, Zap,
  MessageCircle, CheckCircle2, CalendarDays, History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          setProfile(data);
          setIsTutor(data?.role === 'seller');
          fetchNotifications(user.id);
          subscribeToSignals(user.id);
          
          if (data?.role === 'admin') router.push('/admin/dashboard');
          
          if (data?.role === 'seller' && data?.skills?.length > 0) {
            supabase.from('help_requests')
              .select('*, student:profiles(full_name)')
              .eq('status', 'open')
              .in('subject', data.skills)
              .limit(3)
              .then(({ data: matches }) => {
                setRecommendations(matches || []);
              });
          }

          if (data?.role === 'user') {
             supabase.from('help_requests')
               .select('*')
               .eq('student_id', user.id)
               .then(({ data: reqs }) => {
                  setMyRequests(reqs || []);
               });
          }
          
          supabase.from('tutoring_sessions')
            .select('*')
            .or(`tutor_id.eq.${user.id},student_id.eq.${user.id}`)
            .eq('status', 'completed')
            .then(({ data }) => {
              setCompletedSessions(data || []);
              const total = data?.reduce((acc: number, curr: any) => acc + (Number(curr.agreed_price) || 0), 0);
              setTotalEarnings(total || 0);
            });
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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [router]);

  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
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
      setNotifications(prev => [payload.new, ...prev].slice(0, 10));
    });
    
    channel.subscribe();
    channelRef.current = channel;
    return channel;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
       <div className="w-12 h-12 border-[3px] border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-brand-dark overflow-x-hidden pb-24">
      <div className="bg-brand-dark relative overflow-hidden pt-8 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent opacity-50" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-[9px] font-black uppercase tracking-[4px] text-brand-primary mb-1.5 opacity-80">My TutorMatch</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white italic uppercase leading-[0.9] mb-4">
              {profile?.full_name?.split(' ')[0] || (isTutor ? 'Specialist' : 'Agent')} <span className="text-brand-primary block not-italic">Dashboard</span>
            </h1>
            <div className="flex items-center gap-4 mt-4">
               <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-[2px] text-white/50">
                    ₱{totalEarnings.toLocaleString()} {isTutor ? 'Revenue' : 'Investment'}
                  </span>
               </div>
            </div>
          </motion.div>
          <div className="flex items-center gap-3">
            <Link href={isTutor ? `/tutors/${profile?.id}` : "/subjects"} className="px-6 py-3.5 bg-brand-primary text-brand-dark rounded-xl font-black text-[9px] uppercase tracking-[2px] shadow-lg hover:bg-white hover:-translate-y-0.5 transition-all">
              {isTutor ? 'Modify Dossier' : 'Browse'}
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
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: isTutor ? 'Available Bids' : 'Post Mission', sub: isTutor ? 'Hunt Markets' : 'Recruit Experts', icon: BookOpen, color: 'indigo', href: isTutor ? '/help-wanted' : '/help-wanted/new' },
                { label: isTutor ? 'Active Offers' : 'Bids Recieved', sub: 'Inbound Signals', icon: Send, color: 'pink', href: isTutor ? '/bids' : '/dashboard' },
                { label: 'Chat Terminal', sub: 'Secure Comms', icon: MessageSquare, color: 'emerald', href: isTutor ? '/dashboard/session' : '/sessions' }
              ].map((tile, i) => (
                <Link key={i} href={tile.href}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-primary/30 transition-all group overflow-hidden relative">
                    <div className={`w-12 h-12 rounded-2xl bg-${tile.color}-50 text-${tile.color}-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}><tile.icon className="w-6 h-6" /></div>
                    <h4 className="text-[11px] font-black text-brand-dark uppercase tracking-wide mb-0.5">{tile.label}</h4>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{tile.sub}</p>
                  </motion.div>
                </Link>
              ))}
            </div>

            {isTutor && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Link href="/dashboard/missions" className="block group">
                  <div className="p-10 bg-brand-dark rounded-[3.5rem] border border-white/5 relative overflow-hidden shadow-2xl group-hover:border-brand-primary/50 transition-all">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/20 blur-[100px] rounded-full translate-x-12 -translate-y-12" />
                    <div className="relative z-10 flex flex-col">
                      <div className="flex justify-between items-start mb-16">
                        <div className="p-5 bg-brand-primary text-brand-dark rounded-3xl group-hover:rotate-12 transition-transform"><Zap className="w-10 h-10" /></div>
                        <div className="text-right">
                          <span className="px-5 py-2 bg-white/5 border border-white/10 text-brand-primary text-[10px] font-black uppercase tracking-[4px] rounded-full">Strategic Access</span>
                        </div>
                      </div>
                      <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-[0.85] mb-4">Specialist <span className="text-brand-primary block not-italic">Mission Hub</span></h3>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-[2px] leading-relaxed max-w-lg mb-8">Manage handshake signals, negotiate contracts, and monitor session telemetry.</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-[3px] text-brand-primary">Direct Inbound Active</span>
                        </div>
                        <ChevronRight className="w-8 h-8 text-white group-hover:translate-x-4 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {!isTutor && (
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
                             <Link href="/sessions" className="flex-[2] py-4 bg-brand-dark text-white rounded-2xl text-[9px] font-black text-center uppercase tracking-[2px] transition-all hover:bg-brand-primary hover:text-brand-dark">Enter Terminal</Link>
                             <button onClick={async () => { const { error } = await supabase.from('help_requests').delete().eq('id', req.id); if (!error) setMyRequests(prev => prev.filter(r => r.id !== req.id)); }} className="flex-1 py-4 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl text-[9px] font-black uppercase tracking-[2px] hover:bg-red-500 hover:text-white transition-all">Abort</button>
                          </div>
                        </motion.div>
                      ))
                    )}
                 </div>
              </section>
            )}

            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-400 flex items-center gap-4"><History className="w-4 h-4 text-brand-primary" /> Operational Mission History</h3>
                  <div className="h-[1px] bg-slate-200 flex-1 ml-6" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {completedSessions.length === 0 ? (
                    <div className="md:col-span-2 p-16 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center"><History className="w-12 h-12 text-slate-100 mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-[3px] text-slate-300 italic">Archive is currently empty.</p></div>
                  ) : (
                    completedSessions.map((session) => (
                      <motion.div key={session.id} whileHover={{ y: -5 }} className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all relative overflow-hidden">
                         <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-500"><CheckCircle2 className="w-7 h-7" /></div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">COMPLETED</p>
                               <p className="text-[14px] font-black text-brand-dark italic">₱{session.agreed_price}</p>
                            </div>
                         </div>
                         <h4 className="text-xl font-black uppercase italic tracking-tighter text-brand-dark mb-1">{session.subject || 'General Mission'}</h4>
                         <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[2px] mb-8">Archived: {new Date(session.created_at).toLocaleDateString()}</p>
                         <Link href={`/dashboard/session?room=${session.room_id}`} className="w-full inline-block py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl text-[9px] font-black text-center uppercase tracking-[2px] transition-all hover:bg-brand-dark hover:text-white shadow-sm">Reveal Chat Logs</Link>
                      </motion.div>
                    ))
                  )}
               </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className={`bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 flex flex-col h-[480px]`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-blue-400"><Zap className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-[3px] text-white/60">Intelligence Signals</span></div>
                {notifications.length > 0 && <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[8px] font-bold text-green-400 uppercase tracking-widest">Live Feed</span></div>}
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scroll">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20"><div className="w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" /><p className="text-[10px] font-black uppercase tracking-[4px] text-white">Scanning Bandwidth...</p><div className="w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" /></div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {notifications.map((notif) => (
                      <motion.div key={notif.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group" onClick={() => notif.link && router.push(notif.link)}>
                         <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.type === 'MESSAGE' ? 'bg-blue-500/20' : notif.type === 'ACCEPTED' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                               {notif.type === 'MESSAGE' ? <MessageCircle className="w-4 h-4 text-blue-400" /> : notif.type === 'ACCEPTED' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <CalendarDays className="w-4 h-4 text-amber-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{notif.type}</p>
                               <h4 className="text-sm font-black text-white leading-tight mb-1">{notif.title}</h4>
                               <p className="text-[11px] text-white/60 font-medium truncate">{notif.content}</p>
                            </div>
                            <div className="text-[8px] font-bold text-white/20 uppercase">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-12 -translate-y-12 transition-transform group-hover:scale-150" />
               <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-400 mb-6 flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-brand-primary" /> Dossier Support</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8 italic opacity-60">Need clearance for session payments or verify specialized credentials?</p>
               <Link href="/support" className="w-full py-5 bg-slate-50 border border-slate-200 rounded-3xl block text-center font-black text-[9px] uppercase tracking-[3px] text-slate-400 hover:bg-brand-dark hover:text-white transition-all shadow-sm">Open Support Signal</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
