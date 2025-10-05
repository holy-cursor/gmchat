import React from 'react';
import { Database, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HybridModeIndicatorProps {
  useHybridMode: boolean;
  isConnected?: boolean;
}

const HybridModeIndicator: React.FC<HybridModeIndicatorProps> = ({ 
  useHybridMode, 
  isConnected = true 
}) => {
  const { isDark } = useTheme();

  if (!useHybridMode) return null;

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
      isDark 
        ? 'bg-gray-800 text-gray-300' 
        : 'bg-blue-50 text-blue-700'
    }`}>
      <Database className="w-4 h-4" />
      <span className="font-medium">Hybrid Mode</span>
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-500">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-red-500" />
            <span className="text-xs text-red-500">Offline</span>
          </>
        )}
      </div>
    </div>
  );
};

export default HybridModeIndicator;
