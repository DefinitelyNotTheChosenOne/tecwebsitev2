'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, RefreshCcw, Landmark, 
  History, DollarSign, ArrowRight, ShieldCheck, 
  User, Activity, ShieldX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function EscrowActionCenter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth');
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.role !== 'admin') return router.push('/');
          fetchEscrowSessions();
        });
    });
  }, [router]);

  const fetchEscrowSessions = async () => {
    setLoading(true);
    // Mocking escrow hold/dispute data
    setSessions([
      { id: "TX-4001", amount: 145.00, status: "escrow_hold", student: "Sarah J.", tutor: "Artem S.", daysLeft: 2, note: "Pending student confirmation" },
      { id: "TX-4002", amount: 200.00, status: "disputed", student: "Sarah J.", tutor: "John D.", daysLeft: -1, note: "Figma source file missing" },
      { id: "TX-4003", amount: 50.00, status: "escrow_hold", student: "Sarah J.", tutor: "Artem S.", daysLeft: 5, note: "Session in progress" },
    ]);
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12">
      <header className="mb-16">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-colors mb-4 uppercase text-xs font-black tracking-widest group">
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard
        </Link>
        <h1 className="text-5xl font-black tracking-tight flex items-center gap-4">
           Escrow <span className="text-brand-primary">Action Center</span>
           <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">₱4,240.00 PENDING</div>
        </h1>
        <p className="text-brand-secondary font-medium uppercase tracking-[4px] text-[10px] mt-2">Financial Operations & Fund Disbursement</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Transaction Feed */}
        <div className="xl:col-span-1 space-y-4">
           <div className="p-4 border-b border-white/5 mb-4 px-6 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Pending Pool</span>
              <History className="w-4 h-4 text-brand-secondary" />
           </div>
           {sessions.map((session) => (
             <motion.button 
               key={session.id}
               onClick={() => setSelectedSession(session)}
               className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedSession?.id === session.id ? 'bg-brand-primary/10 border-brand-primary/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
             >
                <div className="flex justify-between items-start mb-3">
                   <h3 className="text-sm font-black uppercase tracking-widest text-white">{session.id}</h3>
                   <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${session.status === 'disputed' ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-brand-secondary'}`}>{session.status}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-2xl font-black text-brand-primary italic">₱{session.amount}</span>
                   <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{session.daysLeft} Days Remain</span>
                </div>
             </motion.button>
           ))}
        </div>

        {/* Action Terminal */}
        <div className="xl:col-span-3">
           <AnimatePresence mode="wait">
              {selectedSession ? (
                <motion.div 
                  key={selectedSession.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl h-full flex flex-col"
                >
                   <div className="flex justify-between items-start mb-16">
                      <div className="flex items-center gap-8">
                         <div className="w-24 h-24 bg-brand-primary rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(82,109,130,0.5)]">
                            <Landmark className="w-12 h-12 text-brand-dark" />
                         </div>
                         <div>
                            <span className="text-sm font-black text-brand-primary uppercase tracking-[4px] mb-2 block">System Disbursment Tunnel</span>
                            <h2 className="text-5xl font-black">Authorize Transfer</h2>
                         </div>
                      </div>
                      <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] text-center border-dashed">
                         <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-2 block">Release Amount</span>
                         <span className="text-4xl font-black italic text-brand-primary">₱{selectedSession.amount}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-12 mb-16 px-4">
                      <div className="flex flex-col gap-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Sender (Student)</span>
                         <div className="flex items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/5 transition-all hover:bg-white/10 group">
                            <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center font-black group-hover:scale-110 transition-transform">S</div>
                            <div>
                               <p className="font-bold text-lg">{selectedSession.student}</p>
                               <p className="text-[10px] font-mono text-brand-secondary">sarah.j@student.edu</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col gap-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Beneficiary (Tutor)</span>
                         <div className="flex items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/5 transition-all hover:bg-white/10 group">
                            <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center font-black group-hover:scale-110 transition-transform">T</div>
                            <div>
                               <p className="font-bold text-lg">{selectedSession.tutor}</p>
                               <p className="text-[10px] font-mono text-brand-secondary">artem.s@pro-tutoring.com</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-black/20 p-8 rounded-[2rem] border border-white/5 mb-16">
                      <div className="flex items-center gap-3 mb-4">
                         <Activity className="w-4 h-4 text-brand-primary" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Contract Status Report</span>
                      </div>
                      <p className="text-brand-secondary text-sm font-medium leading-relaxed italic">
                         "Internal Analysis: {selectedSession.note}. Account verification successful. Escrow period compliance met. Waiting for manual override authorization."
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <button className="py-8 bg-white/5 hover:bg-red-500 hover:text-brand-dark transition-all rounded-[2.5rem] font-black uppercase tracking-[3px] text-xs border border-white/10 hover:border-red-500 shadow-2xl flex items-center justify-center gap-4 group">
                         <ShieldX className="w-6 h-6 group-hover:scale-110 transition-transform" /> Void & Refund Buyer
                      </button>
                      <button className="py-8 bg-brand-primary hover:bg-brand-secondary text-brand-dark hover:text-white transition-all rounded-[2.5rem] font-black uppercase tracking-[3px] text-xs shadow-[0_30px_60px_-10px_rgba(82,109,130,0.4)] flex items-center justify-center gap-4 group">
                         <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" /> Authorize Fund Release
                      </button>
                   </div>
                </motion.div>
              ) : (
                <div className="bg-white/5 border border-white/5 border-dashed rounded-[3rem] p-40 text-center flex flex-col items-center justify-center h-full opacity-30">
                   <Landmark className="w-20 h-20 mb-8 text-brand-secondary" />
                   <h2 className="text-2xl font-black uppercase mb-4">Financial Protocol: Idle</h2>
                   <p className="text-xs font-black uppercase tracking-widest text-brand-secondary">Select an active transaction from the pending pool for dispersal control</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
