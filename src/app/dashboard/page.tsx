'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, MessageSquare, Heart, Clock, 
  ChevronRight, Shield, HelpCircle, Send, 
  FileText, LogOut, User, ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        // Fetch Profile & Role
        supabase.from('profiles').select('*').eq('id', currentSession.user.id).single()
          .then(({ data }) => {
            if (data?.role === 'admin') router.push('/admin/dashboard');
            setProfile(data);
            setLoading(false);
          });
        
        // Fetch Completed Analytics for Tutor
        supabase.from('tutoring_sessions')
          .select('*, profiles:student_id(full_name)')
          .eq('tutor_id', currentSession.user.id)
          .eq('status', 'completed')
          .then(({ data }) => {
            setCompletedSessions(data || []);
            const total = data?.reduce((acc: number, curr: any) => acc + (Number(curr.agreed_price) || 0), 0);
            setTotalEarnings(total || 0);
          });
      } else {
        router.push('/auth');
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const activeSessions = [
    { id: "SESS-8821", subject: "Advanced Calculus Mentoring", status: "In Progress", name: "Alex M.", price: 45, date: "Apr 12" }
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isTutor = profile?.role === 'seller';

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark overflow-x-hidden pb-12">
      {/* Dynamic Header Area */}
      <motion.div 
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-dark text-white pt-12 pb-32 px-6 shadow-2xl rounded-b-[3rem]"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight">
              {isTutor ? 'Tutor' : 'My'} <span className="text-brand-secondary">{isTutor ? 'Intel' : 'Dashboard'}</span>
            </h1>
            <div className="flex items-center gap-4">
              {isTutor ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-xs font-black uppercase tracking-widest text-green-400">₱{totalEarnings.toLocaleString()} Total Earnings</span>
                </div>
              ) : (
                <>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-dark bg-brand-primary" />)}
                  </div>
                  <span className="text-sm font-bold text-brand-light/60 uppercase tracking-widest">3 active mentors</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 pb-1">
            <Link 
              href={isTutor ? `/tutors/${profile?.id}` : "/"} 
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-xl"
            >
              {isTutor ? 'Public Portfolio' : 'Browse Tutors'}
            </Link>
            <button 
              onClick={handleSignOut}
              className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[2px] text-red-400 hover:bg-red-500 hover:text-brand-dark transition-all flex items-center gap-2 group"
            >
              Sign Out <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          
          {/* Specialized Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {isTutor ? (
              <>
                <Link href="/help-wanted" className="bg-white p-6 rounded-3xl shadow-sm border border-brand-secondary/5 hover:border-brand-primary/30 transition-all flex flex-col items-center justify-center text-center group">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><HelpCircle className="w-6 h-6" /></div>
                  <h4 className="font-black text-sm text-brand-dark mb-1">Available Bids</h4>
                  <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold">Hunt for Students</p>
                </Link>
                <Link href="/bids" className="bg-white p-6 rounded-3xl shadow-sm border border-brand-secondary/5 hover:border-brand-primary/30 transition-all flex flex-col items-center justify-center text-center group">
                  <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Send className="w-6 h-6" /></div>
                  <h4 className="font-black text-sm text-brand-dark mb-1">My Outgoing Offers</h4>
                  <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold">Track Your Bids</p>
                </Link>
                <Link href="/dashboard/profile" className="bg-white p-6 rounded-3xl shadow-sm border border-brand-secondary/5 hover:border-brand-primary/30 transition-all flex flex-col items-center justify-center text-center group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User className="w-6 h-6" /></div>
                  <h4 className="font-black text-sm text-brand-dark mb-1">Manage Portfolio</h4>
                  <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold">Edit Public Brand</p>
                </Link>
              </>
            ) : (
              <>
                <Link href="/help-wanted/new" className="bg-white p-6 rounded-3xl shadow-sm border border-brand-secondary/5 hover:border-brand-primary/30 transition-all flex flex-col items-center justify-center text-center group">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><HelpCircle className="w-6 h-6" /></div>
                  <h4 className="font-black text-sm text-brand-dark mb-1">Post Help Request</h4>
                  <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold">Ask for a Tutor</p>
                </Link>
                <Link href="/bids" className="bg-white p-6 rounded-3xl shadow-sm border border-brand-secondary/5 hover:border-brand-primary/30 transition-all flex flex-col items-center justify-center text-center group">
                  <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Send className="w-6 h-6" /></div>
                  <h4 className="font-black text-sm text-brand-dark mb-1">My Bids & Matches</h4>
                  <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold">Review Tutor Offers</p>
                </Link>
                <div className="bg-white/40 p-6 rounded-3xl shadow-sm border border-brand-secondary/5 opacity-50 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mb-3"><Clock className="w-6 h-6" /></div>
                  <h4 className="font-black text-sm text-zinc-400 mb-1 italic">Study History</h4>
                  <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold">Coming Soon</p>
                </div>
              </>
            )}
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <ShoppingBag className="text-brand-primary" /> 
              {isTutor ? 'Active Tutoring Contracts' : 'My Active Mentors'}
            </h2>
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
              className="space-y-4"
            >
              {activeSessions.map((sessionData) => (
                <div key={sessionData.id} className="bg-white p-6 rounded-3xl shadow-sm border border-brand-secondary/5 flex justify-between items-center group hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-brand-primary"><Clock className="w-6 h-6" /></div>
                    <div>
                      <h4 className="font-bold text-brand-dark">{sessionData.subject}</h4>
                      <p className="text-[10px] text-brand-secondary font-black uppercase tracking-widest">{isTutor ? 'Student' : 'Tutor'}: {sessionData.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-black text-brand-secondary uppercase tracking-widest">{isTutor ? 'Earning' : 'Price'}</span>
                    <span className="text-lg font-black text-brand-dark">₱{sessionData.price}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </section>

          {isTutor && completedSessions.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <ShieldCheck className="text-green-500" /> 
                Completed Contracts Archive
              </h2>
              <div className="space-y-4">
                {completedSessions.map((sess) => (
                  <div key={sess.id} className="bg-white/60 p-6 rounded-3xl border border-green-500/10 flex justify-between items-center group hover:bg-white transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500"><FileText className="w-5 h-5" /></div>
                      <div>
                        <h4 className="font-bold text-brand-dark text-sm">{sess.subject || 'Advanced Mentoring'}</h4>
                        <p className="text-[9px] text-brand-secondary font-black uppercase tracking-widest">Student: {sess.profiles?.full_name || 'Verified User'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] font-black text-brand-secondary uppercase tracking-widest">Paid Out</span>
                      <span className="text-lg font-black text-green-600">₱{(Number(sess.agreed_price) || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-10"
        >
          <div className="bg-brand-dark text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full group-hover:scale-150 transition-transform" />
            <h3 className="text-xl font-black mb-6 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Recent Messages</h3>
            <div className="space-y-6 relative z-10">
              {[1, 2].map(m => (
                <div key={m} className="flex items-start gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-brand-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{isTutor ? 'Student_Sarah' : 'Tutor_Sarah'} (Calc 101)</p>
                    <p className="text-xs text-brand-secondary truncate">"Hey! Did you understand chapter 4?"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-secondary/10 relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-primary/5 blur-2xl rounded-full translate-x-12 translate-y-12" />
             <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-brand-primary" /> Support Portal</h3>
             <p className="text-xs font-semibold text-brand-primary opacity-60 leading-relaxed mb-8">
               Need help with a session, payment, or verification? Contact the Tutoring Administration directly.
             </p>
             <Link href="/support" className="w-full py-4 bg-brand-dark text-white rounded-2xl block text-center font-black text-xs uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg active:scale-95">
                Open Support Ticket
              </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
