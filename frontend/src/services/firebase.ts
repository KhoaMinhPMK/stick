import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAWXH675F8F-Od6PlGOopDXXzpGf36qKhI",
  authDomain: "stick-e9560.firebaseapp.com",
  projectId: "stick-e9560",
  storageBucket: "stick-e9560.firebasestorage.app",
  messagingSenderId: "490758085326",
  appId: "1:490758085326:web:076338557bf872189c8e9f",
  measurementId: "G-CENLSST8RL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
