import { auth } from '../config/firebase.js';
import { appState } from '../state/appState.js';
import { setItem, removeItem } from '../services/storageService.js';
import { setActiveScreen } from '../utils/dom.js';

const defaultRole = 'passageiro';

export function bindRoleTabs() {
  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => {
      const role = button.dataset.role;
      appState.currentRole = role;
      setItem('sjn_role', role);

      const groupName = document.getElementById('group-name');
      const groupPhone = document.getElementById('group-phone');
      const groupPlate = document.getElementById('group-plate');
      const groupAdminPass = document.getElementById('group-admin-pass');
      const googleContainer = document.getElementById('google-btn-container');

      if (groupName) groupName.style.display = role === 'admin' ? 'none' : 'block';
      if (groupPhone) groupPhone.style.display = role === 'passageiro' ? 'block' : 'none';
      if (groupPlate) groupPlate.style.display = role === 'motorista' ? 'block' : 'none';
      if (groupAdminPass) groupAdminPass.style.display = role === 'admin' ? 'block' : 'none';
      if (googleContainer) googleContainer.style.display = role === 'admin' ? 'none' : 'block';

      document.querySelectorAll('.tab-btn').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.role === role);
      });
    });
  });
}

export function bindAuthActions() {
  const loginBtn = document.getElementById('btn-login');
  const googleBtn = document.getElementById('btn-google-login');
  const logoutPassenger = document.getElementById('btn-passenger-logout');
  const logoutDriver = document.getElementById('btn-driver-logout');
  const logoutAdmin = document.getElementById('btn-admin-logout');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      setActiveScreen('auth-screen');
      if (appState.currentRole === 'admin') {
        console.log('Admin: fluxo de login inicializado');
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      console.log('Google login clicado');
    });
  }

  const doLogout = () => {
    removeItem('sjn_role');
    removeItem('sjn_name');
    removeItem('sjn_phone');
    removeItem('sjn_plate');
    if (auth) auth.signOut();
    window.location.reload();
  };

  if (logoutPassenger) logoutPassenger.addEventListener('click', doLogout);
  if (logoutDriver) logoutDriver.addEventListener('click', doLogout);
  if (logoutAdmin) logoutAdmin.addEventListener('click', doLogout);
}

export function initAuthController() {
  bindRoleTabs();
  bindAuthActions();
  appState.currentRole = defaultRole;
  setItem('sjn_role', defaultRole);
  setActiveScreen('auth-screen');
}
