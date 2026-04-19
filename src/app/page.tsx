'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Monitor, PlusCircle, LogIn, 
  LogOut, Star, MessageSquare, ChevronDown, 
  Globe, ArrowRight, User 
} from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [supportThreadCount, setSupportThreadCount] = useState(0);
  const [activeSubjects, setActiveSubjects] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchSupportCount();
      }
    });
    fetchServices();
    fetchActiveSubjects();
  }, []);

  const fetchActiveSubjects = async () => {
    const { data } = await supabase.rpc('get_active_subjects');
    if (data && data.length > 0) setActiveSubjects(data);
  };

  const fetchSupportCount = async () => {
    const { data } = await supabase.from('admin_messages').select('user_id');
    if (data) {
      const uniqueUsers = new Set(data.map(item => item.user_id));
      setSupportThreadCount(uniqueUsers.size);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role, avatar_url')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
      if (data.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (data.role === 'seller') {
        router.replace('/dashboard');
      }
    }
  };

  const fetchServices = async () => {
    // Fetch top-rated specialists (role: seller) instead of generic services
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'seller')
      .limit(6);
      
    if (data && data.length > 0) setServices(data);
    else setServices(fallbackServices);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white font-sans overflow-x-hidden">
      {/* Dynamic Navbar */}
      <nav className="border-b border-white/5 py-6 px-10 flex items-center justify-between sticky top-0 bg-[#0f172a]/80 backdrop-blur-3xl z-[100]">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-12"
        >
          <Link href="/" className="text-3xl font-black tracking-tighter hover:scale-105 transition-transform flex items-center gap-2">
            Tutor<span className="text-brand-primary">Match</span>
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse mt-3" />
          </Link>

          {/* New High-Density Middle Nav */}
          <div className="hidden xl:flex items-center gap-8 text-[11px] font-black uppercase tracking-[2px] text-brand-secondary/80">
            <Link href="#markets" className="hover:text-white transition-colors">Subjects</Link>
            <Link href={session ? "/help-wanted" : "/auth?mode=signup&redirect=/help-wanted"} className="hover:text-white transition-colors">Help Wanted</Link>
            {session && profile?.role !== 'seller' && (
              <Link href="/sessions" className="text-blue-400 hover:text-blue-300 transition-colors">My Sessions</Link>
            )}
            {!session && (
              <Link href="/auth?mode=signup&redirect=/dashboard" className="text-brand-primary/60 hover:text-brand-primary transition-colors italic">Become a Tutor</Link>
            )}
          </div>
        </motion.div>
        
        <div className="flex items-center gap-10">
          <AnimatePresence mode="wait">
            {!session ? (
              <motion.div 
                key="login"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.1, scale: 0.9 }}
              >
                <Link href="/auth" className="flex items-center gap-2 text-brand-secondary hover:text-white transition-colors group">
                  <LogIn className="w-5 h-5 group-hover:-translate-x-1" /> Join Now
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                key="signed-in"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-6"
              >
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-4 hover:opacity-70 transition-opacity cursor-pointer group bg-white/5 border border-white/10 p-2 pr-6 rounded-full"
                >
                   <div className="w-10 h-10 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-brand-primary">{profile?.full_name?.charAt(0)}</span>
                      )}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest leading-none mb-1">Authenticated</span>
                      <span className="text-sm font-bold text-white tracking-tight">{profile?.full_name || 'Specialist'}</span>
                   </div>
                </Link>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={handleSignOut}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400/70 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen flex flex-col justify-center items-center px-10 text-center overflow-hidden shrink-0 pb-20">
        <div className="max-w-4xl mx-auto text-center relative z-10 -mt-32">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-10 tracking-tighter leading-[0.9]"
          >
            Scale your <span className="text-brand-secondary">knowledge</span> with <span className="opacity-40">elite global</span> <span className="text-white">tutors</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-brand-secondary font-medium max-w-2xl mx-auto leading-relaxed"
          >
            A centralized platform for university and high school students. Find verified tutors for specialized subjects, or post a "Help Wanted" request.
          </motion.p>
        </div>
      </header>
      
      {/* Academic Market Grid with Scroll Reveal */}
      <main id="markets" className="px-10 pb-40 relative z-10 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1, margin: "-10px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-16 px-4">
            <h2 className="text-4xl font-black flex flex-col uppercase tracking-tighter italic leading-none">
              <span className="text-brand-primary not-italic text-[10px] tracking-[5px] mb-2">Institutional Mastery</span>
              Browse Academic <span className="text-brand-primary">Markets</span>
            </h2>
            <Link href="/subjects" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
               View Full Directory
            </Link>
          </div>

          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
          {(activeSubjects.length > 0 ? activeSubjects : fallbackSubjects).map((sub, i) => (
            <Link key={i} href={session ? `/subjects/${sub.slug}` : `/auth?redirect=/subjects/${sub.slug}`}>
              <motion.div 
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 20 },
                  show: { opacity: 1, scale: 1, y: 0 }
                }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="bg-white/5 border border-white/5 rounded-[3rem] p-10 group hover:bg-white/[0.08] transition-all cursor-pointer relative overflow-hidden flex flex-col h-[380px]"
              >
                <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mb-10 border border-white/5 group-hover:bg-brand-primary transition-all">
                   <Layout className="w-8 h-8 text-brand-primary opacity-50 group-hover:opacity-100 group-hover:text-brand-dark transition-all" />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-3xl font-black italic mb-4 leading-tight tracking-tighter group-hover:text-brand-primary transition-colors uppercase">{sub.name}</h3>
                  <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-10">{sub.description || sub.desc || 'Specialist Mentoring'}</p>
                  
                  <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary group-hover:text-white transition-colors">Enter Market</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform text-brand-primary" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </main>
  </div>
  );
}

const fallbackSubjects = [
  { name: 'Advanced Calculus', slug: 'advanced-calculus', desc: 'Precision Mathematical Mastery' },
  { name: 'Computer Science', slug: 'computer-science', desc: 'Elite Algorithmic Engineering' },
  { name: 'Pre-Med & Nursing', slug: 'pre-med-nursing', desc: 'Clinical Excellence Hub' },
  { name: 'Constitutional Law', slug: 'constitutional-law', desc: 'Civil Rights & Legal Theory' },
  { name: 'Organic Chemistry', slug: 'organic-chemistry', desc: 'Atomic Design & Mechanisms' },
  { name: 'Physics & Engineering', slug: 'physics-engineering', desc: 'Universal Mechanics & Synthesis' },
];

const fallbackServices = [
  { title: "Advanced Calculus & Linear Algebra Mentoring", category: "Mathematics", price: 45 },
  { title: "Data Structures & Algorithms in Python/C++", category: "Coding", price: 50 },
  { title: "Nursing Case Studies & Pharmacology Review", category: "Nursing", price: 35 },
  { title: "Constitutional Law & Legal Writing Help", category: "Law", price: 60 },
  { title: "AP Physics 1 & 2 Exam Preparation", category: "Physics", price: 40 },
  { title: "Organic Chemistry Mechanisms & Synthesis", category: "Chemistry", price: 45 }
];
