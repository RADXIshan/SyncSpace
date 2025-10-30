import { useState } from "react";
import { X, Users } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-md glass-dark rounded-2xl sm:rounded-3xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 cosmic-bg"></div>
        <form onSubmit={handleSubmit} className="relative px-8 py-10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white transition-all transform text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-white/10 hover:rotate-90 duration-300"
          >
            <X size={22} />
          </button>
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 glass-button-enhanced rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users size={24} className="text-purple-400 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">
              Join Organisation
            </h2>
            <p className="text-gray-300 text-sm sm:text-base">Enter the invite code to join an organization</p>
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
                  className="w-full px-4 py-3 rounded-xl glass-effect text-white text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200"
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
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg glass-button text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto disabled:opacity-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !orgCode.trim()}
                className="px-6 py-3 rounded-xl glass-button-enhanced text-violet-400 hover:text-violet-300 font-semibold transition-all duration-300 cursor-pointer active:scale-95 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
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