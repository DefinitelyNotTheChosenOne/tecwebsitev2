import { supabase } from './supabase';

/**
 * Moderation and Anti-Leakage Utilities for FreelanceHub
 * Detecting: Emails, Phone Numbers, PayPal Links, WhatsApp.
 */
export const MODERATION_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
  PHONE: /(\+?|\()?\d{2,4}(\)?|\s)?\d{3,4}[\s.-]?\d{3,4}/,
  PAYPAL: /paypal\.me|paypal\.com\/paypalme/i,
  WHATSAPP: /wa\.me|whatsapp\.com|chat\.whatsapp\.com/i,
  EXTERNAL_URL: /(http|https):\/\/[^\s]+/i
};

export interface FlagResult {
  isFlagged: boolean;
  reason?: string;
}

export const scanContentForLeakage = (content: string): FlagResult => {
  if (MODERATION_PATTERNS.EMAIL.test(content)) return { isFlagged: true, reason: 'Email leakage' };
  if (MODERATION_PATTERNS.PHONE.test(content)) return { isFlagged: true, reason: 'Phone leakage' };
  if (MODERATION_PATTERNS.PAYPAL.test(content)) return { isFlagged: true, reason: 'Payment leakage' };
  if (MODERATION_PATTERNS.WHATSAPP.test(content)) return { isFlagged: true, reason: 'External contact (WhatsApp)' };
  
  return { isFlagged: false };
};

/**
 * Executes a scan and immediately inserts a record into the Moderation Queue if flagged.
 * Use this in message submission hooks or profile update handlers.
 */
export const submitFlaggedContent = async (userId: string, itemId: string, type: string, content: string) => {
  const scan = scanContentForLeakage(content);
  if (scan.isFlagged) {
    const { error } = await supabase.from('moderation_queue').insert({
       user_id: userId,
       item_id: itemId,
       type: type,
       context: `Automated Scan: ${scan.reason}`,
       content: content,
       priority: 'high'
    });
    if (error) console.error("Detection System Failure:", error);
    return true; 
  }
  return false;
};
