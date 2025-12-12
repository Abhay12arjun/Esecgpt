import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

export const authService = {
  signup: async (email, password, name) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // store user profile in Firestore
    await setDoc(doc(db, "users", userCred.user.uid), {
      name,
      email,
      photoURL: userCred.user.photoURL || null,
      createdAt: serverTimestamp(),
    });

    return userCred;
  },

  login: async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  loginWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);

    // write or merge user's profile in Firestore
    await setDoc(
      doc(db, "users", result.user.uid),
      {
        name: result.user.displayName || null,
        email: result.user.email || null,
        photoURL: result.user.photoURL || null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    return result;
  },

  resetPassword: async (email) => {
    return await sendPasswordResetEmail(auth, email);
  },

  logout: async () => {
    return await signOut(auth);
  },
};
