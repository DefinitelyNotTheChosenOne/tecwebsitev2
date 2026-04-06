'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, Filter, 
  Clock, MapPin, DollarSign, 
  ChevronRight, Bookmark, ArrowUpRight,
  TrendingUp, Zap, Sparkles, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function HelpWantedFeed() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('help_requests')
        .select(`
          *,
          profiles:student_id (full_name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      setRequests(data || []);
      setLoading(false);
    };

    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12 font-sans selection:bg-brand-primary selection:text-brand-dark overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary blur-[160px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900 blur-[160px] rounded-full" />
      </div>

      <header className="max-w-6xl mx-auto mb-16 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mt-8">
           <div>
              <div className="flex items-center gap-3 mb-4">
                 <TrendingUp className="w-5 h-5 text-brand-primary" />
                 <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-primary">Live Marketplace Feed</span>
              </div>
              <h1 className="text-6xl font-black italic tracking-tighter leading-none mb-2">Available <span className="text-brand-primary">Bids</span></h1>
              <p className="text-brand-secondary font-medium tracking-tight text-sm px-1">Browse active requests and fire off your expert bids.</p>
           </div>
           
           <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-3xl">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
                 <input className="bg-transparent border-none py-3 pl-12 pr-6 rounded-2xl focus:ring-0 text-sm font-bold w-full md:w-64 placeholder-brand-secondary" placeholder="Search by subject..." />
              </div>
              <button className="p-3 bg-brand-primary text-brand-dark rounded-2xl hover:scale-105 transition-transform"><Filter className="w-5 h-5" /></button>
           </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Left Side: The Feed */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                 <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
               <div className="h-96 flex flex-col items-center justify-center text-center opacity-40">
                  <Zap className="w-16 h-16 mb-4 text-brand-secondary" />
                  <h3 className="text-2xl font-black uppercase italic">Marketplace idle</h3>
                  <p className="text-sm font-bold">No active requests found in the current sector.</p>
               </div>
            ) : requests.map((req, i) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] p-8 md:p-10 rounded-[3rem] transition-all group relative overflow-hidden shadow-2xl"
              >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-1.5 bg-brand-primary text-brand-dark rounded-full text-[10px] font-black uppercase tracking-widest leading-none shadow-[0_0_20px_rgba(82,109,130,0.4)]">{req.subject}</span>
                        <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Latest Request</span>
                      </div>
                      <h3 className="text-3xl font-black italic tracking-tight mb-4 leading-none group-hover:text-brand-primary transition-colors">{req.title}</h3>
                      <p className="text-brand-secondary text-sm leading-relaxed mb-8 line-clamp-2 font-medium max-w-2xl">{req.description}</p>
                      <div className="flex items-center gap-6 mt-auto">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary"><MapPin className="w-4 h-4" /> Global Tunnel</div>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <div className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase">Student: {req.profiles?.full_name || 'Verified User'}</div>
                      </div>
                   </div>

                   <div className="flex flex-col items-end gap-6 w-full md:w-auto h-full justify-between pb-2">
                       <div className="text-right">
                          <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-[3px] mb-2">Budget Target</span>
                          <span className="text-4xl font-black tracking-tight italic text-brand-primary shadow-brand-primary/20">₱{req.budget}</span>
                       </div>
                       <Link 
                        href={`/help-wanted/${req.id}`}
                        className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 hover:bg-brand-primary hover:text-brand-dark hover:border-brand-primary rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 group/btn"
                       >
                         Express Interest <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                       </Link>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right Side: Market Stats */}
        <aside className="lg:col-span-1 space-y-10">
           <div className="bg-brand-primary text-brand-dark p-10 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(82,109,130,0.5)] relative overflow-hidden group">
              <TrendingUp className="absolute top-4 right-4 w-6 h-6 opacity-20" />
              <h4 className="text-xs font-black uppercase tracking-[4px] mb-8">Quick Intel</h4>
              <div className="space-y-8 relative z-10">
                 <div>
                    <span className="text-5xl font-black italic block mb-1">₱42.1k</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Daily Pipeline</span>
                 </div>
                 <div>
                    <span className="text-5xl font-black italic block mb-1">104</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Bids In Progress</span>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-brand-primary mb-8 underline decoration-brand-primary/30 underline-offset-8">Trending Topics</h4>
              <div className="flex flex-wrap gap-3">
                 {['Calculus', 'Next.js', 'Phyton', 'React', 'Marketing'].map(tag => (
                    <button key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:border-brand-primary/50 transition-colors">{tag}</button>
                 ))}
              </div>
           </div>
        </aside>
      </main>

    </div>
  );
}
