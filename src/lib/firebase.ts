// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "queryfire",
  "appId": "1:118305736514:web:15a83b3173e413aac4eadb",
  "storageBucket": "queryfire.firebasestorage.app",
  "apiKey": "AIzaSyAn06feLy8OVvgMee1kbEVBnVkWAYvL6UM",
  "authDomain": "queryfire.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "118305736514"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
