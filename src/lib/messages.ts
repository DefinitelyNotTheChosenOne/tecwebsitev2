import { supabase } from './supabase';
import { scanContentForLeakage } from './moderation';

/**
 * Centralized Message Protocol for tecWebsite
 * Handles: Moderation, Global Presence Detection, and status/timestamp synchronization.
 */
export const sendMessage = async (
  roomId: string, 
  senderId: string, 
  recipientId: string, 
  content: string,
  tableName: 'chat_messages' | 'live_class_messages' = 'chat_messages'
) => {
  // 1. Moderate Content
  const flag = scanContentForLeakage(content);
  
  // 2. Verify Recipient Global Presence (Dashboard online/idle status)
  const { data: recipient } = await supabase
    .from('profiles')
    .select('online_status')
    .eq('id', recipientId)
    .single();

  // 3. Determine Initial Status and Timestamps
  // Global presence (online/idle) = 'delivered' -> Set delivered_at to NOW()
  const isDelivered = recipient?.online_status === 'online' || recipient?.online_status === 'idle';
  
  const initialStatus = isDelivered ? 'delivered' : 'sent';
  const deliveredAt = isDelivered ? new Date().toISOString() : null;

  // 4. Insert Message into specified table
  const { data: message, error: messageError } = await supabase
    .from(tableName)
    .insert([{ 
      room_id: roomId, 
      sender_id: senderId, 
      content,
      status: initialStatus,
      delivered_at: deliveredAt
    }])
    .select()
    .single();

  if (messageError) throw messageError;

  // 5. Handle Moderation Flags (Logged to flagged_content)
  // Note: Flags always reference the content and sender, regardless of table parity.
  if (flag.isFlagged && message) {
    await supabase.from('flagged_content').insert([{
      message_id: message.id, 
      sender_id: senderId,
      content,
      reason: flag.reason,
      status: 'pending'
    }]);
  }

  return message;
};
