export const appState = {
  currentRole: 'passageiro',
  currentUser: null,

  activeRideId: null,
  pendingRide: null,
  currentRideStatus: null,

  origin: [-21.5431, -43.0108],
  destination: null,
  estimatedValue: 0,
  distanceKm: 0,

  maps: {
    passengerMap: null,
    driverMap: null
  },

  flags: {
    isDriverBlocked: false,
    wakeLock: null
  },

  markers: {
    passenger: null,
    destination: null,
    driver: null,
    otherDrivers: {},
    passengerMarkers: {}
  }
};

export function setAppState(patch) {
  Object.assign(appState, patch);
}
