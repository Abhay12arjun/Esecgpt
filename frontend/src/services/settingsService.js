import { db, storage, auth } from "./firebase";

 // correct

import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// import { auth } from "../firebase/firebase";
import { deleteUser, updateProfile, updatePassword } from "firebase/auth";

export const settingsService = {
  async updateProfileInfo(user, { displayName, photoFile }) {
    let photoURL = user.photoURL;

    if (photoFile) {
      const storageRef = ref(storage, `avatars/${user.uid}_${photoFile.name}`);
      await uploadBytes(storageRef, photoFile);
      photoURL = await getDownloadURL(storageRef);
    }

    await updateProfile(user, {
      displayName,
      photoURL,
    });

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { displayName, photoURL });

    return { displayName, photoURL };
  },

  async changePassword(user, newPassword) {
    await updatePassword(user, newPassword);
  },

  async clearAllChats(userId) {
    const q = query(collection(db, "chats"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const deletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);
  },

  async clearAllProjects(userId) {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const deletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);
  },

  async deleteAccount(user) {
    const userId = user.uid;

    // 1. Delete all chats
    await this.clearAllChats(userId);

    // 2. Delete all projects
    await this.clearAllProjects(userId);

    // 3. Delete user profile image from storage (if exists)
    if (user.photoURL) {
      try {
        const fileRef = ref(storage, user.photoURL);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn("No profile image to delete or already deleted", err);
      }
    }

    // 4. Delete Firestore user document
    await deleteDoc(doc(db, "users", userId));

    // 5. Delete Firebase Auth user
    await deleteUser(user);
  },
};
