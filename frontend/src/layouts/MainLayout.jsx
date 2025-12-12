import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * MainLayout
 * - includes sidebar + main content area
 * - handles dark/light mode and responsive layout
 */

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  // Theme: load from localStorage or default to dark
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          theme={theme}
          setTheme={setTheme}
        />
        <main className="flex-1 h-screen overflow-hidden">
          {/* header (optional) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen((s) => !s)}
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-lg font-semibold">EsecGPT</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Signed in as</span>
              <div className="flex items-center gap-2">
                <img
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || "U")}`}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="text-sm">{user?.displayName || user?.email}</div>
              </div>
            </div>
          </div>

          {/* content outlet */}
          <div className="h-[calc(100vh-56px)] overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
