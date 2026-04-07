'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, Clock, DollarSign, 
  ChevronRight, ArrowLeft, RefreshCcw, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketplaceDiscovery() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('help_requests')
      .select('*, student:profiles(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (!error) {
      setRequests(data);
    }
    setLoading(false);
  };

  const filteredRequests = requests.filter(req => 
    req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12 selection:bg-brand-primary selection:text-brand-dark overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent blur-3xl animate-pulse" />
      
      <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
         <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group mb-6">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> Dashboard
            </Link>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">Marketplace <span className="text-brand-primary block not-italic font-black">Discovery Hub</span></h1>
            <p className="text-brand-secondary font-medium uppercase tracking-[5px] text-[11px] mt-4">Hunting for Live Student Contracts (₱)</p>
         </div>

         <div className="flex gap-4">
            <div className="relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-brand-primary transition-colors" />
               <input 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search niches (e.g. Calculus, Nursing...)"
                 className="bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl w-80 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all outline-none"
               />
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto relative z-10">
         {filteredRequests.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                 {filteredRequests.map((request, idx) => (
                    <motion.div 
                      key={request.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white/5 border border-white/10 rounded-[3rem] p-10 hover:border-brand-primary/40 transition-all shadow-2xl relative overflow-hidden flex flex-col h-full"
                    >
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <BookOpen className="w-32 h-32 text-white" />
                       </div>

                       <div className="flex justify-between items-start mb-8 relative z-10">
                          <div className="px-5 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-black text-brand-primary tracking-widest uppercase italic">
                             # {request.subject}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                             <Clock className="w-3 h-3" /> {new Date(request.created_at).toLocaleDateString()}
                          </div>
                       </div>

                       <h3 className="text-3xl font-black uppercase mb-4 leading-tight italic group-hover:text-brand-primary transition-colors">
                          {request.description.length > 60 ? `${request.description.substring(0, 60)}...` : request.description}
                       </h3>

                       <div className="flex items-center gap-4 mb-8 pt-6 border-t border-white/5">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black uppercase text-brand-secondary border border-white/5">
                             {request.student?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Requester Intelligence</p>
                             <p className="text-sm font-black text-white italic">{request.student?.full_name || 'Anonymous Student'}</p>
                          </div>
                       </div>

                       <div className="mt-auto pt-8 flex items-center justify-between relative z-10">
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary mb-1">Target Budget</p>
                             <p className="text-3xl font-black italic text-white leading-none">₱{request.budget}<span className="text-xs text-zinc-600 ml-1">/hr</span></p>
                          </div>

                          <Link 
                            href={`/help-wanted/${request.id}`}
                            className="p-5 bg-brand-primary text-brand-dark rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl group/btn"
                          >
                             <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                       </div>
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
         ) : (
           <div className="text-center py-40 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
              <BookOpen className="w-20 h-20 text-zinc-800 mx-auto mb-8 opacity-20" />
              <h2 className="text-4xl font-black uppercase text-zinc-700 italic">No Contracts manifested yet</h2>
              <p className="text-brand-secondary font-medium uppercase tracking-[5px] text-[10px] mt-4">The grid is currently silent. Stand by for live requests.</p>
           </div>
         )}
      </main>
    </div>
  );
}
