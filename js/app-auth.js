(function () {
  function applyAuthViewState() {
    const role = window.appState?.currentRole || 'passageiro';

    const passengerTab = document.getElementById('tab-passenger');
    const driverTab = document.getElementById('tab-driver');
    const adminTab = document.getElementById('tab-admin');

    passengerTab?.classList.toggle('active', role === 'passageiro');
    driverTab?.classList.toggle('active', role === 'motorista');
    adminTab?.classList.toggle('active', role === 'admin');

    const groupName = document.getElementById('group-name');
    const groupPhone = document.getElementById('group-phone');
    const groupPlate = document.getElementById('group-plate');
    const groupAdminPass = document.getElementById('group-admin-pass');
    const googleBtnContainer = document.getElementById('google-btn-container');

    if (groupName) groupName.style.display = role === 'admin' ? 'none' : 'block';
    if (groupPhone) groupPhone.style.display = role === 'passageiro' ? 'block' : 'none';
    if (groupPlate) groupPlate.style.display = role === 'motorista' ? 'block' : 'none';
    if (groupAdminPass) groupAdminPass.style.display = role === 'admin' ? 'block' : 'none';
    if (googleBtnContainer) googleBtnContainer.style.display = role === 'admin' ? 'none' : 'block';
  }

  function setRole(newRole) {
    const role = newRole || 'passageiro';

    if (!window.appState) {
      console.warn('[app-auth] appState not available yet');
      return;
    }

    window.appState.currentRole = role;
    localStorage.setItem('sjn_role', role);
    applyAuthViewState();
  }

  window.appAuth = {
    setRole,
    applyAuthViewState
  };

  window.setRole = setRole;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAuthViewState);
  } else {
    applyAuthViewState();
  }
})();
