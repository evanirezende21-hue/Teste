export function watchLocation(onSuccess, onError = null, options = { enableHighAccuracy: true }) {
  if (!navigator.geolocation) {
    if (onError) onError(new Error('Geolocalização não disponível neste navegador.'));
    return null;
  }

  return navigator.geolocation.watchPosition(onSuccess, onError, options);
}

export function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não disponível neste navegador.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.latitude, position.coords.longitude]),
      reject,
      { enableHighAccuracy: true }
    );
  });
}
