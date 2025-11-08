import { useState, useEffect, useRef } from 'react';
import { Search, X, Hash, File, Video, User, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SmartSearch = ({ onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ messages: [], files: [], meetings: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ messages: [], files: [], meetings: [], users: [] });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/search?q=${encodeURIComponent(query)}`,
        { withCredentials: true }
      );
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: Object.values(results).flat().length },
    { id: 'messages', label: 'Messages', icon: Hash, count: results.messages?.length || 0 },
    { id: 'files', label: 'Files', icon: File, count: results.files?.length || 0 },
    { id: 'meetings', label: 'Meetings', icon: Video, count: results.meetings?.length || 0 },
    { id: 'users', label: 'People', icon: User, count: results.users?.length || 0 },
  ];

  const getFilteredResults = () => {
    if (activeTab === 'all') return results;
    return { [activeTab]: results[activeTab] || [] };
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-20 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-top-4 duration-500 border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages, files, meetings, people..."
              className="flex-1 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 outline-none text-lg font-medium"
            />
            {loading && <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />}
            <kbd className="hidden sm:inline-block px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-mono shadow-sm">
              ESC
            </kbd>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-105">
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {query.length < 2 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Type at least 2 characters to search</p>
            </div>
          ) : Object.values(filteredResults).flat().length === 0 && !loading ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredResults).map(([type, items]) => 
                items && items.length > 0 && (
                  <div key={type}>
                    {activeTab === 'all' && (
                      <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3 tracking-wide">
                        {type}
                      </h3>
                    )}
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => onNavigate && onNavigate(type, item)}
                          className="group p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        >
                          <div className="flex items-start gap-3">
                            {type === 'messages' && <Hash className="w-5 h-5 text-purple-600 mt-0.5 group-hover:scale-110 transition-transform" />}
                            {type === 'files' && <File className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />}
                            {type === 'meetings' && <Video className="w-5 h-5 text-green-600 mt-0.5 group-hover:scale-110 transition-transform" />}
                            {type === 'users' && <User className="w-5 h-5 text-orange-600 mt-0.5 group-hover:scale-110 transition-transform" />}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {item.title || item.name || item.content}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.channel_name && `#${item.channel_name} • `}
                                {item.created_at && new Date(item.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartSearch;
