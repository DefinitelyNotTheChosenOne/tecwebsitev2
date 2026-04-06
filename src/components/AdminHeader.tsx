'use client';
import { supabase } from '@/lib/supabase';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminHeader({ adminName }: { adminName: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/auth');
  };

  return (
    <header className="flex items-center justify-between mb-16 border-b border-white/5 pb-10">
      <div>
        <h1 className="text-5xl font-black mb-2 tracking-tight">
          Welcome, <span className="text-brand-primary">{adminName || 'Admin'}</span>
        </h1>
        <p className="text-brand-secondary font-medium uppercase tracking-widest text-xs">High Command Central</p>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-1">System Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold font-mono">ENCRYPTED_SESSION</span>
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all group"
        >
          Sign Out <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </header>
  );
}
