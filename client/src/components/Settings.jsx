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
    photo: user?.user_photo || null,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;

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
      <div className="relative w-full max-w-2xl bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
            Settings
          </h1>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Profile Section */}
        <div className="p-8 space-y-8">
          <div className="flex items-center gap-6">
            {(editMode ? formData.photo : user?.photo) ? (
              <img
                src={editMode ? formData.photo || user?.photo : user?.photo}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-500/60 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
              {editMode && (
                <label className="mt-3 cursor-pointer text-sm font-medium text-violet-500 hover:text-violet-400 transition-colors">
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
              <div key={field}>
                <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                  {field}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  disabled={!editMode}
                  className={`w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none ${
                    !editMode ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
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
                    className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 pr-10 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
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
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white opacity-70"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-white/10">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-500 cursor-pointer text-white font-medium transition-all shadow-md"
            >
              Delete Account
            </button>

            <div className="space-x-3">
              {editMode ? (
                <>
                  <button
                    onClick={toggleEdit}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 font-medium transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all cursor-pointer"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleEdit}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all cursor-pointer"
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
