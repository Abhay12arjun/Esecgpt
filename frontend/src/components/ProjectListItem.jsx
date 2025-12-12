// src/components/ProjectListItem.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../services/projectService";
import { chatService } from "../services/chatService";

export default function ProjectListItem({ project, open, canCreate = true, user }) {
  const navigate = useNavigate();

  // State
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name || "");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(!!project.id); // If project exists, already "created"
  const [creating, setCreating] = useState(!project.id && canCreate); // Show create input for new project

  // Navigate to project page
  const goToProject = () => {
    if (project.id) {
      navigate(`/project/${project.id}`);
    }
  };

  // Rename existing project
  const handleRename = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await projectService.renameProject(project.id, name);
      setEditing(false);
    } catch (err) {
      console.error("Rename failed", err);
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDelete = async () => {
    if (!project.id) return;

    const ok = confirm(
      `Delete project "${project.name}"? This will not delete chats. You can clear project assignments manually.`
    );
    if (!ok) return;

    try {
      await projectService.deleteProject(project.id);
      await chatService.clearProjectFromChats(project.id, user.uid);
      setCreated(false); // allow creating a new project again
      setCreating(true); // show the create input again
    } catch (err) {
      console.error("Delete project failed", err);
    }
  };

  // Create new project
  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const newProject = await projectService.createProject({ name });
      setCreated(true);
      setCreating(false);
      navigate(`/project/${newProject.id}`);
    } catch (err) {
      console.error("Project creation failed", err);
    } finally {
      setSaving(false);
    }
  };

  // Cancel new project creation
  const handleCancelCreate = () => {
    setName("");       // clear input
    setCreating(false); // hide input
  };

  // Render "new project" input if creating
  if (!created && creating) {
    return (
      <div className="px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-sm font-semibold">
          
        </div>
        <div className="flex-1 flex gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
            className="px-1 py-0.5 rounded border bg-white dark:bg-gray-800 flex-1 max-w-[100px] text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-2 py-0.5 rounded bg-green-600 text-white text-sm"
          >
            {saving ? "Creating..." : "Create"}
          </button>
          <button
            onClick={handleCancelCreate}
            className="px-2 py-0.5 rounded border text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render existing project
  return (
    <div className="px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-sm font-semibold">
        {project.name?.[0] || "P"}
      </div>

      {open ? (
        <div className="flex-1">
          {!editing ? (
            <div className="flex items-center justify-between">
              <div className="cursor-pointer" onClick={goToProject}>
                {project.name}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs px-2 py-0.5 rounded hover:bg-gray-200"
                >
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs px-2 py-0.5 rounded hover:bg-red-100 text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-1 py-0.5 rounded border bg-white dark:bg-gray-800 max-w-[200px] text-sm"
              />
              <button
                onClick={handleRename}
                disabled={saving}
                className="px-2 py-0.5 rounded bg-blue-600 text-white text-sm"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(project.name); // reset name on cancel
                }}
                className="px-2 py-0.5 rounded border text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="truncate">{project.name}</div>
      )}
    </div>
  );
}
