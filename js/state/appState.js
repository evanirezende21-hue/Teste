export const appState = {
  currentRole: 'passageiro',
  currentUser: null,
  activeRideId: null,
  pendingRide: null,
  currentRideStatus: null,
  maps: {
    passengerMap: null,
    driverMap: null
  }
};

export function setCurrentRole(role) {
  appState.currentRole = role;
}

export function setCurrentUser(user) {
  appState.currentUser = user;
}
