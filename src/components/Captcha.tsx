import React, { useEffect, useRef } from 'react';

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError: (error: string) => void;
  siteKey: string;
}

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, onError, siteKey }) => {
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const loadCaptcha = () => {
      if (window.grecaptcha && captchaRef.current) {
        try {
          widgetIdRef.current = window.grecaptcha.render(captchaRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            'expired-callback': () => {
              onError('CAPTCHA expired. Please try again.');
            },
            'error-callback': () => {
              onError('CAPTCHA error. Please try again.');
            },
          });
        } catch (error) {
          onError('Failed to load CAPTCHA');
        }
      }
    };

    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      script.onload = loadCaptcha;
      document.head.appendChild(script);
    } else {
      loadCaptcha();
    }

    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (error) {
          console.error('Error resetting CAPTCHA:', error);
        }
      }
    };
  }, [siteKey, onVerify, onError]);

  return (
    <div className="flex justify-center">
      <div ref={captchaRef}></div>
    </div>
  );
};

export default Captcha;
