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
      button: "bg-red-600/30 hover:bg-red-600/40 border-red-500/40 text-red-200 hover:text-red-100",
      border: "border-red-500/20",
      bg: "bg-red-500/10"
    },
    warning: {
      icon: "text-yellow-400",
      button: "bg-yellow-600/30 hover:bg-yellow-600/40 border-yellow-500/40 text-yellow-200 hover:text-yellow-100",
      border: "border-yellow-500/20",
      bg: "bg-yellow-500/10"
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-md bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative p-6">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className={`w-16 h-16 ${styles.bg} ${styles.border} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <AlertTriangle size={32} className={styles.icon} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-3">
              {title}
            </h3>

            {/* Message */}
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-gray-200 font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
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
                className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${styles.button} cursor-pointer`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading...
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