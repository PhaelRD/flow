
// Fix: Corrected Firebase modular imports for app, auth, and firestore.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCA8VcXC9hG0r0_U8Ue2ZKLpU0Ln5e8RCo",
  authDomain: "mytos-ce61b.firebaseapp.com",
  projectId: "mytos-ce61b",
  storageBucket: "mytos-ce61b.firebasestorage.app",
  messagingSenderId: "638188527450",
  appId: "1:638188527450:web:0ac12105881c6090725d63",
  measurementId: "G-KS7334EVMG"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
