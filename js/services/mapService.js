export function createMap(containerId, options = {}) {
  if (!window.L) return null;
  return window.L.map(containerId, options);
}

export function addGoogleTileLayers(map) {
  if (!window.L || !map) return;

  const googleStreets = window.L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  });

  const googleSat = window.L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Satellite'
  });

  googleSat.addTo(map);
  window.L.control.layers({ 'Satélite (Google)': googleSat, 'Mapa de Ruas (Google)': googleStreets }, {}, { position: 'topright' }).addTo(map);
}
