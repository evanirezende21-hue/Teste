import { auth, db } from '../config/firebase.js';
import { ADMIN_PASSWORD } from '../config/constants.js';
import { appState } from '../state/appState.js';
import { setItem, removeItem, getItem } from '../services/storageService.js';
import { setActiveScreen } from '../utils/dom.js';

const defaultRole = 'passageiro';

function syncRoleUi(role) {
  const groupName = document.getElementById('group-name');
  const groupPhone = document.getElementById('group-phone');
  const groupPlate = document.getElementById('group-plate');
  const groupAdminPass = document.getElementById('group-admin-pass');
  const googleContainer = document.getElementById('google-btn-container');

  document.querySelectorAll('.tab-btn').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.role === role);
  });

  if (groupName) groupName.style.display = role === 'admin' ? 'none' : 'block';
  if (groupPhone) groupPhone.style.display = role === 'passageiro' ? 'block' : 'none';
  if (groupPlate) groupPlate.style.display = role === 'motorista' ? 'block' : 'none';
  if (groupAdminPass) groupAdminPass.style.display = role === 'admin' ? 'block' : 'none';
  if (googleContainer) googleContainer.style.display = role === 'admin' ? 'none' : 'block';
}

export function setRole(newRole) {
  appState.currentRole = newRole;
  setItem('sjn_role', newRole);
  syncRoleUi(newRole);
}

function showScreen(screenId) {
  setActiveScreen(screenId);
}

function showLoggedPassenger(name, phone) {
  const badge = document.getElementById('passenger-badge');
  if (badge) badge.innerText = `${name} (${phone})`;
  showScreen('passenger-screen');
}

function showLoggedDriver(name, plate) {
  const badge = document.getElementById('driver-badge');
  if (badge) badge.innerText = `${name} - Placa: ${plate}`;
  showScreen('driver-screen');
}

function showAdminPanel() {
  showScreen('admin-screen');
}

export function entrarNoAppComDados(name, phone, plate) {
  appState.currentUser = { name, phone, plate, role: appState.currentRole };

  if (appState.currentRole === 'passageiro') {
    showLoggedPassenger(name, phone);
  } else if (appState.currentRole === 'motorista') {
    showLoggedDriver(name, plate);
  } else if (appState.currentRole === 'admin') {
    showAdminPanel();
  }
}

export async function entrarComGoogle() {
  const nameInput = document.getElementById('user-name')?.value?.trim() || '';
  const plateInput = document.getElementById('user-plate')?.value?.trim() || '';

  if (!auth) {
    alert('Firebase não inicializado.');
    return;
  }

  if (appState.currentRole === 'motorista' && !plateInput) {
    alert('Motorista: informe a placa da moto antes de continuar.');
    return;
  }

  try {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    const finalName = user.displayName || nameInput || 'Usuário Google';

    if (appState.currentRole === 'motorista') {
      const userRef = db.ref('usuarios/' + user.uid);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
      const savedPlate = (userData && userData.placa) || plateInput;

      if (!savedPlate) {
        alert('Motorista: a placa da moto é obrigatória para o primeiro cadastro.');
        return;
      }

      await userRef.set({ nome: finalName, placa: savedPlate, role: 'motorista' });
      setItem('sjn_plate', savedPlate);
      entrarNoAppComDados(finalName, user.email || 'Google User', savedPlate);
      return;
    }

    setItem('sjn_name', finalName);
    entrarNoAppComDados(finalName, user.email || 'Google User', '');
  } catch (error) {
    console.error('Erro no login com Google:', error);
    alert('Erro ao autenticar com o Google. Tente novamente.');
  }
}

export async function entrarNoAppManual() {
  const role = appState.currentRole;

  if (role === 'admin') {
    const password = document.getElementById('admin-password')?.value?.trim() || '';
    if (password !== ADMIN_PASSWORD) {
      alert('Senha de administrador incorreta!');
      return;
    }

    if (!auth) {
      showAdminPanel();
      return;
    }

    try {
      await auth.signInAnonymously();
    } catch (_error) {
      // ignora falha aceita para manter painel administrativo funcionando em ambiente local
    }

    showAdminPanel();
    return;
  }

  const name = document.getElementById('user-name')?.value?.trim() || '';
  const phone = document.getElementById('user-phone')?.value?.trim() || '';
  const plate = document.getElementById('user-plate')?.value?.trim() || '';

  if (!name || (role === 'passageiro' && !phone) || (role === 'motorista' && !plate)) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  setItem('sjn_name', name);
  setItem('sjn_phone', phone);
  setItem('sjn_plate', plate);
  setItem('sjn_role', role);

  if (!auth) {
    entrarNoAppComDados(name, phone, plate);
    return;
  }

  try {
    const credential = await auth.signInAnonymously();

    if (role === 'motorista' && credential.user) {
      await db.ref('usuarios/' + credential.user.uid).set({ nome: name, placa: plate, role: 'motorista' });
    }

    entrarNoAppComDados(name, phone, plate);
  } catch (error) {
    console.error('Erro no login anônimo:', error);
    alert('Erro de autenticação no Firebase. Ative o login anônimo na console do Firebase.');
  }
}

export function sairDaConta() {
  removeItem('sjn_role');
  removeItem('sjn_name');
  removeItem('sjn_phone');
  removeItem('sjn_plate');

  if (auth) {
    auth.signOut();
  }

  appState.currentUser = null;
  appState.currentRole = defaultRole;
  showScreen('auth-screen');
  window.location.reload();
}

export function bindAuthActions() {
  const loginBtn = document.getElementById('btn-login');
  const googleBtn = document.getElementById('btn-google-login');
  const logoutButtons = [
    document.getElementById('btn-passenger-logout'),
    document.getElementById('btn-driver-logout'),
    document.getElementById('btn-admin-logout')
  ];

  if (loginBtn) {
    loginBtn.addEventListener('click', entrarNoAppManual);
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', entrarComGoogle);
  }

  logoutButtons.forEach((button) => {
    if (button) {
      button.addEventListener('click', sairDaConta);
    }
  });

  document.querySelectorAll('.tab-btn').forEach((tab) => {
    tab.addEventListener('click', () => {
      setRole(tab.dataset.role || defaultRole);
    });
  });
}

export function initAuthController() {
  const savedRole = getItem('sjn_role', defaultRole);
  appState.currentRole = savedRole;
  syncRoleUi(savedRole);
  bindAuthActions();
  showScreen('auth-screen');
}

window.setRole = setRole;
window.entrarComGoogle = entrarComGoogle;
window.entrarNoAppManual = entrarNoAppManual;
window.sairDaConta = sairDaConta;
window.entrarNoAppComDados = entrarNoAppComDados;
