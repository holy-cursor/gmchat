import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-3xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              About Parc3l
            </h3>
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
            <p>
              Parc3l is a decentralized messaging app built as a Base Mini App, enabling seamless communication on the Base blockchain.
            </p>
            
            <p>
              <strong>Core idea:</strong> Every message is sent with a small ETH transfer to ensure on-chain permanence and direct wallet-to-wallet communication.
            </p>
            
            <p>
              <strong>Why it's different:</strong> No signups, no hidden costs — just connect your Base wallet and start messaging. Built specifically for the Base ecosystem.
            </p>
            
            <p>
              <strong>ETH transfer model:</strong> Sending messages includes a small ETH transfer (0.001 ETH) plus Base network gas fees.
            </p>
            
            <p>
              <strong>Transparency:</strong> Messages are stored locally and tied to wallet addresses. Add custom tags to identify contacts easily.
            </p>
            
            <div className={`pt-4 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Built by: David ADeyemi
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700'
              }`}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
