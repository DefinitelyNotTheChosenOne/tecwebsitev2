'use client';
import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, ArrowRight, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function AuthContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const mode = searchParams.get('mode');

  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    setIsLoading(true);
    const { data: { user }, error } = isSignUp
      ? await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: fullName }
          }
        }).then(res => ({ data: { user: res.data.user }, error: res.error }))
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      const destination = redirect 
        ? `${redirect}${redirect.includes('?') ? '&' : '?'}redirected=true` 
        : '/dashboard';
      window.location.href = destination;
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans relative overflow-hidden text-white">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 40, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
          x: [0, -40, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-950/20 blur-[120px] rounded-full pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] bg-brand-dark/95 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] relative z-10"
      >
        <div className="bg-black/40 p-1.5 rounded-2xl flex items-center mb-12 relative">
          <motion.div
            layoutId="activeTab"
            className="absolute h-[40px] w-[calc(50%-6px)] bg-brand-primary rounded-xl shadow-[0_0_20px_rgba(82,109,130,0.5)]"
            initial={false}
            animate={{ x: isSignUp ? '100%' : '0%' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />

          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 relative z-10 py-3 text-[10px] font-black uppercase tracking-[2.5px] transition-colors duration-300 ${!isSignUp ? 'text-white' : 'text-brand-secondary hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 relative z-10 py-3 text-[10px] font-black uppercase tracking-[2.5px] transition-colors duration-300 ${isSignUp ? 'text-white' : 'text-brand-secondary hover:text-white'}`}
          >
            Register
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.98 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)', scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col"
          >
            <div className="text-center mb-10 h-[80px] flex flex-col justify-center">
              <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4 group">
                <h1 className="text-4xl font-black italic tracking-tighter transition-transform group-hover:scale-105 text-white">
                  Tutor<span className="text-brand-primary">Match</span>
                </h1>
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse mt-4" />
              </Link>
              <p className="text-brand-secondary text-sm font-medium tracking-tight px-4 leading-relaxed">
                {isSignUp ? 'Create an account to start tutoring.' : 'Login to access your tutoring portal.'}
              </p>
            </div>

            <div className="space-y-6">
              <AnimatePresence>
                {isSignUp && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="block text-[10px] font-black uppercase tracking-[2px] text-brand-secondary ml-1">Legal Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        className="w-full bg-black/40 border border-white/5 py-4 pl-12 pr-4 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder-white/20"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isSignUp}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div whileTap={{ scale: 0.995 }} className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-brand-secondary ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full bg-black/40 border border-white/5 py-4 pl-12 pr-4 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder-white/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </motion.div>

              <motion.div whileTap={{ scale: 0.995 }} className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-brand-secondary ml-1">{isSignUp ? 'Create Password' : 'Password'}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/5 py-4 pl-12 pr-12 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder-white/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-secondary hover:text-white transition-colors" onClick={() => {}}>
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>

              {!isSignUp && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-right">
                  <button className="text-[10px] font-black uppercase tracking-[1px] text-brand-secondary hover:text-white transition-colors">
                    Forgot Password?
                  </button>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAuth}
                disabled={isLoading}
                className="w-full py-5 bg-brand-primary hover:bg-brand-secondary text-white rounded-2xl font-black text-sm uppercase tracking-[2px] transition-all duration-300 shadow-[0_20px_40px_-5px_rgba(82,109,130,0.5)] flex items-center justify-center gap-3 relative overflow-hidden disabled:opacity-50"
              >
                <span>{isLoading ? 'Processing...' : (isSignUp ? 'Register' : 'Sign In')}</span>
                {!isLoading && <ArrowRight className="w-5 h-5" />}

                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </motion.button>

              <div className="pt-4 flex justify-center">
                 <Link 
                   href="/" 
                   className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[3px] text-brand-secondary/40 hover:text-brand-primary transition-all group py-4"
                 >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
                    Back to Tutor<span className="italic">Match</span>
                 </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black italic uppercase tracking-widest animate-pulse text-center">
        Securely handshaking...
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
