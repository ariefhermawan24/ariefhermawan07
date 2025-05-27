// Import the functions you need from the SDKs you need
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB_ArzdTec41y6SIVk9hKGwoHWK0CKR9Yw",
    authDomain: "portofolio-3911d.firebaseapp.com",
    projectId: "portofolio-3911d",
    storageBucket: "portofolio-3911d.firebasestorage.app",
    messagingSenderId: "391821817524",
    appId: "1:391821817524:web:78671a104b95e9eb9149e1",
    measurementId: "G-TWE869LFGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export {
    app
}; // Ekspor app agar bisa digunakan di file lain