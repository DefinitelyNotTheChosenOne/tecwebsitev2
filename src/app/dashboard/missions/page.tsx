'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  Shield, User, ChevronLeft, 
  AlertCircle, Zap, Clock, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Temporal Intelligence Utility
const formatReceivedTime = (date: Date, now: Date) => {
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 24) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    if (minutes < 1) return `just now`;
    if (minutes < 60) return `${minutes} minutes ago`;
    return `${Math.floor(diffInHours)} hours ago`;
  }

  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }) + ' at ' + date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export default function SpecialistMissionBoard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth'); return; }
    
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (!prof) { setLoading(false); return; }
    setProfile(prof);
    
    // 1. Fetch public help requests matching specialist's skills
    const { data: publicReqs } = await supabase
      .from('help_requests')
      .select('*, profiles:student_id(full_name, avatar_url)')
      .eq('status', 'open')
      .in('subject', prof.skills || []);

    // 2. Fetch direct "Tunnels" 
    const { data: directRooms } = await supabase
      .from('chat_rooms')
      .select(`
        *, 
        profiles:student_id(full_name, avatar_url),
        chat_messages(sender_id)
      `)
      .eq('tutor_id', prof.id);

    // 3. Filter rooms: Hide if there's an existing class OR if specialist has already engaged (sent a message)
    const { data: existingSessions } = await supabase
      .from('tutoring_sessions')
      .select('room_id');
    
    const sessionRoomIds = new Set(existingSessions?.map(s => s.room_id) || []);
    
    const refinedDirect = (directRooms || [])
      .filter(room => {
        const hasSession = sessionRoomIds.has(room.id);
        const hasEngaged = (room as any).chat_messages?.some((msg: any) => msg.sender_id === prof.id);
        return !hasSession && !hasEngaged;
      })
      .map(room => ({
        ...room,
        isDirect: true,
        subject: "Direct Handshake",
        title: `Direct Tunnel with ${room.profiles?.full_name || 'Student'}`,
        description: "Student initiated a secure connection via Specialist Market Feed.",
        created_at: room.created_at,
        student_id: room.student_id
      }));

    setMissions([...(publicReqs || []), ...refinedDirect]);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchMissionsStable = useCallback(fetchMissions, []);

  useEffect(() => {
    fetchMissionsStable();

    // 4. Real-time Subscription for Incoming Handshaking
    const channel = supabase
      .channel('missions-live')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_rooms'
      }, () => {
        fetchMissions();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [fetchMissionsStable]);

  const initiateDiscussion = async (mission: any) => {
    if (!profile) return;
    
    // 1. Check if room exists
    let { data: room } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('student_id', mission.student_id)
      .eq('tutor_id', profile.id)
      .single();

    // 2. Create if not exists
    if (!room) {
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
          student_id: mission.student_id,
          tutor_id: profile.id
        })
        .select()
        .single();
      room = newRoom;
    }

    // 3. Official specialist engagement (signals acceptance)
    if (mission.isDirect && room) {
      await supabase.from('chat_messages').insert({
        room_id: room.id,
        sender_id: profile.id,
        content: `SIGNAL ACCEPTED: Specialist has officially opened the communication line.`
      });
    }

    // 4. Navigate to session
    router.push('/dashboard/session');
  };

  const declineMission = async (mission: any) => {
    if (confirm("Are you sure you want to decline this handshake? The student will be notified.")) {
      try {
        if (mission.isDirect) {
          await supabase.from('chat_messages').insert({
            room_id: mission.id,
            sender_id: profile.id,
            content: "SIGNAL REJECTED: Specialist is unavailable for this session."
          });
          setMissions(prev => prev.filter(m => m.id !== mission.id));
        } else {
          // For help_requests, just dismiss locally
          setMissions(prev => prev.filter(m => m.id !== mission.id));
        }
      } catch (err) {
        console.error("Decline Error:", err);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
       <div className="w-10 h-10 border-[3px] border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-brand-dark pb-24">
      {/* ─── Header ─── */}
      <div className="bg-brand-dark text-white pt-8 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent opacity-50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-white/40 hover:text-brand-primary transition-colors mb-8 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[5px] text-brand-primary mb-2">Operational Intel</p>
              <h1 className="text-5xl font-black tracking-tighter italic uppercase leading-none mb-3">Handshake Terminal</h1>
              <p className="text-sm font-medium text-white/40 uppercase tracking-[2px]">Vet students and schedule sessions before committing</p>
            </div>
            <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 backdrop-blur-xl">
               <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-[3px] text-brand-primary">Negotiation Portal Active</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="flex items-center gap-6 mb-8">
           <div className="flex items-center gap-3 px-5 py-2 bg-brand-primary text-brand-dark rounded-full shadow-lg">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[2px]">Incoming Handshakes</span>
           </div>
           <span className="text-[10px] font-black uppercase tracking-[2px] text-brand-secondary/40 px-3 py-1 bg-white rounded-lg border border-slate-100">{missions.length} New Leads</span>
        </div>

        <div className="space-y-6">
          {missions.length === 0 ? (
            <div className="p-32 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
               <User className="w-12 h-12 text-slate-100 mb-6" />
               <p className="text-[10px] font-black uppercase tracking-[4px] text-brand-secondary/30 italic">No handshake signals manifest...</p>
            </div>
          ) : (
            missions.map((mission) => (
              <motion.div 
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 p-10 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:border-brand-primary/30 transition-all relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 relative z-10">
                  <div className="flex items-center gap-8 text-left">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center relative border border-slate-100">
                       <User className="w-8 h-8 text-brand-secondary/40" />
                       <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white shadow-lg">
                         {mission.profiles?.full_name?.charAt(0) || 'S'}
                       </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-2 flex-wrap">
                         <h3 className="text-3xl font-black italic uppercase tracking-tighter text-brand-dark">{mission.profiles?.full_name || 'Anonymous Student'}</h3>
                         <span className="px-3 py-1 bg-brand-dark/5 text-brand-dark border border-brand-dark/10 text-[8px] font-black uppercase tracking-widest rounded-lg">Pending Discussion</span>
                         {mission.isDirect && (
                           <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/10 text-[8px] font-black uppercase tracking-widest rounded-lg animate-pulse">Direct Signal</span>
                         )}
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[3px] text-brand-secondary/60">
                        Subject: <span className="text-brand-primary ml-1">{mission.subject}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-300 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Received: {new Date(mission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-300 flex items-center gap-2">
                           <Shield className="w-3 h-3" /> Secure Tunnel Active
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => initiateDiscussion(mission)}
                      className="px-8 py-5 bg-brand-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-brand-primary hover:text-brand-dark transition-all shadow-xl shadow-brand-dark/20 active:scale-95"
                    >
                      Initiate Discussion
                    </button>
                    <button 
                      onClick={() => declineMission(mission)}
                      className="px-6 py-5 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="pt-20 text-center opacity-10 pointer-events-none">
           <Shield className="w-8 h-8 text-slate-400 mx-auto mb-3" />
           <p className="text-[9px] font-black uppercase tracking-[5px] text-brand-secondary">EndOfStream_Intel</p>
        </div>
      </main>
    </div>
  );
}
