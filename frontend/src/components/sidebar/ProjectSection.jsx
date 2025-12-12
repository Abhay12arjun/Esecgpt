import projectService from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function ProjectSection() {
  const { user } = useAuth();
  const [newProjectName, setNewProjectName] = useState("");

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;

    await projectService.createProject(user.uid, newProjectName);
    setNewProjectName("");
  };

  return (
    <div className="p-3">
      <h2 className="text-sm text-gray-400 uppercase">Projects</h2>

      <div className="flex mt-2">
        <input
          className="flex-1 bg-gray-800 p-2 rounded text-white"
          placeholder="New project..."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />
        <button
          onClick={handleAddProject}
          className="ml-2 bg-blue-600 px-3 rounded text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}
