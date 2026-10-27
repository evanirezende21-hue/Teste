(function () {
  const state = window.appState || {};

  function iniciarReconhecimentoVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('O seu navegador não suporta reconhecimento de voz. Por favor, digite o endereço.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    const btnMic = document.getElementById('btn-voice');
    btnMic?.classList.add('listening');

    recognition.start();

    recognition.onresult = (event) => {
      btnMic?.classList.remove('listening');
      const textoFalar = event.results[0][0].transcript;
      const destinationInput = document.getElementById('destination-input');
      if (destinationInput) destinationInput.value = textoFalar;
      buscarEndereçoPorTexto(textoFalar);
    };

    recognition.onerror = () => {
      btnMic?.classList.remove('listening');
      alert('Não foi possível entender a voz. Tente falar novamente ou digite.');
    };

    recognition.onend = () => {
      btnMic?.classList.remove('listening');
    };
  }

  async function buscarEndereçoPorTexto(textoBusca) {
    const rawQuery = textoBusca || document.getElementById('destination-input')?.value.trim();
    if (!rawQuery) return;

    let queryCompleta = rawQuery;
    if (!rawQuery.toLowerCase().includes('são joão nepomuceno') && !rawQuery.toLowerCase().includes('sjn')) {
      queryCompleta = `${rawQuery}, São João Nepomuceno - MG`;
    }

    try {
      const viewbox = '-43.05,-21.50,-42.97,-21.58';
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryCompleta)}&bounded=1&viewbox=${viewbox}&limit=1`;

      let res = await fetch(url);
      let data = await res.json();

      if (!data || data.length === 0) {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryCompleta)}&limit=1`;
        res = await fetch(fallbackUrl);
        data = await res.json();
      }

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        onPassengerMapClick({ latlng: { lat, lng: lon } });
      } else {
        alert('Endereço não encontrado em São João Nepomuceno. Tente indicar mais detalhes da rua ou ponto de referência.');
      }
    } catch (e) {
      console.error('Erro na busca de endereço:', e);
      alert('Erro ao pesquisar o endereço.');
    }
  }

  function onPassengerMapClick(event) {
    const latlng = event?.latlng || event;
    if (!latlng) return;

    state.destino = [latlng.lat, latlng.lng];
    const destinationInput = document.getElementById('destination-input');
    if (destinationInput) {
      destinationInput.value = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    }

    if (state.pDestMarker) {
      state.pDestMarker.setLatLng(state.destino);
    } else {
      state.pDestMarker = L.marker(state.destino, { icon: window.redIcon || L.icon({}) })
        .addTo(state.passengerMap)
        .bindPopup('Destino')
        .bindTooltip('Destino', { permanent: true, direction: 'bottom', className: 'custom-label' });
    }

    if (state.pRouteLine) {
      state.passengerMap.removeLayer(state.pRouteLine);
      state.pRouteLine = null;
    }

    if (state.pUserMarker && state.pDestMarker) {
      state.pRouteLine = L.polyline([state.origem, state.destino], {
        color: '#ff9800',
        weight: 4,
        opacity: 0.9
      }).addTo(state.passengerMap);
    }

    const origemLat = state.origem[0];
    const origemLng = state.origem[1];
    const destinoLat = state.destino[0];
    const destinoLng = state.destino[1];

    const distanciaKm = Math.hypot(destinoLat - origemLat, destinoLng - origemLng) * 111.32;
    const valorEstimado = Math.max(6.68, (distanciaKm * 2.5) + 6.68);

    state.distanciaKm = distanciaKm;
    state.valorEstimado = valorEstimado;

    const distanceText = document.getElementById('distance-text');
    const priceText = document.getElementById('price-text');
    const rideDetails = document.getElementById('ride-details');

    if (distanceText) distanceText.textContent = `Distância: ${distanciaKm.toFixed(1)} km`;
    if (priceText) priceText.textContent = `R$ ${valorEstimado.toFixed(2).replace('.', ',')}`;
    if (rideDetails) rideDetails.style.display = 'block';
  }

  async function solicitarCorrida() {
    if (!state.currentUser || !state.destino) {
      alert('Selecione um destino antes de solicitar a corrida.');
      return;
    }

    const db = firebase.database();
    const tripRef = db.ref('corridas').push();

    const corrida = {
      id: tripRef.key,
      passageiro: state.currentUser.name,
      telefone: state.currentUser.phone,
      origem_lat: state.origem[0],
      origem_lng: state.origem[1],
      destino_lat: state.destino[0],
      destino_lng: state.destino[1],
      valor_estimado: state.valorEstimado,
      distancia_km: state.distanciaKm,
      status: 'pendente',
      createdAt: Date.now()
    };

    await tripRef.set(corrida);

    state.pendingRide = corrida;
    state.currentRideStatus = 'pendente';

    const statusBox = document.getElementById('status-box');
    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.textContent = 'Aguardando motorista aceitar...';
    }

    db.ref('corridas/' + tripRef.key).on('value', (snapshot) => {
      const atual = snapshot.val();
      if (!atual) return;

      if (atual.status === 'aceita') {
        state.currentRideStatus = 'aceita';
        if (statusBox) statusBox.textContent = 'Motorista aceitou sua corrida!';
      }

      if (atual.status === 'em_andamento') {
        state.currentRideStatus = 'em_andamento';
        if (statusBox) statusBox.textContent = 'Viagem em andamento.';
      }

      if (atual.status === 'finalizada') {
        state.currentRideStatus = 'finalizada';
        if (statusBox) statusBox.textContent = 'Corrida finalizada.';
      }
    });
  }

  function confirmarAceiteCorrida() {
    const db = firebase.database();
    const rideId = state.pendingRide?.id || state.activeRideId;
    if (!rideId) return;

    db.ref('corridas/' + rideId).update({ status: 'aceita' });
    state.currentRideStatus = 'aceita';
    state.activeRideId = rideId;

    const pickupCard = document.getElementById('driver-pickup-card');
    const requestCard = document.getElementById('driver-request-card');
    if (pickupCard) pickupCard.style.display = 'block';
    if (requestCard) requestCard.style.display = 'none';

    const pickupText = document.getElementById('driver-pickup-passenger-info');
    if (pickupText) pickupText.innerHTML = `<b>Passageiro:</b> ${state.pendingRide?.passageiro || '---'} - ${state.pendingRide?.telefone || '---'}`;

    const ridePrice = document.getElementById('driver-pickup-ride-price');
    if (ridePrice) ridePrice.textContent = `R$ ${(state.pendingRide?.valor_estimado || 0).toFixed(2).replace('.', ',')}`;
  }

  function iniciarViagemComPassageiro() {
    const db = firebase.database();
    const rideId = state.pendingRide?.id || state.activeRideId;
    if (!rideId) return;

    db.ref('corridas/' + rideId).update({ status: 'em_andamento' });
    state.currentRideStatus = 'em_andamento';

    const pickupCard = document.getElementById('driver-pickup-card');
    const activeCard = document.getElementById('driver-active-card');
    if (pickupCard) pickupCard.style.display = 'none';
    if (activeCard) activeCard.style.display = 'block';
  }

  function finalizarCorrida() {
    const db = firebase.database();
    const rideId = state.pendingRide?.id || state.activeRideId;
    if (!rideId) return;

    db.ref('corridas/' + rideId).update({ status: 'finalizada' });
    state.activeRideId = null;
    state.pendingRide = null;
    state.currentRideStatus = 'finalizada';

    const activeCard = document.getElementById('driver-active-card');
    const emptyBox = document.getElementById('driver-empty-box');
    if (activeCard) activeCard.style.display = 'none';
    if (emptyBox) emptyBox.style.display = 'block';
  }

  function escutarStatusMotorista() {
    const db = firebase.database();
    const keyPlate = (state.currentUser?.plate || '').replace(/[^a-zA-Z0-9]/g, '');
    const driverStatusRef = db.ref('motoristas/' + keyPlate);

    driverStatusRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      const saldoDevedor = data.saldoDevedor || 0;
      state.isDriverBlocked = data.bloqueado === true;

      const badge = document.getElementById('driver-badge');
      if (badge) {
        badge.innerHTML = `${state.currentUser.name} (${state.currentUser.plate}) <br><span style="color: ${saldoDevedor > 0 ? '#ff5252' : '#69f0ae'}; font-weight:bold;">Taxas Devidas: R$ ${saldoDevedor.toFixed(2).replace('.', ',')}</span>`;
      }

      if (state.isDriverBlocked) {
        document.getElementById('driver-blocked-card').style.display = 'block';
        document.getElementById('driver-empty-box').style.display = 'none';
        document.getElementById('driver-request-card').style.display = 'none';
        document.getElementById('driver-pickup-card').style.display = 'none';
        document.getElementById('driver-active-card').style.display = 'none';
      } else {
        document.getElementById('driver-blocked-card').style.display = 'none';
        if (!state.activeRideId && !state.pendingRide) {
          document.getElementById('driver-empty-box').style.display = 'block';
        }
      }
    });
  }

  function escutarCorridasMotorista() {
    const db = firebase.database();

    db.ref('corridas').on('value', (snapshot) => {
      const rides = snapshot.val() || {};
      const keys = Object.keys(rides);
      if (!keys.length) return;

      const pendingRide = keys
        .map((key) => ({ ...rides[key], id: key }))
        .find((ride) => ride.status === 'pendente');

      if (!pendingRide) return;

      state.pendingRide = pendingRide;

      const requestCard = document.getElementById('driver-request-card');
      const passengerInfo = document.getElementById('driver-passenger-info');
      const priceLabel = document.getElementById('driver-ride-price');

      if (requestCard) requestCard.style.display = 'block';
      if (passengerInfo) passengerInfo.innerHTML = `<b>Passageiro:</b> ${pendingRide.passageiro} - ${pendingRide.telefone}`;
      if (priceLabel) priceLabel.textContent = `R$ ${(pendingRide.valor_estimado || 0).toFixed(2).replace('.', ',')}`;
    });
  }

  window.appFlow = {
    iniciarReconhecimentoVoz,
    buscarEndereçoPorTexto,
    onPassengerMapClick,
    solicitarCorrida,
    confirmarAceiteCorrida,
    iniciarViagemComPassageiro,
    finalizarCorrida,
    escutarStatusMotorista,
    escutarCorridasMotorista
  };

  window.iniciarReconhecimentoVoz = iniciarReconhecimentoVoz;
  window.buscarEndereçoPorTexto = buscarEndereçoPorTexto;
  window.onPassengerMapClick = onPassengerMapClick;
  window.solicitarCorrida = solicitarCorrida;
  window.confirmarAceiteCorrida = confirmarAceiteCorrida;
  window.iniciarViagemComPassageiro = iniciarViagemComPassageiro;
  window.finalizarCorrida = finalizarCorrida;
  window.escutarStatusMotorista = escutarStatusMotorista;
  window.escutarCorridasMotorista = escutarCorridasMotorista;
})();
