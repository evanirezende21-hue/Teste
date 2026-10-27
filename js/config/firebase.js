import { FIREBASE_CONFIG } from './constants.js';

if (window.firebase && !window.firebase.apps?.length) {
  window.firebase.initializeApp(FIREBASE_CONFIG);
}

export const firebaseApp = window.firebase?.apps?.[0] || null;
export const db = window.firebase ? window.firebase.database() : null;
export const auth = window.firebase ? window.firebase.auth() : null;
