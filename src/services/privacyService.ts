export interface PrivacySettings {
  // Message Controls
  allowMessageForwarding: boolean;
  allowScreenshots: boolean;
  allowScreenRecording: boolean;
  messageRetentionDays: number; // 0 = never delete, -1 = delete immediately
  messageSelfDestructSeconds: number; // 0 = disabled
  
  // Status Controls
  showReadReceipts: boolean;
  showOnlineStatus: boolean;
  showTypingIndicators: boolean;
  
  // Encryption Controls
  encryptionLevel: 'standard' | 'military' | 'quantum';
  perfectForwardSecrecy: boolean;
  keyRotationInterval: number; // hours
  
  // Data Controls
  allowDataSharing: boolean;
  allowAnalytics: boolean;
  allowCrashReporting: boolean;
  
  // Contact Controls
  allowUnknownContacts: boolean;
  requireContactVerification: boolean;
  
  // Incognito Mode
  incognitoMode: boolean;
  incognitoRetentionMinutes: number;
}

export interface BlockedContact {
  address: string;
  displayName: string;
  blockedAt: number;
  reason?: string;
}

export interface MessageForwardingRule {
  contactAddress: string;
  allowForwarding: boolean;
  allowScreenshots: boolean;
  allowCopying: boolean;
}

class PrivacyService {
  private static readonly STORAGE_KEY = 'parc3l_privacy_settings';
  private static readonly BLOCKED_CONTACTS_KEY = 'parc3l_blocked_contacts';
  private static readonly FORWARDING_RULES_KEY = 'parc3l_forwarding_rules';
  
  // Default privacy settings
  private static readonly DEFAULT_SETTINGS: PrivacySettings = {
    allowMessageForwarding: true,
    allowScreenshots: true,
    allowScreenRecording: true,
    messageRetentionDays: 30,
    messageSelfDestructSeconds: 0,
    showReadReceipts: true,
    showOnlineStatus: true,
    showTypingIndicators: true,
    encryptionLevel: 'standard',
    perfectForwardSecrecy: false,
    keyRotationInterval: 24,
    allowDataSharing: false,
    allowAnalytics: false,
    allowCrashReporting: false,
    allowUnknownContacts: true,
    requireContactVerification: false,
    incognitoMode: false,
    incognitoRetentionMinutes: 60
  };

  /**
   * Get current privacy settings
   */
  static getPrivacySettings(): PrivacySettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
    return { ...this.DEFAULT_SETTINGS };
  }

  /**
   * Update privacy settings
   */
  static updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    try {
      const current = this.getPrivacySettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      console.log('Privacy settings updated:', updated);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  }

  /**
   * Reset privacy settings to defaults
   */
  static resetPrivacySettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.DEFAULT_SETTINGS));
  }

  /**
   * Block a contact
   */
  static blockContact(address: string, displayName: string, reason?: string): void {
    try {
      const blocked = this.getBlockedContacts();
      const blockedContact: BlockedContact = {
        address,
        displayName,
        blockedAt: Date.now(),
        reason
      };
      
      blocked[address] = blockedContact;
      localStorage.setItem(this.BLOCKED_CONTACTS_KEY, JSON.stringify(blocked));
      console.log('Contact blocked:', blockedContact);
    } catch (error) {
      console.error('Failed to block contact:', error);
    }
  }

  /**
   * Unblock a contact
   */
  static unblockContact(address: string): void {
    try {
      const blocked = this.getBlockedContacts();
      delete blocked[address];
      localStorage.setItem(this.BLOCKED_CONTACTS_KEY, JSON.stringify(blocked));
      console.log('Contact unblocked:', address);
    } catch (error) {
      console.error('Failed to unblock contact:', error);
    }
  }

  /**
   * Check if a contact is blocked
   */
  static isContactBlocked(address: string): boolean {
    const blocked = this.getBlockedContacts();
    return !!blocked[address];
  }

  /**
   * Get all blocked contacts
   */
  static getBlockedContacts(): Record<string, BlockedContact> {
    try {
      const stored = localStorage.getItem(this.BLOCKED_CONTACTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load blocked contacts:', error);
      return {};
    }
  }

  /**
   * Set message forwarding rule for a contact
   */
  static setForwardingRule(contactAddress: string, rule: Partial<MessageForwardingRule>): void {
    try {
      const rules = this.getForwardingRules();
      rules[contactAddress] = {
        contactAddress,
        allowForwarding: true,
        allowScreenshots: true,
        allowCopying: true,
        ...rule
      };
      localStorage.setItem(this.FORWARDING_RULES_KEY, JSON.stringify(rules));
      console.log('Forwarding rule set:', rules[contactAddress]);
    } catch (error) {
      console.error('Failed to set forwarding rule:', error);
    }
  }

  /**
   * Get message forwarding rule for a contact
   */
  static getForwardingRule(contactAddress: string): MessageForwardingRule | null {
    const rules = this.getForwardingRules();
    return rules[contactAddress] || null;
  }

  /**
   * Get all forwarding rules
   */
  static getForwardingRules(): Record<string, MessageForwardingRule> {
    try {
      const stored = localStorage.getItem(this.FORWARDING_RULES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load forwarding rules:', error);
      return {};
    }
  }

  /**
   * Check if message forwarding is allowed for a contact
   */
  static isForwardingAllowed(contactAddress: string): boolean {
    const settings = this.getPrivacySettings();
    if (!settings.allowMessageForwarding) return false;
    
    const rule = this.getForwardingRule(contactAddress);
    return rule ? rule.allowForwarding : true;
  }

  /**
   * Check if screenshots are allowed for a contact
   */
  static isScreenshotAllowed(contactAddress: string): boolean {
    const settings = this.getPrivacySettings();
    if (!settings.allowScreenshots) return false;
    
    const rule = this.getForwardingRule(contactAddress);
    return rule ? rule.allowScreenshots : true;
  }

  /**
   * Check if copying is allowed for a contact
   */
  static isCopyingAllowed(contactAddress: string): boolean {
    const rule = this.getForwardingRule(contactAddress);
    return rule ? rule.allowCopying : true;
  }

  /**
   * Check if contact is allowed (not blocked)
   */
  static isContactAllowed(address: string): boolean {
    const settings = this.getPrivacySettings();
    if (settings.allowUnknownContacts) return true;
    
    return !this.isContactBlocked(address);
  }

  /**
   * Get encryption level for a conversation
   */
  static getEncryptionLevel(contactAddress: string): 'standard' | 'military' | 'quantum' {
    const settings = this.getPrivacySettings();
    return settings.encryptionLevel;
  }

  /**
   * Check if perfect forward secrecy is enabled
   */
  static isPerfectForwardSecrecyEnabled(): boolean {
    const settings = this.getPrivacySettings();
    return settings.perfectForwardSecrecy;
  }

  /**
   * Get key rotation interval in hours
   */
  static getKeyRotationInterval(): number {
    const settings = this.getPrivacySettings();
    return settings.keyRotationInterval;
  }

  /**
   * Check if incognito mode is enabled
   */
  static isIncognitoModeEnabled(): boolean {
    const settings = this.getPrivacySettings();
    return settings.incognitoMode;
  }

  /**
   * Get message retention period in days
   */
  static getMessageRetentionDays(): number {
    const settings = this.getPrivacySettings();
    return settings.messageRetentionDays;
  }

  /**
   * Get message self-destruct time in seconds
   */
  static getMessageSelfDestructSeconds(): number {
    const settings = this.getPrivacySettings();
    return settings.messageSelfDestructSeconds;
  }

  /**
   * Check if read receipts should be shown
   */
  static shouldShowReadReceipts(): boolean {
    const settings = this.getPrivacySettings();
    return settings.showReadReceipts;
  }

  /**
   * Check if online status should be shown
   */
  static shouldShowOnlineStatus(): boolean {
    const settings = this.getPrivacySettings();
    return settings.showOnlineStatus;
  }

  /**
   * Check if typing indicators should be shown
   */
  static shouldShowTypingIndicators(): boolean {
    const settings = this.getPrivacySettings();
    return settings.showTypingIndicators;
  }

  /**
   * Clear all privacy data
   */
  static clearAllPrivacyData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.BLOCKED_CONTACTS_KEY);
    localStorage.removeItem(this.FORWARDING_RULES_KEY);
    console.log('All privacy data cleared');
  }
}

export default PrivacyService;
