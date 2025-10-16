import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Optional for production
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jjgrvaonocjpaarinjmc.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3J2YW9ub2NqcGFhcmluam1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTQwNjYsImV4cCI6MjA3NDgzMDA2Nn0.yux-6sAfZecnmxbjvTTi16VIEYR-WjuJdkLPESjEAW0';

// Create Supabase client with error handling
let supabase: any = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized');
  } else {
    console.warn('⚠️ Supabase credentials not found, using local storage only');
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Supabase, using local storage only:', error);
}

export { supabase };

// Database schema for messages
export interface DatabaseMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  timestamp: number;
  transaction_signature?: string;
  chain_type: 'evm';
  chain_id: number;
  ipfs_hash?: string;
  is_encrypted: boolean;
  encrypted_content?: string;
  nonce?: string;
  public_key?: string;
  created_at: string;
  updated_at: string;
}

// Database schema for contacts
export interface DatabaseContact {
  id: string;
  wallet_address: string;
  contact_address: string;
  display_name: string;
  custom_tag?: string;
  last_activity: number;
  unread_count: number;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}
