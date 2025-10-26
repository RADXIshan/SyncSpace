import { useState, useRef } from "react";
import { Upload, X, File, Image } from "lucide-react";
import { toast } from "react-hot-toast";

// Debug wrapper for toast to catch undefined values
const safeToast = {
  success: (message, options) => {
    if (message && message !== 'undefined') {
      return toast.success(message, options);
    } else {
      console.warn('Attempted to show undefined success toast:', message);
      return toast.success('Action completed successfully', options);
    }
  },
  error: (message, options) => {
    if (message && message !== 'undefined') {
      return toast.error(message, options);
    } else {
      console.warn('Attempted to show undefined error toast:', message);
      return toast.error('An error occurred', options);
    }
  },
  warning: (message, options) => {
    if (message && message !== 'undefined') {
      return toast(message, { ...options, icon: '⚠️' });
    } else {
      console.warn('Attempted to show undefined warning toast:', message);
      return toast('Warning', { ...options, icon: '⚠️' });
    }
  }
};

const FileUpload = ({ onUpload, onClose, maxFiles = 5, maxSize = 10 * 1024 * 1024 }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const fileName = file.name || 'Unknown file';
      
      if (file.size > maxSize) {
        safeToast.error(`${fileName} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      
      // Check for potentially problematic file types (optional security check)
      const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com'];
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (dangerousExtensions.includes(extension)) {
        safeToast.error(`${fileName} file type is not allowed for security reasons`);
        return false;
      }
      
      return true;
    }).slice(0, maxFiles);

    // Check for duplicates
    const newFiles = validFiles.filter(file => 
      !selectedFiles.some(existing => 
        existing.name === file.name && existing.size === file.size
      )
    );

    if (newFiles.length !== validFiles.length) {
      safeToast.warning('Some files were already selected and skipped');
    }

    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      try {
        await onUpload(selectedFiles);
        setSelectedFiles([]);
        // The parent component (TeamChat) will handle closing the modal
      } catch (error) {
        console.error('Upload failed:', error);
        // Keep files selected if upload failed so user can retry
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image size={20} className="text-blue-500" />;
    }
    if (file.type.startsWith('video/')) {
      return <span className="text-lg">🎬</span>;
    }
    if (file.type.startsWith('audio/')) {
      return <span className="text-lg">🎵</span>;
    }
    if (file.type.includes('pdf')) {
      return <span className="text-lg">📄</span>;
    }
    if (file.type.includes('document') || file.type.includes('word')) {
      return <span className="text-lg">📝</span>;
    }
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
      return <span className="text-lg">📊</span>;
    }
    if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
      return <span className="text-lg">📽️</span>;
    }
    if (file.type.includes('zip') || file.type.includes('compressed')) {
      return <span className="text-lg">🗜️</span>;
    }
    
    // Fallback based on file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <span className="text-lg">📄</span>;
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
        return <span className="text-lg">🎵</span>;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <span className="text-lg">🎬</span>;
      case 'doc':
      case 'docx':
        return <span className="text-lg">📝</span>;
      case 'xls':
      case 'xlsx':
        return <span className="text-lg">📊</span>;
      case 'ppt':
      case 'pptx':
        return <span className="text-lg">📽️</span>;
      case 'zip':
      case 'rar':
      case '7z':
        return <span className="text-lg">🗜️</span>;
      default:
        return <File size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-2xl p-6 w-full max-w-lg mx-4 border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Upload Files</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? "border-purple-400 bg-purple-500/10"
              : "border-gray-500 hover:border-gray-400 hover:bg-gray-500/5"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-200 mb-2">
            Drag and drop files here, or{" "}
            <span className="text-purple-400 font-medium">
              click to browse
            </span>
          </p>
          <p className="text-sm text-gray-400">
            Maximum {maxFiles} files, {maxSize / 1024 / 1024}MB each
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(e.target.files);
            }
          }}
        />

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-white mb-2">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={16} className="text-gray-300" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFiles.length > 0
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg cursor-pointer"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;