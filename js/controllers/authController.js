import { db } from '../config/firebase.js';
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

export function entrarNoAppComDados(name, phone, plate) {
  appState.currentUser = { name, phone, plate, role: appState.currentRole };

  if (appState.currentRole === 'passageiro') {
    document.getElementById('passenger-badge').innerText = `${name} (${phone})`;
    setActiveScreen('passenger-screen');
  } else if (appState.currentRole === 'motorista') {
    document.getElementById('driver-badge').innerText = `${name} - Placa: ${plate}`;
    setActiveScreen('driver-screen');
  } else if (appState.currentRole === 'admin') {
    setActiveScreen('admin-screen');
  }
}

export async function entrarComGoogle() {
  if (!window.firebase) return;

  const nameInput = document.getElementById('user-name')?.value?.trim() || '';
  const plateInput = document.getElementById('user-plate')?.value?.trim() || '';

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
    alert('Erro ao autenticar com o Google.');
  }
}

export async function entrarNoAppManual() {
  const role = appState.currentRole;

  if (role === 'admin') {
    const password = document.getElementById('admin-password')?.value?.trim() || '';
    if (password !== 'Rinaverinave32@') {
      alert('Senha de administrador incorreta!');
      return;
    }
    entrarNoAppComDados('Admin', 'admin', '');
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

  entrarNoAppComDados(name, phone, plate);
}

export function sairDaConta() {
  removeItem('sjn_role');
  removeItem('sjn_name');
  removeItem('sjn_phone');
  removeItem('sjn_plate');
  appState.currentUser = null;
  appState.currentRole = defaultRole;
  setActiveScreen('auth-screen');
  window.location.reload();
}

export function bindAuthActions() {
  const loginBtn = document.getElementById('btn-login');
  const googleBtn = document.getElementById('btn-google-login');
  const logoutBtns = [
    document.getElementById('btn-passenger-logout'),
    document.getElementById('btn-driver-logout'),
    document.getElementById('btn-admin-logout')
  ];

  if (loginBtn) loginBtn.addEventListener('click', entrarNoAppManual);
  if (googleBtn) googleBtn.addEventListener('click', entrarComGoogle);
  logoutBtns.forEach((button) => {
    if (button) button.addEventListener('click', sairDaConta);
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
  setActiveScreen('auth-screen');
}
