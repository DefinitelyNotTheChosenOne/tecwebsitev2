'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Shield, Send, ArrowLeft, RefreshCcw, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomerSupportPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Admin-specific states
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      }
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      if (data.role === 'admin') {
        fetchThreads();
      } else {
        fetchMessages(userId);
      }
    }
  };

  const fetchThreads = async () => {
    // Get unique user_ids who have sent messages
    const { data, error } = await supabase
      .from('admin_messages')
      .select('user_id, profiles!user_id(full_name, email)')
      .order('created_at', { ascending: false });

    if (data) {
      // Remove duplicates for the thread list
      const uniqueThreads = Array.from(new Set(data.map(item => item.user_id)))
        .map(id => data.find(item => item.user_id === id));
      setAllThreads(uniqueThreads);
    }
  };

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session || !profile) return;

    const targetUserId = profile.role === 'admin' ? selectedUserId : session.user.id;
    if (!targetUserId) return;

    setIsLoading(true);
    const { error } = await supabase.from('admin_messages').insert({
      user_id: targetUserId,
      admin_id: profile.role === 'admin' ? session.user.id : '94409045-2254-43db-ba67-9cdca4671f12',
      content: newMessage,
      sender_role: profile.role === 'admin' ? 'admin' : 'user'
    });

    if (!error) {
      setNewMessage('');
      fetchMessages(targetUserId);
    }
    setIsLoading(false);
  };

  const selectUser = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessages(userId);
  };

  return (
    <div className="h-screen bg-[#0f172a] text-white font-sans py-4 px-12 overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-[1900px] h-full flex flex-col">
        {/* Header Section */}
        <header className="flex items-center justify-between mb-4 px-10 shrink-0">
          <AnimatePresence mode="wait">
            {!profile ? (
              <div className="w-32 h-4 bg-white/5 animate-pulse rounded-full" />
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Link 
                  href={profile?.role === 'admin' ? "/admin/dashboard" : "/dashboard"} 
                  className="flex items-center gap-3 text-brand-secondary hover:text-white transition-all group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest leading-none">Back to Dashboard</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <span className="block text-[10px] font-black tracking-[4px] text-brand-primary uppercase mb-1">System Status</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-white uppercase opacity-60">Connected to Command</span>
                </div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
          {!profile ? (
            <div className="lg:col-span-4 flex items-center justify-center h-full bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-6" />
                <p className="text-xs font-black uppercase tracking-widest text-brand-secondary animate-pulse">Establishing Secure Connection...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Sidebar for Admin */}
              {profile?.role === 'admin' && (
                <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl flex flex-col">
                  <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                    <h2 className="text-xs font-black uppercase tracking-widest text-brand-primary">Active Threads</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                    {allThreads.map((thread) => (
                      <button 
                        key={thread.user_id}
                        onClick={() => selectUser(thread.user_id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${selectedUserId === thread.user_id ? 'bg-brand-primary text-brand-dark' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-bold text-sm truncate uppercase tracking-tighter">{(thread.profiles as any)?.full_name || 'Anonymous'}</p>
                          <p className={`text-[9px] font-bold opacity-60 truncate ${(selectedUserId === thread.user_id ? 'text-brand-dark' : 'text-brand-secondary')}`}>{(thread.profiles as any)?.email}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedUserId === thread.user_id ? '' : 'group-hover:translate-x-1'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Terminal UI */}
              <div className={`${profile?.role === 'admin' ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-3xl flex flex-col h-full relative`}>
                {profile?.role === 'admin' && !selectedUserId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                    <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mb-8">
                      <User className="w-10 h-10 text-brand-primary opacity-50" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Access User Terminals</h3>
                    <p className="text-brand-secondary text-sm font-medium tracking-wide leading-relaxed max-w-sm">Select a support ticket from the sidebar to establish a secure communication tunnel.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-10 border-b border-white/10 flex items-center gap-6 bg-white/[0.02]">
                      <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
                        <Shield className="w-8 h-8 text-brand-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-black tracking-tight leading-none mb-2 uppercase">Tutor<span className="text-brand-primary italic">Match</span></h1>
                        <p className="text-brand-secondary text-xs font-bold uppercase tracking-widest opacity-60">
                          {profile?.role === 'admin' ? `Secure Tunnel to Authorized User: ${selectedUserId?.substring(0,8)}` : 'Direct Tunnel to Tutoring Administration'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-10 overflow-y-auto space-y-8 no-scrollbar scroll-smooth">
                      <AnimatePresence>
                        {messages.map((msg, i) => (
                          <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex flex-col ${msg.sender_role === 'admin' ? 'items-start' : 'items-end'} max-w-[85%] ${msg.sender_role === 'admin' ? 'mr-auto' : 'ml-auto'}`}
                          >
                            <span className={`text-[10px] font-black uppercase mb-2 ${msg.sender_role === 'admin' ? 'text-brand-primary ml-1' : 'text-brand-secondary mr-1'}`}>
                              {msg.sender_role === 'admin' ? 'Marketplace Administrator' : 'Authorized User Transmission'}
                            </span>
                            <div className={`p-6 rounded-3xl text-sm font-medium leading-relaxed border transition-all ${
                              msg.sender_role === 'admin' 
                                ? 'bg-brand-primary text-brand-dark border-brand-primary shadow-[0_15px_30px_-10px_rgba(82,109,130,0.4)] font-black' 
                                : 'bg-white/5 text-white border-white/5'
                            }`}>
                              {msg.content}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="p-8 bg-black/40 border-t border-white/10">
                      <form onSubmit={handleSendMessage} className="relative group">
                        <input 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-6 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all placeholder-brand-secondary/40" 
                          placeholder={profile?.role === 'admin' ? "Input response for user transmission..." : "Describe your issue or inquiry to the High Command..."}
                        />
                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="absolute right-4 top-1/2 -translate-y-1/2 px-8 py-3 bg-brand-primary text-brand-dark font-black rounded-xl text-xs uppercase tracking-widest shadow-xl hover:bg-brand-secondary hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Transmit'}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
