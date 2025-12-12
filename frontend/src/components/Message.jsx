import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { chatService } from "../services/chatService";
import { generateResponse } from "../services/aiService";

/**
 * Message component with actions:
 * - Edit (inline)
 * - Delete
 * - Copy
 * - Regenerate (for AI messages)
 */

export default function Message({ message, chatId }) {
  const isUser = message.sender === "user";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(message.text);
  const [busy, setBusy] = useState(false);

  const handleEditSave = async () => {
    if (!value.trim()) return;
    setBusy(true);
    try {
      await chatService.editMessage(chatId, message.id, value.trim());
      setEditing(false);
    } catch (err) {
      console.error("Edit failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    setBusy(true);
    try {
      await chatService.deleteMessage(chatId, message.id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      // optionally show UI feedback
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleRegenerate = async () => {
    // only allow on ai messages to regenerate
    if (message.sender !== "ai") return;
    setBusy(true);
    try {
      // For regeneration, create a new ai response based on previous context.
      // Simple approach: call AI with the same text or some context. Here we call with message.text.
      const newText = await generateResponse([{ role: "user", content: message.text }]);
      // append new message
      await chatService.appendMessageToChat(chatId, { sender: "ai", text: newText });
    } catch (err) {
      console.error("Regenerate failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 mr-3 flex items-center justify-center">
          AI
        </div>
      )}

      <div className={`${isUser ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"} max-w-[80%] rounded-lg p-3`}>
        <div className="prose prose-sm dark:prose-invert">
          {editing ? (
            <>
              <textarea value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-2 rounded bg-white text-black" rows={4} />
              <div className="mt-2 flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="px-3 py-1 rounded border">Cancel</button>
                <button onClick={handleEditSave} disabled={busy} className="px-3 py-1 rounded bg-blue-600 text-white">{busy ? "Saving..." : "Save"}</button>
              </div>
            </>
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {message.text || ""}
              </ReactMarkdown>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs text-gray-400">
                  {message.editedAt ? "edited" : ""}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleCopy} title="Copy" className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Copy</button>

                  <button onClick={() => setEditing(true)} title="Edit" className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Edit</button>

                  <button onClick={handleDelete} title="Delete" className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-800">Delete</button>

                  {message.sender === "ai" && (
                    <button onClick={handleRegenerate} disabled={busy} className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                      {busy ? "Regenerating..." : "Regenerate"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-10 h-10 rounded-full bg-blue-600 shrink-0 ml-3 flex items-center justify-center text-white">
          U
        </div>
      )}
    </div>
  );
}
