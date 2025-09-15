import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import SecurityService from '../services/securityService';

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (success: boolean) => void;
}

const CaptchaModal: React.FC<CaptchaModalProps> = ({ isOpen, onClose, onVerify }) => {
  const { isDark } = useTheme();
  const [challenge, setChallenge] = useState<{ question: string; answer: number } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      generateNewChallenge();
    }
  }, [isOpen]);

  const generateNewChallenge = () => {
    const newChallenge = SecurityService.generateCaptchaChallenge();
    setChallenge(newChallenge);
    setUserAnswer('');
    setError('');
  };

  const handleVerify = async () => {
    if (!challenge || !userAnswer.trim()) {
      setError('Please enter an answer');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const isValid = SecurityService.verifyCaptchaAnswer(userAnswer, challenge.answer);
    
    if (isValid) {
      onVerify(true);
      onClose();
    } else {
      setError('Incorrect answer. Please try again.');
      generateNewChallenge();
    }

    setIsVerifying(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-2xl ${
                isDark ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <Shield className={`w-6 h-6 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <h3 className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Security Verification
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-2xl transition-all duration-200 ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
          </div>

          <div className={`space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <p className="text-sm">
              To prevent spam and ensure security, please solve this simple math problem:
            </p>

            {challenge && (
              <div className={`p-4 rounded-2xl border-2 border-dashed ${
                isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="text-center">
                  <p className={`text-lg font-mono ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {challenge.question}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Your Answer
              </label>
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your answer..."
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-lg ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                    : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isVerifying}
                autoFocus
              />
            </div>

            {error && (
              <div className={`p-3 rounded-2xl ${
                isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
              }`}>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={generateNewChallenge}
                disabled={isVerifying}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-200 ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">New Challenge</span>
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={isVerifying}
                  className={`px-4 py-2 rounded-2xl transition-all duration-200 text-sm font-semibold ${
                    isDark 
                      ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  } ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || !userAnswer.trim()}
                  className={`px-6 py-2 text-white rounded-2xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl ${
                    isDark 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700' 
                      : 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700'
                  } ${isVerifying || !userAnswer.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isVerifying ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptchaModal;
