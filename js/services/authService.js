import { auth } from '../config/firebase.js';
import { getItem, setItem } from './storageService.js';

export async function loginAnonymously() {
  if (!auth) return null;
  return auth.signInAnonymously();
}

export async function loginWithGoogle() {
  if (!auth) return null;
  const provider = new window.firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

export function logout() {
  if (!auth) return Promise.resolve();
  return auth.signOut();
}

export function getCurrentRole() {
  return getItem('sjn_role', 'passageiro');
}

export function setCurrentRoleStorage(role) {
  setItem('sjn_role', role);
}
