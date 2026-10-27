import { initAuthController } from './controllers/authController.js';
import { renderAuthView } from './views/authView.js';

window.addEventListener('DOMContentLoaded', () => {
  renderAuthView();
  initAuthController();
  console.log('Aplicação inicializada em modo modular.');
});
