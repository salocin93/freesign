
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDhoELfecVGX3j5LBFUT1_e51e5YH4Ydo",
  authDomain: "docufreesign.firebaseapp.com",
  projectId: "docufreesign",
  storageBucket: "docufreesign.firebasestorage.app",
  messagingSenderId: "269027937382",
  appId: "1:269027937382:web:2920fb0e63b0687760b1a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
