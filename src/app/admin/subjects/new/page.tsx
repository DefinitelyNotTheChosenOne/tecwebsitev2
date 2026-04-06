'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, RefreshCcw, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function CreateSubject() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [subjectName, setSubjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentSubjects, setRecentSubjects] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth');
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.role !== 'admin') return router.push('/');
          setProfile(data);
          setIsLoading(false);
          fetchRecentSubjects();
        });
    });
  }, [router]);

  const fetchRecentSubjects = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setRecentSubjects(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !profile) return;
    
    setIsSubmitting(true);
    // Auto-generate slug
    const slug = subjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { error } = await supabase.from('categories').insert({
      name: subjectName,
      slug: slug,
      created_by: profile.id
    });

    setIsSubmitting(false);

    if (!error) {
      setSuccess(true);
      setSubjectName('');
      fetchRecentSubjects();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Error adding subject. It might already exist.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-colors mb-12 uppercase text-xs font-black tracking-widest group">
         <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Command
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
           <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Tag className="w-8 h-8 text-brand-primary" />
           </div>
           <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Deploy Subject Market</h1>
           <p className="text-brand-secondary font-medium tracking-wide">Add a new academic category. This immediately activates a new channel for student Help Wanted requests and Tutor verifications.</p>
        </div>

        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl mb-12">
          <div className="mb-8">
            <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary mb-3">Discipline Name</label>
            <input 
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Advanced Thermodynamics"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-lg font-bold placeholder-white/20 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all outline-none"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !subjectName.trim()}
            className="w-full py-5 bg-brand-primary text-brand-dark rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-brand-secondary hover:text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-5 h-5" /> Deploy Market Category</>}
          </button>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-black uppercase tracking-widest text-center">
                Transmission Successful. Market Live.
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-widest text-brand-secondary px-4">Recently Deployed Markets</h3>
           {recentSubjects.map((sub, i) => (
             <div key={sub.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-sm tracking-tight">{sub.name}</span>
                <span className="text-[10px] font-mono text-white/40 bg-black/20 px-3 py-1 rounded-full">/{sub.slug}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
