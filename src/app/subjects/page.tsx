'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Layout, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SubjectDirectory() {
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data && data.length > 0) {
      setSubjects(data);
    } else {
      // Fallback display if DB not seeded
      setSubjects([
        { id: 1, name: 'Advanced Calculus', slug: 'advanced-calculus' },
        { id: 2, name: 'Computer Science', slug: 'computer-science' },
        { id: 3, name: 'Pre-Med & Nursing', slug: 'pre-med-nursing' },
        { id: 4, name: 'Constitutional Law', slug: 'constitutional-law' },
        { id: 5, name: 'Organic Chemistry', slug: 'organic-chemistry' },
        { id: 6, name: 'Physics & Engineering', slug: 'physics-engineering' },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      <div className="pt-32 pb-20 px-10 text-center max-w-4xl mx-auto">
         <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-block px-5 py-2 bg-white/5 border border-white/5 backdrop-blur-xl rounded-full mb-10"
         >
           <span className="text-[10px] font-black uppercase tracking-[4px] text-brand-primary">Subject Directory</span>
         </motion.div>
         <motion.h1 
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-6xl font-black mb-8 tracking-tighter"
         >
           Browse Academic Markets
         </motion.h1>
         <p className="text-brand-secondary max-w-xl mx-auto text-lg">Select a specific discipline to browse verified elite tutors or post a direct "Help Wanted" request.</p>
      </div>

      <main className="max-w-7xl mx-auto px-10 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub, i) => (
            <Link key={sub.id} href={`/subjects/${sub.slug}`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 hover:border-brand-primary/50 transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-brand-primary/10 transition-colors">
                  <Layout className="w-8 h-8 text-brand-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-brand-primary transition-colors">{sub.name}</h3>
                <div className="mt-auto pt-8 flex items-center justify-between text-brand-secondary group-hover:text-white transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest">Enter Market</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
