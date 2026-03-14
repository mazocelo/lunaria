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

O `Backlog-2` esta majoritariamente correto, mas nao esta 100% limpo.

Status consolidado:

- Implementado e confirmado: maior parte dos itens
- Parcial: `S-01`, `S-05`, `P-03`
- Adiado por design: `T-04`, `T-01`

Conclusao pratica:

- o `Backlog-2` avancou de verdade;
- o resumo "22 implementados, 2 adiados" precisa nuance;
- tres itens ainda nao devem ser tratados como totalmente fechados.

## Achados principais

### 1. S-01 - JWT no WebSocket ficou parcial

**Status:** Parcial
**Arquivo:** `Backend/websocket/handlers/authHandler.js`

O `socketToken` agora e verificado com `jwt.verify`, e o `userId` deixa de vir do cliente.
Isso corrige a parte principal do problema.

Mas o `username` ainda pode cair no payload do cliente se o token nao trouxer `nome` ou `username`:

```js
const username = decoded.nome || decoded.username || String(data?.username || 'Jogador');
```

Impacto:

- impede impersonacao forte por `userId`;
- ainda deixa spoof semantico de nome no socket.

Tratamento correto:

- considerar `S-01` como **parcial**, nao totalmente concluido;
- o ideal e reconstruir `username` a partir de fonte confiavel, nao do payload.

### 2. S-05 - Blacklist de refresh token implementada, mas rotacao quebra lembrarDeMim

**Status:** Parcial
**Arquivos:**

- `Backend/middleware/authMiddleware.js`
- `Backend/controllers/auth/authController.js`

O `jti` foi adicionado, o logout blacklista e o refresh verifica Redis.
Essa parte esta correta.

O problema restante esta na rotacao:

- no login, `rememberMe=true` gera refresh token de `30d`;
- no refresh, o backend sempre recria o refresh token com `false`;
- o cookie renovado sempre volta com `25m`.

Impacto:

- sessoes "lembrar de mim" perdem duracao longa no primeiro refresh;
- a seguranca avancou, mas a semantica do produto ficou incompleta.

Tratamento correto:

- considerar `S-05` como **parcial** ate a rotacao preservar a politica original.

### 3. P-03 - Confirmacao ao sair ficou incompleta

**Status:** Parcial
**Arquivos:**

- `Frontend/src/Pages/Jogo/JogoAtivo/jogo-ativo.view.jsx`
- `Frontend/src/components/Jogo/Etapas/EtapaSalaEspera.jsx`

O `ConfirmationModal` foi aplicado no jogo ativo.
Isso esta correto.

Mas a sala de espera ainda chama `onSair` diretamente no botao "Sair da Sala".

Impacto:

- a protecao existe em parte do fluxo;
- ainda ha saida direta sem confirmacao antes da aventura iniciar.

Tratamento correto:

- considerar `P-03` como **parcial** se o objetivo era cobrir a saida do jogo/sala como um todo.

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

- **Concluido com ressalvas** no nivel macro
- **Nao totalmente limpo** no nivel item-a-item

Forma mais precisa de comunicar:

- `Backlog-2`: majoritariamente implementado
- `Pendencias restantes`: `S-01`, `S-05`, `P-03`
- `Adiados por design`: `T-04`, `T-01`

## Proximo passo recomendado

Antes de arquivar o `Backlog-2`, fechar estes tres pontos:

1. `S-01`: remover fallback de `username` vindo do cliente no auth websocket
2. `S-05`: preservar `rememberMe` na rotacao do refresh token
3. `P-03`: aplicar confirmacao tambem na saida da sala de espera

Depois disso, o `Backlog-2` pode ser tratado como efetivamente encerrado.
