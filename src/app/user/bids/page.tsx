'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Send, Clock, CheckCircle2, XCircle, 
  ChevronRight, ArrowLeft, RefreshCcw, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function BidTrackingTerminal() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          request:help_requests (
            subject,
            student:profiles (full_name)
          )
        `)
        .eq('tutor_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error) {
         setBids(data || []);
      }
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-400 border-green-500/20 bg-green-500/10';
      case 'rejected': return 'text-red-400 border-red-500/20 bg-red-500/10';
      default: return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12 selection:bg-brand-primary selection:text-brand-dark">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent blur-3xl animate-pulse" />
      
      <header className="max-w-6xl mx-auto mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
         <div>
            <Link href="/" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group mb-6">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> Dashboard
            </Link>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">Outgoing <span className="text-brand-primary block not-italic font-black">Offer Terminal</span></h1>
            <p className="text-brand-secondary font-medium uppercase tracking-[5px] text-[11px] mt-4">Tracking Your Active Sales Pipeline (₱)</p>
         </div>

         <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
            <Send className="w-5 h-5 text-brand-primary" />
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total Active Bids</p>
               <p className="text-xl font-black italic">{bids.filter(b => b.status === 'pending').length} Sent Missions</p>
            </div>
         </div>
      </header>

      <main className="max-w-6xl mx-auto relative z-10">
         {bids.length > 0 ? (
           <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                 {bids.map((bid, idx) => (
                    <motion.div 
                      key={bid.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-10 hover:border-brand-primary/40 transition-all shadow-2xl relative"
                    >
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                          <DollarSign className="w-6 h-6" />
                       </div>

                       <div className="flex-1 text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                             <h3 className="text-2xl font-black uppercase italic">{bid.request?.subject || 'Mystery Topic'}</h3>
                             <div className={`px-4 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(bid.status)}`}>
                                {bid.status}
                             </div>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600">Student Intelligence: <span className="text-white italic">{bid.request?.student?.full_name || 'Verified Requester'}</span></p>
                       </div>

                       <div className="text-center md:text-right px-10 border-x border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary mb-1">My Committed Rate</p>
                          <p className="text-4xl font-black italic text-white">₱{bid.proposed_rate}<span className="text-[10px] text-zinc-600 ml-1">/hr</span></p>
                       </div>

                       <Link 
                         href={`/help-wanted/${bid.request_id}`}
                         className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary hover:text-brand-dark transition-all flex items-center gap-3 group/btn"
                       >
                          Audit Original Request <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                       </Link>
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
         ) : (
           <div className="text-center py-40 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
              <XCircle className="w-20 h-20 text-zinc-800 mx-auto mb-8 opacity-20" />
              <h2 className="text-4xl font-black uppercase text-zinc-700 italic text-white/20">No active offers manifested</h2>
              <p className="text-brand-secondary font-medium uppercase tracking-[5px] text-[10px] mt-4">Your mission grid is empty. Hunt for students to grow your pipeline.</p>
              <Link href="/user/help-wanted" className="mt-10 inline-block px-10 py-5 bg-brand-primary text-brand-dark rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                 Manifest Your First Bid
              </Link>
           </div>
         )}
      </main>
    </div>
  );
}
