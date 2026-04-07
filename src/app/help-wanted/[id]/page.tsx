'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Clock, DollarSign, Send, 
  CheckCircle2, RefreshCcw, BookOpen, User,
  MessageCircle, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function BiddingTerminal() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [existingBid, setExistingBid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pitch, setPitch] = useState('');
  const [proposedRate, setProposedRate] = useState<string>('');

  useEffect(() => {
    fetchMissionDetails();
  }, [id]);

  const fetchMissionDetails = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
      return;
    }

    // Fetch Job Intellectual Property
    const { data: job, error } = await supabase
      .from('help_requests')
      .select('*, student:profiles(id, full_name)')
      .eq('id', id)
      .single();

    if (!error && job) {
      setRequest(job);
      setProposedRate(job.budget.toString());

      // Check if tutor already manifested an offer
      const { data: bid } = await supabase
        .from('bids')
        .select('*')
        .eq('request_id', id)
        .eq('tutor_id', session.user.id)
        .single();
      
      setExistingBid(bid);
    }
    setLoading(false);
  };

  const submitManifestBid = async () => {
    if (!pitch || !proposedRate) return;
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase
        .from('bids')
        .insert({
          request_id: id,
          tutor_id: session.user.id,
          proposed_rate: Number(proposedRate),
          message: pitch,
          status: 'pending'
        });

      if (!error) {
         fetchMissionDetails();
      }
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  if (!request) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-12 text-center">
       <ShieldAlert className="w-20 h-20 text-red-500 mb-8 opacity-20" />
       <h1 className="text-4xl font-black uppercase text-white/40 italic">Mission Dossier Not Found</h1>
       <Link href="/help-wanted" className="mt-8 text-brand-primary font-black uppercase tracking-widest text-[10px]">Return to Grid</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12 selection:bg-brand-primary selection:text-brand-dark overflow-x-hidden">
      {/* Cinematic Pulse */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent scale-[2] blur-3xl animate-pulse" />

      <header className="max-w-6xl mx-auto mb-16 relative z-10">
         <Link href="/help-wanted" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group mb-6">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> Back to Grid
         </Link>
         <div className="flex flex-col md:flex-row items-end justify-between gap-10">
            <div>
               <div className="px-5 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full inline-block text-[10px] font-black text-brand-primary tracking-widest uppercase italic mb-6">
                  LIVE MISSION Dossier
               </div>
               <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
                  {request.subject}
               </h1>
               <p className="text-brand-secondary font-medium uppercase tracking-[5px] text-[11px] mt-4 flex items-center gap-3">
                  Requester: <span className="text-white font-black italic">{request.student?.full_name}</span> 
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" /> 
                  Manifested: <span className="text-white font-black italic">{new Date(request.created_at).toLocaleDateString()}</span>
               </p>
            </div>
            
            <div className="text-right">
               <p className="text-[11px] font-black uppercase tracking-widest text-brand-secondary mb-1">Target Budget Protocol</p>
               <p className="text-6xl font-black italic text-brand-primary">₱{request.budget}<span className="text-xl text-zinc-600 ml-1">/hr</span></p>
            </div>
         </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16 relative z-10 pb-32">
         {/* Left Side: Mission Context */}
         <div className="lg:col-span-2 space-y-12">
            <section className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-all pointer-events-none">
                  <BookOpen className="w-64 h-64 text-white" />
               </div>
               <h2 className="text-[10px] font-black uppercase tracking-[5px] text-brand-secondary mb-8 flex items-center gap-4">
                  <MessageCircle className="w-4 h-4 text-brand-primary" /> Student Requirement Brief <div className="h-[1px] bg-white/5 flex-1" />
               </h2>
               <p className="text-2xl font-bold leading-relaxed text-zinc-300 italic">
                  "{request.description}"
               </p>
            </section>

            {/* Bidding Terminal (Only show if not already bid) */}
            <AnimatePresence mode="wait">
               {!existingBid ? (
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-10"
                  >
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary ml-1">Manifest Your Pitch</label>
                        <textarea 
                          value={pitch}
                          onChange={(e) => setPitch(e.target.value)}
                          placeholder="Explain your approach... why are you the best specialist for this mission?"
                          className="w-full bg-white/5 border border-white/5 p-10 rounded-[3rem] text-xl font-bold italic h-64 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all placeholder:text-zinc-700 outline-none resize-none shadow-2xl"
                        />
                     </div>

                     <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 border border-white/10 p-10 rounded-[3rem]">
                        <div className="flex-1 space-y-4 w-full">
                           <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary ml-1">Proposed Investment (₱/hr)</label>
                           <div className="relative group">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-brand-secondary italic">₱</span>
                              <input 
                                type="text"
                                value={proposedRate}
                                onChange={(e) => setProposedRate(e.target.value.replace(/\D/g, ''))}
                                placeholder="0"
                                className="w-full bg-white/5 border border-white/5 p-6 pl-14 rounded-[2rem] text-2xl font-black italic focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all placeholder:text-zinc-800 text-white"
                              />
                           </div>
                        </div>

                        <button 
                          onClick={submitManifestBid}
                          disabled={submitting || !pitch || !proposedRate}
                          className="px-12 py-8 bg-brand-primary text-brand-dark rounded-[2.5rem] font-black uppercase tracking-[3px] text-xs shadow-2xl transition-all active:scale-95 disabled:opacity-50 hover:bg-white flex items-center gap-4 group/submit"
                        >
                           {submitting ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6 group-hover/submit:translate-x-1" /> Submit manifested bid</>}
                        </button>
                     </div>
                  </motion.section>
               ) : (
                  <motion.section 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-500/5 border border-green-500/10 rounded-[3rem] p-12 flex flex-col items-center text-center space-y-6"
                  >
                     <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                        <CheckCircle2 className="w-10 h-10" />
                     </div>
                     <h2 className="text-3xl font-black uppercase italic tracking-tight">Bid Successfully Manifested</h2>
                     <p className="text-sm font-black text-green-500 uppercase tracking-widest leading-loose max-w-sm">
                        You have committed ₱{existingBid.proposed_rate}/hr to this mission. Stand by for student intelligence.
                     </p>
                     <Link href="/bids" className="mt-8 px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all inline-block">Audit Your Offers</Link>
                  </motion.section>
               )}
            </AnimatePresence>
         </div>

         {/* Right Side: Quick Stats/Safety */}
         <div className="space-y-10">
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary/20" />
               <h3 className="text-[10px] font-black uppercase tracking-[5px] text-brand-secondary flex items-center gap-3"><Clock className="w-4 h-4" /> Market Status</h3>
               
               <div className="space-y-6">
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                     <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Current Integrity Status</p>
                     <p className="text-sm font-black text-white italic uppercase tracking-widest">Active Negotiation Area</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                     <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Escrow Capability</p>
                     <p className="text-sm font-black text-brand-primary italic uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Fully Secured
                     </p>
                  </div>
               </div>
            </div>

            <div className="p-10 bg-brand-primary/10 border border-brand-primary/20 rounded-[3rem] relative overflow-hidden group">
               <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-brand-primary opacity-[0.05] rounded-full blur-3xl group-hover:scale-150 transition-all" />
               <h4 className="text-xs font-black uppercase italic text-brand-primary mb-4 flex items-center gap-3"><User className="w-4 h-4" /> Specialist Tip</h4>
               <p className="text-xs font-bold leading-relaxed text-zinc-400">
                  Students prioritize **Strategy over Price.** Explain exactly how you'll move their grade before discussing the ₱.
               </p>
            </div>
         </div>
      </main>
    </div>
  );
}
