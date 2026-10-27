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
      console.warn('[app-auth] appState not found');
      return;
    }

    window.appState.currentRole = role;
    localStorage.setItem('sjn_role', role);
    applyAuthViewState();
  }

  async function entrarNoAppManual() {
    const auth = firebase?.auth?.();
    const db = firebase?.database?.();

    if (!auth || !db) {
      alert('Firebase ainda não foi inicializado.');
      return;
    }

    const currentRole = window.appState?.currentRole || 'passageiro';

    if (currentRole === 'admin') {
      const pass = document.getElementById('admin-password')?.value.trim();
      const adminPassword = window.appConfig?.admin?.password || 'Rinaverinave32@';

      if (pass === adminPassword) {
        try {
          await auth.signInAnonymously();
          if (typeof window.entrarPainelAdmin === 'function') {
            window.entrarPainelAdmin();
          } else {
            document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
            const adminScreen = document.getElementById('admin-screen');
            if (adminScreen) adminScreen.classList.add('active');
          }
        } catch (e) {
          if (typeof window.entrarPainelAdmin === 'function') {
            window.entrarPainelAdmin();
          }
        }
      } else {
        alert('Senha de Administrador incorreta!');
      }
      return;
    }

    const name = document.getElementById('user-name')?.value.trim();
    const phone = document.getElementById('user-phone')?.value.trim();
    const plate = document.getElementById('user-plate')?.value.trim();

    if (!name || (currentRole === 'passageiro' && !phone) || (currentRole === 'motorista' && !plate)) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    localStorage.setItem('sjn_name', name);
    localStorage.setItem('sjn_phone', phone || '');
    localStorage.setItem('sjn_plate', plate || '');
    localStorage.setItem('sjn_role', currentRole);

    try {
      const cred = await auth.signInAnonymously();

      if (currentRole === 'motorista' && cred.user) {
        db.ref('usuarios/' + cred.user.uid).set({
          nome: name,
          placa: plate,
          role: 'motorista'
        });
      }

      if (typeof window.entrarNoAppComDados === 'function') {
        window.entrarNoAppComDados(name, phone, plate);
      }
    } catch (error) {
      console.error('Erro no login anônimo:', error);
      alert('Erro de autenticação no Firebase. Ative o login Anônimo na consola do Firebase.');
    }
  }

  async function entrarComGoogle() {
    const auth = firebase?.auth?.();
    const db = firebase?.database?.();

    if (!auth || !db) {
      alert('Firebase ainda não foi inicializado.');
      return;
    }

    const currentRole = window.appState?.currentRole || 'passageiro';
    let plateInput = document.getElementById('user-plate')?.value.trim() || '';
    let nameInput = document.getElementById('user-name')?.value.trim() || '';

    localStorage.setItem('sjn_role', currentRole);

    const provider = new firebase.auth.GoogleAuthProvider();

    try {
      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      if (currentRole === 'motorista') {
        const userRef = db.ref('usuarios/' + user.uid);
        const snap = await userRef.once('value');
        const userData = snap.val();

        if (userData && userData.placa) {
          plateInput = userData.placa;
        } else if (plateInput) {
          await userRef.set({
            nome: user.displayName || nameInput,
            email: user.email,
            placa: plateInput,
            role: 'motorista'
          });
        } else {
          alert('Motorista: Por favor, digite a Placa da sua moto para concluir o primeiro cadastro.');
          return;
        }

        localStorage.setItem('sjn_plate', plateInput);
      }

      if (nameInput) localStorage.setItem('sjn_name', nameInput);

      if (typeof window.entrarNoAppComDados === 'function') {
        window.entrarNoAppComDados(user.displayName || nameInput || 'Usuário', user.phoneNumber || user.email || '', plateInput);
      }
    } catch (error) {
      console.error('Erro no login Google:', error);
      try {
        await auth.signInWithRedirect(provider);
      } catch (err) {
        console.error('Erro no redirect Google:', err);
        alert('Erro ao autenticar com o Google. Tente novamente.');
      }
    }
  }

  function attachAuthStateListener() {
    const auth = firebase?.auth?.();
    if (!auth) return;

    auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const savedRole = localStorage.getItem('sjn_role') || window.appState?.currentRole || 'passageiro';
      if (savedRole === 'admin') return;

      let savedName = localStorage.getItem('sjn_name') || user.displayName || 'Usuário';
      let savedPhone = localStorage.getItem('sjn_phone') || user.phoneNumber || user.email || 'Google User';
      let savedPlate = localStorage.getItem('sjn_plate') || '';

      if (savedRole === 'motorista' && user.uid) {
        try {
          const db = firebase.database();
          const snap = await db.ref('usuarios/' + user.uid).once('value');
          const userData = snap.val();
          if (userData && userData.placa) {
            savedPlate = userData.placa;
            localStorage.setItem('sjn_plate', savedPlate);
          }
        } catch (e) {
          console.error('Erro ao buscar dados do usuário:', e);
        }
      }

      if (window.appState) {
        window.appState.currentRole = savedRole;
      }

      if (savedRole === 'motorista' && !savedPlate) {
        return;
      }

      if (typeof window.entrarNoAppComDados === 'function') {
        window.entrarNoAppComDados(savedName, savedPhone, savedPlate);
      }
    });
  }

  window.appAuth = {
    setRole,
    applyAuthViewState,
    entrarNoAppManual,
    entrarComGoogle,
    attachAuthStateListener
  };

  window.setRole = setRole;
  window.entrarNoAppManual = entrarNoAppManual;
  window.entrarComGoogle = entrarComGoogle;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyAuthViewState();
      attachAuthStateListener();
    });
  } else {
    applyAuthViewState();
    attachAuthStateListener();
  }
})();
