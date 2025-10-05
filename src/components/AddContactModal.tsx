import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (address: string, displayName?: string) => Promise<void>;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onAddContact }) => {
  const { isDark } = useTheme();
  const [address, setAddress] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (address.trim()) {
      setIsAdding(true);
      try {
        await onAddContact(address.trim(), displayName.trim() || undefined);
        setAddress('');
        setDisplayName('');
      } catch (error) {
        console.error('Failed to add contact:', error);
      } finally {
        setIsAdding(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-2xl ${
              isDark ? 'bg-green-900/50' : 'bg-green-100'
            }`}>
              <UserPlus className={`w-6 h-6 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Add Contact
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Base Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              placeholder="0x..."
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-lg ${
                isDark 
                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
            <p className={`text-xs mt-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Enter the Base wallet address (0x...)
            </p>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              placeholder="Enter a friendly name..."
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-lg ${
                isDark 
                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500'
              }`}
            />
            <p className={`text-xs mt-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              A friendly name to identify this contact
            </p>
          </div>

          <div className="flex space-x-2 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl transition-all duration-200 text-sm font-semibold ${
                isDark 
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !address.trim()}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700'
              }`}
            >
              {isAdding ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;
