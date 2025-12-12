import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";
import { useAuth } from "../context/AuthContext";
import Message from "../components/Message";
import MessageInput from "../components/MessageInput";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { streamResponse, generateTitle } from "../services/aiService";

/**
 * ChatPage
 * - Streaming AI responses
 * - Auto-generates title for first message
 * - Handles retry
 */
export default function ChatPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const scrollRef = useRef();
  const navigate = useNavigate();

  // ----------------------------
  // Real-time chat subscription
  // ----------------------------
  useEffect(() => {
    if (!chatId) return;

    const unsubChat = chatService.onChatRealtime(chatId, (snap) => {
      if (snap.exists()) setChat({ id: snap.id, ...snap.data() });
      else setChat(null);
    });

    const msgsCol = collection(db, "chats", chatId, "messages");
    const q = query(msgsCol, orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(arr);
    });

    return () => {
      unsubChat();
      unsubMsgs();
    };
  }, [chatId]);

  // ----------------------------
  // Auto-scroll to bottom
  // ----------------------------
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // ----------------------------
  // Send message
  // ----------------------------
  const handleSend = async (text) => {
    setStreamError(null);
    if (!user) throw new Error("Not authenticated");

    let activeChatId = chatId;

    // Create chat if it doesn't exist
    if (!activeChatId) {
      const ref = await chatService.createChat(user.uid, "New chat");
      activeChatId = ref.id;
      navigate(`/chat/${activeChatId}`);
    }

    // Add user message
    await chatService.appendMessageToChat(activeChatId, {
      sender: "user",
      text,
    });

    // Auto-generate title if first message
    if (messages.length === 0) {
      try {
        const generatedTitle = await generateTitle(text);
        if (generatedTitle) {
          await chatService.updateChatTitle(activeChatId, generatedTitle);
        }
      } catch (err) {
        console.log("Title generation failed:", err);
      }
    }

    // Create placeholder AI message
    const aiMsgRef = await chatService.appendMessageToChat(activeChatId, {
      sender: "ai",
      text: "",
    });
    const aiMsgId = aiMsgRef.id;

    // Prepare message history
    const history = [
      ...messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: text },
    ];

    // ----------------------------
    // Stream AI response
    // ----------------------------
    setIsStreaming(true);
    let partial = "";

    await streamResponse({
      messages: history,
      systemPrompt: "You are a helpful assistant.",
      onToken: (token) => {
        partial += token;
        chatService.updateMessageText(activeChatId, aiMsgId, partial);
      },
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        setIsStreaming(false);
        setStreamError(err?.message || "Stream error");
        chatService.updateMessageText(
          activeChatId,
          aiMsgId,
          "Error: " + err?.message
        );
      },
    });
  };

  // ----------------------------
  // Retry failed AI message
  // ----------------------------
  const handleRetry = async (failedAiMsg) => {
    if (!failedAiMsg) return;

    const before = messages.filter(
      (m) =>
        m.createdAt &&
        new Date(
          m.createdAt.toDate ? m.createdAt.toDate() : m.createdAt
        ) < new Date(
          failedAiMsg.createdAt.toDate
            ? failedAiMsg.createdAt.toDate()
            : failedAiMsg.createdAt
        )
    );

    const history = before.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const aiMsgRef = await chatService.appendMessageToChat(chatId, {
      sender: "ai",
      text: "",
    });
    const aiMsgId = aiMsgRef.id;

    let partial = "";
    setIsStreaming(true);

    await streamResponse({
      messages: [...history],
      systemPrompt: "You are a helpful assistant.",
      onToken: (token) => {
        partial += token;
        chatService.updateMessageText(chatId, aiMsgId, partial);
      },
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        setIsStreaming(false);
        setStreamError(err?.message || "Error");
        chatService.updateMessageText(chatId, aiMsgId, "Error: " + err?.message);
      },
    });
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto">
        {messages.length === 0 && !isStreaming ? (
          <div className="text-center text-gray-500 mt-12">
            Start your conversation…
          </div>
        ) : (
          messages.map((msg) => (
            <Message key={msg.id} message={msg} chatId={chatId} />
          ))
        )}

        {isStreaming && (
          <div className="mt-3 text-sm text-gray-500">AI is typing…</div>
        )}

        {streamError && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
            {streamError}
            <button
              onClick={() => {
                const lastError = messages
                  .slice()
                  .reverse()
                  .find(
                    (m) => m.sender === "ai" && m.text.startsWith("Error:")
                  );
                handleRetry(lastError);
              }}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-300 dark:border-gray-800">
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
