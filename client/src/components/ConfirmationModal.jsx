import { X, AlertTriangle } from "lucide-react";

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger",
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-sm sm:max-w-md glass-dark rounded-2xl sm:rounded-3xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform mx-auto px-4">
        <div className="absolute inset-0 cosmic-bg"></div>
        <div className="relative p-4 sm:p-8">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50 p-1.5 sm:p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90 transform duration-300"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 glass-button-enhanced rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
              <AlertTriangle size={28} className={`${styles.icon} sm:w-9 sm:h-9`} />
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 px-2 gradient-text">
              {title}
            </h3>

            {/* Message */}
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 px-2">
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                disabled={loading}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl glass-button text-gray-400 hover:text-gray-300 font-semibold text-sm sm:text-base transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95"
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
                className={`w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95 glass-button-enhanced ${styles.button}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-xs sm:text-sm">Processing...</span>
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