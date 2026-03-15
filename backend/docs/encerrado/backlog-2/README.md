# Backlog 2 — Analise de Pendencias

Analise completa pos-Rodada 13 (2026-03-14). Duas perspectivas: arquitetura tecnica e produto/UX.

Referencia: o Backlog 1 (`README-analise-pendencias.md`) cobriu 6 frentes (F-01 a F-03, D-01 a D-03), todas acima de 95%. Este backlog cobre gaps residuais, vulnerabilidades e novos problemas identificados.

---

## Sumario

| Categoria | Criticos | Altos | Medios | Baixos | Total |
|-----------|----------|-------|--------|--------|-------|
| Seguranca | 1 | 5 | 2 | 1 | 9 |
| Bugs Runtime | 0 | 1 | 1 | 0 | 2 |
| Produto/UX | 0 | 6 | 8 | 5 | 19 |
| Debito Tecnico | 0 | 2 | 4 | 4 | 10 |
| **Total** | **1** | **14** | **15** | **10** | **40** |

---

## Parte 1 — Seguranca e Arquitetura (visao tecnica)

### S-01. Autenticacao WebSocket sem verificacao JWT [CRITICA]

**Status:** PERSISTE (desde Backlog 1)
**Arquivo:** `websocket/handlers/authHandler.js:20-38`

O handler `authenticate` aceita `userId` e `username` do payload do cliente sem chamar `jwt.verify()`. O `socketToken` e gerado no login, enviado ao frontend e passado no `socket.handshake.auth`, mas o handler nunca o valida — apenas loga `hasToken: !!data?.token`.

Qualquer cliente pode se autenticar como qualquer userId existente.

**Correcao:** Verificar `socket.handshake.auth?.token` com `jwt.verify(token, JWT_SECRET)`. Extrair `userId` do token verificado. Rejeitar se ausente, invalido ou divergente do payload.

---

### S-02. handleMensagemParaMestre aceita userId arbitrario [ALTA]

**Status:** NOVO
**Arquivo:** `websocket/engines/masterNarrationEngine.js:82-86`

O handler de mensagem para o Mestre aceita `userId` do payload sem verificar contra `socket.userId`. Um jogador autenticado pode enviar mensagens no nome de outro jogador, ganhando a vez de turno e injetando acoes no historico alheio.

O `handleMensagemRoleplay` (linha 406) TEM a verificacao. O `handleMensagemParaMestre` NAO tem.

**Correcao:** Adicionar `if (String(rawUserId) !== String(socket.userId)) return` — identico ao guard do roleplay.

---

### S-03. requireSuperAdmin sem authenticateToken em 6+ rotas [ALTA]

**Status:** NOVO
**Arquivos:**
- `routes/equipamento.js:11-13`
- `routes/classe.js:77, 145-146`
- `routes/habilidades.js:26, 29, 32`
- `routes/raca.js:77, 145-146`
- `routes/desvantagens.js:172, 449-450`
- `routes/websocket.js:43, 95, 164, 234`

O middleware `requireSuperAdmin` verifica `req.user.role`, mas `req.user` so e populado por `authenticateToken`. Nas rotas listadas, `authenticateToken` nao e chamado antes de `requireSuperAdmin`. Resultado: `req.user` e `undefined`, retorna 401 generico em vez de validacao real.

Compare com `adminMotor.js:13` que faz corretamente: `authenticateToken, requireSuperAdmin`.

**Correcao:** Adicionar `authenticateToken` antes de `requireSuperAdmin` em todas as rotas listadas.

---

### S-04. Prompt injection nao sanitizado [ALTA]

**Status:** NOVO
**Arquivo:** `websocket/engines/masterNarrationEngine.js:246`

A mensagem do jogador entra diretamente no prompt da IA sem sanitizacao:

```js
acaoComContexto += `Acao do jogador: "${mensagem}"`;
```

A funcao `sanitizePromptInput` existe em `helpers/sanitize.js` mas NAO e chamada. A sanitizacao atual tambem e fragil — apenas remove `{}`, `<>`, `###`, `IGNORE`.

**Correcao:** Aplicar `sanitizePromptInput(mensagem)` antes de montar `acaoComContexto`. Fortalecer filtro contra variantes unicode, whitespace, "Human:", "Assistant:", "SYSTEM:".

---

### S-05. Refresh Token sem blacklist [ALTA]

**Status:** PERSISTE (desde Backlog 1)
**Arquivo:** `controllers/auth/authController.js:305-325`

O logout limpa cookies no cliente mas nao invalida o refresh token. Um token capturado antes do logout continua gerando access tokens por ate 30 dias.

**Correcao:** Armazenar `jti` (JWT ID) no refresh token. Manter blacklist no Redis com TTL = vida do token. Verificar blacklist em `verifyRefreshToken`.

---

### S-06. SocketToken em localStorage (exposto a XSS) [ALTA]

**Status:** NOVO
**Arquivos:** `Frontend/src/store/socket/states.js:36`, `Frontend/src/store/socket/connection.js:168`

O `socketToken` (JWT 24h) e armazenado em `localStorage`, acessivel a qualquer script XSS. Os outros tokens (access, refresh) usam cookies HttpOnly corretamente — assimetria de seguranca.

**Correcao:** Obter novo socketToken via `/auth/renovar` a cada conexao WebSocket em vez de persistir em localStorage.

---

### S-07. Rollback CI/CD com git checkout HEAD~1 incorreto [ALTA]

**Status:** NOVO
**Arquivo:** `.github/workflows/ci-cd.yml:77`

`git checkout HEAD~1 -- .` restaura arquivos mas NAO move HEAD. No proximo `git pull --ff-only`, o pull falhara (HEAD no commit novo, working tree no antigo). O rollback e falso — deixa servidor em estado hibrido.

**Correcao:** Usar `git revert HEAD --no-edit` (cria commit de rollback) ou manter artefatos de build versionados.

---

### S-08. Broadcast admin sem whitelist de eventos [MEDIA]

**Status:** NOVO
**Arquivo:** `routes/websocket.js:107`

O endpoint de broadcast admin permite emitir qualquer event name arbitrario para todos os clientes:

```js
socketManager.io.emit(event, data); // event e data vem do request
```

Um superadmin pode emitir eventos que o frontend nao espera, causando comportamento imprevisivel.

**Correcao:** Whitelist de eventos permitidos no broadcast.

---

### S-09. Fallback CORS apontando para Heroku inexistente [BAIXA]

**Status:** NOVO
**Arquivo:** `app.js:22`

```js
process.env.FRONTEND_URL || 'https://lunaria-frontend.herokuapp.com'
```

Se `FRONTEND_URL` nao estiver definida, CORS bloqueara todas as requisicoes do frontend real.

**Correcao:** Trocar fallback para `false` ou URL real da VPS.

---

## Parte 2 — Bugs e Debito Tecnico

### T-01. Mutex em memoria (falha em multi-processo) [ALTA]

**Status:** PERSISTE (intencional, risco futuro)
**Arquivo:** `websocket/socketManager.js:74, 101-120`

O `_roomLocks` (Map em memoria) nao funciona entre processos. Se o backend rodar com cluster/PM2/horizontal scaling, dois workers podem processar a mesma sala simultaneamente, corrompendo estado Redis.

Atualmente roda processo unico (systemd). Bomba-relogio arquitetural.

**Correcao:** Substituir por lock distribuido Redis (SET NX PX) — mesmo padrao de `enqueueRoteiroJob.js:acquireRoteiroLock`.

---

### T-02. buildMestreMensagem duplicada em 3 lugares [MEDIA]

**Status:** PARCIALMENTE CORRIGIDO
**Arquivos:**
- `websocket/socketManager.js:40-58`
- `websocket/engines/combatEngine.js:26-44` (copia identica)
- `websocket/utils/sessionMessages.js:54`

CombatEngine tem comentario explicito: "mirrors socketManager's module-level buildMestreMensagem".

**Correcao:** Exportar de modulo unico e importar nos 3 lugares.

---

### T-03. window.showGameNotification como global implicito [MEDIA]

**Status:** NOVO
**Arquivos:**
- `Frontend/src/store/socket/listeners.js` — 15+ ocorrencias
- `Frontend/src/components/Jogo/NotificationManager.jsx:40, 44`

O store Zustand depende de um efeito colateral de um componente React (`window.showGameNotification = addNotification`). Se o componente nao montou, notificacoes sao descartadas silenciosamente.

**Correcao:** Expor via Context React ou store Zustand.

---

### T-04. Query DB por request na autenticacao sem cache [MEDIA]

**Status:** NOVO
**Arquivo:** `middleware/authMiddleware.js:29-35`

Cada request autenticado faz query ao PostgreSQL para buscar usuario e role. Em alta carga, queries multiplicadas desnecessariamente.

**Correcao:** Cache Redis com TTL 60s para `user:${userId}`. Invalidar em mudanca de role.

---

### T-05. ~77 arquivos com console.* em producao [MEDIA]

**Status:** PERSISTE (documentado no Backlog 1)

Pino ativo em 6 arquivos criticos. Restam ~77 com `console.log/error/warn`, sem niveis configuraveis nem formato JSON.

**Correcao:** Migrar incrementalmente, priorizando: `bin/worker`, `authController.js`, `sessionEngine.js`, `combatEngine.js`.

---

### T-06. Morgan modo dev em producao [MEDIA]

**Status:** PERSISTE
**Arquivo:** `app.js:46`

**Correcao:** `app.use(logger(isProduction ? 'combined' : 'dev'))` ou remover Morgan (pino ja instalado).

---

### T-07. WebSocketService_CORRIGIDO.js arquivo morto [BAIXA]

**Status:** PERSISTE
**Arquivo:** `Backend/WebSocketService_CORRIGIDO.js` (379 linhas, URL Heroku hardcoded)

**Correcao:** Deletar.

---

### T-08. FF_AI_ASYNC_ROTEIRO no env.example (flag removida do codigo) [BAIXA]

**Status:** NOVO
**Arquivo:** `env.example:42`

**Correcao:** Remover a entrada.

---

### T-09. Modelo hardcoded no historico de versoes [BAIXA]

**Status:** NOVO
**Arquivo:** `services/roteiroGenerationService.js:101`

```js
modelo: 'claude-sonnet-4-5-20250929',
```

Campo hardcoded em vez de usar o modelo efetivamente retornado pelo `blueprintService`.

**Correcao:** Persistir modelo dinamico retornado pela geracao.

---

### T-10. Import dinamico dentro de funcao frequente [BAIXA]

**Status:** NOVO
**Arquivo:** `websocket/engines/sessionEngine.js:60`

```js
const { default: db } = await import('../../Model/index.js');
```

Deveria ser import estatico no topo do arquivo, igual aos outros engines.

---

## Parte 3 — Produto e UX (visao de produto)

### P-01. HP nao persiste apos encerramento de sessao [ALTO]

**Status:** PERSISTE (parcialmente mascarado)
**Arquivo:** `Model/PersonagemSessao.js` — `finalizarEMesclar():194-203`

O merge propaga `xp_atual`, `nivel`, `xp_proximo_nivel` para tabela `personagens`, mas NAO inclui `hp_atual` nem `mp_atual`. O clone armazena HP durante a sessao via `persistirEstadoClone`, mas o valor e descartado no merge.

**Impacto usuario:** Personagem sai com 3 HP do combate. Proxima sessao: HP cheio. Consequencia mecanica do jogo quebrada.

**Correcao:** Incluir `hp_atual: clone.hp_atual` no `tx.personagens.update` dentro de `finalizarEMesclar`.

---

### P-02. Wizard de criacao perde todo progresso ao fechar aba [ALTO]

**Status:** PERSISTE
**Arquivo:** `Frontend/src/` — wizard.model.js

9 etapas de criacao em `useState` local sem nenhum persist. Sem `localStorage`, sem sessionStorage, sem `beforeunload` listener. Criacao leva 5-15 minutos.

**Impacto usuario:** Fechar aba acidentalmente = perder tudo. Devastador para fluxo rico e demorado.

**Correcao:** Auto-save em `localStorage` a cada mudanca de etapa. Restaurar no mount.

---

### P-03. Sair do jogo sem confirmacao [ALTO]

**Status:** PERSISTE
**Arquivos:** `Frontend/src/components/Jogo/EtapaJogoRPG.view.jsx:217`, `jogo-ativo.model.js:146`

`onClick={onSair}` direto sem modal. `ConfirmationModal` existe no projeto mas nao e usado aqui.

**Impacto usuario:** Clique acidental abandona sessao multiplayer sem aviso. Disruptivo para todos os jogadores.

**Correcao:** Envolver `onSair` com `ConfirmationModal` existente.

---

### P-04. Vagas exibidas sao o maximo, nao as disponiveis [ALTO]

**Status:** PARCIALMENTE CORRIGIDO
**Arquivo:** `Frontend/src/` — Explorar/index.jsx:135

Backend ja retorna `totalJogadores` e `sessaoAtiva`. Frontend exibe `maximo_de_participantes` como texto estatico "vagas", ignorando `totalJogadores`.

**Correcao:** Calcular `vagasDisponiveis = maximo - totalJogadores`. Exibir "X/Y vagas".

---

### P-05. Level-up sem distribuicao de pontos no jogo ativo [ALTO]

**Status:** NOVO
**Arquivos:** `Model/PersonagemSessao.js:adicionarXP:187`, `Frontend/src/` — LevelUpCelebration.jsx

`pontosAtributoPendentes` acumula ao subir de nivel, mas so pode distribuir na pagina "Ver Personagem" fora do jogo. O modal de level-up nao abre painel de distribuicao.

**Impacto usuario:** Subiu de nivel no combate mas nao sabe o que fazer com os pontos. Precisa sair do jogo para distribui-los.

**Correcao:** Adicionar opcao de distribuir pontos no modal de level-up ou na ficha dentro do jogo ativo.

---

### P-06. Explorar Historias sem filtros uteis [ALTO]

**Status:** PARCIALMENTE CORRIGIDO
**Arquivo:** `Frontend/src/` — Explorar/index.jsx

Busca client-side por texto apenas. Sem filtros por tema, status, vagas ou nivel. API ja tem esses dados mas nao sao usados como filtro.

**Correcao:** Adicionar chips/selects de filtro com filtragem server-side via query params.

---

### P-07. Upload de avatar inexistente [MEDIO]

**Status:** PERSISTE
**Arquivo:** `Frontend/src/` — perfil.view.jsx:147-151

Campo texto para URL externa. Sem botao de upload. Backend ja tem `imageController.js` e R2 integrado.

**Correcao:** Adicionar `input type="file"` com preview, integrado ao endpoint de upload existente.

---

### P-08. Notificacoes de convite via polling 30s [MEDIO]

**Status:** PARCIALMENTE CORRIGIDO
**Arquivo:** `Frontend/src/` — App.jsx:100

Polling com `setInterval(fetchNotificationCount, 30000)`. Socket ja esta conectado mas nao emite `novo_convite`.

**Correcao:** Emitir evento WebSocket `novo_convite` ao criar convite. Listener no store para toast + contador.

---

### P-09. Avatar ignorado no Feed e TopHeader [MEDIO]

**Status:** NOVO
**Arquivos:** `Frontend/src/` — FeedPostCard.jsx:102-104, TopHeader.jsx:123-129

Sempre renderiza inicial do nome em vez de verificar `usuario.avatar`. Mesmo com URL configurada, avatar nao aparece.

**Correcao:** Verificar `avatar` e exibir `<img>` se disponivel, fallback para inicial.

---

### P-10. Sala de espera sem indicador X/Y participantes [MEDIO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — EtapaSalaEspera.jsx

Recebe `participantes` e `historia` mas nao exibe progresso de lotacao.

**Correcao:** Adicionar indicador "X/Y participantes" (ex: barra de progresso ou texto).

---

### P-11. Feed sem feedback de sucesso ao publicar [MEDIO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — feed.model.js:53-71

Erro exibido, sucesso silencioso. Campo limpa mas sem toast nem animacao.

**Correcao:** Toast de sucesso ou animacao de entrada no novo post.

---

### P-12. window.confirm nativo para geracao de audio [MEDIO]

**Status:** NOVO
**Arquivos:** `Frontend/src/` — renderers.jsx:320-324, SessaoHistoricoModal.jsx:90-93

Popup nativo do navegador quebra imersao. `ConfirmationModal` existe no projeto.

**Correcao:** Substituir `window.confirm` por `ConfirmationModal`.

---

### P-13. Indicador "Mestre pensando" sem retry suave [MEDIO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — EtapaJogoRPG (hooks de jogo)

Texto estatico "O Mestre esta pensando...". Apos timeout de 30s, sem opcao de "Tentar novamente" contextual.

**Correcao:** Indicador animado tipo "digitando". Botao "Tentar novamente" ao timeout que reenvia ultima mensagem.

---

### P-14. Historico de sessoes sem resumo narrativo [MEDIO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — SessaoHistoricoModal

Modal exibe mensagens brutas. O `SessionRecap` gera `resumo` mas nao e persistido/exibido no historico.

**Correcao:** Persistir `resumo` na tabela `sessoes_jogo`. Exibir no topo do modal.

---

### P-15. Configuracoes duplicadas no dropdown [BAIXO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — TopHeader.jsx:150-162

"Meu Perfil" e "Configuracoes" ambos apontam para `/perfil`.

**Correcao:** Remover duplicata ou criar pagina `/configuracoes` separada.

---

### P-16. Onboarding nao menciona wizard de IA [BAIXO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — OnboardingTour.jsx:27

Tour direciona para `/personagens` (lista), nao para `/novo-personagem` (wizard com IA).

**Correcao:** Redirecionar para `/novo-personagem` e mencionar o "Mestre Criador".

---

### P-17. Explorar sem paginacao real [BAIXO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — Explorar/index.jsx

Limite fixo de 50 historias sem "carregar mais". API ja suporta paginacao (`hasMore`).

**Correcao:** Implementar scroll infinito ou botao "Carregar mais".

---

### P-18. Sessao encerra sem aviso previo [BAIXO]

**Status:** NOVO
**Arquivo:** `routes/jogo.js:722`

DELETE encerra sessao imediatamente. Todos os jogadores redirecionados sem contagem regressiva.

**Correcao:** Emitir `sessao_encerrando_em_30s` antes do encerramento real.

---

### P-19. Explorar/Lista sem thumbnail de capa [BAIXO]

**Status:** NOVO
**Arquivo:** `Frontend/src/` — cards de historia

Campo `imagem` existe (capa via Leonardo AI) mas nao exibido nos cards de listagem.

**Correcao:** Adicionar thumbnail no card de historia.

---

## Quick Wins (esforco minimo, impacto alto)

| # | Item | Ref | Esforco | Impacto |
|---|------|-----|---------|---------|
| 1 | Verificar userId === socket.userId no masterNarrationEngine | S-02 | 5 linhas | Seguranca |
| 2 | Adicionar authenticateToken em 6+ rotas | S-03 | 6 arquivos | Seguranca |
| 3 | Sanitizar mensagem antes do prompt IA | S-04 | 1 linha | Seguranca |
| 4 | Confirmacao ao sair do jogo (ConfirmationModal) | P-03 | 10 linhas | UX |
| 5 | Vagas = maximo - totalJogadores | P-04 | 5 linhas | UX |
| 6 | Trocar window.confirm por ConfirmationModal | P-12 | 2 arquivos | UX |
| 7 | Deletar WebSocketService_CORRIGIDO.js | T-07 | 1 arquivo | Limpeza |
| 8 | Remover FF_AI_ASYNC_ROTEIRO do env.example | T-08 | 1 linha | Limpeza |
| 9 | Trocar fallback CORS Heroku | S-09 | 1 linha | Config |
| 10 | Morgan condicional por NODE_ENV | T-06 | 1 linha | Logs |

---

## Prioridades recomendadas

### Fase 1 — Seguranca (urgente)

1. **S-01** — JWT no WebSocket (CRITICA)
2. **S-02** — userId guard no masterNarrationEngine
3. **S-03** — authenticateToken nas rotas
4. **S-04** — sanitizacao de prompt injection

### Fase 2 — Integridade do jogo

5. **P-01** — HP persistido apos sessao
6. **P-02** — Wizard auto-save
7. **P-03** — Confirmacao ao sair
8. **P-05** — Level-up com distribuicao de pontos

### Fase 3 — Experiencia e polish

9. **P-04** — Vagas disponiveis reais
10. **P-06** — Filtros no Explorar
11. **P-07** — Upload de avatar
12. **P-09** — Avatar no Feed/Header
13. **P-08** — Notificacoes WebSocket push

### Fase 4 — Debito tecnico incremental

14. **S-05** — Blacklist de refresh token
15. **S-06** — SocketToken fora do localStorage
16. **T-01** — Lock distribuido Redis
17. **T-05** — Migracao pino restante
18. **S-07** — Fix rollback CI/CD

---

## Comparativo com Backlog 1

| Metrica | Backlog 1 (13/03) | Backlog 2 (14/03) |
|---------|-------------------|-------------------|
| Frentes abertas | 6 (F-01 a F-03, D-01 a D-03) | 0 novas frentes (todas >95%) |
| Items criticos | 2 (WebSocket JWT, criarMensagemMestre) | 1 (WebSocket JWT persiste) |
| Items corrigidos entre rodadas | — | 7 (criarMensagemMestre, async roteiro, EtapaJogoRPG, git --ff-only, badge ativa, loot, comentarios feed) |
| Novos items identificados | — | 17 (S-02 a S-09, P-05, P-09 a P-19, T-08 a T-10) |
| Items persistentes | — | 11 (S-01, S-05, T-01, T-02, T-05, T-06, T-07, P-01, P-02, P-03, P-07) |

O projeto avancou significativamente. O foco agora muda de "fechar frentes arquiteturais" para "hardening de seguranca" + "polir experiencia do usuario".
