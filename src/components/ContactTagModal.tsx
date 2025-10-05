import React, { useState, useEffect } from 'react';
import { X, Tag, User } from 'lucide-react';

interface ContactTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    address: string;
    displayName: string;
    customTag?: string;
  } | null;
  onSaveTag: (address: string, customTag: string) => void;
  onRemoveTag: (address: string) => void;
}

const ContactTagModal: React.FC<ContactTagModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSaveTag,
  onRemoveTag,
}) => {
  const [customTag, setCustomTag] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (contact) {
      setCustomTag(contact.customTag || '');
      setIsEditing(!!contact.customTag);
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  const handleSave = () => {
    if (customTag.trim()) {
      onSaveTag(contact.address, customTag.trim());
    } else {
      onRemoveTag(contact.address);
    }
    onClose();
  };

  const handleRemove = () => {
    onRemoveTag(contact.address);
    onClose();
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Contact</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contact Info */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {contact.customTag || formatAddress(contact.address)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 font-mono truncate">
                  {contact.address}
                </p>
              </div>
            </div>
          </div>

          {/* Tag Input */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Name/Tag
              </label>
              <input
                type="text"
                value={customTag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTag(e.target.value)}
                placeholder="Enter a custom name for this contact..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will help you identify this contact easily
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
              {isEditing && (
                <button
                  onClick={handleRemove}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Tag
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Update Tag' : 'Save Tag'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactTagModal;
