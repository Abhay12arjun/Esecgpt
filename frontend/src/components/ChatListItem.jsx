import React from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * ChatListItem: shows chat preview; clicking navigates to chat page
 */
export default function ChatListItem({ chat, open }) {
  const navigate = useNavigate();
  const preview = chat.messages && chat.messages.length ? chat.messages[chat.messages.length - 1].text : "";

  return (
    <div
      onClick={() => navigate(`/chat/${chat.id}`)}
      className="cursor-pointer px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
    >
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center text-sm font-semibold">
        {chat.title?.[0] || "C"}
      </div>
      {open && (
        <div className="flex-1">
          
{chat.projectId && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{chat.projectId}</span>}

          <div className="text-sm font-medium">{chat.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{preview}</div>
        </div>
      )}
    </div>
  );
}
