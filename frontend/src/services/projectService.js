// projectService.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase";

export const projectService = {
  // ------------------------------------------------------------------
  // CREATE PROJECT
  // ------------------------------------------------------------------
  createProject: async (userId, name) => {
    const ref = await addDoc(collection(db, "projects"), {
      userId,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref;
  },

  // ------------------------------------------------------------------
  // UPDATE PROJECT
  // ------------------------------------------------------------------
  updateProject: async (projectId, newData) => {
    const ref = doc(db, "projects", projectId);
    await updateDoc(ref, {
      ...newData,
      updatedAt: serverTimestamp(),
    });
  },

  // ------------------------------------------------------------------
  // DELETE PROJECT
  // ------------------------------------------------------------------
  deleteProject: async (projectId) => {
    await deleteDoc(doc(db, "projects", projectId));
  },

  // ------------------------------------------------------------------
  // LIST PROJECTS (one-time)
  // ------------------------------------------------------------------
  listProjects: async (userId) => {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // ------------------------------------------------------------------
  // REALTIME PROJECT SNAPSHOT  ← This fixes your Sidebar error
  // ------------------------------------------------------------------
  onProjectsSnapshot: (userId, callback) => {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(list);
    });
  },
};
