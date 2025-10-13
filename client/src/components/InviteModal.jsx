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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative px-8 py-10">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-white/10"
          >
            <X size={22} />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
              Invite People
            </h2>
            <p className="text-gray-400 text-sm">
              Invite others to join <span className="font-semibold text-violet-300">{organization?.name}</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "copy" && (
            <div className="space-y-6">
              {/* Organization Info */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <UserPlus className="w-5 h-5 text-violet-400 mr-2" />
                  <h3 className="font-semibold text-violet-300">Organization Invite Code</h3>
                </div>
                <p className="text-sm text-violet-200/80 mb-4">
                  Share this code with others so they can join your organization
                </p>
                
                {/* Invite Code Display */}
                <div className="bg-black/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Invite Code</p>
                      <p className="text-2xl font-mono font-bold text-white tracking-widest">
                        {organization?.code || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        copied
                          ? "bg-green-600/20 text-green-300 border border-green-500/30"
                          : "bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30"
                      }`}
                    >
                      {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-sm text-gray-300 bg-white/5 rounded-lg p-3">
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
            <form onSubmit={handleSendInvite} className="space-y-6">
              {/* Email Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Email Recipient
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
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
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  The invite code will be automatically included in the email
                </p>
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Invitation
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