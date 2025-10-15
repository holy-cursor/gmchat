interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

interface SecurityConfig {
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  cooldownPeriod: number; // in milliseconds
  suspiciousActivityThreshold: number;
}

class SecurityService {
  private static readonly RATE_LIMIT_KEY = 'parc3l_rate_limits';
  private static readonly SECURITY_CONFIG_KEY = 'parc3l_security_config';
  private static readonly SUSPICIOUS_ACTIVITY_KEY = 'parc3l_suspicious_activity';

  private static defaultConfig: SecurityConfig = {
    maxMessagesPerMinute: 10,
    maxMessagesPerHour: 100,
    maxMessagesPerDay: 500,
    cooldownPeriod: 5000, // 5 seconds
    suspiciousActivityThreshold: 3
  };

  /**
   * Check if user can send a message (rate limiting)
   */
  static canSendMessage(walletAddress: string): { allowed: boolean; reason?: string; retryAfter?: number } {
    const now = Date.now();
    const rateLimits = this.getRateLimits();
    const userLimits = rateLimits[walletAddress] || this.createNewRateLimit();

    // Check if user is in cooldown period
    if (now - userLimits.lastAttempt < this.getConfig().cooldownPeriod) {
      const retryAfter = Math.ceil((this.getConfig().cooldownPeriod - (now - userLimits.lastAttempt)) / 1000);
      return {
        allowed: false,
        reason: 'Please wait before sending another message',
        retryAfter
      };
    }

    // Reset counters if time window has passed
    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + (60 * 1000); // Reset every minute
    }

    // Check daily limit
    if (userLimits.count >= this.getConfig().maxMessagesPerDay) {
      return {
        allowed: false,
        reason: 'Daily message limit reached. Please try again tomorrow.'
      };
    }

    // Check hourly limit
    const hourlyCount = this.getHourlyCount(walletAddress);
    if (hourlyCount >= this.getConfig().maxMessagesPerHour) {
      return {
        allowed: false,
        reason: 'Hourly message limit reached. Please wait before sending more messages.'
      };
    }

    // Check minute limit
    if (userLimits.count >= this.getConfig().maxMessagesPerMinute) {
      return {
        allowed: false,
        reason: 'Too many messages sent. Please wait a moment before trying again.'
      };
    }

    return { allowed: true };
  }

  /**
   * Record a message attempt
   */
  static recordMessageAttempt(walletAddress: string): void {
    const now = Date.now();
    const rateLimits = this.getRateLimits();
    const userLimits = rateLimits[walletAddress] || this.createNewRateLimit();

    userLimits.count++;
    userLimits.lastAttempt = now;

    // Reset counter if time window has passed
    if (now > userLimits.resetTime) {
      userLimits.count = 1;
      userLimits.resetTime = now + (60 * 1000);
    }

    rateLimits[walletAddress] = userLimits;
    this.saveRateLimits(rateLimits);

    // Check for suspicious activity
    this.checkSuspiciousActivity(walletAddress);
  }

  /**
   * Check for suspicious activity patterns
   */
  static checkSuspiciousActivity(walletAddress: string): boolean {
    const now = Date.now();
    const suspiciousActivity = this.getSuspiciousActivity();
    const userActivity = suspiciousActivity[walletAddress] || [];

    // Add current attempt
    userActivity.push(now);

    // Keep only last 24 hours of activity
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const recentActivity = userActivity.filter(timestamp => timestamp > dayAgo);

    suspiciousActivity[walletAddress] = recentActivity;
    this.saveSuspiciousActivity(suspiciousActivity);

    // Check if activity is suspicious
    const config = this.getConfig();
    if (recentActivity.length >= config.suspiciousActivityThreshold) {
      this.flagSuspiciousActivity(walletAddress);
      return true;
    }

    return false;
  }

  /**
   * Flag suspicious activity
   */
  static flagSuspiciousActivity(walletAddress: string): void {
    const flagged = this.getFlaggedAddresses();
    flagged[walletAddress] = {
      timestamp: Date.now(),
      reason: 'High message frequency detected'
    };
    this.saveFlaggedAddresses(flagged);
  }

  /**
   * Check if address is flagged
   */
  static isAddressFlagged(walletAddress: string): boolean {
    const flagged = this.getFlaggedAddresses();
    return !!flagged[walletAddress];
  }

  /**
   * Get remaining message count for user
   */
  static getRemainingMessages(walletAddress: string): { daily: number; hourly: number; minute: number } {
    const rateLimits = this.getRateLimits();
    const userLimits = rateLimits[walletAddress] || this.createNewRateLimit();
    const config = this.getConfig();

    const dailyRemaining = Math.max(0, config.maxMessagesPerDay - userLimits.count);
    const hourlyRemaining = Math.max(0, config.maxMessagesPerHour - this.getHourlyCount(walletAddress));
    const minuteRemaining = Math.max(0, config.maxMessagesPerMinute - userLimits.count);

    return {
      daily: dailyRemaining,
      hourly: hourlyRemaining,
      minute: minuteRemaining
    };
  }

  /**
   * Validate message content for spam
   */
  static validateMessageContent(content: string): { valid: boolean; reason?: string } {
    // Check for empty or too short messages
    if (!content || content.trim().length < 1) {
      return { valid: false, reason: 'Message cannot be empty' };
    }

    // Check for too long messages
    if (content.length > 1000) {
      return { valid: false, reason: 'Message too long (max 1000 characters)' };
    }

    // Check for spam patterns
    const spamPatterns = [
      /(.)\1{10,}/g, // Repeated characters
      /https?:\/\/[^\s]+/g, // URLs
      /[A-Z]{10,}/g, // Excessive caps
      // eslint-disable-next-line no-useless-escape
      /[!@#$%^&*()_+=[\]{}|;':",./<>?]{5,}/g // Excessive special characters
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        return { valid: false, reason: 'Message contains suspicious content' };
      }
    }

    return { valid: true };
  }

  /**
   * Generate a simple CAPTCHA challenge
   */
  static generateCaptchaChallenge(): { question: string; answer: number } {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1: number, num2: number, answer: number;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 25;
        num2 = Math.floor(Math.random() * 25) + 1;
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    return {
      question: `What is ${num1} ${operation} ${num2}?`,
      answer
    };
  }

  /**
   * Verify CAPTCHA answer
   */
  static verifyCaptchaAnswer(userAnswer: string, correctAnswer: number): boolean {
    const parsedAnswer = parseInt(userAnswer.trim());
    return !isNaN(parsedAnswer) && parsedAnswer === correctAnswer;
  }

  /**
   * Reset rate limits for a user
   */
  static resetUserLimits(walletAddress: string): void {
    const rateLimits = this.getRateLimits();
    delete rateLimits[walletAddress];
    this.saveRateLimits(rateLimits);
  }

  /**
   * Clear all security data
   */
  static clearAllSecurityData(): void {
    localStorage.removeItem(this.RATE_LIMIT_KEY);
    localStorage.removeItem(this.SUSPICIOUS_ACTIVITY_KEY);
    localStorage.removeItem('parc3l_flagged_addresses');
  }

  // Private helper methods
  private static createNewRateLimit(): RateLimitEntry {
    return {
      count: 0,
      resetTime: Date.now() + (60 * 1000),
      lastAttempt: 0
    };
  }

  private static getRateLimits(): Record<string, RateLimitEntry> {
    try {
      const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load rate limits:', error);
      return {};
    }
  }

  private static saveRateLimits(limits: Record<string, RateLimitEntry>): void {
    try {
      localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(limits));
    } catch (error) {
      console.error('Failed to save rate limits:', error);
    }
  }

  private static getSuspiciousActivity(): Record<string, number[]> {
    try {
      const stored = localStorage.getItem(this.SUSPICIOUS_ACTIVITY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load suspicious activity:', error);
      return {};
    }
  }

  private static saveSuspiciousActivity(activity: Record<string, number[]>): void {
    try {
      localStorage.setItem(this.SUSPICIOUS_ACTIVITY_KEY, JSON.stringify(activity));
    } catch (error) {
      console.error('Failed to save suspicious activity:', error);
    }
  }

  private static getFlaggedAddresses(): Record<string, { timestamp: number; reason: string }> {
    try {
      const stored = localStorage.getItem('parc3l_flagged_addresses');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load flagged addresses:', error);
      return {};
    }
  }

  private static saveFlaggedAddresses(flagged: Record<string, { timestamp: number; reason: string }>): void {
    try {
      localStorage.setItem('parc3l_flagged_addresses', JSON.stringify(flagged));
    } catch (error) {
      console.error('Failed to save flagged addresses:', error);
    }
  }

  private static getHourlyCount(walletAddress: string): number {
    const suspiciousActivity = this.getSuspiciousActivity();
    const userActivity = suspiciousActivity[walletAddress] || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return userActivity.filter(timestamp => timestamp > oneHourAgo).length;
  }

  private static getConfig(): SecurityConfig {
    try {
      const stored = localStorage.getItem(this.SECURITY_CONFIG_KEY);
      return stored ? JSON.parse(stored) : this.defaultConfig;
    } catch (error) {
      console.error('Failed to load security config:', error);
      return this.defaultConfig;
    }
  }
}

export default SecurityService;
