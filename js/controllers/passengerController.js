import { db } from '../config/firebase.js';
import { appState } from '../state/appState.js';
import { formatPrice } from '../utils/formatters.js';

const TAXA_MINIMA = 6.68;
const PRECO_POR_KM = 2.5;

function calcularDistancia(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const hav = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(hav));
}

export async function buscarEndereçoPorTexto(textoBusca) {
  const rawQuery = textoBusca || document.getElementById('destination-input')?.value?.trim();
  if (!rawQuery) return;

  let query = rawQuery;
  const lower = rawQuery.toLowerCase();
  if (!lower.includes('são joão nepomuceno') && !lower.includes('sjn')) {
    query = `${rawQuery}, São João Nepomuceno - MG`;
  }

  try {
    const viewbox = '-43.05,-21.50,-42.97,-21.58';
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&bounded=1&viewbox=${viewbox}&limit=1`;
    let response = await fetch(url);
    let data = await response.json();

    if (!data || data.length === 0) {
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      response = await fetch(url);
      data = await response.json();
    }

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      atualizarDestinoSelecionado({ lat, lng });
      return;
    }

    alert('Endereço não encontrado em São João Nepomuceno.');
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    alert('Erro ao pesquisar o endereço.');
  }
}

export function iniciarReconhecimentoVoz() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Seu navegador não suporta reconhecimento de voz.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;

  const btnMic = document.getElementById('btn-voice');
  if (btnMic) btnMic.classList.add('listening');

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('destination-input');
    if (input) input.value = transcript;
    buscarEndereçoPorTexto(transcript);
    if (btnMic) btnMic.classList.remove('listening');
  };

  recognition.onerror = () => {
    if (btnMic) btnMic.classList.remove('listening');
    alert('Não foi possível entender a voz. Tente novamente.');
  };

  recognition.onend = () => {
    if (btnMic) btnMic.classList.remove('listening');
  };
}

export function atualizarDestinoSelecionado(latlng) {
  const destino = [latlng.lat, latlng.lng];
  appState.destination = destino;

  const origem = appState.origin;
  const distancia = calcularDistancia(origem, destino);
  const valor = Math.max(TAXA_MINIMA, distancia * PRECO_POR_KM);

  appState.distanceKm = distancia;
  appState.estimatedValue = valor;

  const distanceText = document.getElementById('distance-text');
  const priceText = document.getElementById('price-text');
  if (distanceText) distanceText.innerText = `Distância: ${distancia.toFixed(1)} km`;
  if (priceText) priceText.innerText = `R$ ${valor.toFixed(2).replace('.', ',')}`;

  const rideDetails = document.getElementById('ride-details');
  if (rideDetails) rideDetails.style.display = 'block';
}

export function solicitarCorrida() {
  const user = appState.currentUser;
  const destino = appState.destination;

  if (!user || !destino) {
    alert('Selecione um destino antes de solicitar a corrida.');
    return;
  }

  const origem = appState.origin;
  const distancia = calcularDistancia(origem, destino);
  const valor = Math.max(TAXA_MINIMA, distancia * PRECO_POR_KM);

  const rideRef = db.ref('corridas').push();
  const ride = {
    id: rideRef.key,
    passageiro: user.name,
    telefone: user.phone,
    origem_lat: origem[0],
    origem_lng: origem[1],
    destino_lat: destino[0],
    destino_lng: destino[1],
    valor,
    distancia_km: distancia,
    status: 'pendente',
    createdAt: Date.now()
  };

  rideRef.set(ride);
  appState.pendingRide = ride;

  const statusBox = document.getElementById('status-box');
  if (statusBox) {
    statusBox.innerText = 'Corrida solicitada. Aguardando motorista...';
    statusBox.style.display = 'block';
  }
}

export function initPassengerController() {
  const searchBtn = document.getElementById('btn-search-address');
  const requestBtn = document.getElementById('btn-request');
  const voiceBtn = document.getElementById('btn-voice');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const value = document.getElementById('destination-input')?.value || '';
      buscarEndereçoPorTexto(value);
    });
  }

  if (requestBtn) {
    requestBtn.addEventListener('click', solicitarCorrida);
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', iniciarReconhecimentoVoz);
  }
}
