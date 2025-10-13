import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, X, Save} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

const Settings = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    photo: user?.user_photo || null,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Original values for change detection
  const originalValues = useRef({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    photo: user?.user_photo || null
  });

  // Check for unsaved changes
  const checkForUnsavedChanges = () => {
    if (!editMode) return false;
    
    const original = originalValues.current;
    return (
      formData.name !== original.name ||
      formData.email !== original.email ||
      formData.password !== original.password ||
      (photoFile !== null) || // New photo selected
      (formData.photo !== original.photo && formData.photo !== user?.user_photo)
    );
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Track changes for unsaved changes detection
  useEffect(() => {
    if (editMode) {
      const hasChanges = checkForUnsavedChanges();
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [formData, photoFile, editMode]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const r2 = new FileReader();
      r2.onloadend = () => resolve(r2.result);
      r2.onerror = reject;
      r2.readAsDataURL(blob);
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const fr = new FileReader();

    fr.onload = (ev) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(800 / img.width, 800 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return;
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
            });
            setPhotoFile(compressedFile);

            try {
              const base64 = await blobToBase64(blob);
              setFormData((prev) => ({ ...prev, photo: base64 }));
            } catch (e) {
              console.error("Error converting image", e);
            }
          },
          "image/jpeg",
          0.8
        );
      };
      img.src = ev.target.result;
    };

    fr.readAsDataURL(file);
  };

  // Handle closing with unsaved changes
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => {
        if (typeof onClose === "function") onClose();
        else navigate(-1);
      });
      setShowUnsavedChangesModal(true);
    } else {
      if (typeof onClose === "function") onClose();
      else navigate(-1);
    }
  };
  
  // Handle cancel editing with unsaved changes
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => {
        setFormData({
          name: user?.name || "",
          email: user?.email || "",
          password: "",
          photo: user?.user_photo || null,
        });
        setPhotoFile(null);
        setEditMode(false);
        setHasUnsavedChanges(false);
      });
      setShowUnsavedChangesModal(true);
    } else {
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        password: "",
        photo: user?.user_photo || null,
      });
      setPhotoFile(null);
      setEditMode(false);
    }
  };
  
  // Discard changes and proceed with pending action
  const discardChanges = () => {
    setShowUnsavedChangesModal(false);
    setHasUnsavedChanges(false);
    
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };
  
  // Cancel unsaved changes modal
  const cancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  const toggleEdit = () => {
    if (editMode && hasUnsavedChanges) {
      handleCancelEdit();
    } else if (editMode) {
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        password: "",
        photo: user?.user_photo || null,
      });
      setPhotoFile(null);
      setEditMode(false);
    } else {
      setEditMode(true);
      // Update original values when entering edit mode
      originalValues.current = {
        name: user?.name || "",
        email: user?.email || "",
        password: "",
        photo: user?.user_photo || null
      };
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Updating profile...");
      const token = localStorage.getItem("token");
      const form = new FormData();

      if (formData.name && formData.name !== user?.name)
        form.append("name", formData.name);
      if (formData.email && formData.email !== user?.email)
        form.append("email", formData.email);
      if (formData.password) form.append("password", formData.password);
      if (photoFile) form.append("profilePicture", photoFile);

      if ([...form.keys()].length === 0) {
        toast.dismiss(toastId);
        toast("No changes to update");
        setEditMode(false);
        return;
      }

      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/auth/updateProfile`,
        form,
        {
          withCredentials: true,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Profile updated successfully", { id: toastId });
      await checkAuth();
      
      // Update original values to reflect saved state
      originalValues.current = {
        name: formData.name,
        email: formData.email,
        password: "",
        photo: formData.photo
      };
      setHasUnsavedChanges(false);
      setEditMode(false);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Deleting account...");
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/auth/delete`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success("Account deleted", { id: toastId });
      setShowDeleteConfirm(false);
      window.location.href = "/";
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[90vh] px-8 py-10">
          <div className="space-y-8">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10"
            >
              <X size={22} />
            </button>
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
                Profile Settings
              </h2>
              <p className="text-gray-400 text-sm">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Profile Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-6">
                {(editMode ? formData.photo : user?.user_photo) ? (
                  <img
                    src={editMode ? formData.photo || user?.user_photo : user?.user_photo}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-violet-500/30 shadow-xl hover:ring-violet-500/50 transition-all duration-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl hover:scale-105 transition-transform duration-200">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                  <p className="text-gray-300">{user?.email}</p>
                  {editMode && (
                    <label className="mt-4 cursor-pointer text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors active:scale-95 bg-violet-500/20 px-4 py-2 rounded-lg hover:bg-violet-500/30 inline-block">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
              
              {["name", "email"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                    {field === "name" ? "Full Name" : "Email Address"}
                  </label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none ${
                      !editMode ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                {editMode ? (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                ) : (
                  <input
                    type="password"
                    value="••••••••"
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white opacity-70 cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center gap-4 pt-6 border-t border-white/10">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
              >
                Delete Account
              </button>

              <div className="flex gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={toggleEdit}
                      disabled={loading}
                      className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2 justify-center ${
                        hasUnsavedChanges 
                          ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300" 
                          : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300"
                      }`}
                    >
                      <Save size={16} />
                      {loading ? "Saving..." : hasUnsavedChanges ? "Save Changes*" : "Save Changes"}
                      {hasUnsavedChanges && !loading && (
                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={toggleEdit}
                    className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Account"
        message="Are you sure you want to delete your account? This will permanently remove all your data, including your profile, organization memberships, and settings. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
      
      {/* Unsaved Changes Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnsavedChangesModal}
        onClose={cancelUnsavedChanges}
        onConfirm={discardChanges}
        title="Unsaved Changes"
        message="You have unsaved changes that will be lost if you continue. Are you sure you want to discard these changes?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
        loading={false}
      />
    </div>
  );
};

export default Settings;
