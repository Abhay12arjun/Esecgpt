import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { settingsService } from "../services/settingsService";

export default function Settings() {
  const { user, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState("");

  // ----------------------------
  // Update Profile
  // ----------------------------
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const res = await settingsService.updateProfileInfo(user, {
        displayName,
        photoFile,
      });
      setMsg("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setMsg("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Change Password
  // ----------------------------
  const handleChangePassword = async () => {
    if (!password.trim()) return;
    try {
      setLoading(true);
      await settingsService.changePassword(user, password);
      setMsg("Password updated successfully!");
      setPassword("");
    } catch (err) {
      console.error(err);
      setMsg("Failed to update password. You may need to re-login.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Clear All Chats
  // ----------------------------
  const handleClearChats = async () => {
    if (!window.confirm("Are you sure you want to clear all chats?")) return;
    try {
      setLoading(true);
      await settingsService.clearAllChats(user.uid);
      setMsg("All chats cleared!");
    } catch (err) {
      console.error(err);
      setMsg("Failed to clear chats");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Clear All Projects
  // ----------------------------
  const handleClearProjects = async () => {
    if (!window.confirm("Are you sure you want to clear all projects?")) return;
    try {
      setLoading(true);
      await settingsService.clearAllProjects(user.uid);
      setMsg("All projects cleared!");
    } catch (err) {
      console.error(err);
      setMsg("Failed to clear projects");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Delete Account
  // ----------------------------
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This will delete ALL data permanently.")) return;
    try {
      setLoading(true);
      await settingsService.deleteAccount(user);
      alert("Account deleted successfully");
      logout();
    } catch (err) {
      console.error(err);
      setMsg("Failed to delete account. Re-login may be required.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      {msg && <div className="mb-4 text-green-600">{msg}</div>}

      {/* ------------------- Profile ------------------- */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-semibold mb-2">Profile</h3>
        <input
          type="text"
          className="border rounded p-2 mb-2 w-full"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display Name"
        />
        <input
          type="file"
          className="mb-2"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files[0])}
        />
        <button
          disabled={loading}
          onClick={handleProfileUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update Profile
        </button>
      </div>

      {/* ------------------- Password ------------------- */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-semibold mb-2">Account Security</h3>
        <input
          type="password"
          className="border rounded p-2 mb-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password"
        />
        <button
          disabled={loading}
          onClick={handleChangePassword}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Change Password
        </button>
        <button
          onClick={logout}
          className="ml-2 bg-gray-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* ------------------- Data Controls ------------------- */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-semibold mb-2">Data Controls</h3>
        <button
          disabled={loading}
          onClick={handleClearChats}
          className="bg-red-500 text-white px-4 py-2 rounded mb-2 block w-full"
        >
          Clear All Chats
        </button>
        <button
          disabled={loading}
          onClick={handleClearProjects}
          className="bg-red-500 text-white px-4 py-2 rounded mb-2 block w-full"
        >
          Clear All Projects
        </button>
        <button
          disabled={loading}
          onClick={handleDeleteAccount}
          className="bg-red-700 text-white px-4 py-2 rounded block w-full"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
