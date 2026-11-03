# Game Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Markdown-based documentation system that renders as static HTML pages in the frontend, with player-facing docs at `/docs` and internal/admin docs at `/admin/docs`.

**Architecture:** Markdown files live in `frontend/public/docs/`. A Vite build script pre-converts them to HTML via `markdown-it`. Two page components (`DocsJogador`, `DocsInterno`) load the pre-built HTML. Sidebar is generated from `index.md` links.

**Tech Stack:** markdown-it (build-time conversion), React Router (routes), existing Tailwind theme

**Spec:** `backend/docs/superpowers/specs/2026-03-21-game-documentation-design.md`

---

### Task 1: Install markdown-it and create build script

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/scripts/build-docs.js`

- [ ] **Step 1: Install markdown-it**

```bash
cd /opt/role-chat-game/frontend && npm install --save-dev markdown-it
```

- [ ] **Step 2: Create build script**

Create `frontend/scripts/build-docs.js`:

```javascript
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_SRC = join(ROOT, 'docs');
const DOCS_OUT = join(ROOT, 'public', 'docs');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const SECTIONS = ['jogador', 'interno'];

function buildSection(section) {
  const srcDir = join(DOCS_SRC, section);
  const outDir = join(DOCS_OUT, section);

  if (!existsSync(srcDir)) {
    console.warn(`Seção ${section} não encontrada em ${srcDir}`);
    return;
  }

  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(srcDir).filter(f => f.endsWith('.md'));
  const manifest = [];

  for (const file of files) {
    const content = readFileSync(join(srcDir, file), 'utf-8');
    const html = md.render(content);
    const slug = basename(file, '.md');
    const outFile = join(outDir, `${slug}.html`);

    writeFileSync(outFile, html, 'utf-8');
    manifest.push({ slug, file });
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[docs] ${section}: ${files.length} arquivos convertidos`);
}

for (const section of SECTIONS) {
  buildSection(section);
}

console.log('[docs] Build completo');
```

- [ ] **Step 3: Add build-docs to package.json scripts**

Add to `package.json` scripts:
```json
"build:docs": "node scripts/build-docs.js",
"build": "node scripts/build-docs.js && tsc && vite build"
```

Note: Prepend docs build to the existing `"build": "tsc && vite build"` — keep `tsc`.

- [ ] **Step 4: Run script to verify it works (will warn about missing dirs)**

```bash
cd /opt/role-chat-game/frontend && node scripts/build-docs.js
```

Expected: warnings about missing sections (docs not written yet)

- [ ] **Step 5: Add public/docs to .gitignore**

Add to `frontend/.gitignore`:
```
public/docs/
```

This prevents built HTML from being committed. Must be done before any `node scripts/build-docs.js` run.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-docs.js package.json package-lock.json .gitignore
git commit -m "feat(docs): add markdown-it build script for documentation"
```

---

### Task 2: Create player documentation (jogador/)

**Files:**
- Create: `frontend/docs/jogador/index.md`
- Create: `frontend/docs/jogador/como-jogar.md`
- Create: `frontend/docs/jogador/atributos.md`
- Create: `frontend/docs/jogador/combate.md`
- Create: `frontend/docs/jogador/progressao.md`

- [ ] **Step 1: Create index.md**

```markdown
# Guia do Jogador

Bem-vindo a Lunaria! Aqui você encontra tudo que precisa saber para começar sua aventura.

- [Como Jogar](como-jogar)
- [Atributos](atributos)
- [Combate](combate)
- [Progressão](progressao)
```

- [ ] **Step 2: Create como-jogar.md**

Content covers:
- Criar conta e acessar o jogo
- Escolher ou criar uma história
- Selecionar personagem
- O fluxo de turno: você age, o Mestre narra
- Botões de ação: Atacar, Defender, Fugir, Habilidades, Magias
- Como rolar dados (d20 aparece, você clica)
- O chat: como interagir com o Mestre e NPCs
- Dica: ações criativas são bem-vindas

- [ ] **Step 3: Create atributos.md**

Content covers:
- Os 6 atributos: Força, Destreza, Constituição, Agilidade, Inteligência, Carisma
- O que cada um faz em linguagem de jogador:
  - Força: dano nos ataques corpo a corpo
  - Destreza: precisão nos ataques (corpo a corpo e à distância)
  - Constituição: resistência física, pontos de vida, absorção de dano
  - Agilidade: esquiva, chance de desviar ataques
  - Inteligência: poder mágico, magias mais fortes
  - Carisma: influência social, reserva de mana
- HP e MP: o que são, como recuperar
- Sem fórmulas — linguagem descritiva

- [ ] **Step 4: Create combate.md**

Content covers:
- Quando o combate começa (Mestre detecta situação hostil)
- Iniciativa: todos rolam d20, quem tira mais age primeiro
- Seu turno: escolher ação
  - Atacar: rola d20 para acertar, depois dado de dano
  - Defender: se protege, reduz dano recebido
  - Fugir: tenta escapar do combate
  - Habilidades/Magias: poderes especiais que custam mana
- Turno do monstro: automático, resultado aparece no chat
- Dano e absorção: armadura pode reduzir dano recebido
- Efeitos de status: veneno, atordoamento, queimadura, congelamento, cegueira
- Vitória: todos os monstros derrotados, você ganha XP
- Derrota: seus pontos de vida chegam a zero

- [ ] **Step 5: Create progressao.md**

Content covers:
- XP: ganha por combate e ações narrativas
- Subir de nível: fichas de personagem evoluem
- O que melhora: mais vida, mais mana, ataques mais fortes
- Equipamentos: armas e armaduras melhoram seus atributos
- Vantagens: habilidades especiais da sua raça e classe

- [ ] **Step 6: Run build and verify**

```bash
cd /opt/role-chat-game/frontend && node scripts/build-docs.js
ls public/docs/jogador/
```

Expected: 5 .html files + manifest.json

- [ ] **Step 7: Commit**

```bash
git add docs/jogador/
git commit -m "docs(jogador): guia do jogador — como jogar, atributos, combate, progressão"
```

---

### Task 3: Create internal documentation (interno/)

**Files:**
- Create: `frontend/docs/interno/index.md`
- Create: `frontend/docs/interno/formulas.md`
- Create: `frontend/docs/interno/engine.md`
- Create: `frontend/docs/interno/mestre-ia.md`
- Create: `frontend/docs/interno/combate-engine.md`

- [ ] **Step 1: Create index.md**

```markdown
# Base de Conhecimento Interna

Documentação técnica do Lunaria — mecânicas, fórmulas e decisões de design.

- [Fórmulas](formulas)
- [Game Engine](engine)
- [Mestre IA](mestre-ia)
- [Combat Engine](combate-engine)
```

- [ ] **Step 2: Create formulas.md**

Source: `backend/docs/REGRAS_BATALHA.md` + `backend/helpers/combateHelper.js`

Content — all formulas with context:
- Modificador de atributo: `floor((atributo - 10) / 2)`
- HP: `mult_raca × (nivel + max(1, modCON))`
- MP: `max(5, 10 + nivel + (max(modINT, modCHA) × 2))`
- DC Esquiva: `10 + modAGI`
- Absorção (TA): `max(0, modCON-1)d4 + armadura`
- Ataque: `d20 + modDEX + bonusNivel`
- Dano melee: `dado + modFOR`
- Dano ranged: `dado + modDEX`
- bonusNivel: `floor(nivel / 2)`
- DC Fuga: `d20 + modAGI vs 10 + (monstros_vivos × 2)`
- DC Resistência Mágica: `8 + custo_mana + floor(max(modINT, modCHA) / 2)`
- XP por combate
- mult_raca por raça (tabela)
- Efeitos de status: DCs, duração, condições
- Concentração: quando quebra, DC
- Defesa: DC +2, 50% redução dano

- [ ] **Step 3: Create engine.md**

Source: `backend/helpers/gameEngine.js`, `backend/helpers/intentClassifier.js`, `backend/agents/Revisores/`

Content:
- gameEngine facade: prepararTurno → resolverTurno → formatarContexto
- 3 camadas de intent:
  - Camada 1: Regex (rápido, sem custo)
  - Camada 2: Flash Lite classifier (LLM barato)
  - Camada 3: Mestre intentSugerido (criativo)
- Unified reviewer: substitui 3 revisores anteriores
- Fluxo completo: mensagem jogador → intent → teste → resolução → narração
- Diagrama de fluxo do turno

- [ ] **Step 4: Create mestre-ia.md**

Source: `backend/agents/Mestre/config.js`, `backend/services/blueprintService.js`

Content:
- 5 tiers:
  - Pescador: Gemini 2.5 Flash Lite (mais barato, narrativa básica)
  - Poeta: Gemini 2.5 Flash (boa narrativa)
  - Bardo: Gemini 3 Flash Preview (narrativa melhor)
  - Profeta: Gemini 3.1 Pro (alta qualidade, quota limitada)
  - Profetisa: Claude Sonnet 4.6 (qualidade máxima, ~30-45s latência)
- Fallback chain roteiro: Gemini 3.1 Pro → Claude Sonnet → Gemini 2.5 Pro
- Montagem do prompt: contexto + regras + personalidade + histórico
- Revisores: validação de narrativa, coerência, regras

- [ ] **Step 5: Create combate-engine.md**

Source: `backend/websocket/engines/combatEngine.js`, `backend/helpers/combateHelper.js`

Content:
- Ciclo: iniciarCombate → initiative rolls → fase combate
- avancarTurno: skip dead, track rounds, passedZero
- executarTurnoMonstro: auto-resolve com fórmulas
- Fluxo detalhado: attack_roll → damage_roll → absorção → HP update → próximo turno
- Condições de fim: vitória (monstros HP=0), derrota (jogador HP=0), fuga
- Status effects: aplicação por rodada, checagem, remoção
- Concentração: checagem ao tomar dano
- Diagrama de estados do combate

- [ ] **Step 6: Run build and verify**

```bash
cd /opt/role-chat-game/frontend && node scripts/build-docs.js
ls public/docs/interno/
```

Expected: 5 .html files + manifest.json

- [ ] **Step 7: Commit**

```bash
git add docs/interno/
git commit -m "docs(interno): base de conhecimento — fórmulas, engine, mestre-ia, combate-engine"
```

---

### Task 4: Create shared documentation components

**Files:**
- Create: `frontend/src/components/docs/DocsSidebar.jsx`
- Create: `frontend/src/components/docs/DocsContent.jsx`
- Create: `frontend/src/components/docs/DocsLayout.jsx`

- [ ] **Step 1: Create DocsSidebar.jsx**

```jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/theme.jsx';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function DocsSidebar({ items, baseUrl, title }) {
  const { slug } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <aside className={`w-64 flex-shrink-0 h-full overflow-y-auto border-r ${
      isLight ? 'bg-white/95 border-slate-200/60' : 'bg-slate-900/95 border-slate-700/50'
    }`}>
      <div className={`px-4 py-4 border-b ${
        isLight ? 'border-slate-200/60' : 'border-slate-700/50'
      }`}>
        <div className="flex items-center gap-2">
          <BookOpen size={18} className={isLight ? 'text-purple-600' : 'text-purple-400'} />
          <h2 className={`text-sm font-bold font-fantasy ${
            isLight ? 'text-slate-800' : 'text-white'
          }`}>{title}</h2>
        </div>
      </div>

      <nav className="p-3 space-y-0.5">
        {items.map(item => {
          const active = slug === item.slug || (!slug && item.slug === 'index');
          return (
            <Link
              key={item.slug}
              to={item.slug === 'index' ? baseUrl : `${baseUrl}/${item.slug}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all ${
                active
                  ? isLight
                    ? 'bg-purple-100/80 text-purple-700 font-medium'
                    : 'bg-purple-900/40 text-purple-300 font-medium'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-800'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {active && <ChevronRight size={14} />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create DocsContent.jsx**

```jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/theme.jsx';

export default function DocsContent({ section, slug }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    setLoading(true);
    fetch(`/docs/${section}/${slug}.html`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(setHtml)
      .catch(() => setHtml('<p>Documento não encontrado.</p>'))
      .finally(() => setLoading(false));
  }, [section, slug]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>;
  }

  return (
    <article
      className={`docs-content max-w-none px-8 py-6 ${
        isLight ? 'text-slate-800' : 'text-slate-200'
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 3: Create DocsLayout.jsx**

```jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import DocsSidebar from './DocsSidebar';
import DocsContent from './DocsContent';

export default function DocsLayout({ section, title, items }) {
  const { slug } = useParams();
  const activeSlug = slug || 'index';

  return (
    <div className="flex h-full overflow-hidden">
      <DocsSidebar items={items} baseUrl={section === 'jogador' ? '/docs' : '/admin/docs'} title={title} />
      <main className="flex-1 overflow-y-auto">
        <DocsContent section={section} slug={activeSlug} />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create docs prose styles**

Add to `frontend/src/index.css` (or the main CSS file) the docs-specific prose styles:

```css
.docs-content h1 { @apply text-2xl font-bold font-fantasy mb-4 text-purple-300; }
.docs-content h2 { @apply text-xl font-bold font-fantasy mt-8 mb-3 text-purple-400; }
.docs-content h3 { @apply text-lg font-semibold mt-6 mb-2; }
.docs-content p { @apply mb-4 leading-relaxed; }
.docs-content ul { @apply list-disc pl-6 mb-4 space-y-1; }
.docs-content ol { @apply list-decimal pl-6 mb-4 space-y-1; }
.docs-content code { @apply px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 text-sm font-mono; }
.docs-content pre { @apply p-4 rounded-lg bg-slate-800 overflow-x-auto mb-4; }
.docs-content pre code { @apply p-0 bg-transparent; }
.docs-content table { @apply w-full border-collapse mb-4; }
.docs-content th { @apply text-left px-3 py-2 border-b border-slate-700 font-semibold; }
.docs-content td { @apply px-3 py-2 border-b border-slate-800; }
.docs-content a { @apply text-purple-400 hover:text-purple-300 underline; }
.docs-content blockquote { @apply border-l-4 border-purple-500 pl-4 italic text-slate-400 mb-4; }
```

- [ ] **Step 5: Commit**

```bash
git add src/components/docs/ src/index.css
git commit -m "feat(docs): shared documentation components — sidebar, content, layout"
```

---

### Task 5: Create DocsJogador page

**Files:**
- Create: `frontend/src/Pages/Docs/Jogador/index.jsx`
- Create: `frontend/src/Pages/Docs/Jogador/docs-jogador.model.js`
- Create: `frontend/src/Pages/Docs/Jogador/docs-jogador.view.jsx`

- [ ] **Step 1: Create model**

```javascript
const SIDEBAR_ITEMS = [
  { slug: 'index', label: 'Início' },
  { slug: 'como-jogar', label: 'Como Jogar' },
  { slug: 'atributos', label: 'Atributos' },
  { slug: 'combate', label: 'Combate' },
  { slug: 'progressao', label: 'Progressão' },
];

export function useDocsJogadorModel() {
  return { items: SIDEBAR_ITEMS, section: 'jogador', title: 'Guia do Jogador' };
}
```

- [ ] **Step 2: Create view**

```jsx
import React from 'react';
import DocsLayout from '../../../components/docs/DocsLayout';

export default function DocsJogadorView({ section, title, items }) {
  return <DocsLayout section={section} title={title} items={items} />;
}
```

- [ ] **Step 3: Create index (ViewModel)**

```jsx
import { useDocsJogadorModel } from './docs-jogador.model';
import DocsJogadorView from './docs-jogador.view';

export default function DocsJogadorPage() {
  const model = useDocsJogadorModel();
  return <DocsJogadorView {...model} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/Pages/Docs/
git commit -m "feat(docs): DocsJogador page — player documentation route"
```

---

### Task 6: Create DocsInterno page (admin)

**Files:**
- Create: `frontend/src/Pages/Docs/Interno/index.jsx`
- Create: `frontend/src/Pages/Docs/Interno/docs-interno.model.js`
- Create: `frontend/src/Pages/Docs/Interno/docs-interno.view.jsx`

- [ ] **Step 1: Create model**

```javascript
const INTERNO_ITEMS = [
  { slug: 'index', label: 'Início' },
  { slug: 'formulas', label: 'Fórmulas' },
  { slug: 'engine', label: 'Game Engine' },
  { slug: 'mestre-ia', label: 'Mestre IA' },
  { slug: 'combate-engine', label: 'Combat Engine' },
];

const JOGADOR_ITEMS = [
  { slug: 'como-jogar', label: 'Como Jogar' },
  { slug: 'atributos', label: 'Atributos' },
  { slug: 'combate', label: 'Combate' },
  { slug: 'progressao', label: 'Progressão' },
];

export function useDocsInternoModel() {
  return {
    internoItems: INTERNO_ITEMS,
    jogadorItems: JOGADOR_ITEMS,
    title: 'Base de Conhecimento',
  };
}
```

- [ ] **Step 2: Create view**

The admin view shows both sections in the sidebar: Interno + Jogador.

```jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import DocsContent from '../../../components/docs/DocsContent';
import { useTheme } from '../../../contexts/theme.jsx';
import { BookOpen, ScrollText } from 'lucide-react';

export default function DocsInternoView({ internoItems, jogadorItems, title }) {
  const { slug, section: sectionParam } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const activeSection = sectionParam || 'interno';
  const activeSlug = slug || 'index';

  return (
    <div className="flex h-full overflow-hidden">
      <aside className={`w-64 flex-shrink-0 h-full overflow-y-auto border-r ${
        isLight ? 'bg-white/95 border-slate-200/60' : 'bg-slate-900/95 border-slate-700/50'
      }`}>
        <div className={`px-4 py-4 border-b ${
          isLight ? 'border-slate-200/60' : 'border-slate-700/50'
        }`}>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className={isLight ? 'text-purple-600' : 'text-purple-400'} />
            <h2 className={`text-sm font-bold font-fantasy ${
              isLight ? 'text-slate-800' : 'text-white'
            }`}>{title}</h2>
          </div>
        </div>

        <nav className="p-3">
          <SidebarSection
            label="Interno"
            icon={ScrollText}
            items={internoItems}
            baseUrl="/admin/docs"
            section="interno"
            activeSection={activeSection}
            activeSlug={activeSlug}
            isLight={isLight}
          />
          <SidebarSection
            label="Jogador"
            icon={BookOpen}
            items={jogadorItems}
            baseUrl="/admin/docs"
            section="jogador"
            activeSection={activeSection}
            activeSlug={activeSlug}
            isLight={isLight}
          />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <DocsContent section={activeSection} slug={activeSlug} />
      </main>
    </div>
  );
}

function SidebarSection({ label, icon: Icon, items, baseUrl, section, activeSection, activeSlug, isLight }) {
  return (
    <div className="mb-4">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${
        isLight ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <Icon size={12} />
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map(item => {
          const active = activeSection === section && activeSlug === item.slug;
          const href = item.slug === 'index'
            ? `${baseUrl}/${section}`
            : `${baseUrl}/${section}/${item.slug}`;
          return (
            <Link
              key={`${section}-${item.slug}`}
              to={href}
              className={`block px-3 py-2 rounded-lg text-sm font-modern transition-all ${
                active
                  ? isLight
                    ? 'bg-purple-100/80 text-purple-700 font-medium'
                    : 'bg-purple-900/40 text-purple-300 font-medium'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-800'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create index (ViewModel)**

```jsx
import { useDocsInternoModel } from './docs-interno.model';
import DocsInternoView from './docs-interno.view';

export default function DocsInternoPage() {
  const model = useDocsInternoModel();
  return <DocsInternoView {...model} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/Pages/Docs/Interno/
git commit -m "feat(docs): DocsInterno page — admin documentation with dual sidebar"
```

---

### Task 7: Add routes and sidebar links

**Files:**
- Modify: `frontend/src/constants/routes.js`
- Modify: `frontend/src/routes.jsx`
- Modify: `frontend/src/components/sidebar/index.jsx`

- [ ] **Step 1: Add route constants**

In `frontend/src/constants/routes.js`, add to the ROUTES object:

```javascript
// ===== DOCS =====
DOCS: '/docs',
DOCS_SLUG: '/docs/:slug',
ADMIN_DOCS: '/admin/docs',
ADMIN_DOCS_SECTION: '/admin/docs/:section',
ADMIN_DOCS_SECTION_SLUG: '/admin/docs/:section/:slug',
```

- [ ] **Step 2: Add lazy imports and ROUTE_CONFIG entries**

In `frontend/src/routes.jsx`:

Add lazy imports:
```javascript
const DocsJogadorPage = React.lazy(() => import('./Pages/Docs/Jogador'));
const DocsInternoPage = React.lazy(() => import('./Pages/Docs/Interno'));
```

Add to ROUTE_CONFIG array:
```javascript
// ===== DOCS =====
{
  path: ROUTES.DOCS,
  component: DocsJogadorPage,
  name: 'Documentação',
  category: 'DOCS'
},
{
  path: ROUTES.DOCS_SLUG,
  component: DocsJogadorPage,
  name: 'Documentação',
  category: 'DOCS',
  hasParams: true
},
{
  path: ROUTES.ADMIN_DOCS,
  component: DocsInternoPage,
  name: 'Docs Interno',
  category: 'ADMIN',
  requireSuperAdmin: true
},
{
  path: ROUTES.ADMIN_DOCS_SECTION,
  component: DocsInternoPage,
  name: 'Docs Interno',
  category: 'ADMIN',
  requireSuperAdmin: true,
  hasParams: true
},
{
  path: ROUTES.ADMIN_DOCS_SECTION_SLUG,
  component: DocsInternoPage,
  name: 'Docs Interno',
  category: 'ADMIN',
  requireSuperAdmin: true,
  hasParams: true
},
```

- [ ] **Step 3: Add sidebar link for players**

In `frontend/src/components/sidebar/index.jsx`, add to `playerItems`:

```javascript
{ path: '/docs', label: 'Documentação', icon: BookOpen, description: 'Guia do jogador' },
```

Note: `BookOpen` is already imported.

- [ ] **Step 4: Add sidebar link for admin**

In `frontend/src/components/sidebar/index.jsx`, add to `catalogItems`:

```javascript
{ path: '/admin/docs', label: 'Docs Interno', icon: ScrollText, description: 'Base de conhecimento' },
```

Add `ScrollText` to the lucide-react import.

- [ ] **Step 5: Commit**

```bash
git add src/constants/routes.js src/routes.jsx src/components/sidebar/index.jsx
git commit -m "feat(docs): add routes and sidebar links for docs and admin docs"
```

---

### Task 8: Build, deploy, and verify

- [ ] **Step 1: Build docs**

```bash
cd /opt/role-chat-game/frontend && node scripts/build-docs.js
```

Expected: jogador and interno sections built successfully

- [ ] **Step 3: Build frontend**

```bash
cd /opt/role-chat-game/frontend && npm run build
```

Expected: successful build with no errors

- [ ] **Step 4: Deploy and verify**

```bash
sudo cp -r dist/* /var/www/lunaria-front/
```

Navigate to `/docs` and `/admin/docs` to verify pages render.

- [ ] **Step 5: Delete backend REGRAS_BATALHA.md**

```bash
cd /opt/role-chat-game/backend && rm docs/REGRAS_BATALHA.md
```

- [ ] **Step 5: Final commit**

```bash
cd /opt/role-chat-game/backend && git rm docs/REGRAS_BATALHA.md
git commit -m "chore: remove REGRAS_BATALHA.md — absorbed into frontend docs"
```
