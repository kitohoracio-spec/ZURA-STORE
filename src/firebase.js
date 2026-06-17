import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAozVaH56Tg6CRQ2NC3fwI-HsF8d12MQD4",
  authDomain: "zura-store-f1bbe.firebaseapp.com",
  projectId: "zura-store-f1bbe",
  storageBucket: "zura-store-f1bbe.firebasestorage.app",
  messagingSenderId: "103218966468",
  appId: "1:103218966468:web:c1e0eb61bda3611ee3fe91"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
