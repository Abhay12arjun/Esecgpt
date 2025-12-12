import React, { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

/**
 * MessageInput
 * - rounded input box + floating send button
 * - supports Enter to submit, Shift+Enter for newline
 */

export default function MessageInput({ onSend }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = async () => {
    if (!value.trim()) return;
    setSending(true);
    try {
      await onSend(value.trim());
      setValue("");
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a message..."
        className="w-full resize-none pr-14 pl-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring"
      />
      <div className="absolute right-3 top-1.5">
        <button onClick={submit} disabled={sending} className="p-3 bg-blue-600 text-white rounded-full shadow hover:opacity-95">
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
