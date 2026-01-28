// Firebase Configuration for Siddhivinayak Realtors
// Using Firebase Compat SDK (loaded via script tags)

const firebaseConfig = {
    apiKey: "AIzaSyC7fhs8JV3bnIlPxOY9k1qmK9pZsuZSgeQ",
    authDomain: "nirajprojectdatabase.firebaseapp.com",
    projectId: "nirajprojectdatabase",
    storageBucket: "nirajprojectdatabase.firebasestorage.app",
    messagingSenderId: "596584122305",
    appId: "1:596584122305:web:29c79c2d638931cecad140",
    measurementId: "G-FLDT2FSMWB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Auth state observer
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

// Check if user is logged in
function isLoggedIn() {
    return auth.currentUser !== null;
}

// Get current user
function getCurrentUser() {
    return auth.currentUser;
}
