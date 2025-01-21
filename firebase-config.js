import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsDbqmpt1C1CcSzgXI7FGwmpTktXCJ3KI",
    authDomain: "learnenplay-47bff.firebaseapp.com",
    projectId: "learnenplay-47bff",
    storageBucket: "learnenplay-47bff.firebasestorage.app",
    messagingSenderId: "190641439207",
    appId: "1:190641439207:web:954c83a55ae4533981bd42"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 