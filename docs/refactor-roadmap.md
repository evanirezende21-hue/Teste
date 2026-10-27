# Refatoração do MVP do Moto Táxi SJN

Objetivo:
- manter o app funcionando sem quebrar o fluxo atual
- reduzir o acoplamento do código monolítico em `index.html`
- separar configuração, estado e utilitários em módulos
- preparar o projeto para evoluir sem reescrever tudo do zero

Estrutura planejada:
- `js/app-config.js` — Firebase, pricing e appConfig
- `js/app-state.js` — estado centralizado do app
- `js/app-bootstrap.js` — bootstrap inicial para o processo de refatoração
- `index.html` — manter a camada de interface e o fluxo atual

Próximos passos recomendados:
1. extrair autenticação e login
2. extrair robô de mapa e rota
3. extrair fluxo de corrida e motorista
4. extrair painel admin
5. mover CSS para `styles.css`
6. revisar Firebase Rules e segurança

Observação:
- esta primeira etapa foi feita de forma segura para não interromper a funcionalidade atual do app.
- a refatoração incremental reduz risco e mantém o projeto operacional.
