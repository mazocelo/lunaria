# Mapas 3D — síntese do workflow adversarial (2026-08-24)

> Fonte: saída do workflow `wfl6ffmy1` rodado no VPS em 2026-08-24 (`/tmp/claude-0/-root/365079ec-.../tasks/wfl6ffmy1.output`), sessão 365079ec. Objetivo declarado: "Desenha e critica adversarialmente a integracao backend do motor de mapas 3D".
> Estrutura: 3 fases (Desenho → Crítica → Síntese), 7 agentes, 596,871 tokens, 224 tool calls.
> As três lentes de desenho e a escolha de cada uma: **minimo** → `backend-nao-precisa-do-layout`, **narrativa** → `persistir-layout-em-historias-mapas`, **tatico** → `portar-motor-para-js`.
> A síntese abaixo virou o plano `plans/2026-08-25-backend-mapas-3d.md`. Estado em 2026-09-25: bugs 1-4 fechados (1daf57b/655a10a); Fases 1-4 e bug 5 abertos.

## Agentes do workflow
| Fase | Agente | Modelo | Tokens | Tool calls |
|---|---|---|---|---|
| Desenho | desenho:minimo | claude-opus-5 | 58,747 | 29 |
| Desenho | desenho:narrativa | claude-opus-5 | 64,597 | 22 |
| Desenho | desenho:tatico | claude-opus-5 | 56,535 | 20 |
| Critica | critica:minimo | claude-opus-5 | 110,503 | 48 |
| Critica | critica:narrativa | claude-opus-5 | 100,581 | 39 |
| Critica | critica:tatico | claude-opus-5 | 107,977 | 50 |
| Sintese | sintese | claude-opus-5 | 97,931 | 16 |

---

# RECOMENDAÇÃO FINAL

Verifiquei no repo os pontos em que as três lentes se contradizem. Vários "fatos" do contexto original estão errados e derrubam planos inteiros. Começo por isso, porque muda as decisões.

## 0. Fatos corrigidos (verificados agora)

| Afirmação | Realidade |
|---|---|
| Fato 10: `historias.mapas` é slot vazio | **FALSO.** É feature viva: upload de imagens de mapa pelo dono. `frontend/src/Pages/Historia/Ver/historia-ver.model.ts:369-387` grava `{url,nome}`, `historia-ver.view.tsx:596-643` renderiza, e o backend **coage para array** (`backend/controllers/historia/historiaController.js:473`: `dadosSeguros.mapas = Array.isArray(mapas) ? mapas : []`). Gravar layout ali é apagado na escrita e destrói dado de usuário. |
| Fato 17: whitelist dupla de eventos socket | **FALSO.** `websocket/socketManager.js:483-498` é `socket.onAny` **inbound**, que só emite um WARN `UNKNOWN_EVENT_RECEIVED`. Não existe registro de saída. Criar evento server→client custa zero. |
| "A seed determina o layout" (lente tática) | **FALSO.** `derivarSeed` (`frontend/src/mapEngine/index.ts:52-54`) só hasheia `historiaId::nome::tipo`, mas `archetypes/interior.ts:48-50` faz `alvo = rng.inteiro(base) + min(segredos.length,4) + min(ceil(monstros.length/2),4)`. O próprio `Mapa3D.tsx:38` admite: a chave de memo inclui `segredos` e `monstros_comuns`. **Mandar só o id NÃO reproduz a planta.** |
| Fato 5: escrever `estadoJogo.locaisVisitados` resolve | **FALSO.** O campo vive em `mestreContexto.sessao`: `mestreContextBuilder.js:488` só acumula de `contextoExistente`, e `:710` lê de `ctx = sessao.mestreContexto.sessao`. Escrever em `estadoJogo` é um **sexto ponto morto**. O write point real é o `mergeMestreContext({sessao:{...}})` em `mestreContextBuilder.js:866-878`. |
| "responseValidator é a autoridade sobre local" | **Parcialmente falso, e a favor de vocês.** `validateMestreResponse` roda em 2 sites, mas a trava real de local em combate está **dentro** de `applyMetadadosToSessao` (`mestreContextBuilder.js:806-809`), que roda nos **8** sites (`turnEngine.js:378,712,1223`, `testEngine.js:450`, `combatEngine.js:934`, `masterNarrationEngine.js:624,1207`, `acoesProcessor.js:1095`). Não há buraco aqui. |
| Fato 13: "falta só saber qual local está ativo" | **Já existe um detector em produção.** `EtapaJogoRPG.model.ts:250-285` varre cada narração do Mestre e casa contra `roteiro.locais[].nome` via `findMentionedEntities` (`Chat/renderers.tsx:207-211`, substring). Está acoplado a `local.imagem` (`:217-225`), só isso. |

E o fato que ninguém listou e é o mais importante para o objetivo: **`blueprintService.js:390` manda o LLM criar 4 locais por campanha inteira**, enquanto `prompts/sistema.js:599` e `:738` ensinam ele a escrever sub-cena em `local_atual` ("Trilha na Floresta", "Trilha"). Toda a arquitetura de canonização opera contra 4 nomes-alvo.

---

## 1. DECISÃO DE LAYOUT NO BACKEND — resolvida de uma vez

**O backend NÃO gera, NÃO porta e NÃO persiste layout. Mas passa a congelar a ENTRADA do gerador.**

Não portar (contra a lente tática e a narrativa):
- Não há consumidor. Zero geometria no servidor; alvo é "primeiro monstro vivo" (`combateHelper.js:1050-1052`) e jogador aleatório (`websocket/engines/combatEngine.js:461-465`). Portar 674 linhas para alimentar nada é dead code com custo de paridade byte a byte entre dois repos git separados.
- O "grafo pronto" que justificaria o porte **não é um grafo de movimento**: em cidade/floresta os corredores ligam `celulas[k-1]→celulas[k]` em ordem de índice (`archetypes/urbanoNatural.ts:59-68` e `:118-128`) — o último quarteirão de uma linha fica "adjacente" ao primeiro da linha seguinte, do outro lado do mapa. Em interior é árvore sem ciclos (1 corredor por sala nova, `interior.ts:63-88`). Movimento validado sobre isso rejeita o movimento óbvio.
- E `geometria.ts:33-47` (`corredorEmL`) liga centro-a-centro **sem checar colisão** — corredores atravessam salas. Direção cardeal derivada disso mente.

Não persistir em `historias.mapas`: o campo tem dono (ver §0), é escrito pelo cliente via `PUT /historias/:id` (`routes/historia.js` → `historiaController.js:473`), e colocar autoridade espacial ali é literalmente autoridade de mundo no cliente.

**O que o backend faz em vez disso:** ao resolver o local ativo, grava em `estadoJogo.localAtual` a *entrada exata* do gerador, não o resultado:

```js
estadoJogo.localAtual = {
  nome, tipo, segredos, monstros_comuns,   // ~200-400 bytes
  fonte: 'roteiro' | 'emergente'
}
```

O cliente chama `gerarMapa(historiaId, estadoJogo.localAtual)` — nunca contra o `roteiro` que ele baixou por HTTP. Isso custa ~40 linhas e mata cinco vetores de divergência que **nenhum dos três planos tratou**:

1. `PUT /:id/roteiro` (`routes/historia.js:582`) troca `locais[]` na campanha viva.
2. `ativarVersaoRoteiro` (`routes/historia.js:594` → `historiaController.js:1194-1226`) faz rollback e chama `sincronizarRoteiroNaSessao`.
3. O cliente **nunca fica sabendo**: `roteiro_gerado` é emitido pelo backend e tem **zero listeners** no frontend (grep vazio em `frontend/src`).
4. Dois jogadores que entraram em momentos diferentes carregam roteiros diferentes.
5. Como a planta depende de `segredos[]`, o dono editando o roteiro **muda o número de salas embaixo dos jogadores no meio da sessão**.

Estabilidade > frescor. Para um mapa que quer ser parte do jogo, a planta não pode mudar porque alguém editou um campo de texto.

---

## 2. BUGS — corrigir já, valem por si, independentes de qualquer plano

**B1. Segredos dos locais nunca chegam ao Mestre.** `blueprintService.js:195` grava `segredos` (array); `agents/Mestre/prompts/roteiroCondenser.js:164` lê `l.segredo` (singular) — o `if` nunca dispara. O mapEngine desenha salas `papel:'segredo'` que o narrador desconhece.
Correção: ler `l.segredos` (array, 1-2 itens), com fallback para `l.segredo`. **E filtrar placeholders**: `blueprintService.js:195-196` preenche defaults `['Nenhum segredo definido']` / `['Nenhum']`. O mapEngine já filtra (`index.ts:105-113`, `PLACEHOLDERS`); o condenser precisa do mesmo filtro ou o Mestre lê `[Segredo: Nenhum segredo definido]` em todo local.

**B2. `locaisVisitados` — 5 leituras, 0 escritas.** Write point correto: `mestreContextBuilder.js:866-878` (bloco `mergeMestreContext({sessao:{...}})`) mais o acúmulo em `buildSessionContext:488`. **Não** `estadoJogo`.

**B3. `montanha` vira masmorra fechada.** `blueprintService.js:387` oferece `montanha` no enum; `mapEngine/index.ts:48-57` não conhece → `'outro'` → arquétipo `interior`.
Correção real está no cliente (`TIPOS_VALIDOS` + `ARQUETIPO_POR_TIPO`: `montanha → 'natural'`), **não** no prompt — `normalizeLocais` (`blueprintService.js:192`) faz `asTrimmedString(local?.tipo, 'outro')` e nunca valida, e `PUT /:id/roteiro` aceita o que mandarem. Trocar a lista do prompt só afeta roteiros novos.
**Faça a tabela de sinônimos inteira de uma vez** (montanha, colina, deserto, pântano, vila, aldeia, planície...), porque cada valor adicionado depois muda `normalizarTipo` → muda `derivarSeed` → repinta plantas. Trave com vetores dourados em `frontend/src/__tests__/mapEngine/` — hoje `mapEngine.test.ts:75-79` só compara duas execuções no mesmo processo; **nenhum valor está fixado**.

**B4 (menor). `local.perigo` é leitura morta.** `EtapaJogoRPG.model.ts:224` lê `local.perigo`, mas `normalizeLocais` (`blueprintService.js:189-200`) nunca o define e o schema do prompt (`:387`) não pede `perigo` em `locais` (só em `mapaMundi.regioes`).

**B5 (menor, opcional). `Math.cos/sin` em `urbanoNatural.ts:97-98`** são implementation-approximated em ECMAScript. `Math.round` mitiga, mas divergência de 1m atravessa `colidem(...)` e cascateia a planta inteira no arquétipo `floresta`. Custo baixo: tabela de ângulos inteira. Prioridade baixa (probabilidade real é pequena), mas registre.

---

## 3. TRABALHO NOVO — fases, cada uma entregando valor sozinha

### FASE 1 — Medir antes de construir (meio dia)
Script que lê as sessões em Redis / `sessaoSnapshot` e conta: dos `estadoJogo.cenaAtual` distintos, quantos dão **match exato normalizado** contra `roteiro.locais[].nome`.

Isto não é cerimônia. Com 4 locais por campanha (`blueprintService.js:390`) e o prompt ensinando sub-cena (`sistema.js:599,738`), a hipótese central das três lentes — "dá para canonizar o que o LLM escreve" — pode ser falsa. Se a taxa for baixa, o gargalo não é normalização, é o roteiro, e a correção barata é outra (§6).

### FASE 2 — Local canônico + lista fechada (backend puro, valor sozinho)
Valor entregue sem tocar no frontend: o Mestre passa a saber qual local do roteiro está ativo, `locaisVisitados` funciona, e o prompt de turno passa a carregar descrição/segredos/perigos do local certo.

Arquivos:
- **NOVO** `backend/helpers/localCanonico.js` → `resolverLocal(raw, roteiro) -> {nome, tipo, segredos, monstros_comuns, fonte}`.
  **Não copie `normalizeNpcName`.** `mestreContextBuilder.js:641-644` faz match parcial bidirecional (`canon.includes(lower) || lower.includes(canon)`) e termina em `return partial || name` — **nunca falha**. Para NPC é cosmético; para local, "Templo" casa com "Templo do Sol" e "Templo Submerso" e **teleporta o grupo em silêncio**. Regra: exato normalizado (lowercase + NFD sem acento); parcial só se houver **exatamente um** candidato; senão `fonte:'emergente'` e **não mexe** em `localAtual`. Copie o *conceito* de emergente (`normalizeNpcList:646-664`), não o matcher.
- `mestreContextBuilder.js:800-824` — escrever `estadoJogo.localAtual` (a entrada congelada, §1) no bloco que já detecta mudança de local. Manter `cenaAtual`/`ambiente` intactos: `filtrarPassivasAplicaveis` (`turnStateBuilder.js:236-241`) casa contra eles como texto livre.
- `mestreContextBuilder.js:866-878` — `locaisVisitados` (dedup, cap `MAX_LIST_ITEMS`).
- `helpers/turnStateBuilder.js:215-219` e `:265-268` — este é o canal certo, e as três lentes acertaram o motivo: roda a cada turno, **fora** do system prompt congelado (`MestreAgent.js:703-712` + `masterCacheManager.js` invalidando a cada 5 rodadas) e **fora** do `truncateBySections` (`roteiroCondenser.js:275-291`).
  Injete duas coisas: (a) o local ativo com descrição/segredos/perigos; (b) **a lista fechada dos nomes canônicos** — "LOCAIS DO ROTEIRO: A | B | C | D. `local_atual` DEVE ser um destes; sub-cena vai em `ambiente`." Oferecer a lista eleva o match muito mais que qualquer matcher esperto. Cap duro ~300 chars: `formatTurnStateText` é prefixado à mensagem **de cada jogador, todo turno** (`masterNarrationEngine.js:379-380`, `:1011`), fora de cache.

Atenção: `helpers/acoesProcessor.js:1095` chama `applyMetadadosToSessao(sessao, metadados)` **sem `historia`** — o caminho `mudar_cenario`, que `sistema.js:466` instrui para "nova sala". Funciona porque `inferRoteiro` (`mestreContextBuilder.js:309-311`) cai em `sessao.historiaRoteiro`. Não quebre isso.

### FASE 3 — Broadcast (uma linha) + mapa na tela de jogo
- `websocket/utils/turnStateMachine.js:81-100` (`buildTurnEventPayload`) — adicionar `localAtual`. É o choke point único: `stateProjector.js:3-8`, `sessionEventBus.js:25`, `socketManager.js:159`, `testePipeline.js` — todos passam por ele. `tests/turnStateMachine.test.js` só faz `toEqual` em `payload.testesPendentes`, então adicionar campo é seguro.
  Sem evento novo — **não** porque custa whitelist (custa zero, §0), mas porque `acao_mestre` é renderizado como mensagem "Sistema" no chat (`Chat/renderers.tsx:1191`, `:373-398`) e **persistido** em `sessao.mensagens` (`acoesProcessor.js:110-111`): cada mudança de sala viraria lixo permanente no histórico.
- `roomGateway.js:385-405` já manda `estadoJogo` inteiro no join — bootstrap de graça.
- Frontend: **não use `store.estadoJogo`** (nasce `{}`; `listeners.ts:359` é o único writer). Campo tipado novo, preenchido no handler de `turno_estado_atualizado`.
- `components/Jogo/` — painel novo com `React.lazy` sobre `Mapa3D`. O chunk é ~900KB e a tela de jogo é a mais quente do produto: só instancie o `<Canvas>` quando o painel abrir. `AvisoSemWebGL` (`Mapa3D.tsx:57-60`) precisa continuar valendo dentro do jogo.
- Bootstrap honesto: enquanto `localAtual` for `null`, use o **detector que já existe** (`EtapaJogoRPG.model.ts:250-285`, hoje filtrado por `local.imagem`) como fallback marcado "presumido", ou o primeiro local do arco. Não deixe o painel nascer vazio.
- Seja honesto na UI: destaque o **local**, não a sala. Não existe posição por sala.

### FASE 4 — Refatoração barata que compra futuro (opcional, faça junto da 3)
`Mapa3D.tsx:33-39` recebe `local` e chama `gerarMapa` dentro. Extrair `<Mapa3DCena layout={...}>{children}</Mapa3DCena>`. É o slot por onde tokens/destaque entram depois e o ponto onde a fonte do layout inverteria, se algum dia inverter. Custa pouco agora e caro depois.

---

## 4. O QUE NÃO FAZER AGORA

- **Portar o mapEngine para o backend.** Sem consumidor. E o grafo que justificaria não é grafo de movimento (§1).
- **Persistir layout em `historias.mapas`.** Campo ocupado por imagens do usuário, coagido a array no `PUT`.
- **Tabela/model novo** (`Local`, `Sala`, `Posicao`) e migração. Nada consome.
- **BullMQ para `gerarMapa`.** É `useMemo` puro de microssegundos.
- **Evento socket dedicado** (`mapa_atualizado`, `local_alterado`). Não por custo — por acoplamento: `turno_estado_atualizado` já tem construtor único.
- **`metadados.sala_destino` / movimento sala-a-sala.** Precisaria de adjacência real, que não existe em 2 dos 3 arquétipos. Reabrir só quando houver **uma regra que consuma a posição**.
- **Combate posicional, grid, alcance, linha de visão.** É outro projeto, e mexe em balanceamento já medido. E `getEngine` (`game-systems/index.js:11`) tem três sistemas — alcance implementado em um é regra que não existe nos outros dois.
- **Fog of war no render como proteção.** É teatro: `GET /historias/:id` (`historiaController.js:421-428`) devolve a linha inteira com `roteiro`, e a porta é `usuarioPodeAcessarHistoria` (`helpers/historiaAuthPolicy.js:17-40`) — **qualquer participante convidado passa**. Todos os segredos já estão no browser do jogador. Mascarar salas é decoração.
- **Usar `rotulo` de sala como nome no prompt.** Em `interior.ts:126-146` o rótulo de `papel:'segredo'` **é o texto do segredo** e o de `'encontro'` é a lista de monstros. Colocar rótulo no prompt do Mestre entrega o segredo que ele deveria esconder.
- **Coordenadas x/z no prompt, ou planta completa no prompt.** Caro e alucinógeno.
- **Pasta `shared/` / workspace npm.** Repos git separados, backend ESM puro sem transpilação. A duplicação já é a política declarada.
- **Mexer em `hashSeed`, na ordem de geração ou em `normalizarTipo` depois da B3.** Ids são posicionais (`sala-${i}` em `interior.ts:148`, `quarteirao-${n}` em `urbanoNatural.ts:43`). Faça a tabela de tipos **uma vez**, no mesmo commit dos vetores dourados.

---

## 5. Onde as três lentes erraram, explicitamente

- **Mínimo:** certo na conclusão (backend não precisa do layout), errado no mecanismo — "mande só o id" é impossível, a planta depende de `segredos[]`/`monstros_comuns[]`. E "de brinde, escreva `locaisVisitados` no `estadoJogo`" não faz nada. E vender a Fase 3 como "aqui o mapa deixa de ser decorativo" é otimismo: 0-4 entrega o mapa decorativo **sincronizado**.
- **Narrativa:** a Fase 1 inteira (persistir em `historias.mapas`) está construída sobre um campo que tem dono e é coagido a array — apagaria upload de usuário e seria apagada pelo próximo `PUT`. O grafo de corredores que ela quer usar como adjacência é uma cadeia por índice em 2 de 3 arquétipos.
- **Tático:** "o layout já é persistido pela seed" é falso e é a premissa de quatro das suas decisões. E a Fase 3 (planta em texto no `turnStateBuilder`) depende da Fase 4 (porte do motor) — o servidor não tem layout na Fase 3.

O que sobrevive das três: **canonizar o local**, **injetar no `turnStateBuilder`**, **pegar carona em `turno_estado_atualizado`**, **não portar, não persistir layout, não fazer combate posicional**.

---

## 6. DECISÕES QUE SÃO SUAS — pergunte antes de codar

1. **4 locais por campanha (`blueprintService.js:390`) é o gargalo real.** Um mapa de um lugar que muda 4 vezes na campanha inteira nunca vira "parte do jogo", por melhor que seja a infra. Subir para 8-12 é uma linha no prompt e provavelmente entrega mais que as Fases 2-4 juntas. Quer?
2. **O roteiro inteiro (segredos de locais e NPCs, plot twists, desfechos) vai para o browser de qualquer participante** (`historiaController.js:421-428` + `historiaAuthPolicy.js:17-40`). Isso é intencional (mapa client-side depende disso) ou é bug de privacidade? A resposta muda a arquitetura: se fechar, o cliente deixa de poder gerar a planta e a decisão de §1 se inverte.
3. **B3 muda a planta dos locais `montanha` já existentes, uma vez.** É melhoria (hoje viram masmorra), mas quebra continuidade para quem já viu o mapa. Aceita? Vale contar quantos existem em produção antes.
4. **Mapa é ferramenta de quem?** Se o jogador vê salas `segredo`/`encontro` no 3D, ele vê o que o Mestre deveria revelar. Ou o render esconde papéis (e o mapa fica mais pobre), ou o jogo assume que a planta é informação pública. Não dá para os dois.
5. **Movimento sala-a-sala transforma o jogo em dungeon crawl.** O motor gera 5-17 salas por local (`interior.ts:44-50`) onde só as autorais têm conteúdo. Amarrar a narrativa a uma sala por turno é mudança de gênero, não de feature. É isso que você quer, ou "o mapa deixar de ser decorativo" significa apenas que o Mestre e o jogador passam a ver o mesmo lugar?
