'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Star, Clock, ShieldCheck, 
  BookOpen, Award, MessageSquare, ChevronRight,
  Globe, Mail, Edit2, Settings, Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function PublicTutorPortfolio() {
  const { id } = useParams();
  const [tutor, setTutor] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTunneling, setIsTunneling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Audit Current Session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    if (id) {
      supabase.from('profiles').select('*').eq('id', id).single()
        .then(({ data }) => {
          setTutor(data);
          setLoading(false);
        });
    }
  }, [id]);

  const handleStartTunnel = async () => {
    if (!currentUser) { router.push('/auth'); return; }
    setIsTunneling(true);
    try {
      // 1. Establish Secure Room
      const { data: room, error: roomErr } = await supabase
        .from('chat_rooms')
        .upsert({ tutor_id: tutor.id, student_id: currentUser.id }, { onConflict: 'tutor_id,student_id' })
        .select()
        .single();

      if (roomErr) throw roomErr;

      // 2. Broadcast Inbound Signal
      await supabase.from('notifications').insert({
        user_id: tutor.id,
        title: 'INBOUND HANDSHAKE SIGNAL',
        content: `${currentUser.email?.split('@')[0]} is initiating a command tunnel for your services.`,
        type: 'REQUEST',
        link: `/dashboard/session?room=${room.id}`
      });

      // 3. Optional: Initial Message
      await supabase.from('chat_messages').insert({
        room_id: room.id,
        sender_id: currentUser.id,
        content: `SIGNAL INITIATED: Student has entered the tunnel.`
      });

      // 4. Deploy User to Terminal
      router.push(`/sessions?room=${room.id}`);
    } catch (err) {
      console.error("Tunnel Failure:", err);
      alert("Encryption failure in tunnel initiation. Try again.");
    } finally {
      setIsTunneling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!tutor) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center text-white">
       <h1 className="text-4xl font-black mb-4 uppercase italic">Identity not found</h1>
       <p className="text-brand-secondary text-sm mb-12 uppercase tracking-widest font-black">This user has been deauthorized or does not exist.</p>
       <Link href="/" className="px-8 py-4 bg-brand-primary rounded-2xl font-black text-xs uppercase tracking-widest">Back to Marketplace</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-brand-primary selection:text-brand-dark">
      
      {/* Dynamic Header */}
      <div className="relative h-[300px] overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/20 to-[#0f172a] z-10" />
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent scale-[2] blur-3xl animate-pulse" />
         
         <div className="max-w-6xl mx-auto px-6 h-full flex items-end pb-12 relative z-20">
            <Link 
              href={currentUser?.id === tutor.id ? "/dashboard" : "/"} 
              className="absolute top-8 left-6 flex items-center gap-3 text-brand-secondary hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group"
            >
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> 
               {currentUser?.id === tutor.id ? "Back to Dashboard" : "Back to Discover"}
            </Link>

            <div className="flex flex-col md:flex-row items-end gap-10">
               <div className="w-40 h-40 rounded-[3rem] bg-brand-primary/20 border-4 border-brand-dark shadow-2xl relative overflow-hidden flex items-center justify-center group">
                  {tutor.avatar_url ? (
                    <img alt={tutor.full_name} src={tutor.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <span className="text-6xl font-black text-brand-primary uppercase">{tutor.full_name?.charAt(0) || 'T'}</span>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-brand-primary p-3 rounded-full border-2 border-brand-dark shadow-[0_0_20px_rgba(82,109,130,1)]">
                     <ShieldCheck className="w-5 h-5 text-brand-dark fill-brand-dark/20" />
                  </div>
               </div>
               <div className="flex-1 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/30 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-primary">Elite Specialist</span>
                     <div className="flex text-yellow-400 gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                     </div>
                  </div>
                  <div className="flex items-center gap-6 mb-4">
                     <h1 className="text-6xl font-black italic tracking-tighter leading-none uppercase">{tutor.full_name}</h1>
                     {currentUser?.id === tutor.id && (
                        <Link 
                          href="/dashboard/profile"
                          className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-primary hover:text-brand-dark transition-all group/edit shadow-2xl backdrop-blur-xl"
                          title="Reconfigure Public Dossier"
                        >
                           <Edit2 className="w-5 h-5 group-hover/edit:rotate-12 transition-transform" />
                        </Link>
                     )}
                  </div>
                  <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[3px] text-brand-secondary">
                     <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 140+ Hours Tutored</div>
                     <div className="flex items-center gap-2"><Award className="w-4 h-4" /> Top rated 2024</div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Main Content Tunnel */}
      <main className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-20">
         
         {/* Left Side: Intel & Portfolio */}
         <div className="lg:col-span-2 space-y-20">
            <section>
               <h2 className="text-xs font-black uppercase tracking-[5px] text-brand-primary mb-8 flex items-center gap-4">
                  Professional Bio <div className="h-[2px] bg-brand-primary/20 flex-1" />
               </h2>
               <p className="text-xl font-medium leading-[1.8] text-brand-secondary italic">
                  "{tutor.bio || "This tutor is currently finalizing their specialist dossier. Please inquire directly via the command tunnel for their full background and curriculum focus."}"
               </p>
            </section>

            {tutor.skills && tutor.skills.length > 0 && (
               <div className="space-y-8">
                  <h2 className="text-[10px] font-black uppercase tracking-[5px] text-brand-secondary flex items-center gap-6">
                     Domain Expertise <div className="h-[1px] bg-white/5 flex-1" />
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {tutor.skills.map((skill: string) => (
                        <div key={skill} className="bg-white/5 border border-white/5 p-8 rounded-[2rem] hover:border-brand-primary/20 transition-all group">
                           <BookOpen className="w-8 h-8 text-brand-secondary mb-6 group-hover:text-brand-primary transition-colors" />
                           <h4 className="text-xl font-black uppercase italic mb-1">{skill}</h4>
                           <span className="text-[9px] font-black text-brand-secondary uppercase tracking-widest">Specialized</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         {/* Right Side: Deployment Terminal */}
         <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl sticky top-12">
               <div className="mb-10 text-center">
                  <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-[4px] mb-4">Investment Protocol</span>
                  <div className="flex items-center justify-center gap-2">
                     <span className="text-5xl font-black italic">₱1,200</span>
                     <span className="text-xs font-black text-brand-secondary uppercase tracking-widest mt-4">/hr</span>
                  </div>
               </div>

               <div className="space-y-4 mb-10">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                     <span className="text-[9px] font-black uppercase text-brand-secondary">Availability</span>
                     <span className="text-[9px] font-black uppercase text-green-400">High Frequency</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                     <span className="text-[9px] font-black uppercase text-brand-secondary">Escrow</span>
                     <span className="text-[9px] font-black uppercase text-brand-primary">Secured</span>
                  </div>
               </div>

               <div className="space-y-4">
                  {currentUser?.id !== tutor.id && (
                    <button 
                      onClick={handleStartTunnel}
                      disabled={isTunneling}
                      className="w-full py-10 bg-brand-primary/20 border border-brand-primary/30 rounded-[2.5rem] font-black uppercase tracking-[3px] text-xs text-brand-primary flex items-center justify-center gap-4 hover:bg-brand-primary hover:text-brand-dark transition-all group shadow-[0_0_50px_-12px_rgba(var(--brand-primary-rgb),0.5)] active:scale-95 disabled:opacity-50"
                    >
                       <MessageSquare className={`w-6 h-6 ${isTunneling ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform`} /> 
                       {isTunneling ? 'Initiating Signal...' : 'Start Command Tunnel'}
                    </button>
                  )}
               </div>

               <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-3">
                  {tutor.website_url && (
                    <a href={tutor.website_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-brand-primary hover:text-brand-dark transition-all flex items-center gap-2 group">
                      <Globe className="w-4 h-4 text-brand-secondary group-hover:text-brand-dark transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Portfolio</span>
                    </a>
                  )}
                  {tutor.facebook_url && (
                    <a href={tutor.facebook_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-brand-primary hover:text-brand-dark transition-all flex items-center gap-2 group">
                      <Share2 className="w-4 h-4 text-brand-secondary group-hover:text-brand-dark transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Facebook</span>
                    </a>
                  )}
                  {tutor.public_email && (
                    <a href={`mailto:${tutor.public_email}`} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-brand-primary hover:text-brand-dark transition-all flex items-center gap-2 group">
                      <Mail className="w-4 h-4 text-brand-secondary group-hover:text-brand-dark transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                    </a>
                  )}
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
