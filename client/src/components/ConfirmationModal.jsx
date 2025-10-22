import { X, AlertTriangle } from "lucide-react";

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger", // "danger" or "warning"
  loading = false 
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: "text-red-400",
      button: "bg-red-900/40 hover:bg-red-900/60 border-red-700/50 text-red-400 hover:text-red-300",
      border: "border-red-700/50",
      bg: "bg-red-900/20"
    },
    warning: {
      icon: "text-amber-400",
      button: "bg-amber-900/40 hover:bg-amber-900/60 border-amber-700/50 text-amber-400 hover:text-amber-300",
      border: "border-amber-700/50",
      bg: "bg-amber-900/20"
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-gray-900/50 to-indigo-900/20"></div>
        <div className="relative p-8">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50 p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90 transform duration-300"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className={`w-20 h-20 ${styles.bg} ${styles.border} border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm`}>
              <AlertTriangle size={36} className={styles.icon} />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-4">
              {title}
            </h3>

            {/* Message */}
            <p className="text-gray-300 text-base leading-relaxed mb-8">
              {message}
            </p>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 rounded-xl text-gray-300 hover:text-white font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onConfirm();
                }}
                disabled={loading}
                className={`flex-1 px-6 py-3 border rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 ${styles.button}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;