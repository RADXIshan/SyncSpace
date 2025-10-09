import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";

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

      // TODO: replace with real API call
      await new Promise((res) => setTimeout(res, 800));
      const mockOrg = { code: orgCode.trim(), name: "Demo Org" };

      toast.success("Successfully joined organisation", { id: toastId });
      if (onSuccess) onSuccess(mockOrg);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn px-8 py-10 hover:scale-[1.02] transition-transform"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95"
        >
          <X size={22} />
        </button>
        <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
          Join Organisation
        </h2>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-1">Invite Code</label>
          <input
            type="text"
            value={orgCode}
            onChange={(e) => setOrgCode(e.target.value)}
            placeholder="Enter organisation code"
            className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 font-medium transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg transition-all hover:opacity-90 cursor-pointer active:scale-95"
          >
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinOrgModal;