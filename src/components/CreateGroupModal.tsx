import React, { useState } from 'react';
import { X, Users, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: { name: string; description: string; members: string[] }) => void;
  isCreating: boolean;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  isCreating,
}) => {
  const { isDark } = useTheme();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [memberAddress, setMemberAddress] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  const handleAddMember = () => {
    if (memberAddress.trim() && !members.includes(memberAddress.trim())) {
      setMembers([...members, memberAddress.trim()]);
      setMemberAddress('');
    }
  };

  const handleRemoveMember = (address: string) => {
    setMembers(members.filter(member => member !== address));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim() && members.length > 0) {
      onCreateGroup({
        name: groupName.trim(),
        description: description.trim(),
        members,
      });
      // Reset form
      setGroupName('');
      setDescription('');
      setMemberAddress('');
      setMembers([]);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setDescription('');
    setMemberAddress('');
    setMembers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold flex items-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Users className="w-5 h-5 mr-2 text-green-500" />
            Create Group Chat
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="group-name" className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Group Name *
            </label>
            <input
              type="text"
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                  : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
              }`}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                  : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div>
            <label htmlFor="member-address" className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Add Members *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="member-address"
                value={memberAddress}
                onChange={(e) => setMemberAddress(e.target.value)}
                placeholder="Enter wallet address"
                className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  isDark 
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                    : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!memberAddress.trim() || members.includes(memberAddress.trim())}
                className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center ${
                  isDark 
                    ? 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Members ({members.length})
              </label>
              <div className={`max-h-32 overflow-y-auto space-y-2 ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              } rounded-xl p-3`}>
                {members.map((address, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isDark ? 'bg-gray-600' : 'bg-white'
                    }`}
                  >
                    <span className={`text-sm font-mono ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {address.length > 20 ? `${address.substring(0, 20)}...` : address}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(address)}
                      className={`p-1 rounded transition-colors ${
                        isDark 
                          ? 'hover:bg-gray-500 text-gray-400 hover:text-red-400' 
                          : 'hover:bg-gray-200 text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                isDark 
                  ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || members.length === 0 || isCreating}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
