'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, DollarSign, Clock, ArrowRight, BookOpen, User } from 'lucide-react';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';

export default function HelpWantedBoard() {
  const [activeFilter, setActiveFilter] = useState('All');

  // Mock data representing database 'help_requests' table
  const openRequests = [
    {
      id: "REQ-4029",
      student: "User_491",
      title: "Need a crash course on AP Calculus Integrals",
      subject: "Mathematics",
      description: "I have a midterm on Friday. I need someone to patiently walk me through area under a curve and volume by cross-sections.",
      budget: 45,
      urgency: "High",
      postedAt: "10 mins ago"
    },
    {
      id: "REQ-4030",
      student: "NursingStudent_J",
      title: "Help understanding Pharmacology Case Studies",
      subject: "Nursing",
      description: "Struggling to connect drug classes with patient symptoms in my latest case study assignment. Looking for an upperclassman.",
      budget: 30,
      urgency: "Medium",
      postedAt: "1 hr ago"
    },
    {
      id: "REQ-4031",
      student: "CodeNewbie101",
      title: "C++ Pointers and Memory Leaks Debugging",
      subject: "Computer Science",
      description: "My homework assignment keeps throwing a seg fault. Need a tutor to hop on a call and explain memory management.",
      budget: 60,
      urgency: "High",
      postedAt: "3 hrs ago"
    },
    {
      id: "REQ-4032",
      student: "LawPrepper",
      title: "Constitutional Law Exam Prep - Commerce Clause",
      subject: "Law",
      description: "Looking for a law student to help me outline cases related to the Commerce Clause for my finals.",
      budget: 50,
      urgency: "Medium",
      postedAt: "5 hrs ago"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden pt-24 pb-32 px-6">
        
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-16 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10 block">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black tracking-tighter mb-8 hover:scale-105 transition-transform group">
                Tutor<span className="text-brand-primary">Match</span>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse mt-3" />
              </Link>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-4">
                Help <span className="text-brand-primary italic">Wanted</span>
              </h1>
              <p className="text-brand-secondary text-lg font-medium max-w-xl">
                Browse real-time requests from students needing immediate help. Pitch your expertise, set your price, and start teaching.
              </p>
            </div>
            
            <Link 
              href="/help-wanted/new"
              className="px-8 py-4 bg-white text-brand-dark rounded-full font-black uppercase text-xs tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-xl"
            >
              Post a Request
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {['All', 'Mathematics', 'Computer Science', 'Nursing', 'Law', 'Chemistry'].map(filter => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeFilter === filter 
                    ? 'bg-brand-primary text-white border border-brand-primary' 
                    : 'bg-white/5 text-brand-secondary border border-white/10 hover:bg-white/10'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary" />
            <input 
              type="text" 
              placeholder="Search concepts..." 
              className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 text-sm text-white placeholder-brand-secondary focus:outline-none focus:border-brand-primary transition-colors font-medium"
            />
          </div>
        </div>

        {/* Requests Feed */}
        <main className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {openRequests.map((req, i) => (
              <motion.div 
                key={req.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="bg-white/5 border border-white/5 hover:border-brand-primary/30 rounded-[2rem] p-8 flex flex-col transition-all cursor-pointer group hover:bg-white/[0.08]"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-md bg-white/10 text-[10px] font-black uppercase text-brand-primary tracking-widest mb-3">
                      {req.subject}
                    </span>
                    <h3 className="text-xl font-bold leading-tight group-hover:text-brand-primary transition-colors mb-2">
                      {req.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary">
                      <User className="w-3 h-3" /> {req.student}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-1">Budget</span>
                    <span className="text-2xl font-black tracking-tight italic">${req.budget}</span>
                  </div>
                </div>

                <p className="text-sm text-brand-secondary/80 leading-relaxed mb-8 flex-1 line-clamp-3">
                  {req.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {req.postedAt}</span>
                    {req.urgency === 'High' && (
                      <span className="text-red-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Urgent
                      </span>
                    )}
                  </div>
                  
                  <button className="flex items-center gap-2 text-brand-primary font-black uppercase text-[10px] tracking-widest group-hover:translate-x-1 transition-transform">
                    Submit Bid <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </main>

      </div>
    </PageTransition>
  );
}
