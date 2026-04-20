'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  User, FileText, Upload, CheckCircle2, 
  ChevronLeft, Loader2, Link as LinkIcon, Trash2,
  AlertCircle, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
// We'll use the Next.js router
import { useRouter } from 'next/navigation';

export default function ProfileEditor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [systemSubjects, setSystemSubjects] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return; }
      
      Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('system_subjects').select('*').order('name')
      ]).then(([ { data: prof }, { data: subjs } ]) => {
        setProfile(prof || {});
        setSystemSubjects(subjs || []);
        setLoading(false);
      });
    });
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase.from('profiles')
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        skills: profile.skills || []
      })
      .eq('id', profile.id);

    if (error) alert(error.message);
    else alert('Intelligence Profile Updated.');
    setSaving(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Manifest Overflow: Max payload is 25MB.');
      return;
    }
    setUploadError(null);
    setSaving(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}/resume_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('specialist-credentials')
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setSaving(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('specialist-credentials')
      .getPublicUrl(filePath);

    await supabase.from('profiles')
      .update({ resume_url: publicUrl })
      .eq('id', profile.id);

    setProfile({ ...profile, resume_url: publicUrl });
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-brand-dark pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50 backdrop-blur-xl bg-white/90">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/seller" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-dark transition-colors group"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Identity Secured
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] font-black uppercase tracking-[4px] text-brand-primary mb-2">Specialist Dossier</p>
          <h1 className="text-3xl font-black tracking-tighter text-brand-dark uppercase italic leading-none">Public Persona Terminal</h1>
          <p className="text-slate-400 text-xs mt-1 italic">Sculpt how you manifest in the academic markets.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-10">
          
          {/* Identity Form */}
          <form onSubmit={handleUpdateProfile} className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-3">
               <User className="w-4 h-4 text-brand-primary" /> Core Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Display Name</label>
                <input 
                  type="text" 
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-bold focus:border-brand-primary transition-all outline-none"
                  placeholder="e.g. Master Calculus"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Avatar Terminal Signal (URL)</label>
                <input 
                  type="text"
                  value={profile.avatar_url || ''}
                  onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-bold focus:border-brand-primary transition-all outline-none"
                  placeholder="Paste URL here..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Bio Intelligence Manifest</label>
              <textarea 
                value={profile.bio || ''}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-bold focus:border-brand-primary transition-all outline-none h-32 resize-none"
                placeholder="Declare your expertise and history..."
              />
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialized Dependencies (Subjects)</label>
              {profile.role === 'seller' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {systemSubjects.map(sub => {
                     const isSelected = (profile.skills || []).includes(sub.name);
                     return (
                       <label key={sub.id} className={`p-4 border rounded-2xl cursor-pointer hover:border-brand-primary transition-all flex flex-col gap-2 ${isSelected ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100 bg-slate-50'}`}>
                         <input 
                           type="checkbox" 
                           className="hidden"
                           checked={isSelected}
                           onChange={(e) => {
                             const newSkills = e.target.checked 
                               ? [...(profile.skills || []), sub.name]
                               : (profile.skills || []).filter((s: string) => s !== sub.name);
                             setProfile({...profile, skills: newSkills});
                           }}
                         />
                         <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-brand-primary border-brand-primary' : 'bg-white border-slate-200'}`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-brand-dark" />}
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark leading-snug">{sub.name}</span>
                       </label>
                     );
                   })}
                   {systemSubjects.length === 0 && (
                     <div className="col-span-full p-4 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase">No subjects deployed by admins yet.</div>
                   )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Upgrade to Specialist to manifest capabilities.
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-5 bg-brand-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:bg-brand-primary hover:text-brand-dark transition-all active:scale-95 shadow-xl flex items-center gap-3"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Manifest Changes
            </button>
          </form>

          {/* Credential Vault */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
            
            <h2 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-3 relative z-10">
               <FileText className="w-4 h-4 text-brand-primary" /> Credential Vault
            </h2>

            {profile.resume_url ? (
               <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-brand-primary text-brand-dark rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div>
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-brand-secondary block mb-1">Dossier Locked</span>
                        <a href={profile.resume_url} target="_blank" className="text-xs font-black text-brand-dark hover:text-brand-primary flex items-center gap-2 uppercase tracking-tighter">
                           View Manifested Resume <LinkIcon className="w-3 h-3" />
                        </a>
                     </div>
                  </div>
                  <button 
                    onClick={() => setProfile({...profile, resume_url: null})}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            ) : (
               <div className="space-y-6 relative z-10">
                  <p className="text-xs text-slate-400 font-medium italic">Upload your Professional Resume or Dossier. This manifest will be visible to all potential students in the subject markets.</p>
                  
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-brand-primary transition-all bg-slate-50/50 group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-300 group-hover:text-brand-primary transition-all mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 group-hover:text-brand-dark">Initiate Dossier Upload</p>
                      <p className="text-[9px] text-slate-300 mt-2 font-bold uppercase">Max Manifest Payload: 25MB</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleResumeUpload} accept=".pdf,.doc,.docx" />
                  </label>

                  {uploadError && (
                     <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest">
                        <AlertCircle className="w-4 h-4" /> {uploadError}
                     </div>
                  )}
               </div>
            )}
            
            <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <ShieldCheck className="w-4 h-4 text-brand-primary" />
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Verifying credentials builds 10x trust on the open market.</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
