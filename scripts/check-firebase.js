
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
);

const firebaseConfig = {
    apiKey: env['VITE_FIREBASE_API_KEY'],
    authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'],
    projectId: env['VITE_FIREBASE_PROJECT_ID'],
    storageBucket: env['VITE_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
    appId: env['VITE_FIREBASE_APP_ID'],
};

async function checkFirebase() {
    console.log('🔥 Checking Firebase Firestore for products...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        console.log(`✅ Found ${querySnapshot.size} products in Firestore.`);
    } catch (err) {
        console.error('Firebase error:', err);
    }
}

checkFirebase();
