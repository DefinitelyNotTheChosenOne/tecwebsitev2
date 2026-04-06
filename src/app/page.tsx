'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Monitor, PlusCircle, LogIn, 
  LogOut, Star, MessageSquare, ChevronDown, Globe, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [supportThreadCount, setSupportThreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchSupportCount();
      }
    });
    fetchServices();
  }, []);

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
      .select('full_name, role')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
      // SaaS Auto-Redirect: Never show the marketing page to logged-in users
      router.push(data.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*');
    if (data && data.length > 0) setServices(data);
    else setServices(fallbackServices);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
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

          {/* New High-Density Middle Nav (Hidden for Admins) */}
          {profile?.role !== 'admin' && (
            <div className="hidden xl:flex items-center gap-8 text-[11px] font-black uppercase tracking-[2px] text-brand-secondary/80">
              <div className="relative group/subjects">
                <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors pb-4 -mb-4">
                  Subjects <ChevronDown className="w-3 h-3 group-hover/subjects:rotate-180 transition-transform" />
                </div>
                
                <div className="absolute top-full left-0 mt-6 w-64 bg-[#0f172a] border border-white/10 rounded-3xl p-3 opacity-0 invisible group-hover/subjects:opacity-100 group-hover/subjects:visible transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col z-[100] transform translate-y-2 group-hover/subjects:translate-y-0 before:absolute before:-top-6 before:left-0 before:w-full before:h-6 before:bg-transparent">
                  <span className="text-[9px] text-brand-secondary font-black uppercase tracking-[3px] px-4 py-2 border-b border-white/5 mb-2 block">Top Programs</span>
                  {['Advanced Calculus', 'Computer Science', 'Pre-Med & Nursing', 'Constitutional Law', 'Organic Chemistry', 'Physics Engineering'].map((subj) => (
                    <Link key={subj} href={`/subjects/${subj.toLowerCase().replace(/ /g, '-')}`} className="px-4 py-3 hover:bg-white/5 rounded-xl text-xs font-bold text-white transition-colors">{subj}</Link>
                  ))}
                  <div className="my-2 border-t border-white/5" />
                  <Link href="/subjects" className="px-4 py-3 bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-brand-dark rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between group/view">
                    View All <ArrowRight className="w-3 h-3 group-hover/view:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              <Link href="/help-wanted" className="hover:text-white transition-colors">
                Help Wanted
              </Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Globe className="w-3.5 h-3.5" /> EN
              </div>
              <Link href="/services/new" className="hover:text-brand-primary transition-colors italic">Become a Tutor</Link>
            </div>
          )}

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
                  href={profile?.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                  className="flex flex-col items-end mr-2 hover:opacity-70 transition-opacity cursor-pointer group"
                >
                   <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none mb-1 flex items-center gap-2">
                     Welcome back <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </span>
                   <span className="text-sm font-bold text-white tracking-tight">{profile?.full_name || 'User'}</span>
                </Link>

                <div className="flex items-center gap-4">
                  <Link href="/support" className="flex items-center gap-2 text-brand-secondary hover:text-white transition-colors group relative pr-4">
                    <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                    <span className="hidden lg:inline">Customer Support</span>
                    {supportThreadCount > 0 && (
                      <AnimatePresence>
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-[#0f172a]"
                        >
                          {supportThreadCount >= 10 ? '9+' : supportThreadCount}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </Link>
                  <div className="h-4 w-px bg-white/10" />
                  <Link href="/services/new" className="flex items-center gap-2 text-brand-secondary hover:text-white transition-colors group">
                    <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Post Service
                  </Link>
                  <div className="h-4 w-px bg-white/10" />
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" /> Sign Out
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
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-block px-5 py-2 bg-white/5 border border-white/5 backdrop-blur-xl rounded-full mb-10"
          >
            <span className="text-[10px] font-black uppercase tracking-[4px] text-brand-secondary/80">The Future of Tutoring</span>
          </motion.div>
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
      
      {/* Services Grid with Scroll Reveal */}
      <main className="px-10 pb-40 relative z-10 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1, margin: "-10px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-16 px-4">
            <h2 className="text-3xl font-black flex items-center gap-4 uppercase tracking-tighter">
              <Layout className="text-brand-primary w-8 h-8" /> Top Rated <span className="text-brand-primary italic">Tutors</span>
            </h2>
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
          {services.map((service, i) => (
            <motion.div 
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.9, y: 20 },
                show: { opacity: 1, scale: 1, y: 0 }
              }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="bg-white/5 border border-white/5 rounded-[2.5rem] p-4 group hover:bg-white/[0.08] transition-all cursor-pointer relative overflow-hidden flex flex-col"
            >
              <div className="h-56 bg-brand-dark rounded-[2rem] mb-6 flex items-center justify-center overflow-hidden border border-white/5">
                 <Monitor className="w-16 h-16 text-brand-primary opacity-20" />
              </div>
              
              <div className="px-4 pb-4 flex-1 flex flex-col">
                <span className="text-[10px] font-black uppercase text-brand-primary tracking-[2px] mb-2 block">{service.category}</span>
                <h3 className="text-2xl font-bold mb-4 line-clamp-2 leading-tight tracking-tight group-hover:text-brand-primary transition-colors">{service.title}</h3>
                
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-brand-primary fill-brand-primary" />
                    <span className="font-bold text-sm">4.9</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-brand-secondary tracking-widest uppercase mb-1">Starting At</span>
                    <span className="text-2xl font-black italic">${service.price ?? '49'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </main>
  </div>
  );
}

const fallbackServices = [
  { title: "Advanced Calculus & Linear Algebra Mentoring", category: "Mathematics", price: 45 },
  { title: "Data Structures & Algorithms in Python/C++", category: "Coding", price: 50 },
  { title: "Nursing Case Studies & Pharmacology Review", category: "Nursing", price: 35 },
  { title: "Constitutional Law & Legal Writing Help", category: "Law", price: 60 },
  { title: "AP Physics 1 & 2 Exam Preparation", category: "Physics", price: 40 },
  { title: "Organic Chemistry Mechanisms & Synthesis", category: "Chemistry", price: 45 }
];
