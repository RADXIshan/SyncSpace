import { useState } from "react";
import { useNavigate } from "react-router"; 
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const Settings = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    photo: user?.photo || null,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ default hidden

  // Handle text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert blob → base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const r2 = new FileReader();
      r2.onloadend = () => resolve(r2.result);
      r2.onerror = reject;
      r2.readAsDataURL(blob);
    });
  };

  // Handle photo input + compress
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

  // Toggle edit mode
  const toggleEdit = () => {
    if (editMode) {
      // Revert changes if cancelling
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

  // Save changes
  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // ✅ properly defined
      const payload = {};

      if (formData.name && formData.name !== user?.name)
        payload.name = formData.name;
      if (formData.email && formData.email !== user?.email)
        payload.email = formData.email;
      if (formData.password) payload.password = formData.password;
      if (formData.photo && formData.photo !== user?.photo)
        payload.photo = formData.photo;

      if (Object.keys(payload).length === 0) {
        toast("No changes to update");
        setEditMode(false);
        return;
      }

      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/auth/updateProfile`,
        payload,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      toast.success("Profile updated successfully");
      await checkAuth();
      setEditMode(false);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Close modal
  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Delete account
  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/auth/delete`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success("Account deleted");
      window.location.href = "/";
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent bg-opacity-10">
      <div className="bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-xl p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 cursor-pointer"
          onClick={handleClose}
        >
          ✕
        </button>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
            <div className="space-y-4">
              {/* Profile Photo */}
              <div className="flex items-center space-x-4">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl font-semibold text-gray-700">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
                {editMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer">
                      Profile Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-gray-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-secondary)] file:text-white hover:file:bg-opacity-90"
                    />
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:bg-gray-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:bg-gray-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
              disabled={loading}
            >
              Delete Account
            </button>
            <div className="space-x-3">
              {editMode ? (
                <>
                  <button
                    onClick={toggleEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors cursor-pointer"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[var(--color-secondary)] text-white rounded-md hover:bg-violet-800 transition-colors disabled:opacity-60 cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleEdit}
                  className="px-4 py-2 bg-[var(--color-secondary)] text-white rounded-md hover:bg-violet-800 transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
