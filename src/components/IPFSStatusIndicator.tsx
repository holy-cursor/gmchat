import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import IPFSService from '../services/ipfsService';

interface IPFSStatusIndicatorProps {
  className?: string;
}

const IPFSStatusIndicator: React.FC<IPFSStatusIndicatorProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');

  useEffect(() => {
    const checkIPFSStatus = async () => {
      try {
        // Try to upload a small test content
        const testContent = 'IPFS connection test';
        await IPFSService.uploadContent(testContent);
        setStatus('connected');
      } catch (error) {
        console.warn('IPFS check failed:', error);
        setStatus('disconnected');
      }
    };

    checkIPFSStatus();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'disconnected':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'error':
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {status === 'checking' ? 'Checking...' : 'IPFS'}
      </span>
    </div>
  );
};

export default IPFSStatusIndicator;
