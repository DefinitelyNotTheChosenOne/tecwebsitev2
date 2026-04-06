'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (isSignUp: boolean) => {
    setIsLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      router.push('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black mb-2 tracking-tight">FreelanceHub Login</h1>
        <p className="text-brand-secondary text-sm mb-8">Enter your details to access your account.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-secondary mb-2">Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              className="w-full bg-brand-dark/50 border border-white/5 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder-white/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-secondary mb-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-brand-dark/50 border border-white/5 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder-white/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => handleAuth(false)}
            disabled={isLoading}
            className="w-full py-4 bg-brand-primary hover:bg-brand-secondary transition-all rounded-xl font-bold mt-4 shadow-lg active:scale-95"
          >
            {isLoading ? 'Processing...' : 'Sign In'}
          </button>
          
          <div className="flex items-center gap-4 py-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-white/30 font-bold uppercase">or</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
          
          <button 
            onClick={() => handleAuth(true)}
            disabled={isLoading}
            className="w-full py-4 bg-white text-brand-dark hover:bg-brand-light transition-all rounded-xl font-bold shadow-lg active:scale-95"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
