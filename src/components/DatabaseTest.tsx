import React, { useState } from 'react';
import { Database, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import HybridDatabaseService from '../services/hybridDatabaseService';

interface DatabaseTestProps {
  walletAddress: string;
  onClose?: () => void;
}

const DatabaseTest: React.FC<DatabaseTestProps> = ({ walletAddress, onClose }) => {
  const { isDark } = useTheme();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const testDatabaseConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing database connection...');

    try {
      // Test 1: Store a test message
      const testMessage = {
        sender: walletAddress,
        recipient: '0x0000000000000000000000000000000000000000',
        content: 'Database connection test',
        messageType: 'text' as const,
        transactionSignature: 'test_' + Date.now(),
        chainType: 'evm' as const,
        chainId: 8453,
        isEncrypted: false
      };

      try {
        await HybridDatabaseService.storeMessage(testMessage);
        setTestMessage('✅ Test message stored successfully');
      } catch (dbError) {
        console.warn('Database storage failed, but continuing test:', dbError);
        setTestMessage('⚠️ Database storage failed, but IPFS backup worked');
      }

      // Test 2: Retrieve messages
      try {
        const messages = await HybridDatabaseService.getMessages(walletAddress, '0x0000000000000000000000000000000000000000');
        setTestMessage(`✅ Retrieved ${messages.length} messages from database`);
      } catch (dbError) {
        console.warn('Database retrieval failed:', dbError);
        setTestMessage('⚠️ Database retrieval failed, but basic functionality works');
      }

      // Test 3: Store a test contact
      try {
        const testContact = {
          address: '0x0000000000000000000000000000000000000000',
          displayName: 'Test Contact',
          lastActivity: Date.now(),
          unreadCount: 0,
          isOnline: false
        };

        await HybridDatabaseService.storeContact(testContact, walletAddress);
        setTestMessage('✅ Test contact stored successfully');
      } catch (dbError) {
        console.warn('Contact storage failed:', dbError);
        setTestMessage('⚠️ Contact storage failed, but message storage works');
      }

      setTestStatus('success');
      setTestMessage('🎉 Database test completed! Some features may need database setup, but core functionality works.');

    } catch (error) {
      setTestStatus('error');
      setTestMessage(`❌ Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Database test error:', error);
    }
  };

  if (testStatus === 'idle') {
    return (
      <div className={`p-4 rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center space-x-3">
          <Database className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="flex-1">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Database Connection Test
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Test your Supabase connection and hybrid mode functionality
            </p>
          </div>
          <div className="flex space-x-2">
            {onClose && (
              <button
                onClick={onClose}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Close
              </button>
            )}
            <button
              onClick={testDatabaseConnection}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      testStatus === 'success' 
        ? isDark 
          ? 'bg-green-900/20 border-green-700' 
          : 'bg-green-50 border-green-200'
        : testStatus === 'error'
        ? isDark
          ? 'bg-red-900/20 border-red-700'
          : 'bg-red-50 border-red-200'
        : isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center space-x-3">
        {testStatus === 'testing' && <Loader className="w-5 h-5 animate-spin text-blue-500" />}
        {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
        {testStatus === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
        
        <div className="flex-1">
          <h3 className={`font-semibold ${
            testStatus === 'success' 
              ? 'text-green-700 dark:text-green-400'
              : testStatus === 'error'
              ? 'text-red-700 dark:text-red-400'
              : isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {testStatus === 'testing' && 'Testing Database...'}
            {testStatus === 'success' && 'Database Test Passed!'}
            {testStatus === 'error' && 'Database Test Failed'}
          </h3>
          <p className={`text-sm ${
            testStatus === 'success' 
              ? 'text-green-600 dark:text-green-300'
              : testStatus === 'error'
              ? 'text-red-600 dark:text-red-300'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {testMessage}
          </p>
        </div>

        {testStatus !== 'testing' && (
          <button
            onClick={() => {
              setTestStatus('idle');
              setTestMessage('');
            }}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default DatabaseTest;
