# Integração de Magias 3D&T Alpha — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar magias 3D&T no ciclo completo — seleção na criação, conjuração em combate, descanso, e grimório persistente.

**Architecture:** Nova join table `personagem_magia_tresdet` conecta personagens a `magias_tresdet`. Frontend filtra elegibilidade por `focus_requisito` em tempo real. Backend resolve conjuração consumindo PM e descanso com R×d6.

**Tech Stack:** Prisma (PostgreSQL), Express, React 19, Zustand, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-23-3det-magia-integrada-design.md`

---

## File Map

### Backend — Criar:
- `backend/prisma/schema.prisma` — nova tabela `personagem_magia_tresdet`

### Backend — Modificar:
- `backend/services/personagemTresDetService.js` — aceitar `magias_ids` na criação
- `backend/game-systems/tresdet/combatEngine.js` — handlers de conjuração e descanso
- `backend/game-systems/tresdet/index.js` — exportar novos handlers
- `backend/helpers/acoesProcessor.js` — registrar `processarDescanso`

### Frontend — Criar:
- `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/components/GrimorioTresDetSection.jsx`

### Frontend — Modificar:
- `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js` — state de magias
- `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.view.jsx` — renderizar grimório
- `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/index.jsx` — fetch catálogo + payload
- `frontend/src/components/Jogo/Modals/FichaPersonagemModal.jsx` — seção magias

---

## PARTE 1: Seleção de Magias na Ficha Livre

### Task 1: Nova tabela personagem_magia_tresdet

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Adicionar model ao schema**

No final do arquivo, antes do último `}`, adicionar:

```prisma
model personagem_magia_tresdet {
  id                Int             @id @default(autoincrement())
  personagem_id     Int
  magia_tresdet_id  Int
  origem            String          @default("criacao") @db.VarChar(30)
  created_at        DateTime        @default(now())

  personagens    personagens    @relation(fields: [personagem_id], references: [id], onDelete: Cascade)
  magias_tresdet magias_tresdet @relation(fields: [magia_tresdet_id], references: [id], onDelete: Cascade)

  @@unique([personagem_id, magia_tresdet_id])
  @@index([personagem_id])
}
```

Também adicionar a relação reversa no model `personagens` (campo `personagem_magia_tresdet personagem_magia_tresdet[]`) e no model `magias_tresdet` (campo `personagem_magia_tresdet personagem_magia_tresdet[]`).

- [ ] **Step 2: Aplicar schema ao banco**

Run: `cd /opt/role-chat-game/backend && npx prisma db push`
Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 3: Gerar Prisma Client**

Run: `cd /opt/role-chat-game/backend && npx prisma generate`
Expected: "Generated Prisma Client"

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(3det): add personagem_magia_tresdet join table"
```

---

### Task 2: Backend — Persistir magias na criação

**Files:**
- Modify: `backend/services/personagemTresDetService.js`

- [ ] **Step 1: Ler o arquivo e entender a função criarPersonagemTresDet**

Ler `backend/services/personagemTresDetService.js`. Identificar:
- Onde `body` é destructured (linha ~20)
- Onde a transaction cria o personagem (linha ~95)
- Onde vantagens/desvantagens são criadas dentro da transaction

- [ ] **Step 2: Adicionar magias_ids ao destructuring**

Na destructuring do body, adicionar `magias_ids = []`:

```javascript
const { nome, nivelPoder, caracteristicas, focus, vantagens, desvantagens, background, imagem, magias_ids = [] } = body;
```

- [ ] **Step 3: Validar magias_ids antes da transaction**

Seguir o padrão de validação de vantagens (~linhas 42-61). Antes da transaction, adicionar:

```javascript
if (magias_ids.length > 0) {
  const magiasExistentes = await db.prisma.magias_tresdet.findMany({
    where: { id: { in: magias_ids } },
    select: { id: true },
  });
  const idsValidos = new Set(magiasExistentes.map(m => m.id));
  const idsInvalidos = magias_ids.filter(id => !idsValidos.has(id));
  if (idsInvalidos.length > 0) {
    throw new Error(`Magias não encontradas: ${idsInvalidos.join(', ')}`);
  }
}
```

- [ ] **Step 4: Criar registros na transaction**

Dentro da transaction, após a criação de desvantagens, adicionar:

```javascript
if (magias_ids.length > 0) {
  await tx.personagem_magia_tresdet.createMany({
    data: magias_ids.map(magiaId => ({
      personagem_id: personagem.id,
      magia_tresdet_id: magiaId,
      origem: 'criacao',
    })),
    skipDuplicates: true,
  });
}
```

- [ ] **Step 4: Verificar que o endpoint POST /personagens aceita o campo**

O controller já repassa `req.body` inteiro para `criarPersonagemTresDet(req.body, userId)`, então `magias_ids` chega automaticamente.

- [ ] **Step 5: Commit**

```bash
git add backend/services/personagemTresDetService.js
git commit -m "feat(3det): persist magias_ids on character creation"
```

---

### Task 3: Frontend Model — State de magias

**Files:**
- Modify: `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js`

- [ ] **Step 1: Adicionar state de magias**

Após `const [catalogoLoading, setCatalogoLoading] = useState(true);` (~linha 43), adicionar:

```javascript
const [magiasIds, setMagiasIds] = useState([]);
const [magiasCatalogo, setMagiasCatalogo] = useState([]);
```

- [ ] **Step 2: Adicionar computed magiasDisponiveis**

Após o bloco `temMagia` (~linha 99), adicionar:

```javascript
const magiasDisponiveis = useMemo(
  () => magiasCatalogo.filter(m => {
    if (!m.focus_requisito || !Array.isArray(m.focus_requisito)) return true;
    return m.focus_requisito.every(req => {
      const key = Object.keys(req)[0];
      return (focus[key] || 0) >= req[key];
    });
  }),
  [magiasCatalogo, focus],
);
```

- [ ] **Step 3: Adicionar callbacks adicionarMagia / removerMagia**

Após `removerDesvantagem` (~linha 158), adicionar:

```javascript
const adicionarMagia = useCallback((id) => {
  const sid = String(id);
  if (magiasIds.includes(sid)) return;
  setMagiasIds(prev => [...prev, sid]);
}, [magiasIds]);

const removerMagia = useCallback((id) => {
  setMagiasIds(prev => prev.filter(x => x !== String(id)));
}, []);
```

- [ ] **Step 4: Auto-remover magias inelegíveis ao mudar Focus**

Adicionar useEffect após o bloco de draft persistence:

```javascript
useEffect(() => {
  if (magiasCatalogo.length === 0) return;
  setMagiasIds(prev => prev.filter(id => {
    const m = magiasCatalogo.find(x => String(x.id) === id);
    if (!m?.focus_requisito) return true;
    return m.focus_requisito.every(req => {
      const key = Object.keys(req)[0];
      return (focus[key] || 0) >= req[key];
    });
  }));
}, [focus, magiasCatalogo]);
```

- [ ] **Step 5: Incluir magiasIds no draft persistence**

Na serialização do draft (~linha 235), adicionar `magiasIds`:

```javascript
const draft = { nome, nivelPoder, caracteristicas, vantagensIds, desvantagensIds, focus, historia, magiasIds };
```

Na carga do draft (~linha 222), adicionar:

```javascript
if (draft.magiasIds) setMagiasIds(draft.magiasIds);
```

- [ ] **Step 6: Exportar no return**

No objeto de retorno, adicionar na seção State:

```javascript
magiasIds, adicionarMagia, removerMagia,
```

Na seção Derived:

```javascript
magiasDisponiveis,
```

Na seção Catalog:

```javascript
magiasCatalogo, setMagiasCatalogo,
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js
git commit -m "feat(3det): magic selection state in ficha-livre model"
```

---

### Task 4: Frontend — Fetch catálogo + payload de criação

**Files:**
- Modify: `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/index.jsx`

- [ ] **Step 1: Adicionar fetch de magias-tresdet no useEffect**

No `Promise.all` (~linha 18), adicionar 4º fetch:

```javascript
const [vResp, dResp, fResp, mResp] = await Promise.all([
  vantagemService.getAll({ sistema: 'tresdet' }),
  desvantagemService.getAll({ sistema: 'tresdet' }),
  apiClient.get('/focus-elementais'),
  apiClient.get('/magias-tresdet'),
]);
```

Após `setFocusCatalogo`, adicionar:

```javascript
if (mResp?.data) model.setMagiasCatalogo(mResp.data);
```

- [ ] **Step 2: Adicionar magias_ids ao getEstado**

No `getEstado` (~linha 34), adicionar:

```javascript
magias_ids: model.magiasIds,
```

- [ ] **Step 3: Adicionar magias ao payload de criação**

No `onCriar` (~linha 56), adicionar ao payload:

```javascript
magias_ids: model.magiasIds.map(Number),
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/index.jsx
git commit -m "feat(3det): fetch magic catalog and include in creation payload"
```

---

### Task 5: Frontend — Componente GrimorioTresDetSection

**Files:**
- Create: `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/components/GrimorioTresDetSection.jsx`

- [ ] **Step 1: Criar o componente**

Criar `GrimorioTresDetSection.jsx` seguindo o padrão visual de `VantagensDesvantagensSection.jsx` e `FocusSection.jsx`. O componente recebe:

```javascript
export default function GrimorioTresDetSection({
  magiasDisponiveis,
  magiasCatalogo,
  magiasIds,
  adicionarMagia,
  removerMagia,
}) {
```

Funcionalidades:
- Input de busca por nome (filtro local)
- Chips dos 6 focus como filtro (fogo, agua, terra, ar, luz, trevas)
- Grid de cards (2 colunas desktop, 1 mobile)
- Cada card mostra: nome, escola, custo_pm, alcance, duração, descrição (truncada 80 chars)
- Cards elegíveis: checkbox/botão de seleção
- Cards inelegíveis: opacity 0.35, tooltip com requisitos faltantes
- Badge no header: "X magias selecionadas"
- Usar cores/theme do `ELEMENT_COLORS` já definido em FocusSection

Usar `useTheme()` para light/dark mode. Seguir padrão visual existente (wa-panel, wa-etched, font-fantasy, etc).

- [ ] **Step 2: Verificar que renderiza sem erros**

Importar temporariamente no view e verificar que não quebra.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/components/GrimorioTresDetSection.jsx
git commit -m "feat(3det): GrimorioTresDetSection component"
```

---

### Task 6: Frontend — Integrar grimório na View

**Files:**
- Modify: `frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.view.jsx`

- [ ] **Step 1: Importar componente**

Adicionar import no topo:

```javascript
import GrimorioTresDetSection from './components/GrimorioTresDetSection.jsx';
```

- [ ] **Step 2: Destructure novas props**

No destructuring de `props`, adicionar:

```javascript
magiasIds, adicionarMagia, removerMagia,
magiasDisponiveis, magiasCatalogo,
```

- [ ] **Step 3: Inserir seção entre Focus e Equipamentos**

Após o div de FocusSection (wa-stagger-4), adicionar:

```jsx
<div className="wa-stage-enter wa-stagger-5">
  <GrimorioTresDetSection
    magiasDisponiveis={magiasDisponiveis}
    magiasCatalogo={magiasCatalogo}
    magiasIds={magiasIds}
    adicionarMagia={adicionarMagia}
    removerMagia={removerMagia}
  />
</div>
```

- [ ] **Step 4: Atualizar stagger dos elementos seguintes**

- Equipamentos: `wa-stagger-5` → `wa-stagger-6`
- Historia: `wa-stagger-6` → `wa-stagger-7`

- [ ] **Step 5: Build e verificar**

Run: `cd /opt/role-chat-game/frontend && npx vite build 2>&1 | tail -5`
Expected: "✓ built in"

- [ ] **Step 6: Commit**

```bash
git add frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.view.jsx
git commit -m "feat(3det): integrate grimoire section in ficha-livre view"
```

---

## PARTE 2: Conjuração em Combate + Descanso

### Task 7: Backend — Handler de descanso

**Files:**
- Modify: `backend/game-systems/tresdet/combatEngine.js`

- [ ] **Step 1: Adicionar função processarDescansoTresDet**

Importar `calcularHP`, `calcularMP` de `./characterEngine.js`. Adicionar:

```javascript
export function processarDescansoTresDet(personagem) {
  const R = getAtributo(personagem, 'R', 0);
  const hpMax = calcularHP(personagem);
  const mpMax = calcularMP(personagem);
  const hpAtual = personagem.hp_atual ?? hpMax;
  const mpAtual = personagem.mana_atual ?? mpMax;

  const dadosPV = Array.from({ length: Math.max(1, R) }, () => rolarD6());
  const dadosPM = Array.from({ length: Math.max(1, R) }, () => rolarD6());

  const recPV = dadosPV.reduce((s, d) => s + d, 0);
  const recPM = dadosPM.reduce((s, d) => s + d, 0);

  const novoPV = Math.min(hpMax, hpAtual + recPV);
  const novoPM = Math.min(mpMax, mpAtual + recPM);

  return {
    hp_atual: novoPV,
    mana_atual: novoPM,
    detalhes: {
      pv: { dados: dadosPV, total: recPV, antes: hpAtual, depois: novoPV, max: hpMax },
      pm: { dados: dadosPM, total: recPM, antes: mpAtual, depois: novoPM, max: mpMax },
    },
  };
}
```

- [ ] **Step 2: Exportar no index.js do tresdet engine**

Em `backend/game-systems/tresdet/index.js`, adicionar import e export de `processarDescansoTresDet`.

- [ ] **Step 3: Commit**

```bash
git add backend/game-systems/tresdet/combatEngine.js backend/game-systems/tresdet/index.js
git commit -m "feat(3det): rest handler with R×d6 HP/PM recovery"
```

---

### Task 8: Backend — Registrar descanso no acoesProcessor

**Files:**
- Modify: `backend/helpers/acoesProcessor.js`

- [ ] **Step 1: Adicionar processarDescanso**

Seguir o padrão de `processarConjurarMagia` (~linha 627). Criar:

```javascript
async function processarDescanso(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem } = acao;
  const alvo = Object.values(sessao.estadoJogo?.jogadores || {})
    .find(j => j.nome === nomePersonagem || j.nomePersonagem === nomePersonagem);
  if (!alvo) return { erro: 'Personagem não encontrado' };

  const personagemCompleto = await db.prisma.personagens.findUnique({
    where: { id: alvo.personagemId },
    include: { atributos_personagem: true },
  });
  if (!personagemCompleto) return { erro: 'Personagem não encontrado no banco' };

  const resultado = processarDescansoTresDet({
    ...personagemCompleto,
    hp_atual: alvo.hp_atual ?? personagemCompleto.hp,
    mana_atual: alvo.mana_atual ?? personagemCompleto.mana,
  });

  // Persistir no estado do jogo
  if (sessao.estadoJogo.jogadores[alvo.odId || alvo.odId]) {
    sessao.estadoJogo.jogadores[alvo.odId || alvo.odId].hp_atual = resultado.hp_atual;
    sessao.estadoJogo.jogadores[alvo.odId || alvo.odId].mana_atual = resultado.mana_atual;
  }

  sm.emitToRoom(roomId, 'descanso_realizado', {
    personagem: nomePersonagem,
    userId: alvo.userId,
    detalhes: resultado.detalhes,
  });

  return resultado;
}
```

Importar `processarDescansoTresDet` de `../../game-systems/tresdet/combatEngine.js` no topo.

- [ ] **Step 2: Registrar no Map de processadores**

No Map `ACTION_HANDLERS` (~linha 63), adicionar:

```javascript
['descansar', processarDescanso],
```

- [ ] **Step 3: Commit**

```bash
git add backend/helpers/acoesProcessor.js
git commit -m "feat(3det): register rest action in acoesProcessor"
```

---

### Task 9: Backend — Utility de parsing custo_pm

**Files:**
- Modify: `backend/game-systems/tresdet/combatEngine.js`

- [ ] **Step 1: Adicionar parseCustoPM**

```javascript
export function parseCustoPM(custoPmStr) {
  if (typeof custoPmStr === 'number') return custoPmStr;
  if (!custoPmStr) return 0;
  const match = String(custoPmStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
```

Extrai o primeiro número inteiro da string. Exemplos:
- "3" → 3, "1 a 5" → 1, "2 PMs por turno" → 2, "padrão" → 0

- [ ] **Step 2: Exportar no index.js do tresdet engine**

Adicionar `parseCustoPM` ao import/export em `backend/game-systems/tresdet/index.js`.

- [ ] **Step 3: Commit**

```bash
git add backend/game-systems/tresdet/combatEngine.js backend/game-systems/tresdet/index.js
git commit -m "feat(3det): custo_pm string parser utility"
```

---

### Task 10: Backend — Handler de conjuração 3D&T

**Files:**
- Modify: `backend/helpers/acoesProcessor.js`

- [ ] **Step 1: Adicionar processarConjurarMagiaTresDet**

Criar handler específico para 3D&T. Diferenças do Lunaria:
- Busca magia em `magias_tresdet` (não `habilidades_magias`)
- Usa `parseCustoPM()` para extrair custo inteiro do campo string
- Valida focus do personagem vs `focus_requisito` da magia
- Sem cooldown, sem concentração
- Deduz PM

```javascript
async function processarConjurarMagiaTresDet(acao, sessao, roomId, sm) {
  const { personagem: nomePersonagem, magia_id, nome, custo_pm_override } = acao;
  const alvo = Object.values(sessao.estadoJogo?.jogadores || {})
    .find(j => j.nome === nomePersonagem || j.nomePersonagem === nomePersonagem);
  if (!alvo) return { erro: 'Personagem não encontrado' };

  const magia = await db.prisma.magias_tresdet.findUnique({ where: { id: magia_id } });
  if (!magia) return { erro: `Magia ${nome || magia_id} não encontrada` };

  const custo = custo_pm_override ?? parseCustoPM(magia.custo_pm);
  const manaAtual = alvo.mana_atual ?? 0;
  if (custo > manaAtual) return { erro: `PM insuficiente (${manaAtual}/${custo})` };

  // Deduzir PM
  alvo.mana_atual = manaAtual - custo;

  sm.emitToRoom(roomId, 'magia_conjurada', {
    tipo: 'conjurar_magia',
    personagem: nomePersonagem,
    userId: alvo.userId,
    nome: magia.nome,
    magia_id: magia.id,
    custo_pm: custo,
    escola: magia.escola,
    efeito: magia.efeito,
  });

  return { sucesso: true, magia: magia.nome, custo };
}
```

Importar `parseCustoPM` de `../../game-systems/tresdet/combatEngine.js`.

- [ ] **Step 2: Registrar no Map — sistema-aware**

No Map `ACTION_HANDLERS`, o dispatch para `conjurar_magia` já existe apontando para `processarConjurarMagia` (Lunaria). Adaptar o handler existente para checar `sessao.sistema` e despachar para o handler correto:

```javascript
async function processarConjurarMagiaDispatch(acao, sessao, roomId, sm) {
  if (sessao.sistema === 'tresdet') {
    return processarConjurarMagiaTresDet(acao, sessao, roomId, sm);
  }
  return processarConjurarMagia(acao, sessao, roomId, sm);
}
```

Substituir no Map: `['conjurar_magia', processarConjurarMagiaDispatch]`.

- [ ] **Step 3: Commit**

```bash
git add backend/helpers/acoesProcessor.js
git commit -m "feat(3det): 3D&T spell casting handler with PM consumption"
```

---

### Task 11: Backend — Carregar magias 3D&T do personagem

**Files:**
- Modify: `backend/services/personagemTresDetService.js` ou controller relevante

- [ ] **Step 1: Incluir magias no carregamento do personagem**

Ao buscar personagem com relacionamentos, incluir:

```javascript
personagem_magia_tresdet: {
  include: { magias_tresdet: true }
}
```

Isso garante que `personagem.personagem_magia_tresdet[].magias_tresdet` contenha os dados completos da magia.

- [ ] **Step 2: Mapear para formato consumível pelo frontend**

No processamento de dados do personagem, transformar:

```javascript
const magiasPersonagem = personagem.personagem_magia_tresdet?.map(pm => ({
  id: pm.magias_tresdet.id,
  nome: pm.magias_tresdet.nome,
  custo_pm: pm.magias_tresdet.custo_pm,
  escola: pm.magias_tresdet.escola,
  alcance: pm.magias_tresdet.alcance,
  duracao: pm.magias_tresdet.duracao,
  descricao: pm.magias_tresdet.descricao,
  focus_requisito: pm.magias_tresdet.focus_requisito,
  efeito: pm.magias_tresdet.efeito,
  origem: pm.origem,
})) || [];
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/personagemTresDetService.js
git commit -m "feat(3det): load character spells from personagem_magia_tresdet"
```

---

## PARTE 3: Grimório Persistente

### Task 12: Frontend — Seção Magias na FichaPersonagemModal

**Files:**
- Modify: `frontend/src/components/Jogo/Modals/FichaPersonagemModal.jsx`

- [ ] **Step 1: Adicionar seção de magias para 3D&T**

Ler o arquivo primeiro para identificar o padrão de estilo usado (`game-glass`, `border-purple-*`, etc). NÃO usar classes `wa-*` (são do Wizard Atelier, não deste modal).

No `renderConteudo()`, após vantagens/desvantagens, adicionar:

```jsx
{isTresDet && personagem.magiasPersonagem?.length > 0 && (
  <div className="game-glass border border-cyan-500/20 rounded-xl p-3">
    <h4 className="text-sm font-semibold text-cyan-300 mb-2">
      🔮 Magias ({personagem.magiasPersonagem.length})
    </h4>
    <div className="flex flex-wrap gap-1.5">
      {personagem.magiasPersonagem.map(m => (
        <button
          key={m.id}
          onClick={() => setMagiaExpandida(magiaExpandida === m.id ? null : m.id)}
          className="px-2 py-1 rounded-lg text-xs cursor-pointer transition-all game-glass-subtle border border-purple-400/20 text-purple-100 hover:border-purple-400/40"
        >
          {m.nome} <span className="text-cyan-400">({m.custo_pm} PM)</span>
          {magiaExpandida === m.id && (
            <p className="text-[10px] text-gray-400 mt-1 text-left">{m.descricao}</p>
          )}
        </button>
      ))}
    </div>
  </div>
)}
```

Adicionar state local: `const [magiaExpandida, setMagiaExpandida] = useState(null);`

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Jogo/Modals/FichaPersonagemModal.jsx
git commit -m "feat(3det): expandable spells section in character sheet modal"
```

---

### Task 13: Frontend — Magias no ActionDock para 3D&T

**Files:**
- Modify: `frontend/src/components/Jogo/Chat/ActionDock.jsx`

- [ ] **Step 1: Ler o ActionDock e entender a seção de magias**

Ler `ActionDock.jsx`. A seção de magias (~linhas 283-320) já usa `magiasPersonagem`, `manaAtual`, `onUsarMagia`. Para 3D&T, os dados vêm de `personagem_magia_tresdet` mas o formato do array `magiasPersonagem` é o mesmo (id, nome, custo).

- [ ] **Step 2: Adaptar display de custo para PM vs MP**

O ActionDock já tem `sistema === 'tresdet' ? 'PM' : 'MP'` (~linha 179). Na seção de magias, adaptar o check de custo:

```javascript
const custoNumerico = typeof mag.custo_pm === 'string'
  ? parseInt(String(mag.custo_pm).match(/(\d+)/)?.[1] || '0', 10)
  : (mag.custo_mana ?? 0);
const semMana = custoNumerico > manaAtual;
```

Isso permite que o ActionDock funcione com ambos os sistemas.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Jogo/Chat/ActionDock.jsx
git commit -m "feat(3det): ActionDock spell section supports PM cost strings"
```

---

### Task 14: Build final e verificação

- [ ] **Step 1: Build completo do frontend**

Run: `cd /opt/role-chat-game/frontend && npx vite build`
Expected: Build sem erros

- [ ] **Step 2: Verificar schema Prisma**

Run: `cd /opt/role-chat-game/backend && npx prisma validate`
Expected: "The schema at ... is valid"

- [ ] **Step 3: Commit final se necessário**

```bash
git add -A
git commit -m "feat(3det): complete magic system integration"
```
