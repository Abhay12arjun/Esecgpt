import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import ChatPage from "./pages/ChatPage";
import ProjectPage from "./pages/ProjectPage";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="/project/:projectId" element={<ProjectPage />}>
  <Route path="chat/:chatId" element={<ChatPage />} />
</Route>

        <Route path="chat/:chatId" element={<ChatPage />} /> {/* Normal chat */}
        <Route path="project/:projectId" element={<ProjectPage />}>
          <Route path="chat/:chatId" element={<ChatPage />} /> {/* Project chat */}
        </Route>
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
