/**
 * Screenshot Protection Service
 * Implements various methods to prevent screenshots and screen recording
 */

class ScreenshotProtectionService {
  private static isEnabled = false;
  private static originalUserSelect: string = '';
  private static originalWebkitUserSelect: string = '';
  private static originalMozUserSelect: string = '';
  private static originalMsUserSelect: string = '';

  /**
   * Enable screenshot protection
   */
  static enable(): void {
    if (this.isEnabled) return;

    try {
      // Disable text selection to make screenshots less useful
      this.disableTextSelection();
      
      // Add CSS to prevent screenshots (works on some browsers)
      this.addScreenshotPreventionCSS();
      
      // Add event listeners for screenshot attempts
      this.addScreenshotDetection();
      
      // Add visual warning overlay
      this.addWarningOverlay();
      
      this.isEnabled = true;
      console.log('Screenshot protection enabled');
    } catch (error) {
      console.error('Failed to enable screenshot protection:', error);
    }
  }

  /**
   * Disable screenshot protection
   */
  static disable(): void {
    if (!this.isEnabled) return;

    try {
      // Restore text selection
      this.restoreTextSelection();
      
      // Remove CSS
      this.removeScreenshotPreventionCSS();
      
      // Remove event listeners
      this.removeScreenshotDetection();
      
      // Remove warning overlay
      this.removeWarningOverlay();
      
      this.isEnabled = false;
      console.log('Screenshot protection disabled');
    } catch (error) {
      console.error('Failed to disable screenshot protection:', error);
    }
  }

  /**
   * Check if screenshot protection is enabled
   */
  static isProtectionEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Disable text selection to make screenshots less useful
   */
  private static disableTextSelection(): void {
    const body = document.body;
    this.originalUserSelect = body.style.userSelect || '';
    this.originalWebkitUserSelect = (body.style as any).webkitUserSelect || '';
    this.originalMozUserSelect = (body.style as any).mozUserSelect || '';
    this.originalMsUserSelect = (body.style as any).msUserSelect || '';

    body.style.userSelect = 'none';
    (body.style as any).webkitUserSelect = 'none';
    (body.style as any).mozUserSelect = 'none';
    (body.style as any).msUserSelect = 'none';
  }

  /**
   * Restore text selection
   */
  private static restoreTextSelection(): void {
    const body = document.body;
    body.style.userSelect = this.originalUserSelect;
    (body.style as any).webkitUserSelect = this.originalWebkitUserSelect;
    (body.style as any).mozUserSelect = this.originalMozUserSelect;
    (body.style as any).msUserSelect = this.originalMsUserSelect;
  }

  /**
   * Add CSS to prevent screenshots (limited browser support)
   */
  private static addScreenshotPreventionCSS(): void {
    const styleId = 'screenshot-protection-css';
    
    // Remove existing style if any
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Prevent screenshots on some browsers */
      .screenshot-protected {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      /* Add visual noise to make screenshots less clear */
      .screenshot-protected::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          rgba(255, 255, 255, 0.03) 2px,
          rgba(255, 255, 255, 0.03) 4px
        );
        pointer-events: none;
        z-index: 9999;
      }
      
      /* Dark mode noise */
      .dark .screenshot-protected::before {
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.03) 2px,
          rgba(0, 0, 0, 0.03) 4px
        );
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Remove screenshot prevention CSS
   */
  private static removeScreenshotPreventionCSS(): void {
    const style = document.getElementById('screenshot-protection-css');
    if (style) {
      style.remove();
    }
  }

  /**
   * Add event listeners for screenshot detection
   */
  private static addScreenshotDetection(): void {
    // Listen for right-click context menu (common before screenshots)
    document.addEventListener('contextmenu', this.handleContextMenu, true);
    
    // Listen for keyboard shortcuts that might trigger screenshots
    document.addEventListener('keydown', this.handleKeyDown, true);
    
    // Listen for dev tools opening (F12, Ctrl+Shift+I, etc.)
    document.addEventListener('keydown', this.handleDevTools, true);
    
    // Listen for print attempts
    window.addEventListener('beforeprint', this.handlePrintAttempt);
  }

  /**
   * Remove screenshot detection event listeners
   */
  private static removeScreenshotDetection(): void {
    document.removeEventListener('contextmenu', this.handleContextMenu, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    document.removeEventListener('keydown', this.handleDevTools, true);
    window.removeEventListener('beforeprint', this.handlePrintAttempt);
  }

  /**
   * Handle context menu (right-click)
   */
  private static handleContextMenu = (event: Event): void => {
    event.preventDefault();
    this.showWarning('Right-click is disabled for security');
  };

  /**
   * Handle keyboard shortcuts
   */
  private static handleKeyDown = (event: KeyboardEvent): void => {
    // Common screenshot shortcuts
    const isScreenshotShortcut = 
      (event.ctrlKey && event.shiftKey && event.key === 'S') || // Ctrl+Shift+S
      (event.metaKey && event.shiftKey && event.key === '4') || // Cmd+Shift+4 (Mac)
      (event.metaKey && event.shiftKey && event.key === '3') || // Cmd+Shift+3 (Mac)
      (event.key === 'PrintScreen') || // Print Screen key
      (event.altKey && event.key === 'PrintScreen'); // Alt+Print Screen

    if (isScreenshotShortcut) {
      event.preventDefault();
      this.showWarning('Screenshots are not allowed for security');
    }
  };

  /**
   * Handle dev tools opening
   */
  private static handleDevTools = (event: KeyboardEvent): void => {
    const isDevToolsShortcut = 
      (event.key === 'F12') ||
      (event.ctrlKey && event.shiftKey && event.key === 'I') ||
      (event.ctrlKey && event.shiftKey && event.key === 'C') ||
      (event.metaKey && event.altKey && event.key === 'I') ||
      (event.metaKey && event.altKey && event.key === 'C');

    if (isDevToolsShortcut) {
      event.preventDefault();
      this.showWarning('Developer tools are disabled for security');
    }
  };

  /**
   * Handle print attempts
   */
  private static handlePrintAttempt = (event: Event): void => {
    event.preventDefault();
    this.showWarning('Printing is disabled for security');
  };

  /**
   * Add warning overlay
   */
  private static addWarningOverlay(): void {
    const overlayId = 'screenshot-protection-overlay';
    
    // Remove existing overlay if any
    const existingOverlay = document.getElementById(overlayId);
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 18px;
        text-align: center;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.3s ease;
      ">
        <div>
          <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
          <div style="font-weight: bold; margin-bottom: 10px;">Screenshot Protection Active</div>
          <div style="font-size: 14px; opacity: 0.8;">This content is protected from screenshots and screen recording</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Show overlay briefly
    setTimeout(() => {
      const overlayElement = overlay.querySelector('div') as HTMLElement;
      if (overlayElement) {
        overlayElement.style.opacity = '1';
      }
    }, 100);
    
    // Hide overlay after 3 seconds
    setTimeout(() => {
      const overlayElement = overlay.querySelector('div') as HTMLElement;
      if (overlayElement) {
        overlayElement.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
        }, 300);
      }
    }, 3000);
  }

  /**
   * Remove warning overlay
   */
  private static removeWarningOverlay(): void {
    const overlay = document.getElementById('screenshot-protection-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Show warning message
   */
  private static showWarning(message: string): void {
    // Create temporary warning
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    `;
    warning.textContent = message;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(warning);
    
    // Remove after 3 seconds
    setTimeout(() => {
      warning.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        warning.remove();
        style.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Apply protection to specific elements
   */
  static protectElement(element: HTMLElement): void {
    if (!this.isEnabled) return;
    
    element.classList.add('screenshot-protected');
  }

  /**
   * Remove protection from specific elements
   */
  static unprotectElement(element: HTMLElement): void {
    element.classList.remove('screenshot-protected');
  }

  /**
   * Protect all message elements
   */
  static protectMessages(): void {
    if (!this.isEnabled) return;
    
    const messageElements = document.querySelectorAll('.message-bubble, .message-sent, .message-received');
    messageElements.forEach(element => {
      this.protectElement(element as HTMLElement);
    });
  }

  /**
   * Unprotect all message elements
   */
  static unprotectMessages(): void {
    const messageElements = document.querySelectorAll('.message-bubble, .message-sent, .message-received');
    messageElements.forEach(element => {
      this.unprotectElement(element as HTMLElement);
    });
  }
}

export default ScreenshotProtectionService;
