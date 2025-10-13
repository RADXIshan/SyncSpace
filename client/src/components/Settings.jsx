import { useState } from "react";
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const toggleEdit = () => {
    if (editMode) {
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        password: "",
        photo: user?.photo || null,
      });
      setPhotoFile(null);
    }
    setEditMode(!editMode);
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

  const handleClose = () => {
    if (typeof onClose === "function") onClose();
    else navigate(-1);
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
      <div className="relative w-full max-w-2xl bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 sticky top-0 bg-black/20 backdrop-blur-sm">
          <h1 className="text-3xl font-bold gradient-text">
            Settings
          </h1>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 p-2 rounded-full hover:bg-white/10"
          >
            <X size={22} />
          </button>
        </div>

          {/* Profile Section */}
          <div className="p-8 space-y-8">
          <div className="flex items-center gap-6">
            {(editMode ? formData.photo : user?.photo) ? (
              <img
                src={editMode ? formData.photo || user?.photo : user?.photo}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-500/30 shadow-xl hover:ring-purple-500/50 transition-all duration-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-3xl font-bold text-white shadow-xl hover:scale-105 transition-transform duration-200">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-300 text-lg">{user?.email}</p>
              {editMode && (
                <label className="mt-4 cursor-pointer text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors active:scale-95 bg-purple-500/20 px-4 py-2 rounded-lg hover:bg-purple-500/30 inline-block w-fit">
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

          {/* Editable Fields */}
          <div className="space-y-6">
            {["name", "email"].map((field) => (
              <div key={field} className="form-group">
                <label className="form-label-dark capitalize">
                  {field}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  disabled={!editMode}
                  className={`input-glass ${
                    !editMode ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            ))}

            {/* Password */}
            <div className="form-group">
              <label className="form-label-dark">
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
                    className="input-glass pr-12"
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
                  value="********"
                  readOnly
                  className="input-glass opacity-70"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto"
            >
              Delete Account
            </button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {editMode ? (
                <>
                  <button
                    onClick={toggleEdit}
                    disabled={loading}
                    className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto flex items-center gap-2 justify-center"
                  >
                    <Save size={16} />{loading ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleEdit}
                  className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto"
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
    </div>
  );
};

export default Settings;
