// src/components/Sidebar.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  FaPlus,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaChevronDown,
  FaChevronRight,
  FaTrash
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import { Link, useNavigate } from "react-router-dom";
import ChatListItem from "./ChatListItem";
import debounce from "lodash.debounce";

export default function Sidebar({ open, setOpen, theme, setTheme }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [chatsCollapsed, setChatsCollapsed] = useState(false);

  // -----------------------------
  // 📌 REAL-TIME CHAT LOADING
  // -----------------------------
  useEffect(() => {
    if (!user) return;
    const unsubscribe = chatService.onChatsSnapshot(user.uid, setChats);
    return () => unsubscribe();
  }, [user]);

  // -----------------------------
  // 📌 SEARCH (debounced)
  // -----------------------------
  const debouncedSetSearch = useCallback(
    debounce((v) => setSearch(v), 250),
    []
  );
  const onSearchChange = (e) => debouncedSetSearch(e.target.value);

  const filteredChats = chats.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.title || "").toLowerCase().includes(q) ||
      (c.lastMessage || "").toLowerCase().includes(q)
    );
  });

  // -----------------------------
  // 📌 DRAG & DROP DISABLED (no projects)
  // -----------------------------
  const onDragStart = (e, chatId) => {
    e.dataTransfer.setData("text/plain", chatId);
    e.dataTransfer.effectAllowed = "move";
  };

  // -----------------------------
  // 📌 DELETE CHAT
  // -----------------------------
  const handleDeleteChat = async (chatId) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      await chatService.deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      navigate("/");
    } catch (err) {
      console.error("Failed to delete chat →", err);
    }
  };

  return (
    <aside
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex-shrink-0 flex flex-col h-screen ${
        open ? "w-80" : "w-16"
      }`}
    >
      {/* HEADER */}
      <div className="px-3 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={async () => {
            const ref = await chatService.createChat(user.uid, "New chat");
            navigate(`/chat/${ref.id}`);
            setOpen(true);
          }}
          className="flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded"
        >
          <FaPlus />
          {open && <span className="font-medium">New Chat</span>}
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="ml-auto p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="px-3 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            onChange={onSearchChange}
            className="w-full pl-10 pr-3 py-2 rounded bg-gray-100 dark:bg-gray-700 placeholder-gray-500"
            placeholder={open ? "Search chats..." : "Search"}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <FaSearch />
          </div>
        </div>
      </div>

      {/* CHAT LIST */}
      <div className="flex-1 overflow-auto min-h-0 px-1 mt-3">
        <div
          className="px-2 flex items-center justify-between cursor-pointer text-xs text-gray-500 mb-2"
          onClick={() => setChatsCollapsed(!chatsCollapsed)}
        >
          {open ? "Your Chats" : "Chats"}
          {open && (chatsCollapsed ? <FaChevronRight /> : <FaChevronDown />)}
        </div>

        {!chatsCollapsed &&
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              draggable
              onDragStart={(e) => onDragStart(e, chat.id)}
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChatListItem chat={chat} open={open} />
              {open && (
                <button
                  onClick={() => handleDeleteChat(chat.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                  title="Delete chat"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}

        {!chatsCollapsed && filteredChats.length === 0 && (
          <div className="px-4 text-sm text-gray-500 mt-4">No chats yet</div>
        )}
      </div>

      {/* ACCOUNT FOOTER */}
      <div className="px-3 py-3 flex-shrink-0 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={
                user?.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.displayName || user?.email || "U"
                )}`
              }
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
            {open && (
              <div className="text-sm">
                {user?.displayName || user?.email}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ⚙️
            </Link>

            <button
              onClick={logout}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Sign out"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
