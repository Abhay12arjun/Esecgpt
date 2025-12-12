import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Welcome, {user?.displayName || user?.email}
        </h1>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          This is a placeholder dashboard. Continue building your chat UI here.
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
