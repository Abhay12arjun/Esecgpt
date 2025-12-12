import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const storageService = {
  uploadProfileImage: async (file, userId) => {
    const fileRef = ref(storage, `profileImages/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  },

  uploadFile: async (file, folder = "uploads") => {
    const fileRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  },
};
