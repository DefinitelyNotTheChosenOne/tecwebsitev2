'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, DollarSign, BookOpen, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PostHelpRequest() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate database insert
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-white relative overflow-hidden py-20 px-6">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-colors mb-12 font-bold text-sm tracking-wide group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest mb-6">
            Student Operations
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            Post a <span className="text-brand-primary italic">Request</span>
          </h1>
          <p className="text-xl text-brand-secondary/80 font-medium max-w-xl">
            Describe your problem, set a budget, and let elite student-tutors bid on your request instantly.
          </p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl space-y-8"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-brand-secondary uppercase tracking-widest mb-3">Request Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Struggling with AP Calculus Integrals" 
                className="w-full bg-[#0f172a]/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary transition-colors font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-brand-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Subject
                </label>
                <select 
                  required
                  className="w-full bg-[#0f172a]/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors font-medium appearance-none"
                >
                  <option value="">Select a Subject...</option>
                  <option value="math">Mathematics</option>
                  <option value="science">Chemistry & Physics</option>
                  <option value="coding">Computer Science / Coding</option>
                  <option value="law">Law & Legal Studies</option>
                  <option value="medical">Nursing & Pre-Med</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Proposed Budget
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 font-bold">$</span>
                  <input 
                    type="number" 
                    required
                    min="10"
                    placeholder="25" 
                    className="w-full bg-[#0f172a]/50 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary transition-colors font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-secondary uppercase tracking-widest mb-3">Describe Your Problem</label>
              <textarea 
                required
                rows={5}
                placeholder="Be specific. e.g., 'I have a midterm on Friday. I need someone to walk me through volume by cross-sections.'" 
                className="w-full bg-[#0f172a]/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary transition-colors font-medium resize-none"
              ></textarea>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-3 max-w-sm">
              <AlertCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <p className="text-xs text-brand-secondary font-medium leading-relaxed opacity-70">
                Your payment will be held securely in escrow. Funds are only released when the tutoring session is marked complete.
              </p>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto px-10 py-5 bg-white text-brand-dark hover:bg-brand-primary hover:text-white transition-all rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
              ) : (
                <>Publish Request <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
