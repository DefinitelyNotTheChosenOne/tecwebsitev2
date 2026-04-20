import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export type UserStatus = 'online' | 'idle' | 'offline';

export function usePresence(userId: string | undefined, roomId: string | null) {
  const [onlineStatus, setOnlineStatus] = useState<UserStatus>('offline');
  const [isTyping, setIsTyping] = useState(false);
  const [remotePresence, setRemotePresence] = useState<Record<string, any>>({});
  const channelRef = useRef<any>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId || !roomId) return;

    // 1. Initialize Channel
    const channel = supabase.channel(`presence:global:${roomId}`, {
      config: { presence: { key: userId } }
    });

    channelRef.current = channel;

    // 2. Presence Sync Logic
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setRemotePresence(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log(`Presence Join: ${key}`, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log(`Presence Leave: ${key}`, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            status: 'online',
            last_seen: new Date().toISOString(),
            online_at: new Date().toISOString()
          });
          setOnlineStatus('online');
          
          // Update DB Guard
          await supabase.from('profiles').update({ 
            online_status: 'online',
            last_seen: new Date().toISOString() 
          }).eq('id', userId);
        }
      });

    // 3. Idle Detection (5 Minutes)
    const resetIdleTimer = () => {
      if (onlineStatus === 'idle') {
        updatePresenceStatus('online');
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        updatePresenceStatus('idle');
      }, 5 * 60 * 1000); 
    };

    const updatePresenceStatus = async (status: UserStatus) => {
      setOnlineStatus(status);
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: userId,
          status: status,
          last_seen: new Date().toISOString()
        });
      }
      // Persistence
      await supabase.from('profiles').update({ 
        online_status: status,
        last_seen: new Date().toISOString() 
      }).eq('id', userId);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      // Cleanup: Set to offline on DB
      supabase.from('profiles').update({ online_status: 'offline' }).eq('id', userId).then();
      
      supabase.removeChannel(channel);
    };
  }, [userId, roomId]);

  // Typing Emitter
  const emitTyping = async (typing: boolean) => {
    if (channelRef.current) {
      setIsTyping(typing);
      await channelRef.current.track({
        user_id: userId,
        status: onlineStatus,
        typing: typing,
        last_seen: new Date().toISOString()
      });
    }
  };

  const getRemoteStatus = (remoteUid: string): { status: UserStatus, typing: boolean } => {
    const presence = remotePresence[remoteUid];
    if (!presence || presence.length === 0) return { status: 'offline', typing: false };
    const latest = presence[presence.length - 1];
    return { 
      status: latest.status as UserStatus || 'offline', 
      typing: !!latest.typing 
    };
  };

  return { onlineStatus, isTyping, remotePresence, emitTyping, getRemoteStatus };
}
