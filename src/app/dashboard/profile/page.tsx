'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Save, User, FileText, 
  DollarSign, Wrench, RefreshCcw, ExternalLink, ChevronRight,
  Globe, Mail, Share2, Upload, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ProfileEditor() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    hourly_rate: 0,
    skills: [] as string[],
    facebook_url: '',
    website_url: '',
    public_email: '',
    avatar_url: ''
  });

  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({ 
      ...formData, 
      skills: formData.skills.filter(s => s !== skillToRemove) 
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => {
            setProfile(data);
            setFormData({
               full_name: data.full_name || '',
               bio: data.bio || '',
               hourly_rate: data.hourly_rate || 0,
               skills: data.skills || [],
               facebook_url: data.facebook_url || '',
               website_url: data.website_url || '',
               public_email: data.public_email || '',
               avatar_url: data.avatar_url || ''
            });
            setLoading(false);
          });
      }
    });
  }, []);

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Data Audit: 25MB Max
    if (file.size > 25 * 1024 * 1024) {
      alert("System Overload: Files must be under 25MB for elite synchronization.");
      return;
    }

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
    const filePath = `${profile.id}/${fileName}`;

    // Secure Storage Push
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      alert("Storage Error: Identity sync failed.");
      setUploadingImage(false);
      return;
    }

    // Get Public Asset Bridge
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update Profile Dossier
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id);

    if (!updateError) {
      setFormData({ ...formData, avatar_url: publicUrl });
      alert("Identity Verified: Portrait manifested.");
    }
    setUploadingImage(false);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', profile.id);
    
    if (error) {
      alert("System Overload: Profile update failed.");
    } else {
      alert("Identity Reconfigured: Your portfolio is now broadcasted.");
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12 selection:bg-brand-primary selection:text-brand-dark">
      <header className="mb-20 flex flex-col md:flex-row md:items-center justify-between gap-8">
         <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> Dashboard
            </Link>
            <h1 className="text-5xl font-black tracking-tight mt-6">Profile <span className="text-brand-primary italic">Controller</span></h1>
            <p className="text-brand-secondary font-medium uppercase tracking-[4px] text-[10px] mt-2">Personal Brand Intel & Data Sync</p>
         </div>

         <button 
           onClick={handleUpdate}
           disabled={updating}
           className="px-8 py-5 bg-brand-primary hover:bg-brand-secondary text-brand-dark rounded-2xl font-black uppercase tracking-[3px] text-[11px] shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
         >
            {updating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Reconfigure Intel</>}
         </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 max-w-[1400px]">
         {/* Left Side: Input Terminal */}
         <div className="space-y-12">
            <div className="space-y-4">
               <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary ml-1">Elite Identity Portrait (Max 25MB)</label>
               <div className="relative group">
                  <input 
                    type="file" 
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploadingImage}
                    className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-sm font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:border-brand-primary/40 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                  >
                     {uploadingImage ? (
                        <> <RefreshCcw className="w-5 h-5 animate-spin" /> Manifesting Identity... </>
                     ) : (
                        <> <Upload className="w-5 h-5 text-brand-primary" /> Import Portrait Dossier </>
                     )}
                  </button>
               </div>
            </div>

            <div className="space-y-4">
               <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary ml-1">Identity Display Name</label>
               <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Legal Full Name"
                    className="w-full bg-white/5 border border-white/5 p-6 pl-16 rounded-[2rem] text-lg font-bold focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all"
                  />
               </div>
            </div>

            <div className="space-y-4">
               <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary ml-1">Professional Specialist Bio</label>
               <div className="relative">
                  <FileText className="absolute left-6 top-8 w-6 h-6 text-brand-secondary" />
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Describe your expertise, teaching philosophy, and value proposition..."
                    rows={6}
                    className="w-full bg-white/5 border border-white/5 p-8 pl-16 rounded-[2.5rem] text-sm font-medium leading-relaxed focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all resize-none"
                  />
               </div>
            </div>

            <div className="space-y-4">
               <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary ml-1">Hourly Rate (₱)</label>
               <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-brand-secondary italic">₱</span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={formData.hourly_rate === 0 ? '' : formData.hourly_rate}
                    onChange={(e) => {
                       const value = e.target.value.replace(/\D/g, "");
                       setFormData({...formData, hourly_rate: Number(value)});
                    }}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/5 p-6 pl-14 rounded-[2rem] text-2xl font-black italic focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all placeholder:text-zinc-600 text-white"
                  />
               </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-white/5">
               <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-primary ml-1">Professional Credibility & Social Sync</label>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                     <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary" />
                     <input 
                       value={formData.website_url}
                       onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                       placeholder="Professional Portfolio URL"
                       className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                     />
                  </div>
                  <div className="relative">
                     <Share2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary" />
                     <input 
                       value={formData.facebook_url}
                       onChange={(e) => setFormData({...formData, facebook_url: e.target.value})}
                       placeholder="Facebook Profile / Portfolio"
                       className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                     />
                  </div>
               </div>
               <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary" />
                  <input 
                    value={formData.public_email}
                    onChange={(e) => setFormData({...formData, public_email: e.target.value})}
                    placeholder="Public-Facing Contact Email (e.g. gmail.com)"
                    className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                  />
               </div>
            </div>

            {/* Commit Protocol moved to Header */}
         </div>

         {/* Right Side: Preview & Branding */}
         <div className="space-y-10">
            <div className="p-12 bg-white/5 border border-white/10 rounded-[3rem] text-center backdrop-blur-3xl border-dashed">
               <div className="w-40 h-40 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-brand-primary/20 overflow-hidden shadow-2xl relative group/avatar">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile Intelligence" 
                      className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <span className="text-5xl font-black text-brand-primary uppercase italic">{formData.full_name?.charAt(0) || <User className="w-16 h-16" />}</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
               </div>
               <h3 className="text-2xl font-black mb-4 uppercase italic">Live Preview</h3>
               <p className="text-brand-secondary text-xs font-medium uppercase tracking-[3px] leading-relaxed mb-10">
                  This reflects your public dossier on the live grid. 
               </p>
               <Link href={`/tutors/${profile?.id}`} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Preview Dossier
               </Link>
            </div>

            {/* Domain Expertise Toolkit (Relocated) */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
               <label className="block text-[10px] font-black uppercase tracking-[3px] text-brand-secondary ml-1">Domain Expertise Toolkit</label>
               <div className="flex gap-3">
                  <div className="relative flex-1 group">
                     <Wrench className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary group-focus-within:rotate-12 transition-transform" />
                     <input 
                       value={newSkill}
                       onChange={(e) => setNewSkill(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                       placeholder="Type skill..."
                       className="w-full bg-white/5 border border-white/5 p-6 pl-14 rounded-2xl text-lg font-black text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all outline-none"
                     />
                  </div>
                  <button 
                     onClick={(e) => { e.preventDefault(); addSkill(); }}
                     className="px-6 bg-brand-primary text-brand-dark rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center shrink-0"
                  >
                     <Plus className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex flex-wrap gap-2 px-1">
                  <AnimatePresence mode="popLayout">
                     {formData.skills.map((skill) => (
                        <motion.div 
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 group hover:border-brand-primary/40 transition-all"
                        >
                           <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary italic"># {skill}</span>
                           <button 
                             onClick={() => removeSkill(skill)}
                             className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded-full transition-all text-red-400"
                           >
                              <X className="w-2.5 h-2.5" />
                           </button>
                        </motion.div>
                     ))}
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
