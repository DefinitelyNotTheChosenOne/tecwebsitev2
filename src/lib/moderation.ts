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
