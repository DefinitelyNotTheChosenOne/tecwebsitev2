'use client';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Shield, Plus, Trash2, ArrowLeft, RefreshCcw, BookOpen
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import Link from 'next/link';

export default function AdminSubjectsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Subject Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth');
      } else {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => {
            setProfile(data);
            if (data?.role === 'admin') fetchSubjects();
            else setIsLoading(false);
          });
      }
    });
  }, [router]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('system_subjects').select('*').order('name');
    setSubjects(data || []);
    setIsLoading(false);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setIsSubmitting(true);
    
    const { error } = await supabase.from('system_subjects').insert({
      name, slug: slug.toLowerCase().replace(/\s+/g, '-'), description
    });

    if (error) {
      alert("Deployment Failed: " + error.message);
    } else {
      setName(''); setSlug(''); setDescription('');
      alert("Subject successfully deployed to global system.");
      fetchSubjects();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject from the system?")) return;
    await supabase.from('system_subjects').delete().eq('id', id);
    fetchSubjects();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin mb-4 delay-100" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white p-10 text-center">
        <Shield className="w-24 h-24 text-red-500 mb-8 animate-pulse" />
        <h1 className="text-6xl font-black mb-4 uppercase">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-12 overflow-x-hidden">
      <AdminHeader adminName={profile?.full_name || 'System Admin'} />

      <div className="max-w-6xl mx-auto space-y-12 mt-12">
        <div className="flex items-center gap-4">
           <Link href="/admin/dashboard" className="p-3 bg-white/5 hover:bg-brand-primary hover:text-brand-dark rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
           </Link>
           <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Global Subject Database</h1>
              <p className="text-brand-secondary text-xs uppercase tracking-widest font-bold mt-1">Manage disciplines available to specialists</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Add Subject Column */}
          <div className="lg:col-span-1">
             <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl sticky top-8 text-left">
                <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                   <Plus className="w-6 h-6 text-brand-primary" /> Deploy Subject
                </h2>
                
                <form onSubmit={handleAddSubject} className="space-y-6">
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-brand-secondary uppercase mb-2 block">Subject Name</label>
                     <input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value); }} required className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none transition-colors" placeholder="e.g. Advanced Calculus" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-brand-secondary uppercase mb-2 block">System Slug</label>
                     <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/50 focus:border-brand-primary outline-none transition-colors" placeholder="e.g. advanced-calculus" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-brand-secondary uppercase mb-2 block">Description</label>
                     <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none transition-colors h-24 resize-none" placeholder="Short description..." />
                   </div>
                   
                   <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-brand-primary text-brand-dark rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-secondary hover:text-white transition-all disabled:opacity-50">
                     {isSubmitting ? 'Deploying...' : 'Add to Global System'}
                   </button>
                </form>
             </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-2 space-y-4">
             {subjects.length === 0 ? (
               <div className="p-20 text-center border-2 border-dashed border-white/10 rounded-[2.5rem]">
                  <BookOpen className="w-12 h-12 text-brand-secondary/30 mx-auto mb-4" />
                  <p className="text-brand-secondary text-xs uppercase tracking-widest font-black">No subjects deployed in system yet.</p>
               </div>
             ) : (
               subjects.map(sub => (
                 <div key={sub.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between group hover:border-brand-primary/40 transition-colors">
                    <div>
                      <h3 className="text-lg font-black uppercase text-white mb-1">{sub.name}</h3>
                      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                         <span>Slug: {sub.slug}</span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-3 font-medium">{sub.description}</p>
                    </div>
                    <button onClick={() => handleDelete(sub.id)} className="p-4 bg-red-500/10 text-red-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                       <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
               ))
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
