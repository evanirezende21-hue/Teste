(function () {
  function initRefactorBootstrap() {
    if (!window.appConfig || !window.appState) {
      return;
    }

    window.appState.flags.isInitializing = true;

    window.appState.bootstrapMeta = {
      status: 'mvp-refactor-active',
      createdAt: new Date().toISOString(),
      description: 'App running with configuration and state separated from the legacy UI script.'
    };

    document.documentElement.dataset.appBootstrap = 'ready';
    console.info('[Refactor] Bootstrap inicializado com config e state isolados.');

    window.appState.flags.isInitializing = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRefactorBootstrap);
  } else {
    initRefactorBootstrap();
  }
})();
