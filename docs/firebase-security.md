# Segurança do Firebase para o app Moto Táxi SJN

Este repositório agora inclui `database.rules.json` como base de segurança para o Realtime Database do Firebase.

## Objetivo
Proteger os dados sensíveis do app e impedir que qualquer usuário do frontend altere informações críticas sem autorização.

## O que as regras estão protegendo
- `usuarios`: só o próprio usuário pode ler e escrever os dados do seu perfil
- `motoristas`: só o motorista dono da placa ou o admin pode ler/escrever
- `passageiros`: só o passageiro dono do telefone ou o admin pode ler/escrever
- `corridas`: só o passageiro da corrida, o motorista atribuído ou o admin podem acessar

## Observações importantes
1. O frontend não deve conter lógica crítica, como autenticação de admin, bloqueio de motorista ou manutenção financeira.
2. O Realtime Database precisa ser ativado no projeto Firebase e esse arquivo deve ser publicado com o comando:

```bash
firebase deploy --only database
```

3. O app ainda precisa garantir que o campo `role` e os campos `phone` / `placa` existam nos dados do usuário para que as regras funcionem como esperado.
4. A regra de admin pode ser refinada futuramente para usar um campo específico, por exemplo `usuarios/{uid}/role === "admin"` ou um `isAdmin` dedicado, sob validação extra.

## Recomendação para produção
Para um sistema real, a lógica de negócios sensível deve ser movida para Cloud Functions, como:
- aceitar corrida
- bloquear motorista
- quitar taxa
- liberar corrida
- aplicar taxas e regras de saldo

Isso porque o frontend sempre pode ser manipulado por um usuário malicioso.
