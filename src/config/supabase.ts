import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jjgrvaonocjpaarinjmc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3J2YW9ub2NqcGFhcmluam1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTQwNjYsImV4cCI6MjA3NDgzMDA2Nn0.yux-6sAfZecnmxbjvTTi16VIEYR-WjuJdkLPESjEAW0';

// For now, we'll use a placeholder. You'll need to:
// 1. Go to https://supabase.com
// 2. Create a new project
// 3. Get your project URL and anon key
// 4. Replace the values above

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
