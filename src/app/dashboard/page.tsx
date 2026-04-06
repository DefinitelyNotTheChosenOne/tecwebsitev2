'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MessageSquare, Heart, Clock, ChevronRight, Shield, HelpCircle, Send, FileText } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const activeSessions = [
    { id: "SESS-8821", subject: "Advanced Calculus Mentoring", status: "In Progress", tutor: "Alex M.", price: 45, date: "Apr 12" }
  ];

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark overflow-x-hidden">
      {/* Header Area */}
      <motion.div 
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-dark text-white pt-20 pb-32 px-6 shadow-2xl rounded-b-[3rem]"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight">My <span className="text-brand-secondary">Dashboard</span></h1>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-dark bg-brand-primary" />)}
              </div>
              <span className="text-sm font-bold text-brand-light/60 uppercase tracking-widest">3 active conversations</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-xl">Browse Tutors</Link>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions Integration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <Link href="/blog/new" className="bg-white p-6 rounded-3xl shadow-sm border border-brand-secondary/5 hover:border-brand-primary/30 transition-all flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
              <h4 className="font-black text-sm text-brand-dark mb-1">Create Mini-Lesson</h4>
              <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold">Educational Blog</p>
            </Link>
          </div>

          <div className="flex items-center justify-between pt-4">
            <h2 className="text-2xl font-black flex items-center gap-2"><ShoppingBag className="text-brand-primary" /> Active Sessions</h2>
          </div>
          
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-6"
          >
            {activeSessions.map((sessionData) => (
              <motion.div 
                key={sessionData.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 }
                }}
                whileHover={{ scale: 1.01, x: 5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-brand-secondary/5 group hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center text-brand-primary">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-brand-secondary tracking-widest uppercase">{sessionData.id}</span>
                      <h3 className="text-xl font-bold text-brand-dark mt-1">{sessionData.subject}</h3>
                      <p className="text-sm font-medium text-brand-primary mt-1">Tutor: <span className="font-bold">{sessionData.tutor}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-brand-light">
                    <div className="text-right">
                      <span className="block text-[10px] font-black text-brand-secondary tracking-widest uppercase">Price</span>
                      <span className="text-xl font-black text-brand-dark">${sessionData.price}</span>
                    </div>
                    <ChevronRight className="text-brand-light group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
                    <p className="font-bold text-sm truncate">Tutor_Sarah (Calc 101)</p>
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

