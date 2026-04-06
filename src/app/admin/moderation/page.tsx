'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, ShieldX, CheckCircle, 
  ArrowLeft, RefreshCcw, Layout, 
  MessageSquare, User, Activity, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ModerationQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth');
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.role !== 'admin') return router.push('/');
          fetchModerationItems();
        });
    });
  }, [router]);

  const fetchModerationItems = async () => {
    setLoading(true);
    // Mocking some items for now, ideally this would be from 'moderation_queue' table
    setItems([
      { id: "FL-101", type: "Flagged Message", context: "Potential PII sharing in pre-payment tunnel", user: "John D.", timestamp: "2m ago", priority: "high", content: "Hey, can we just move to WhatsApp? Here's my number: +1-555-0199" },
      { id: "FL-102", type: "Disputed Session", context: "Deliverable doesn't include source Figma file", user: "Sarah J.", timestamp: "15m ago", priority: "medium", content: "The tutor promised the .fig file in the description, but only sent a JPG after I paid the escrow." },
      { id: "FL-103", type: "Keyword Trigger", context: "Automated scan: Policy Violation #14", user: "Anonymous", timestamp: "1h ago", priority: "low", content: "I'll give you a discount if you pay me directly via PayPal instead of the platform." },
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
           Moderation <span className="text-brand-primary">Queue</span>
           <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-1 rounded-full text-xs animate-pulse">3 Live Alerts</div>
        </h1>
        <p className="text-brand-secondary font-medium uppercase tracking-[4px] text-[10px] mt-2">Active Surveillance & Policy Enforcement</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Left Column: Alert List */}
        <div className="xl:col-span-1 space-y-4">
           {items.map((item) => (
             <motion.button 
               key={item.id}
               onClick={() => setSelectedItem(item)}
               className={`w-full text-left p-6 rounded-[2rem] border transition-all relative overflow-hidden group ${selectedItem?.id === item.id ? 'bg-brand-primary/10 border-brand-primary/50 border shadow-[0_0_40px_rgba(82,109,130,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
             >
                <div className={`absolute left-0 top-0 w-1 h-full ${item.priority === 'high' ? 'bg-red-500' : 'bg-brand-secondary'}`} />
                <div className="flex justify-between items-start mb-3">
                   <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary">{item.type}</span>
                   <span className="text-[9px] font-mono text-white/20">{item.timestamp}</span>
                </div>
                <h3 className="text-sm font-black uppercase mb-1">{item.id}</h3>
                <p className="text-[10px] text-brand-secondary font-bold line-clamp-1">{item.context}</p>
             </motion.button>
           ))}
        </div>

        {/* Right Column: Context Snapshot & Controls */}
        <div className="xl:col-span-3">
           <AnimatePresence mode="wait">
              {selectedItem ? (
                <motion.div 
                  key={selectedItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl h-full flex flex-col"
                >
                   <div className="flex justify-between items-start mb-12">
                      <div className="flex items-center gap-6">
                         <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-4 border-brand-dark shadow-2xl ${selectedItem.priority === 'high' ? 'bg-red-500 text-brand-dark' : 'bg-brand-primary text-brand-dark'}`}>
                            <ShieldAlert className="w-10 h-10" />
                         </div>
                         <div>
                            <span className="text-[10px] font-black tracking-[4px] text-brand-secondary uppercase mb-2 block">{selectedItem.type}</span>
                            <h2 className="text-4xl font-black">{selectedItem.id}: Context Snapshot</h2>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-1">Assigned Target</span>
                         <span className="text-lg font-black text-white">{selectedItem.user}</span>
                      </div>
                   </div>

                   <div className="bg-black/40 border border-white/5 rounded-[2rem] p-10 flex-1 mb-10 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-3xl opacity-20" />
                      <div className="flex items-center gap-3 mb-6">
                         <Activity className="w-4 h-4 text-brand-primary" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Raw Transmission Context</span>
                      </div>
                      <p className="text-xl font-bold leading-relaxed text-zinc-300">
                         "{selectedItem.content}"
                      </p>
                      
                      <div className="mt-12 flex gap-4">
                         <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase text-brand-secondary">IP: 192.168.1.1</div>
                         <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase text-brand-secondary">LAT: 34.0522</div>
                         <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase text-brand-secondary">LNG: -118.2437</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-6">
                      <button className="py-6 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-primary/50 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                         <ShieldCheck className="w-5 h-5 text-green-400" /> Dismiss Case
                      </button>
                      <button className="py-6 bg-white/5 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/40 text-orange-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                         <AlertTriangle className="w-5 h-5" /> Evidence Request
                      </button>
                      <button className="py-6 bg-red-500 hover:bg-red-600 text-brand-dark font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-5px_rgba(239,68,68,0.3)]">
                         <ShieldX className="w-5 h-5" /> Revoke access
                      </button>
                   </div>
                </motion.div>
              ) : (
                <div className="bg-white/5 border border-white/5 border-dashed rounded-[3rem] p-40 text-center flex flex-col items-center justify-center h-full opacity-40">
                   <ShieldAlert className="w-20 h-20 mb-8 text-brand-secondary" />
                   <h2 className="text-2xl font-black uppercase mb-4">Command Awaiting Input</h2>
                   <p className="text-xs font-black uppercase tracking-widest text-brand-secondary">Select an alert item from the queue to review context snapshots</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
