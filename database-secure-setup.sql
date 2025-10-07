-- SECURE Supabase Database Setup for Parc3l Messaging App
-- This script implements comprehensive security measures

-- Drop existing tables if they exist (CAREFUL: This will delete all data!)
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS contacts CASCADE;
-- DROP TABLE IF EXISTS user_sessions CASCADE;

-- Create user_sessions table for wallet-based authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    session_token TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create messages table with security features
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file')),
    timestamp BIGINT NOT NULL,
    transaction_signature TEXT,
    chain_type TEXT NOT NULL DEFAULT 'evm',
    chain_id INTEGER NOT NULL DEFAULT 8453,
    ipfs_hash TEXT,
    is_encrypted BOOLEAN DEFAULT TRUE, -- Changed to TRUE by default
    encrypted_content TEXT,
    nonce TEXT,
    public_key TEXT,
    message_hash TEXT NOT NULL, -- For integrity verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table with security features
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    contact_address TEXT NOT NULL,
    display_name TEXT NOT NULL,
    custom_tag TEXT,
    last_activity BIGINT NOT NULL,
    unread_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    contact_hash TEXT NOT NULL, -- For integrity verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, contact_address)
);

-- Create security_events table for audit logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    details JSONB NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_hash ON messages(message_hash);
CREATE INDEX IF NOT EXISTS idx_contacts_wallet_address ON contacts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_address ON contacts(contact_address);
CREATE INDEX IF NOT EXISTS idx_contacts_hash ON contacts(contact_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_wallet ON user_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_events_wallet ON security_events(wallet_address);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- Enable Row Level Security (RLS) - CRITICAL SECURITY MEASURE
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages table
CREATE POLICY "Users can only see their own messages" ON messages
    FOR ALL USING (
        sender = current_setting('app.current_wallet_address', true) 
        OR recipient = current_setting('app.current_wallet_address', true)
    );

-- Create RLS policies for contacts table
CREATE POLICY "Users can only see their own contacts" ON contacts
    FOR ALL USING (
        wallet_address = current_setting('app.current_wallet_address', true)
    );

-- Create RLS policies for user_sessions table
CREATE POLICY "Users can only see their own sessions" ON user_sessions
    FOR ALL USING (
        wallet_address = current_setting('app.current_wallet_address', true)
    );

-- Create RLS policies for security_events table
CREATE POLICY "Users can only see their own security events" ON security_events
    FOR ALL USING (
        wallet_address = current_setting('app.current_wallet_address', true)
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate message hash for integrity
CREATE OR REPLACE FUNCTION generate_message_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.message_hash = encode(digest(
        NEW.sender || NEW.recipient || NEW.content || NEW.timestamp::text, 
        'sha256'
    ), 'hex');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to generate contact hash for integrity
CREATE OR REPLACE FUNCTION generate_contact_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.contact_hash = encode(digest(
        NEW.wallet_address || NEW.contact_address || NEW.display_name, 
        'sha256'
    ), 'hex');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for hash generation
CREATE TRIGGER generate_message_hash_trigger BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION generate_message_hash();

CREATE TRIGGER generate_contact_hash_trigger BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION generate_contact_hash();

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_wallet_address TEXT,
    p_details JSONB,
    p_severity TEXT DEFAULT 'low'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_events (event_type, wallet_address, details, severity)
    VALUES (p_event_type, p_wallet_address, p_details, p_severity);
END;
$$ language 'plpgsql';

-- Create function to validate wallet address format
CREATE OR REPLACE FUNCTION is_valid_wallet_address(address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic Ethereum address validation (42 characters, starts with 0x)
    RETURN address ~ '^0x[a-fA-F0-9]{40}$';
END;
$$ language 'plpgsql';

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS VOID AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
END;
$$ language 'plpgsql';

-- Create function to set current wallet address for RLS
CREATE OR REPLACE FUNCTION set_current_wallet_address(wallet_address TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_wallet_address', wallet_address, true);
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a view for secure message access
CREATE VIEW secure_messages AS
SELECT 
    id,
    sender,
    recipient,
    CASE 
        WHEN is_encrypted THEN '[ENCRYPTED]'
        ELSE content
    END as content,
    message_type,
    timestamp,
    transaction_signature,
    chain_type,
    chain_id,
    ipfs_hash,
    is_encrypted,
    message_hash,
    created_at,
    updated_at
FROM messages
WHERE sender = current_setting('app.current_wallet_address', true) 
   OR recipient = current_setting('app.current_wallet_address', true);

-- Create a view for secure contact access
CREATE VIEW secure_contacts AS
SELECT 
    id,
    wallet_address,
    contact_address,
    display_name,
    custom_tag,
    last_activity,
    unread_count,
    is_online,
    contact_hash,
    created_at,
    updated_at
FROM contacts
WHERE wallet_address = current_setting('app.current_wallet_address', true);

-- Security recommendations:
-- 1. Enable SSL/TLS for all connections
-- 2. Regularly rotate API keys
-- 3. Monitor security_events table for suspicious activity
-- 4. Implement rate limiting at application level
-- 5. Use environment variables for sensitive configuration
-- 6. Regular security audits and penetration testing
-- 7. Backup encryption keys securely
-- 8. Implement proper key rotation policies

COMMENT ON TABLE messages IS 'Encrypted messages with RLS protection';
COMMENT ON TABLE contacts IS 'User contacts with RLS protection';
COMMENT ON TABLE user_sessions IS 'Wallet-based authentication sessions';
COMMENT ON TABLE security_events IS 'Security audit log with RLS protection';
