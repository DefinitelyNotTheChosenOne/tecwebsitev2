'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MessageSquare, User, Clock, Send, 
  Search, ArrowLeft, RefreshCcw, BookOpen,
  CheckCircle2, MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage as libSendMessage, markRoomMessagesAsRead } from '@/lib/messages';

export default function MessageTerminal() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchIntelligence();
    
    // Nuke Stale Cache: Re-fetch on focus
    window.addEventListener('focus', fetchIntelligence);
    return () => window.removeEventListener('focus', fetchIntelligence);
  }, []);

  useEffect(() => {
    if (activeRoom && profile) {
      fetchMessages(activeRoom.id);
      markRoomMessagesAsRead(activeRoom.id, profile.id).catch(console.error);

      // Subscribe to real-time signals
      const channel = supabase
        .channel(`room-${activeRoom.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
      
      return () => { channel.unsubscribe(); };
    }
  }, [activeRoom]);

  const fetchIntelligence = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(profile);

      // Fetch active negotiation tunnels
      const { data: roomsData } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          request:help_requests(subject),
          student:profiles!chat_rooms_student_id_fkey(full_name),
          tutor:profiles!chat_rooms_tutor_id_fkey(full_name)
        `)
        .or(`student_id.eq.${session.user.id},tutor_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false });

      if (roomsData) {
        // Audit Fetch: Identify unread status per room
        const roomsWithUnread = await Promise.all(roomsData.map(async (room) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', session.user.id)
            .in('status', ['sent', 'delivered']);
          
          return { ...room, unreadCount: count || 0 };
        }));
        setRooms(roomsWithUnread);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, status, read_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleHire = async () => {
    if (!activeRoom || !profile || submitting) return;
    setSubmitting(true);

    try {
      // 1. Fetch the winning bid to get the agreed price
      const { data: bid } = await supabase
        .from('bids')
        .select('*')
        .eq('request_id', activeRoom.request_id)
        .eq('tutor_id', activeRoom.tutor_id)
        .eq('status', 'pending')
        .single();

      if (!bid) throw new Error("Bid not found");

      // 2. Accept the Bid
      await supabase.from('bids').update({ status: 'accepted' }).eq('id', bid.id);

      // 3. Close the Help Request (In Progress)
      await supabase.from('help_requests').update({ status: 'in_progress' }).eq('id', activeRoom.request_id);

      // 4. Manifest the Tutoring Session
      await supabase.from('tutoring_sessions').insert({
        request_id: activeRoom.request_id,
        tutor_id: activeRoom.tutor_id,
        student_id: activeRoom.student_id,
        status: 'in_progress',
        agreed_price: bid.proposed_rate
      });

      // 5. Manifest a Confirmation System Message
      await supabase.from('chat_messages').insert({
        room_id: activeRoom.id,
        sender_id: profile.id,
        content: `🚨 MISSION SECURED: Contract finalized for ₱${bid.proposed_rate}. Escrow is active.`
      });

      alert("CONGRATULATIONS: Mission Manifesto Initialized. Redirecting to Dashboard.");
      router.push('/seller');
    } catch (err: any) {
      alert("CRITICAL ERROR: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !profile) return;
    
    // Determine recipient based on role
    const recipientId = profile.role === 'seller' ? activeRoom.student_id : activeRoom.tutor_id;
    
    try {
      await libSendMessage(
        activeRoom.id,
        profile.id,
        recipientId,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (err: any) {
      console.error("Transmission Error:", err);
      alert("SIGNAL FAILURE: " + (err.message || "Unknown encryption error."));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col selection:bg-brand-primary selection:text-brand-dark">
      {/* Top Protocol Header */}
      <header className="fixed top-0 inset-x-0 h-20 bg-white/5 backdrop-blur-3xl border-b border-white/5 z-50 flex items-center justify-between px-10">
         <div className="flex items-center gap-6">
            <Link href="/seller" className="text-brand-secondary hover:text-white transition-all">
               <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-black uppercase tracking-tight italic">Message <span className="text-brand-primary">Terminal</span></h1>
         </div>
         <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-primary">
               Mission Intel Active
            </div>
         </div>
      </header>

      <main className="flex-1 pt-20 flex overflow-hidden">
         {/* Sidebar: Negotiation Tunnels */}
         <div className="w-[400px] border-r border-white/5 flex flex-col bg-white/[0.02]">
            <div className="p-8">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input placeholder="Filter conversations..." className="w-full bg-white/5 border border-white/5 rounded-xl p-4 pl-12 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto">
               {rooms.map(room => (
                  <button 
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full p-8 border-b border-white/5 flex items-center gap-4 hover:bg-white/5 transition-all text-left group ${activeRoom?.id === room.id ? 'bg-white/5 border-r-2 border-r-brand-primary' : ''}`}
                  >
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black text-brand-secondary border border-white/5 group-hover:bg-brand-primary group-hover:text-brand-dark transition-all">
                        {(profile?.role === 'seller' ? room.student?.full_name : room.tutor?.full_name)?.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-1">
                           # {room.request?.subject || 'Direct Negotiaton'}
                        </p>
                         <h4 className="font-black text-lg truncate italic flex items-center gap-2">
                            {profile?.role === 'seller' ? room.student?.full_name : room.tutor?.full_name}
                            {room.unreadCount > 0 && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2.5 h-2.5 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(255,185,0,0.5)]" 
                              />
                            )}
                         </h4>
                         <p className="text-xs text-zinc-600 truncate mt-1 italic font-medium">
                           {room.unreadCount > 0 ? `${room.unreadCount} new signals...` : 'Click to enter tunnel...'}
                         </p>
                     </div>
                  </button>
               ))}
            </div>
         </div>

         {/* Chat Area: Live Negotiation Tunnel */}
         <div className="flex-1 flex flex-col bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0f172a] to-[#04040a]">
            {activeRoom ? (
               <>
                  {/* Chat Header */}
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 relative overflow-hidden group/header">
                     {/* Dynamic Header Glow */}
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/5 blur-3xl rounded-full" />

                     <div className="flex items-center gap-6 relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-primary font-black uppercase text-xs border border-white/10 group-hover/header:border-brand-primary/40 transition-all">
                           {activeRoom.request?.subject?.charAt(0)}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black italic tracking-tighter uppercase">{activeRoom.request?.subject}</h3>
                           <p className="text-[9px] font-black uppercase tracking-[3px] text-zinc-500 italic">
                             Tunneling with: <span className="text-white">{profile?.role === 'seller' ? activeRoom.student?.full_name : activeRoom.tutor?.full_name}</span>
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-4 relative z-10">
                        {profile?.role === 'user' && ( // 'user' is our 'student/buyer' role in profiles
                           <button 
                             onClick={handleHire}
                             disabled={submitting}
                             className="px-6 py-3 bg-brand-primary hover:bg-white text-brand-dark rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-2xl transition-all active:scale-95 flex items-center gap-2 group/hire disabled:opacity-50"
                           >
                              {submitting ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 group-hover/hire:scale-110 transition-transform" /> 
                              )}
                              {submitting ? 'Securing Mission...' : 'Hire & Secure Escrow'}
                           </button>
                        )}
                        <button className="p-4 hover:bg-white/5 rounded-2xl transition-colors"><MoreVertical className="w-5 h-5 text-zinc-600" /></button>
                     </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-12 space-y-8 flex flex-col">
                     {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] p-6 rounded-3xl text-sm font-bold leading-relaxed ${msg.sender_id === profile.id ? 'bg-brand-primary text-brand-dark rounded-tr-none' : 'bg-white/5 border border-white/10 text-white rounded-tl-none italic'}`}>
                              {msg.content}
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Input Protocol */}
                  <div className="p-10 bg-white/5 backdrop-blur-2xl border-t border-white/5">
                     <div className="max-w-4xl mx-auto relative">
                        <input 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your strategy here..."
                          className="w-full bg-white/5 border border-white/10 p-6 pr-20 rounded-[2rem] text-sm font-black italic focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all outline-none"
                        />
                        <button 
                          onClick={sendMessage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-brand-primary text-brand-dark rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                        >
                           <Send className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <MessageSquare className="w-32 h-32 text-white/5 mb-10" />
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter opacity-10 leading-none">Intelligence Hub <br/>Silent</h2>
                  <p className="text-zinc-600 font-black uppercase tracking-[5px] text-[10px] mt-8">Select a potential student to initiate session negotiation.</p>
               </div>
            )}
         </div>
      </main>
    </div>
  );
}
