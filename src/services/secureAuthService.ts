import { supabase } from '../config/supabase';
import AuditLogService from './auditLogService';

export interface AuthSession {
  walletAddress: string;
  sessionToken: string;
  publicKey: string;
  expiresAt: number;
  isActive: boolean;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

class SecureAuthService {
  private static readonly SESSION_KEY = 'gmchat_secure_session';
  private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Authenticate user with wallet signature
   */
  static async authenticateWithWallet(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<AuthResult> {
    try {
      // Validate wallet address format
      if (!this.isValidWalletAddress(walletAddress)) {
        await this.logSecurityEvent('invalid_wallet_address', walletAddress, {
          reason: 'Invalid wallet address format'
        }, 'medium');
        return { success: false, error: 'Invalid wallet address format' };
      }

      // Verify signature (simplified - in production, use proper signature verification)
      const isValidSignature = await this.verifySignature(walletAddress, signature, message);
      if (!isValidSignature) {
        await this.logSecurityEvent('invalid_signature', walletAddress, {
          reason: 'Signature verification failed'
        }, 'high');
        return { success: false, error: 'Invalid signature' };
      }

      // Generate session token
      const sessionToken = this.generateSessionToken();
      const publicKey = this.extractPublicKey(signature);

      // Set wallet address for RLS
      await this.setCurrentWalletAddress(walletAddress);

      // Create or update session in database
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert([{
          wallet_address: walletAddress,
          session_token: sessionToken,
          public_key: publicKey,
          expires_at: new Date(Date.now() + this.SESSION_DURATION).toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true
        }], {
          onConflict: 'wallet_address'
        })
        .select()
        .single();

      if (error) {
        await this.logSecurityEvent('auth_database_error', walletAddress, {
          error: error.message
        }, 'high');
        return { success: false, error: 'Authentication failed' };
      }

      const session: AuthSession = {
        walletAddress,
        sessionToken,
        publicKey,
        expiresAt: new Date(data.expires_at).getTime(),
        isActive: data.is_active
      };

      // Store session locally
      this.storeSession(session);

      // Log successful authentication
      await this.logSecurityEvent('user_authenticated', walletAddress, {
        sessionToken: sessionToken.substring(0, 8) + '...',
        publicKey: publicKey.substring(0, 8) + '...'
      }, 'low');

      return { success: true, session };

    } catch (error) {
      await this.logSecurityEvent('auth_error', walletAddress, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'high');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * Get current authenticated session
   */
  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const storedSession = this.getStoredSession();
      if (!storedSession) {
        return null;
      }

      // Check if session is expired
      if (Date.now() > storedSession.expiresAt) {
        await this.logout();
        return null;
      }

      // Verify session with database
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('wallet_address', storedSession.walletAddress)
        .eq('session_token', storedSession.sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        await this.logout();
        return null;
      }

      // Update last activity
      await this.updateLastActivity(storedSession.walletAddress);

      return storedSession;

    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Logout user and invalidate session
   */
  static async logout(): Promise<void> {
    try {
      const session = this.getStoredSession();
      if (session) {
        // Invalidate session in database
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('wallet_address', session.walletAddress)
          .eq('session_token', session.sessionToken);

        // Log logout event
        await this.logSecurityEvent('user_logout', session.walletAddress, {}, 'low');
      }

      // Clear local session
      localStorage.removeItem(this.SESSION_KEY);

    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  /**
   * Set current wallet address for RLS
   */
  private static async setCurrentWalletAddress(walletAddress: string): Promise<void> {
    try {
      await supabase.rpc('set_current_wallet_address', { wallet_address: walletAddress });
    } catch (error) {
      console.error('Failed to set wallet address for RLS:', error);
    }
  }

  /**
   * Validate wallet address format
   */
  private static isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Verify wallet signature (simplified - implement proper verification)
   */
  private static async verifySignature(
    walletAddress: string, 
    signature: string, 
    message: string
  ): Promise<boolean> {
    // In production, implement proper signature verification using ethers.js or web3.js
    // For now, return true for demo purposes
    return signature.length > 0 && message.length > 0;
  }

  /**
   * Generate secure session token
   */
  private static generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Extract public key from signature (simplified)
   */
  private static extractPublicKey(signature: string): string {
    // In production, extract actual public key from signature
    return signature.substring(0, 66); // Simplified
  }

  /**
   * Store session locally
   */
  private static storeSession(session: AuthSession): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Get stored session
   */
  private static getStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  }

  /**
   * Update last activity timestamp
   */
  private static async updateLastActivity(walletAddress: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('wallet_address', walletAddress);
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(
    eventType: string,
    walletAddress: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    try {
      // Log to audit service
      AuditLogService.logEvent(
        eventType as any,
        walletAddress,
        details,
        severity
      );

      // Log to database
      await supabase
        .from('security_events')
        .insert([{
          event_type: eventType,
          wallet_address: walletAddress,
          details,
          severity,
          ip_address: undefined, // Could be added if needed
          user_agent: navigator.userAgent
        }]);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  /**
   * Get current wallet address
   */
  static async getCurrentWalletAddress(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.walletAddress || null;
  }
}

export default SecureAuthService;
