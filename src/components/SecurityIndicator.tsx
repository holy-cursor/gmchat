import React from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import EncryptionService from '../services/encryptionService';

interface SecurityIndicatorProps {
  walletAddress: string;
  contactAddress?: string;
  groupId?: string;
  messageCount?: number;
}

const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({
  walletAddress,
  contactAddress,
  groupId,
  messageCount = 0
}) => {
  const { isDark } = useTheme();

  const getEncryptionStatus = () => {
    if (contactAddress) {
      return EncryptionService.getEncryptionStatus(walletAddress, contactAddress);
    } else if (groupId) {
      return EncryptionService.getGroupEncryptionStatus(groupId);
    }
    return false;
  };

  const getSecurityLevel = () => {
    const isEncrypted = getEncryptionStatus();
    const hasMessages = messageCount > 0;

    if (isEncrypted && hasMessages) {
      return 'high';
    } else if (isEncrypted) {
      return 'medium';
    } else if (hasMessages) {
      return 'low';
    }
    return 'none';
  };

  const securityLevel = getSecurityLevel();

  const getSecurityInfo = () => {
    switch (securityLevel) {
      case 'high':
        return {
          icon: CheckCircle,
          text: 'End-to-end encrypted',
          color: isDark ? 'text-green-400' : 'text-green-600',
          bgColor: isDark ? 'bg-green-900/50' : 'bg-green-100',
          description: 'Messages are encrypted and secure'
        };
      case 'medium':
        return {
          icon: Lock,
          text: 'Encryption ready',
          color: isDark ? 'text-blue-400' : 'text-blue-600',
          bgColor: isDark ? 'bg-blue-900/50' : 'bg-blue-100',
          description: 'Encryption keys generated'
        };
      case 'low':
        return {
          icon: AlertTriangle,
          text: 'Unencrypted',
          color: isDark ? 'text-yellow-400' : 'text-yellow-600',
          bgColor: isDark ? 'bg-yellow-900/50' : 'bg-yellow-100',
          description: 'Messages are not encrypted'
        };
      default:
        return {
          icon: Shield,
          text: 'No messages',
          color: isDark ? 'text-gray-400' : 'text-gray-500',
          bgColor: isDark ? 'bg-gray-800/50' : 'bg-gray-100',
          description: 'Start messaging to enable encryption'
        };
    }
  };

  const securityInfo = getSecurityInfo();
  const IconComponent = securityInfo.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${securityInfo.bgColor}`}>
      <IconComponent className={`w-3 h-3 ${securityInfo.color}`} />
      <span className={securityInfo.color}>
        {securityInfo.text}
      </span>
    </div>
  );
};

export default SecurityIndicator;
