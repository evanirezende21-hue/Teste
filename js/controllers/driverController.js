import { db } from '../config/firebase.js';
import { appState } from '../state/appState.js';
import { formatPrice } from '../utils/formatters.js';

export function escutarCorridasMotorista() {
  db.ref('corridas').on('value', (snapshot) => {
    const corridas = snapshot.val() || {};
    const pendentes = Object.values(corridas).filter((ride) => ride.status === 'pendente');

    if (!pendentes.length) {
      const emptyBox = document.getElementById('driver-empty-box');
      const requestCard = document.getElementById('driver-request-card');
      if (emptyBox) emptyBox.style.display = 'block';
      if (requestCard) requestCard.style.display = 'none';
      return;
    }

    const corrida = pendentes[0];
    appState.pendingRide = corrida;

    const emptyBox = document.getElementById('driver-empty-box');
    const requestCard = document.getElementById('driver-request-card');
    const ridePrice = document.getElementById('driver-ride-price');
    const passengerInfo = document.getElementById('driver-passenger-info');

    if (emptyBox) emptyBox.style.display = 'none';
    if (requestCard) requestCard.style.display = 'block';
    if (ridePrice) ridePrice.innerText = formatPrice(corrida.valor || 0);
    if (passengerInfo) {
      passengerInfo.innerHTML = `<b>Passageiro:</b> ${corrida.passageiro}<br><b>Origem:</b> ${corrida.origem_lat}, ${corrida.origem_lng}<br><b>Destino:</b> ${corrida.destino_lat}, ${corrida.destino_lng}`;
    }
  });
}

export function confirmarAceiteCorrida() {
  const user = appState.currentUser;
  const ride = appState.pendingRide;
  if (!user || !ride) return;

  if (appState.flags.isDriverBlocked) {
    alert('Motorista bloqueado.');
    return;
  }

  const activeRideId = ride.id;
  appState.activeRideId = activeRideId;

  db.ref('corridas/' + activeRideId).update({
    status: 'aceita',
    motorista: user.name,
    placa_motorista: user.plate
  });

  const requestCard = document.getElementById('driver-request-card');
  const pickupCard = document.getElementById('driver-pickup-card');
  const pickupPrice = document.getElementById('driver-pickup-ride-price');
  const pickupInfo = document.getElementById('driver-pickup-passenger-info');

  if (requestCard) requestCard.style.display = 'none';
  if (pickupCard) pickupCard.style.display = 'block';
  if (pickupPrice) pickupPrice.innerText = formatPrice(ride.valor || 0);
  if (pickupInfo) pickupInfo.innerHTML = `<b>Passageiro:</b> ${ride.passageiro}`;
}

export function iniciarViagemComPassageiro() {
  const activeRideId = appState.activeRideId;
  const ride = appState.pendingRide;
  if (!activeRideId || !ride) return;

  db.ref('corridas/' + activeRideId).update({ status: 'em_andamento' });
  appState.currentRideStatus = 'em_andamento';

  const pickupCard = document.getElementById('driver-pickup-card');
  const activeCard = document.getElementById('driver-active-card');
  const activePrice = document.getElementById('driver-active-ride-price');
  const activeInfo = document.getElementById('driver-active-passenger-info');

  if (pickupCard) pickupCard.style.display = 'none';
  if (activeCard) activeCard.style.display = 'block';
  if (activePrice) activePrice.innerText = formatPrice(ride.valor || 0);
  if (activeInfo) activeInfo.innerHTML = `<b>Passageiro:</b> ${ride.passageiro}`;
}

export function finalizarCorrida() {
  const user = appState.currentUser;
  const activeRideId = appState.activeRideId;
  const ride = appState.pendingRide;
  if (!activeRideId || !ride || !user) return;

  const taxa = 1.0;
  const keyPlate = (user.plate || '').replace(/[^a-zA-Z0-9]/g, '');
  if (keyPlate) {
    db.ref('motoristas/' + keyPlate).once('value', (snapshot) => {
      const atual = snapshot.val() || {};
      const saldo = Number(atual.saldoDevedor || 0) + taxa;
      db.ref('motoristas/' + keyPlate).update({ saldoDevedor: saldo });
    });
  }

  db.ref('corridas/' + activeRideId).update({
    status: 'finalizada',
    valor_final: ride.valor || 0,
    taxa
  });

  appState.activeRideId = null;
  appState.pendingRide = null;
  appState.currentRideStatus = null;

  const activeCard = document.getElementById('driver-active-card');
  const emptyBox = document.getElementById('driver-empty-box');
  if (activeCard) activeCard.style.display = 'none';
  if (emptyBox) emptyBox.style.display = 'block';
}

export function initDriverController() {
  const acceptBtn = document.getElementById('btn-accept-ride');
  const startBtn = document.getElementById('btn-start-ride');
  const finishBtn = document.getElementById('btn-finish-ride');

  if (acceptBtn) acceptBtn.addEventListener('click', confirmarAceiteCorrida);
  if (startBtn) startBtn.addEventListener('click', iniciarViagemComPassageiro);
  if (finishBtn) finishBtn.addEventListener('click', finalizarCorrida);

  escutarCorridasMotorista();
}
