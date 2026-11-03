# Review 2 - Auditoria do Backlog 2

Esta pasta registra a segunda revisao formal do projeto.

O foco da `review-2` nao e o backlog original encerrado em `docs/encerrado/backlog/`.
O foco aqui e auditar o estado real do `Backlog-2` contra o codigo atual do runtime.

## Objetivo

Validar se os itens marcados como implementados no `Backlog-2`:

- realmente existem no codigo atual;
- nao ficaram apenas parciais;
- nao regrediram o runtime;
- nao inflaram o percentual de conclusao da rodada;
- podem ser tratados como encerrados ou precisam voltar para backlog.

## Fonte de verdade

Usar sempre esta ordem:

1. codigo atual do workspace
2. commits efetivamente aplicados
3. `Backend/docs/backlog-2/README.md`
4. resumos textuais de sessao

Se houver divergencia entre resumo e runtime, o codigo vence.

## Escopo da review-2

Auditar o `Backlog-2` nas frentes abaixo:

1. Fase 1 - Seguranca
2. Fase 2 - Integridade do jogo
3. Fase 3 - UX
4. Fase 4 - Seguranca avancada
5. Fase 5 - Housekeeping
6. Fase 6 - Debito tecnico

## Veredito atual

O `Backlog-2` agora pode ser tratado como funcionalmente concluido.

Status consolidado:

- Implementado e confirmado: itens do backlog
- Reauditado e fechado: `S-01`, `S-05`, `P-03`
- Adiado por design: `T-04`, `T-01`

Conclusao pratica:

- o `Backlog-2` avancou de verdade;
- os tres pontos que estavam parciais foram corrigidos;
- o resumo "22 implementados, 2 adiados" agora esta coerente com o runtime.

## Reauditoria dos 3 itens parciais

### 1. S-01 - Username confiavel no WebSocket

**Status:** Resolvido
**Arquivos:**

- `Backend/middleware/authMiddleware.js`
- `Backend/controllers/auth/authController.js`
- `Backend/websocket/handlers/authHandler.js`

O `nome` agora entra no payload JWT de:

- access token
- refresh token
- socket token

O handler de auth websocket deixou de usar fallback do cliente:

```js
const username = decoded.nome || 'Jogador';
```

Resultado:

- o `userId` continua vindo do token verificado;
- o `username` deixa de depender de `data.username`;
- o spoof semantico via payload do cliente foi removido.

Observacao residual:

- tokens antigos sem `nome` ainda podem aparecer como `Jogador` ate novo login/renovacao;
- isso e compatibilidade de transicao, nao bug aberto.

### 2. S-05 - rememberMe preservado na rotacao

**Status:** Resolvido
**Arquivos:**

- `Backend/middleware/authMiddleware.js`
- `Backend/controllers/auth/authController.js`

O `refresh token` agora carrega `rememberMe` no payload.
Na renovacao:

- `refreshToken()` le `decoded.rememberMe`
- propaga isso para o novo refresh token
- retorna `rememberMe` ao controller
- o controller recalcula `maxAge` do cookie com base nesse valor

Resultado:

- sessao com `rememberMe=true` continua em `30d`;
- sessao comum continua em `25m`;
- a blacklist com `jti` permanece funcionando.

Observacao residual:

- refresh tokens antigos sem `rememberMe` continuam caindo no fallback `false`;
- isso e comportamento aceitavel de compatibilidade, nao pendencia aberta.

### 3. P-03 - Confirmacao ao sair da sala de espera

**Status:** Resolvido
**Arquivos:**

- `Frontend/src/Pages/Jogo/SalaEspera/sala-espera.model.js`
- `Frontend/src/Pages/Jogo/SalaEspera/sala-espera.view.jsx`

O fluxo da sala de espera agora segue o mesmo padrao do jogo ativo:

- `handleSair` abre modal
- `confirmarSair` executa a saida
- `cancelarSair` fecha o modal
- a view renderiza `ConfirmationModal` com `type="danger"`

Resultado:

- a saida passou a ser consistente entre sala de espera e jogo ativo;
- o fluxo agora protege contra clique acidental antes do inicio da aventura.

## Itens auditados e confirmados

Os itens abaixo conferem com o runtime atual:

### Fase 1 - Seguranca

- `S-02`: guard `userId === socket.userId` no `masterNarrationEngine`
- `S-04`: `sanitizePromptInput()` aplicado antes de montar o prompt
- `S-08`: whitelist de eventos no broadcast admin
- `S-09`: fallback CORS Heroku removido

### Fase 2 - Integridade do jogo

- `P-01`: HP/MP persistidos no merge de sessao
- `P-02`: auto-save do wizard com chave versionada + `beforeunload`
- `N-02`: guard contra salvar personagem sem bonus aplicados

### Fase 3 - UX

- `P-04`: vagas reais em `Explorar`
- `P-10`: indicador `X/Y` na sala de espera
- `P-09`: avatar real no feed e no top header
- `P-12`: `window.confirm` trocado por `ConfirmationModal` nos pontos auditados
- `N-03`: contador de filtradas vs total corrigido
- `N-04`: placeholder `??` removido do fluxo auditado de audio/historico

### Fase 4 - Seguranca avancada

- `S-06`: `socketToken` removido do `localStorage`, mantido so em memoria Zustand

### Fase 5 - Housekeeping

- `N-01`: limpeza de `sessionRecap` saiu da view e foi centralizada no model
- `T-06`, `T-07`, `T-08`, `T-09`, `T-02`: resolvidos nas rodadas anteriores citadas no resumo

### Fase 6 - Debito tecnico

- `T-03`: uso global implicito removido; notificacoes agora usam import direto de `showGameNotification`
- `T-10`: `sessionEngine` deixou de usar os `await import()` que estavam no escopo da rodada

## Status real do Backlog-2

Leitura recomendada da rodada:

- **Concluido** no nivel do backlog planejado
- **Com observacoes de compatibilidade** apenas para tokens antigos

Forma mais precisa de comunicar:

- `Backlog-2`: implementado e reauditado
- `Pendencias restantes`: nenhuma dentro do escopo fechado
- `Adiados por design`: `T-04`, `T-01`

## Proximo passo recomendado

O `Backlog-2` ja pode ser tratado como encerrado.

Proximos movimentos naturais:

1. arquivar o `Backlog-2` quando voce quiser consolidar a rodada
2. manter apenas nota operacional sobre compatibilidade de tokens antigos
3. seguir para `backlog-3` ou para novas reviews de runtime
