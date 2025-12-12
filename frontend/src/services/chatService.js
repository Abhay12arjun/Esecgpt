// chatService.js
import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export const chatService = {
  // ------------------------------------------------------------
  // CREATE CHAT
  // ------------------------------------------------------------
  // src/services/chatService.js
// services/chatService.js
createChat : async (userId, projectId = null) => {
  const chatRef = await addDoc(collection(db, "chats"), {
    userId,
    title: "New Chat",
    messages: [],
    projectId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
   return chatRef;
},

  



  // ------------------------------------------------------------
  // GET CHAT
  // ------------------------------------------------------------
  getChat: async (chatId) => {
    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // ------------------------------------------------------------
  // UPDATE TITLE
  // ------------------------------------------------------------
  updateChatTitle: async (chatId, title) => {
    const ref = doc(db, "chats", chatId);
    await updateDoc(ref, { title, updatedAt: serverTimestamp() });
  },

  // ------------------------------------------------------------
  // DELETE CHAT
  // ------------------------------------------------------------
  deleteChat: async (chatId) => {
    if (!chatId) throw new Error("chatId required");
    // Delete messages subcollection
    const msgsCol = collection(db, "chats", chatId, "messages");
    const msgsSnap = await getDocs(msgsCol);
    for (let msg of msgsSnap.docs) {
      await deleteDoc(msg.ref);
    }

    // Delete chat doc
    await deleteDoc(doc(db, "chats", chatId));
    return true;
  },

  // ------------------------------------------------------------
  // ADD MESSAGE
  // ------------------------------------------------------------
  appendMessageToChat: async (chatId, message) => {
    const messagesCol = collection(db, "chats", chatId, "messages");
    const docRef = await addDoc(messagesCol, {
      sender: message.sender,
      text: message.text,
      createdAt: serverTimestamp(),
      editedAt: null,
      metadata: message.metadata || null,
    });

    await updateDoc(doc(db, "chats", chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: message.text || "",
    });

    return docRef;
  },

  // ------------------------------------------------------------
  // EDIT MESSAGE
  // ------------------------------------------------------------
  editMessage: async (chatId, messageId, newText) => {
    const msgRef = doc(db, "chats", chatId, "messages", messageId);
    await updateDoc(msgRef, {
      text: newText,
      editedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "chats", chatId), {
      updatedAt: serverTimestamp(),
    });
  },

  // ------------------------------------------------------------
  // DELETE MESSAGE
  // ------------------------------------------------------------
  deleteMessage: async (chatId, messageId) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
    await updateDoc(doc(db, "chats", chatId), {
      updatedAt: serverTimestamp(),
    });
  },

  // ------------------------------------------------------------
  // PAGINATION
  // ------------------------------------------------------------
  listChatsPaginated: async (userId, pageSize = 10, startAfterDoc = null) => {
    let q;
    const col = collection(db, "chats");
    if (startAfterDoc) {
      q = query(
        col,
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        startAfter(startAfterDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        col,
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        limit(pageSize)
      );
    }
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const last = snap.docs[snap.docs.length - 1] || null;
    return { docs, last };
  },

  // ------------------------------------------------------------
  // REALTIME CHAT SNAPSHOT (for a single chat)
  // ------------------------------------------------------------
  onChatRealtime: (chatId, cb) => {
    const chatRef = doc(db, "chats", chatId);
    return onSnapshot(chatRef, cb);
  },

  // ------------------------------------------------------------
  // REALTIME MESSAGES
  // ------------------------------------------------------------
  onMessagesRealtime: (chatId, cb, opts = { limit: 100, order: "asc" }) => {
    const { limit: lim, order } = opts;
    const msgsCol = collection(db, "chats", chatId, "messages");
    const q = query(
      msgsCol,
      orderBy("createdAt", order === "asc" ? "asc" : "desc"),
      limit(lim)
    );
    return onSnapshot(q, cb);
  },

  // ------------------------------------------------------------
  // REALTIME CHATS LIST (This fixes your Sidebar error)
  // ------------------------------------------------------------
  onChatsSnapshot: (userId, callback) => {
    const q = query(
      collection(db, "chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(list);
    });
  },

  // ------------------------------------------------------------
  // UPDATE MESSAGE TEXT (alias)
  // ------------------------------------------------------------
  updateMessageText: async (chatId, messageId, newText) => {
    const msgRef = doc(db, "chats", chatId, "messages", messageId);
    await updateDoc(msgRef, { text: newText, editedAt: serverTimestamp() });
    await updateDoc(doc(db, "chats", chatId), {
      updatedAt: serverTimestamp(),
    });
  },

  // ------------------------------------------------------------
  // ASSIGN CHAT TO PROJECT
  // ------------------------------------------------------------
  assignChatToProject: async (chatId, projectId) => {
    await updateDoc(doc(db, "chats", chatId), {
      projectId: projectId || null,
      updatedAt: serverTimestamp(),
    });
  },

  // ------------------------------------------------------------
  // CLEAR PROJECT FROM CHATS
  // ------------------------------------------------------------
  clearProjectFromChats: async (projectId, userId) => {
    const q = query(
      collection(db, "chats"),
      where("projectId", "==", projectId),
      where("userId", "==", userId)
    );

    const snap = await getDocs(q);
    const promises = snap.docs.map((d) =>
      updateDoc(doc(db, "chats", d.id), {
        projectId: null,
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(promises);
  },
};
