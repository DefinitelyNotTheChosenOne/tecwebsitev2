'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, Filter, User, 
  MessageCircle, Star, DollarSign,
  ChevronRight, RefreshCcw, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubjectMarketFeed() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRedirected = searchParams.get('redirected') === 'true';

  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [targetTutor, setTargetTutor] = useState<any>(null);

  const [sentRequests, setSentRequests] = useState<string[]>([]);

  useEffect(() => {
    fetchSpecialists();
    if (isRedirected) {
      setShowWelcome(true);
    }
  }, [slug, isRedirected]);

  const fetchSpecialists = async () => {
    if (!slug) return;
    setLoading(true);
    
    // Map slug to Name (Simple Case-Mapping for now)
    const formattedName = slug.toString().split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    setSubjectName(formattedName);

    // Fetch teachers who have this subject in their skills array
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'seller')
      .contains('skills', [formattedName]);

    if (!error) {
      setTutors(profiles || []);
    }
    setLoading(false);
  };

  const startTunnel = async (tutor: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
      return;
    }

    setTargetTutor(tutor);
    setIsWaiting(true);

    try {
      // 1. Check if a room already exists
      let { data: room, error: findErr } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('student_id', session.user.id)
        .eq('tutor_id', tutor.id)
        .maybeSingle();

      if (findErr) throw findErr;

      // 2. Create if not exists
      if (!room) {
        const { data: newRoom, error: createErr } = await supabase
          .from('chat_rooms')
          .insert({
            student_id: session.user.id,
            tutor_id: tutor.id
          })
          .select()
          .single();
        
        if (createErr) throw createErr;
        room = newRoom;
      }

      // 3. Send opening signal
      const { error: msgErr } = await supabase.from('chat_messages').insert({
        room_id: room.id,
        sender_id: session.user.id,
        content: `SIGNAL INITIATED: Student is requesting a ${subjectName} session.`
      });

      if (msgErr) throw msgErr;

      // 4. Mark as sent locally
      if (!sentRequests.includes(tutor.id)) {
        setSentRequests([...sentRequests, tutor.id]);
      }
      
      (window as any)._latestTunnelId = room.id;

    } catch (err: any) {
      console.error("Tunnel Error Intelligence:", err.message || err);
      alert(`Critical Connection Failure: ${err.message || 'Unknown Protocol Error'}`);
      setIsWaiting(false);
    }
  };

  const abortLatestTunnel = async () => {
    const tunnelId = (window as any)._latestTunnelId;
    if (tunnelId) {
      // In a real app, delete the room or messages. 
      // For now, we'll delete the room messages to clear the signal.
      await supabase.from('chat_messages').delete().eq('room_id', tunnelId);
      // We don't delete the room itself to preserve potential history, 
      // but we "dismiss" the UI state.
    }
    setIsWaiting(false);
    setTargetTutor(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12">
      {/* Tunnel Establishing Modal */}
      <AnimatePresence>
        {isWaiting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#0f172a]/95 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] max-w-lg w-full text-center relative shadow-2xl"
            >
               <button 
                onClick={() => setIsWaiting(false)}
                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all group"
               >
                  <RefreshCcw className="w-5 h-5 text-brand-secondary group-hover:text-white" />
               </button>

               <div className="relative w-32 h-32 mx-auto mb-12">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-brand-primary/30 rounded-full"
                  />
                  <div className="absolute inset-4 bg-brand-primary/10 border border-brand-primary/40 rounded-full flex items-center justify-center overflow-hidden text-brand-primary">
                     <User className="w-10 h-10 animate-pulse" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-brand-primary/20 rounded-full"
                  />
               </div>

               <span className="text-[10px] font-black uppercase tracking-[5px] text-brand-primary mb-4 block animate-pulse">Establishing secure connection</span>
               <h2 className="text-4xl font-black italic tracking-tighter leading-tight mb-6">
                  Inquiry sent to <span className="text-zinc-500 block not-italic mt-1 uppercase leading-none">{targetTutor?.full_name}</span>
               </h2>
               <p className="text-sm text-brand-secondary font-medium tracking-[1px] uppercase opacity-60 leading-relaxed mb-12">The specialist has been alerted. You can minimize this window and track the status in your Dashboard.</p>
               
               <div className="grid grid-cols-2 gap-6">
                  <button 
                  onClick={() => setIsWaiting(false)}
                  className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:bg-white/10 transition-all font-sans"
                  >
                     Minimize to Dashboard
                  </button>
                  <button 
                  onClick={abortLatestTunnel}
                  className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[3px] text-red-500/60 hover:bg-red-500 hover:text-white transition-all font-sans"
                  >
                     Abort Request
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject Welcome Portal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] max-w-xl w-full text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
               {/* Background Glow */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />
               
               <div className="w-24 h-24 bg-brand-primary/20 border border-brand-primary/40 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl animate-pulse">
                  <ShieldCheck className="w-12 h-12 text-brand-primary" />
               </div>

               <span className="text-[10px] font-black uppercase tracking-[5px] text-brand-primary mb-4 block animate-bounce">Academic clearance confirmed</span>
               <h2 className="text-5xl font-black italic tracking-tighter leading-none mb-6">
                  Target Locked: <span className="text-zinc-400 block not-italic mt-2">{subjectName} Market</span>
               </h2>
               <p className="text-lg text-brand-secondary/80 font-medium leading-relaxed mb-12">
                  Your identity has been manifest in the grid. You are now authorized to recruit elite specialists for mission tutoring.
               </p>

               <button 
                onClick={() => setShowWelcome(false)}
                className="w-full py-6 bg-brand-primary text-brand-dark rounded-3xl font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-5px_rgba(82,109,130,0.4)] hover:bg-white hover:scale-105 transition-all"
               >
                  Recruit Specialists
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent blur-3xl animate-pulse" />

      <header className="max-w-6xl mx-auto mb-20 relative z-10">
         <Link href="/subjects" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group mb-6">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> Back to Subject Directory
         </Link>
         <div className="flex flex-col md:flex-row items-end justify-between gap-10">
            <div>
               <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
                  {subjectName} <span className="text-brand-primary block not-italic font-black">Market Feed</span>
               </h1>
               <p className="text-brand-secondary font-medium uppercase tracking-[5px] text-[11px] mt-4">Discover Verified Elite Tutoring Specialists</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
               <ShieldCheck className="w-5 h-5 text-brand-primary" />
               <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{tutors.length} Active Specialists Found</p>
            </div>
         </div>
      </header>

      <main className="max-w-6xl mx-auto relative z-10">
         {tutors.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                 {tutors.map((tutor, idx) => (
                    <motion.div 
                      key={tutor.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white/5 border border-white/10 rounded-[3rem] p-10 hover:border-brand-primary/40 transition-all shadow-2xl relative overflow-hidden"
                    >
                       <div className="flex items-center gap-6 mb-8">
                          <div className="w-20 h-20 rounded-[2rem] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-3xl font-black text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-dark transition-all">
                             {tutor.full_name?.charAt(0)}
                          </div>
                          <div>
                             <h4 className="text-2xl font-black italic truncate">{tutor.full_name}</h4>
                             <div className="flex items-center gap-2 mt-1">
                                <Star className="w-3 h-3 text-brand-primary fill-brand-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Elite Specialist</span>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4 mb-10">
                          <p className="text-sm font-medium text-zinc-400 line-clamp-3 leading-loose italic">
                             {tutor.bio || "High-performance specialist manifesting academic excellence through targeted mentoring."}
                          </p>
                       </div>

                       <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl mb-10">
                          <div className="flex items-center gap-2">
                             <DollarSign className="w-4 h-4 text-brand-secondary" />
                             <span className="text-xl font-black italic">₱{tutor.hourly_rate}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">/hr</span>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <Link href={`/tutors/${tutor.id}`} className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-white/10 transition-all">
                             View Dossier
                          </Link>
                          {sentRequests.includes(tutor.id) ? (
                            <button 
                              className="px-5 py-4 bg-white/5 border border-brand-primary/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-brand-primary flex items-center justify-center gap-2 hover:bg-white/10 transition-all shadow-sm"
                            >
                               <RefreshCcw className="w-3 h-3 animate-spin" /> Awaiting Clearance
                            </button>
                          ) : (
                            <button 
                              onClick={() => startTunnel(tutor)}
                              className="px-5 py-4 bg-brand-primary text-brand-dark rounded-2xl text-[9px] font-black uppercase tracking-widest text-center shadow-xl hover:bg-white transition-all active:scale-95"
                            >
                               Start Tunnel
                            </button>
                          )}
                       </div>
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
         ) : (
           <div className="text-center py-40 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
              <Search className="w-20 h-20 text-zinc-800 mx-auto mb-8 opacity-20" />
              <h2 className="text-4xl font-black uppercase text-zinc-700 italic text-zinc-500">No Specialists Manifested</h2>
              <p className="text-brand-secondary font-medium uppercase tracking-[5px] text-[10px] mt-4">Try another academic market or post a "Help Wanted" mission.</p>
              <Link href="/subjects" className="mt-10 inline-block px-10 py-5 bg-brand-primary text-brand-dark rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                 Return to Directory
              </Link>
           </div>
         )}
      </main>
    </div>
  );
}
