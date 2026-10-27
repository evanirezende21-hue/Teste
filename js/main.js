import { initAuthController } from './controllers/authController.js';
import { initPassengerController } from './controllers/passengerController.js';
import { initDriverController } from './controllers/driverController.js';
import { initAdminController } from './controllers/adminController.js';

window.addEventListener('DOMContentLoaded', () => {
  initAuthController();
  initPassengerController();
  initDriverController();
  initAdminController();
  console.log('App inicializada com arquitetura modular.');
});
