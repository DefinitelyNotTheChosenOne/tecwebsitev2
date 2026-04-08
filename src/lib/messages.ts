import { supabase } from './supabase';
import { scanContentForLeakage } from './moderation';

/**
 * Enhanced Message Sending for FreelanceHub
 * Performs auto-moderation for anti-leakage before insertion.
 */
export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
  // 1. Moderate Content
  const flag = scanContentForLeakage(content);
  
  // 2. Insert Message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert([{ conversation_id: conversationId, sender_id: senderId, content }])
    .select()
    .single();

  if (messageError) throw messageError;

  // 3. Log Flagged Content for Admin Review
  if (flag.isFlagged && message) {
    await supabase.from('flagged_content').insert([{
      message_id: message.id,
      sender_id: senderId,
      content,
      reason: flag.reason,
      status: 'pending'
    }]);
    
    // Potential for: Notifying Admins via push/email here.
  }

  return message;
};
