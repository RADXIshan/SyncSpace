import { useState } from "react";
import { X, Mail, Copy, UserPlus, Send, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const InviteModal = ({ organization, onClose }) => {
  const [activeTab, setActiveTab] = useState("copy");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`Hi! You've been invited to join ${organization?.name || "our organization"} on SyncSpace. Use the invite code below to join us!`);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Copy invite code to clipboard
  const handleCopyCode = async () => {
    if (!organization?.code) return;
    
    try {
      await navigator.clipboard.writeText(organization.code);
      setCopied(true);
      toast.success(`Invite code ${organization.code} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = organization.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`Invite code ${organization.code} copied to clipboard!`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Send invite via email
  const handleSendInvite = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return toast.error("Please enter an email address");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return toast.error("Invalid email format");
    }

    setLoading(true);
    let toastId;

    try {
      toastId = toast.loading("Sending invitation...");

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${organization.id}/invite`,
        {
          emails: [email.trim()],
          message: message.trim(),
          organizationName: organization.name,
          inviteCode: organization.code,
        },
        { withCredentials: true }
      );

      toast.success("Invitation sent successfully!", { id: toastId });
      onClose();
    } catch (err) {
      console.error("Error sending invitation:", err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to send invitation",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "copy", label: "Copy Code", icon: Copy },
    { id: "email", label: "Send via Email", icon: Mail },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-sm sm:max-w-2xl glass-dark rounded-2xl sm:rounded-3xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 cosmic-bg"></div>
        <div className="relative px-4 sm:px-8 py-6 sm:py-10">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 z-10 p-1.5 sm:p-2 rounded-full hover:bg-white/10 hover:rotate-90"
          >
            <X size={18} className="sm:w-[22px] sm:h-[22px]" />
          </button>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 glass-button-enhanced rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <UserPlus size={24} className="text-purple-400 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">
              Invite People
            </h2>
            <p className="text-gray-300 text-sm sm:text-base px-2">
              Invite others to join <span className="font-semibold text-violet-300">{organization?.name}</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 sm:mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "glass-button-enhanced text-violet-300 border border-violet-500/30"
                      : "glass-effect text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <Icon size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "copy" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Organization Info */}
              <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-3 sm:p-4">
                <div className="flex items-center mb-3">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 mr-2" />
                  <h3 className="font-semibold text-violet-300 text-sm sm:text-base">Organization Invite Code</h3>
                </div>
                <p className="text-xs sm:text-sm text-violet-200/80 mb-4">
                  Share this code with others so they can join your organization
                </p>
                
                {/* Invite Code Display */}
                <div className="border border-white/10 bg-black/20 rounded-lg p-3 sm:p-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-1">Invite Code</p>
                      <p className="text-lg sm:text-2xl font-mono font-bold text-white tracking-widest break-all">
                        {organization?.code || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 w-full sm:w-auto border cursor-pointer ${
                        copied
                          ? "bg-green-500/10 text-green-300 border-green-500/30 hover:bg-green-500/15"
                          : "bg-violet-500/10 text-violet-300 border-violet-500/30 hover:bg-violet-500/15"
                      }`}
                    >
                      {copied ? <Check size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" /> : <Copy size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />}
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-xs sm:text-sm text-gray-300 border border-white/10 bg-white/5 rounded-lg p-3">
                  <p className="font-medium mb-2">How to share:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-gray-400">
                    <li>Copy the invite code above</li>
                    <li>Share it with the person you want to invite</li>
                    <li>They can join by entering this code in the "Join Organization" option</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <form onSubmit={handleSendInvite} className="space-y-4 sm:space-y-6">
              {/* Email Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                  Email Recipient
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl glass-effect text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Invitation Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a custom message..."
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl glass-effect text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none resize-none placeholder-gray-400 transition-all duration-200 sm:rows-4"
                />
                <p className="text-xs text-gray-400 mt-2">
                  The invite code will be automatically included in the email
                </p>
              </div>

              {/* Send Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg glass-button text-gray-400 hover:text-gray-300 font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-xl glass-button-enhanced text-violet-400 hover:text-violet-300 font-semibold text-sm sm:text-base transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-xs sm:text-sm">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} className="sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;