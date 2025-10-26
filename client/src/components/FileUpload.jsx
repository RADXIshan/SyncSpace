import { useState, useRef } from "react";
import { Upload, X, File, Image } from "lucide-react";
import { toast } from "react-hot-toast";

const FileUpload = ({ onUpload, onClose, maxFiles = 5, maxSize = 10 * 1024 * 1024 }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    }).slice(0, maxFiles);

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
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

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
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
    return <File size={20} className="text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-purple-500 bg-purple-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">
            Drag and drop files here, or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-500">
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
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded border"
                >
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X size={16} className="text-gray-500" />
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
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFiles.length > 0
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
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