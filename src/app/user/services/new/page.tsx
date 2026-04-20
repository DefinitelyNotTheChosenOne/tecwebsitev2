'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

const categories = [
  "Website Development", "Video Editing", "Software Development", 
  "Book Publishing", "Architecture & Interior Design", "Book Design", 
  "UGC Videos", "Voice Over", "Social Media Marketing", 
  "AI Development", "Logo Design", "Website Design", "Music"
];

export default function NewServicePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: categories[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) router.push('/auth');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from('services').insert([
      {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        seller_id: session?.user?.id
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      router.push('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark">
      <nav className="bg-brand-dark text-white p-6 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-brand-secondary hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Marketplace
          </Link>
          <span className="text-xl font-black tracking-tight tracking-widest uppercase text-xs opacity-50">Seller Studio</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-16 px-6">
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4 tracking-tight">Create your <span className="text-brand-primary italic">Gig</span></h1>
          <p className="text-brand-primary text-xl font-medium tracking-wide">Tell the world what you're incredible at doing.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-secondary/10">
              <label className="block text-[10px] font-black uppercase text-brand-secondary tracking-[2px] mb-4">Service Title</label>
              <input 
                type="text" 
                required
                placeholder="I will build a high-performance website for your..." 
                className="w-full text-2xl font-bold bg-transparent border-b-2 border-brand-light focus:border-brand-primary focus:outline-none py-2 placeholder-brand-light"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-secondary/10">
              <label className="block text-[10px] font-black uppercase text-brand-secondary tracking-[2px] mb-4">Brief Description</label>
              <textarea 
                required
                rows={6}
                placeholder="Explain the scope, the tech stack, and what makes your work the best in the industry..." 
                className="w-full bg-brand-light/20 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-brand-dark text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-3xl rounded-full" />
              <label className="block text-[10px] font-black uppercase text-brand-secondary tracking-[2px] mb-6">Pricing ($)</label>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-brand-secondary">$</span>
                <input 
                  type="number" 
                  required
                  placeholder="49" 
                  className="w-full bg-transparent text-5xl font-black focus:outline-none border-b-4 border-white/10 focus:border-brand-primary"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-secondary/10">
              <label className="block text-[10px] font-black uppercase text-brand-secondary tracking-[2px] mb-6">Service Category</label>
              <select 
                className="w-full p-4 bg-brand-light/30 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-6 bg-brand-primary hover:bg-brand-secondary transition-all rounded-3xl text-white font-black text-xl shadow-[0_15px_30px_-5px_rgba(82,109,130,0.5)] flex items-center justify-center gap-2 group"
            >
              {isLoading ? 'Publishing...' : (
                <>
                  Publish Now <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
