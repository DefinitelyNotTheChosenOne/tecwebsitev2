'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Monitor, PlusCircle, LogIn, 
  LogOut, Star, MessageSquare 
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
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
    if (data) setProfile(data);
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
          className="text-2xl font-black italic tracking-tighter text-brand-primary"
        >
          FreelanceHub
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
                <div className="flex flex-col items-end mr-2">
                   <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none mb-1">Welcome back</span>
                   <span className="text-sm font-bold text-white tracking-tight">{profile?.full_name || 'User'}</span>
                </div>

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
      <header className="relative pt-32 pb-20 px-10 text-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] uppercase font-black tracking-widest mb-8">
            The Future of Freelancing
          </div>
          <h1 className="text-7xl font-black mb-8 leading-[0.95] tracking-tight">
            Scale your <span className="text-brand-primary">vision</span> with<br/> 
            elite global <span className="text-brand-secondary underline-offset-8">talent</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-brand-secondary font-medium tracking-wide leading-relaxed">
            Forget mediocre platforms. This is the Hub where deep technical expertise meets premium execution.
          </p>
        </motion.div>
      </header>

      {/* Services Grid */}
      <main className="max-w-7xl mx-auto px-10 pb-40">
        <div className="flex items-center justify-between mb-16 px-4">
          <h2 className="text-3xl font-black flex items-center gap-4">
            <Layout className="text-brand-primary w-8 h-8" /> Featured <span className="italic">Gigs</span>
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
      </main>
    </div>
  );
}

const fallbackServices = [
  { title: "Custom AI Agent Development using GPT-4o", category: "AI Development", price: 950 },
  { title: "High-End Architecture Visualization & 3D Rendering", category: "Interior Design", price: 340 },
  { title: "Next.js 15 Full-Stack SaaS Development", category: "Software Development", price: 1200 },
  { title: "Professional Video Editing for YouTube & Ads", category: "Video Editing", price: 150 },
  { title: "Luxury Brand Identity & Logo Suite", category: "Logo Design", price: 500 },
  { title: "Social Media Strategy & Content Growth", category: "Social Media Marketing", price: 290 }
];
