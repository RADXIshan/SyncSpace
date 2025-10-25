import { useState } from 'react';
import { ChevronDown, Circle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const StatusSelector = ({ className = '' }) => {
  const { updateUserStatus } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('online');
  const [customStatus, setCustomStatus] = useState('');

  const statusOptions = [
    { value: 'online', label: 'Online', color: 'bg-green-500' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500' },
    { value: 'busy', label: 'Busy', color: 'bg-red-500' },
    { value: 'invisible', label: 'Invisible', color: 'bg-gray-500' }
  ];

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
    updateUserStatus(status, customStatus);
    setIsOpen(false);
  };

  const handleCustomStatusChange = (e) => {
    const newCustomStatus = e.target.value;
    setCustomStatus(newCustomStatus);
    updateUserStatus(currentStatus, newCustomStatus);
  };

  const getCurrentStatusOption = () => {
    return statusOptions.find(option => option.value === currentStatus) || statusOptions[0];
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600/50 rounded-lg transition-all duration-200 text-sm font-medium text-white w-full"
      >
        <Circle size={12} className={`${getCurrentStatusOption().color} rounded-full`} />
        <span className="flex-1 text-left">{getCurrentStatusOption().label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder="Set a custom status..."
                value={customStatus}
                onChange={handleCustomStatusChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={50}
              />
            </div>
            <div className="border-t border-slate-600/50">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                    currentStatus === option.value
                      ? 'bg-purple-600/20 text-purple-300'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Circle size={12} className={`${option.color} rounded-full`} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatusSelector;