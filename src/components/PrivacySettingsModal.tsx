import React, { useState, useEffect } from 'react';
import { X, Shield, Eye, EyeOff, Lock, Forward, UserX, Settings, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import PrivacyService, { PrivacySettings, BlockedContact } from '../services/privacyService';
import AuditLogService from '../services/auditLogService';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  currentUserId
}) => {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState<PrivacySettings>(PrivacyService.getPrivacySettings());
  const [blockedContacts, setBlockedContacts] = useState<Record<string, BlockedContact>>({});
  // const [forwardingRules, setForwardingRules] = useState<Record<string, MessageForwardingRule>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'encryption' | 'contacts' | 'audit'>('general');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setSettings(PrivacyService.getPrivacySettings());
    setBlockedContacts(PrivacyService.getBlockedContacts());
    // setForwardingRules(PrivacyService.getForwardingRules());
    setAuditLogs(AuditLogService.getRecentLogs(50));
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    PrivacyService.updatePrivacySettings(newSettings);
    
    // Log the change
    AuditLogService.logEvent(
      'privacy_settings_changed',
      currentUserId,
      { setting: key, value },
      'medium'
    );
  };

  // const handleBlockContact = (address: string, displayName: string, reason?: string) => {
  //   PrivacyService.blockContact(address, displayName, reason);
  //   setBlockedContacts(PrivacyService.getBlockedContacts());
  //   
  //   AuditLogService.logEvent(
  //     'contact_blocked',
  //     currentUserId,
  //     { contactAddress: address, reason },
  //     'high',
  //     address
  //   );
  // };

  const handleUnblockContact = (address: string) => {
    PrivacyService.unblockContact(address);
    setBlockedContacts(PrivacyService.getBlockedContacts());
    
    AuditLogService.logEvent(
      'contact_unblocked',
      currentUserId,
      {},
      'medium',
      address
    );
  };

  // const handleForwardingRuleChange = (contactAddress: string, rule: Partial<MessageForwardingRule>) => {
  //   PrivacyService.setForwardingRule(contactAddress, rule);
  //   setForwardingRules(PrivacyService.getForwardingRules());
  //   
  //   AuditLogService.logEvent(
  //     'privacy_settings_changed',
  //     currentUserId,
  //     { setting: 'forwarding_rule', contactAddress, rule },
  //     'medium',
  //     contactAddress
  //   );
  // };

  const exportAuditLogs = () => {
    const logs = AuditLogService.exportLogs('json');
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    AuditLogService.logEvent(
      'data_exported',
      currentUserId,
      { type: 'audit_logs' },
      'medium'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              isDark ? 'bg-blue-900' : 'bg-blue-100'
            }`}>
              <Shield className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                Privacy & Security
              </h2>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} hidden sm:block`}>
                Control your privacy and security preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b overflow-x-auto ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'encryption', label: 'Encryption', icon: Lock },
            { id: 'contacts', label: 'Contacts', icon: UserX },
            { id: 'audit', label: 'Audit Logs', icon: AlertTriangle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === id
                  ? isDark
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-80 sm:max-h-96 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Message Controls
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Forward className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Allow Message Forwarding
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Let others forward your messages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettingChange('allowMessageForwarding', !settings.allowMessageForwarding)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.allowMessageForwarding
                          ? isDark ? 'bg-green-600' : 'bg-green-500'
                          : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.allowMessageForwarding ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Eye className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Allow Screenshots
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Prevent screenshots of messages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettingChange('allowScreenshots', !settings.allowScreenshots)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.allowScreenshots
                          ? isDark ? 'bg-green-600' : 'bg-green-500'
                          : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.allowScreenshots ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <EyeOff className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Show Read Receipts
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Let others know when you've read their messages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettingChange('showReadReceipts', !settings.showReadReceipts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showReadReceipts
                          ? isDark ? 'bg-green-600' : 'bg-green-500'
                          : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showReadReceipts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'encryption' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Encryption Settings
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center space-x-3">
                      <Shield className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                          Military-Grade Encryption Active
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          Using AES-256-GCM with Perfect Forward Secrecy
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-center space-x-3">
                      <Lock className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                          Perfect Forward Secrecy Enabled
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          New encryption keys generated for each message
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                          Quantum-Resistant Ready
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          ChaCha20-Poly1305 algorithm for future-proof security
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Blocked Contacts
                </h3>
                <div className="space-y-2">
                  {Object.values(blockedContacts).map((contact) => (
                    <div
                      key={contact.address}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {contact.displayName}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {contact.address}
                        </p>
                        {contact.reason && (
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Reason: {contact.reason}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnblockContact(contact.address)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          isDark
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                  {Object.keys(blockedContacts).length === 0 && (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No blocked contacts
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Audit Logs
                </h3>
                <button
                  onClick={exportAuditLogs}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Export Logs
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg text-sm ${
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        log.severity === 'critical' ? 'text-red-400' :
                        log.severity === 'high' ? 'text-orange-400' :
                        log.severity === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {log.eventType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.contactAddress && (
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Contact: {log.contactAddress}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsModal;
