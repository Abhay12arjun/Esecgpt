// src/pages/ProjectPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import ChatListItem from "../components/ChatListItem";

export default function ProjectPage() {
  const { projectId, chatId } = useParams(); // chatId is optional
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const navigate = useNavigate();

  // -----------------------------
  // Load project details
  // -----------------------------
  useEffect(() => {
    if (!user || !projectId) return;

    const fetchProject = async () => {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Project not found");
      }
    };

    fetchProject();
  }, [projectId, user]);

  // -----------------------------
  // Load chats for this project
  // -----------------------------
  useEffect(() => {
    if (!user || !projectId) return;

    const fetchChats = async () => {
      const q = query(
        collection(db, "chats"),
        where("userId", "==", user.uid),
        where("projectId", "==", projectId),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchChats();
  }, [projectId, user]);

  // -----------------------------
  // Create new chat in project
  // -----------------------------
  const createProjectChat = async () => {
    if (!user) return;

    try {
      const newChatRef = await addDoc(collection(db, "chats"), {
        userId: user.uid,
        title: "New Chat",
        projectId: projectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
      });

      // Refresh chat list
      setChats(prev => [{ id: newChatRef.id, userId: user.uid, title: "New Chat", projectId, messages: [] }, ...prev]);

      // Navigate to new chat window
      navigate(`/project/${projectId}/chat/${newChatRef.id}`);
      setCreatingChat(false);
    } catch (err) {
      console.error("Failed to create chat in project →", err);
    }
  };

  // -----------------------------
  // Select chat
  // -----------------------------
  const handleSelectChat = (c) => {
    navigate(`/project/${projectId}/chat/${c.id}`);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">Back</button>
        <button
          onClick={() => setCreatingChat(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          + New Chat
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">{project?.name || "Project"} Chats</h2>

      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* Chat List */}
        <div className="w-full md:w-1/3 overflow-auto border-r pr-2">
          {chats.length === 0 ? (
            <div className="text-gray-500">No chats assigned to this project.</div>
          ) : (
            chats.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelectChat(c)}
                className="cursor-pointer"
              >
                <ChatListItem chat={c} open={true} />
              </div>
            ))
          )}

          {/* New chat input */}
          {creatingChat && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value="New Chat"
                readOnly
                className="flex-1 px-2 py-1 border rounded"
              />
              <button
                onClick={createProjectChat}
                className="px-2 py-1 bg-green-600 text-white rounded"
              >
                Create
              </button>
              <button
                onClick={() => setCreatingChat(false)}
                className="px-2 py-1 border rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="w-full md:w-2/3 h-full overflow-auto border-l pl-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
