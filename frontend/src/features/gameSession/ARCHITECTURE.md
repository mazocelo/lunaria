# gameSession — Arquitetura

## Estrutura

```
features/gameSession/
  config/
    phaseConfig.js          Definicao das 3 fases (CHARACTER_SELECT, LOBBY, ACTIVE)
    routeRules.js           resolvePhaseRedirect — single source of truth para guard
  core/
    useGameSessionCore.js   Hook compartilhado: state store-backed + acoes puras (sairDoJogo)
    useGameSessionSocket.js Hook de socket: connectAndAuth, joinGameRoom, onEvent/offEvent
    gameSessionSelectors.js Selectors puros para derived state
  phases/
    character-select/
      character-select.model.js   Source of truth — SelecaoPersonagem
    lobby/
      lobby.model.js              Source of truth — SalaEspera
    active/
      active.model.js             Source of truth — JogoAtivo
  index.js                  Barrel: config + selectors (hooks importados diretamente)
```

## Padrao MVVM por fase

Cada fase segue Model → ViewModel → View:

- **Model** (`*.model.js`): Hook com toda logica de negocio, effects, handlers
- **ViewModel** (`index.jsx`): Chama o model, spread props para a view
- **View** (`*.view.jsx`): Componente puro, zero logica

Os models vivem em `features/gameSession/phases/`. Os locais originais (`Pages/Jogo/*/`)
contem **wrappers compat** que re-exportam os novos models:

```
Pages/Jogo/SalaEspera/sala-espera.model.js  →  useLobbyModel
Pages/Jogo/JogoAtivo/jogo-ativo.model.js    →  useActiveModel
Pages/Jogo/SelecaoPersonagem/selecao-personagem.model.js  →  useCharacterSelectModel
```

## Regra de instancia

**Acao + erro/loading SEMPRE do mesmo hook.**

Se `iniciarJogo()` vem de `useJogo`, entao `error` e `clearErrors()` tambem devem vir
de `useJogo` — nunca de `useGameSessionCore` ou outra instancia. Motivo: hooks com
local state criam instancias isoladas. Misturar causa bugs onde erros sao escritos em
uma instancia mas lidos de outra.

Excecao: `sairDoJogo()` vem do core porque escreve diretamente no Zustand store
(sem local state), portanto e seguro usar de qualquer instancia.

## Hooks legados

`Pages/Jogo/hooks/` contem 3 hooks consumidos pelos phase models:

| Hook | Uso | Status |
|------|-----|--------|
| `useJogo` | Acoes complexas (iniciarJogo, retomarJogo, conectarSocket, etc.) + error/loading | Dependencia interna — sera desmembrado quando acoes migrarem para o core |
| `useJogoSocket` | Conexao WebSocket + listeners + socketError | Dependencia interna — mesma regra |
| `useJogoGuard` | Validacao de acesso por fase | Refatorado — delega para `resolvePhaseRedirect` |

Estes hooks NAO sao legado a ser deletado. Sao dependencias intencionais ate que as
acoes de orquestracao sejam extraidas para o core.

## Guard

O guard de acesso funciona em 2 camadas:

1. **`resolvePhaseRedirect(phaseId, state)`** em `config/routeRules.js`
   - Funcao pura, testavel, single source of truth
   - Recebe phase ID + estado booleano, retorna route segment ou null

2. **`useJogoGuard(requiredStep)`** em `Pages/Jogo/hooks/useJogoGuard.js`
   - Hook React que chama `resolvePhaseRedirect` internamente
   - Adiciona: leitura de store, useEffect, navigate, timeout 150ms (anti-flash)
   - Recebe route segment ('sala-espera'), converte via `getPhaseByRoute`

Semantica: so retrocede, nunca avanca automaticamente.

## O que falta para eliminar o legado

1. Extrair acoes de orquestracao de `useJogo` para hooks dedicados no core
   (iniciarJogo, retomarJogo, carregarPersonagens, selecionarPersonagem, etc.)
2. Extrair acoes de `useJogoSocket` para `useGameSessionSocket`
   (conectarSocket, conectarComoConvidado, garantirEntradaSala)
3. Migrar error/loading para o core (unificar local state)
4. Atualizar phase models para consumir apenas core
5. Converter `useJogo`/`useJogoSocket` em wrappers ou deletar
