import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

// Modal for joining an organisation via invite / code
const JoinOrgModal = ({ onClose, onSuccess }) => {
  const [orgCode, setOrgCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgCode.trim()) return toast.error("Please enter the invite code");
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Joining organisation...");

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/join`, 
        { code: orgCode.trim() }, 
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      toast.success("Successfully joined organisation", { id: toastId });
      if (onSuccess) onSuccess(response.data.organization);

      // Notify other components of organization change
      window.dispatchEvent(new CustomEvent('organizationUpdated', { detail: response.data.organization }));

      onClose();
      
      // Refresh the page to show the joined organization
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to allow modal to close gracefully
    } catch (err) {
      console.error("Error joining organization:", err);
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Something went wrong", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-md bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.02] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <form onSubmit={handleSubmit} className="relative px-8 py-10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white transition-all transform text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-white/10 hover:rotate-90 duration-300"
          >
            <X size={22} />
          </button>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
              Join Organisation
            </h2>
            <p className="text-gray-400 text-sm">Enter the invite code to join an organization</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Enter the 6-character code provided by the organization
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !orgCode.trim()}
                className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  "Join Organization"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinOrgModal;