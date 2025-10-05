import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import MiniAppService from '../services/miniAppService';
import IPFSStatusIndicator from './IPFSStatusIndicator';

interface MiniAppModeIndicatorProps {
  onModeChange?: (isMiniApp: boolean) => void;
}

const MiniAppModeIndicator: React.FC<MiniAppModeIndicatorProps> = ({ onModeChange }) => {
  const { isDark } = useTheme();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      const miniAppMode = MiniAppService.isMiniAppEnvironment();
      setIsMiniApp(miniAppMode);
      onModeChange?.(miniAppMode);
    };

    checkMode();
    
    // Check periodically in case environment changes
    const interval = setInterval(checkMode, 5000);
    return () => clearInterval(interval);
  }, [onModeChange]);

  return (
    <div className="relative">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
        isDark 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isMiniApp ? (
            <Smartphone className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          ) : (
            <Monitor className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          )}
          <span className={`text-sm font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {isMiniApp ? 'Mini App Mode' : 'Web Mode'}
          </span>
        </div>
        
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`p-1 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <Info className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
      </div>

      {showInfo && (
        <div className={`absolute top-full left-0 mt-2 w-80 p-4 rounded-lg border shadow-lg z-50 ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <div className="space-y-3">
            <div>
              <h4 className={`font-semibold text-sm ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {isMiniApp ? 'Mini App Mode' : 'Web Mode'}
              </h4>
              <p className={`text-xs mt-1 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {isMiniApp 
                  ? 'Running inside Farcaster/Coinbase Wallet. Transactions are seamless with no popups.'
                  : 'Running in regular browser. Wallet popups will appear for transaction approval.'
                }
              </p>
            </div>
            
            <div className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p><strong>Mini App Mode:</strong> Seamless UX, no popups, optimized for mobile</p>
              <p><strong>Web Mode:</strong> Full wallet control, popups for approval, desktop-friendly</p>
            </div>
            
            <div className="pt-2 border-t border-gray-600">
              <IPFSStatusIndicator />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniAppModeIndicator;
