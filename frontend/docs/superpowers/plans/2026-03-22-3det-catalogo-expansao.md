# 3D&T Catalog Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the 3D&T catalog from 37 entries to ~160 entries by adding races (as vantagens únicas), classes (as vantagens), new advantages from the Manual Alpha, and narrative-driven disadvantages — all with proper costs and tier limits.

**Architecture:** Add `subtipo` and `vantagens_inclusas`/`desvantagens_inclusas` columns to the vantagens table via Prisma schema + db push. Create seed scripts that upsert all new data. Update the MestreCriador prompt to understand tier limits and narrative desvantagem philosophy. Update frontend ficha livre to enforce limits.

**Tech Stack:** Prisma (PostgreSQL), Node.js seed scripts, React (frontend validation)

**Spec:** `docs/superpowers/specs/2026-03-22-3det-catalogo-expansao-design.md`

---

## File Structure

### Backend — New/Modified files
```
backend/prisma/schema.prisma                          # Add subtipo, vantagens_inclusas, desvantagens_inclusas
backend/prisma/seed_tresdet_racas.js                  # NEW: 45 racial vantagens
backend/prisma/seed_tresdet_classes.js                # NEW: 26 class vantagens
backend/prisma/seed_tresdet_vantagens.js              # MODIFY: add ~28 new + fix 4 costs
backend/prisma/seed_tresdet_desvantagens.js           # MODIFY: add ~24 new + fix 2 costs
backend/prisma/seed_tresdet_all.js                    # NEW: runner that calls all 4 seeds in order
backend/agents/MestreCriador/prompts/sistema.js       # MODIFY: update promptTresDet with tier rules
```

### Frontend — Modified files
```
frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js   # Add tier limits
```

---

## Task 1: Schema Migration — Add subtipo and package fields

**Files:**
- Modify: `/opt/role-chat-game/backend/prisma/schema.prisma`

- [ ] **Step 1: Add new fields to vantagens model**

In the `vantagens` model (around line 289), add after the `sistema` field:

```prisma
  subtipo           String?   @db.VarChar(50)    // 'racial', 'classe', or null (normal)
  vantagens_inclusas Json?                        // array of vantagem names included in racial package
  desvantagens_inclusas Json?                     // array of desvantagem names included in racial package
```

- [ ] **Step 2: Push schema to database**

```bash
cd /opt/role-chat-game/backend && npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
cd /opt/role-chat-game/backend
git add prisma/schema.prisma
git commit -m "feat(3det): add subtipo, vantagens_inclusas, desvantagens_inclusas to vantagens table"
```

---

## Task 2: Seed — Racial Vantagens (45 entries)

**Files:**
- Create: `/opt/role-chat-game/backend/prisma/seed_tresdet_racas.js`

- [ ] **Step 1: Create the seed file**

```javascript
// seed_tresdet_racas.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const RACAS = [
  // ===== Semi-humanos =====
  { nome: 'Humano', descricao: 'A raça mais abundante e adaptável. Versáteis e ambiciosos, humanos se destacam em qualquer campo.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptabilidade'], desvantagens_inclusas: [] },
  { nome: 'Anão', descricao: 'Humanoides robustos de baixa estatura. Famosos pela resistência à magia e mestria em forjar armas e armaduras.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Resistência a Magia', 'Armadura Extra'], desvantagens_inclusas: [] },
  { nome: 'Elfo', descricao: 'Seres graciosos e longevos com sentidos aguçados e afinidade natural com a magia e a natureza.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais', 'Aceleração'], desvantagens_inclusas: [] },
  { nome: 'Elfo Negro', descricao: 'Elfos que vivem nas profundezas, dominando as trevas. Possuem visão no escuro e afinidade com magia sombria.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais', 'Magia Negra'], desvantagens_inclusas: [] },
  { nome: 'Gnomo', descricao: 'Pequenos e engenhosos, gnomos combinam inteligência aguçada com sentidos excepcionais.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Genialidade', 'Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Halfling', descricao: 'Criaturas pequenas e sorrateiras com uma sorte sobrenatural e aparência desarmante.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Aparência Inofensiva', 'Sortudo'], desvantagens_inclusas: [] },
  { nome: 'Meio-Elfo', descricao: 'Fruto da união entre humanos e elfos. Combina adaptabilidade humana com sentidos élficos.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: [] },
  { nome: 'Meio-Orc', descricao: 'Resultado da união entre orcs e humanos. Herda a força bruta orca com mais controle e inteligência.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: [] },
  { nome: 'Goblin', descricao: 'Criaturas pequenas, ardilosas e desprezadas pela maioria das sociedades civilizadas.', custo: -1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Inculto'] },
  { nome: 'Orc', descricao: 'Guerreiros brutais e ferozes, conhecidos pela fúria em batalha e sociedade tribal.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Fúria Incontrolável'] },

  // ===== Humanoides =====
  { nome: 'Anfíbio', descricao: 'Ser que vive tanto na água quanto na terra, adaptado a ambientes aquáticos.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptador'], desvantagens_inclusas: [] },
  { nome: 'Alien', descricao: 'Visitante de outro mundo ou dimensão, com biologia e sentidos completamente diferentes.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptador', 'Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Centauro', descricao: 'Metade humano, metade cavalo. Rápido e forte, mas com dificuldades em espaços fechados.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Aceleração'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Kemono', descricao: 'Humanoide com traços animais — orelhas, cauda, garras. Sentidos aguçados de predador.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Meio-Dragão', descricao: 'Descendente de dragões. Asas, escamas, sopro devastador — o poder dracônico corre em suas veias.', custo: 4, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra', 'Voo', 'Ataque Especial'], desvantagens_inclusas: [] },
  { nome: 'Minotauro', descricao: 'Humanoides com cabeça de touro, enormes e poderosos. Mestres dos labirintos.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Arena'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Ogro', descricao: 'Gigantes brutais e pouco inteligentes, temidos pela força descomunal.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Troglodita', descricao: 'Répteis humanoides subterrâneos, adaptados à escuridão total.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptador'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Bugbear', descricao: 'Goblins grandes e furtivos, surpreendentemente silenciosos para seu tamanho.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Hobgoblin', descricao: 'Goblins disciplinados e militaristas, mestres da tática e da guerra organizada.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Arena'], desvantagens_inclusas: [] },
  { nome: 'Kobold', descricao: 'Pequenos répteis covardemente astutos, mestres de armadilhas.', custo: -1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Inculto', 'Modelo Especial'] },
  { nome: 'Draconato', descricao: 'Dragões humanoides orgulhosos com sopro elemental e escamas resistentes.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra', 'Ataque Especial'], desvantagens_inclusas: [] },
  { nome: 'Pardalino', descricao: 'Felinos humanoides ágeis e curiosos, impulsionados por sede de conhecimento.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Aceleração', 'Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Silvagante', descricao: 'Gigantes gentis da floresta com conexão profunda com a natureza.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Ligação Natural'], desvantagens_inclusas: [] },
  { nome: 'Primordiano', descricao: 'Tocados pelos planos elementais, manifestam poder de fogo, água, terra ou ar na própria pele.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Elementalista'], desvantagens_inclusas: [] },

  // ===== Youkai =====
  { nome: 'Anjo', descricao: 'Ser celestial de pura luz. Asas radiantes, magias de cura e proteção divina.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Voo', 'Magia Branca'], desvantagens_inclusas: [] },
  { nome: 'Demônio', descricao: 'Criatura das trevas com resistência sobrenatural. Temido e desprezado onde quer que vá.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Resistência a Magia'], desvantagens_inclusas: ['Má Fama'] },
  { nome: 'Fada', descricao: 'Ser mágico diminuto com asas translúcidas, capaz de voar e conjurar magias elementais.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Voo', 'Magia Elemental'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Licantropo', descricao: 'Amaldiçoado com a forma bestial. Pode se transformar mas luta para manter o controle.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Forma Alternativa'], desvantagens_inclusas: ['Fúria Incontrolável'] },
  { nome: 'Meio-Abissal', descricao: 'Descendente de demônios, carrega poder sombrio e resistência sobrenatural.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Resistência a Magia'], desvantagens_inclusas: [] },
  { nome: 'Meio-Celestial', descricao: 'Descendente de anjos, abençoado com luz divina e magias de proteção.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Magia Branca'], desvantagens_inclusas: [] },
  { nome: 'Meio-Gênio', descricao: 'Descendente de gênios elementais, domina magia elemental e pode voar.', custo: 4, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Magia Elemental', 'Voo'], desvantagens_inclusas: [] },
  { nome: 'Deva', descricao: 'Alma reencarnada de origem divina. Carrega memórias de vidas passadas e poder sagrado.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Magia Branca'], desvantagens_inclusas: [] },

  // ===== Construtos =====
  { nome: 'Androide', descricao: 'Máquina com aparência humana. Forte e resiliente, mas sem emoções verdadeiras.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra'], desvantagens_inclusas: [] },
  { nome: 'Ciborgue', descricao: 'Humano com partes mecânicas. Pode ser melhorado com implantes e equipamentos.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: [] },
  { nome: 'Golem', descricao: 'Construto mágico de pedra, metal ou madeira. Extremamente resistente mas sem magia própria.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Mecha', descricao: 'Robô gigante ou armadura mecânica pilotada. Devastador em combate.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Meio-Golem', descricao: 'Ser vivo com partes de construto. Mais resistente que o normal.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra'], desvantagens_inclusas: [] },
  { nome: 'Nanomorfo', descricao: 'Ser composto por nanomáquinas que se reestruturam. Adapta-se a qualquer situação.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Regeneração', 'Adaptador'], desvantagens_inclusas: [] },
  { nome: 'Robô Positrônico', descricao: 'Máquina com inteligência artificial avançada. Segue as Leis da Robótica.', custo: -2, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial', 'Inculto'] },

  // ===== Mortos-vivos =====
  { nome: 'Esqueleto', descricao: 'Morto-vivo reduzido a ossos animados. Frágil mas incansável.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Fantasma', descricao: 'Espírito que recusa partir. Intangível, invisível, capaz de voar — mas preso entre os mundos.', custo: 5, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Voo', 'Invisibilidade'], desvantagens_inclusas: [] },
  { nome: 'Múmia', descricao: 'Morto-vivo preservado por rituais antigos. Extraordinariamente resistente com poder de paralisia.', custo: 5, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra', 'Regeneração', 'Paralisia'], desvantagens_inclusas: [] },
  { nome: 'Vampiro', descricao: 'Morto-vivo sedutor e letal. Poderes noturnos imensos, mas fraquezas fatais à luz e estacas.', custo: -1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Dependência de Sangue', 'Vulnerabilidade à Luz Solar'] },
  { nome: 'Zumbi', descricao: 'Cadáver reanimado, lento e inculto, mas quase impossível de parar.', custo: -2, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Inculto', 'Lentidão', 'Modelo Especial'] },
];

export async function seedTresdetRacas() {
  console.log(`Seeding ${RACAS.length} 3D&T racial vantagens...`);
  for (const r of RACAS) {
    await prisma.vantagens.upsert({
      where: { nome_sistema: { nome: r.nome, sistema: 'tresdet' } },
      create: {
        nome: r.nome,
        descricao: r.descricao,
        custo: r.custo,
        nivel: r.nivel,
        tipo: r.tipo,
        subtipo: 'racial',
        vantagens_inclusas: r.vantagens_inclusas,
        desvantagens_inclusas: r.desvantagens_inclusas,
        sistema: 'tresdet',
      },
      update: {
        descricao: r.descricao,
        custo: r.custo,
        tipo: r.tipo,
        subtipo: 'racial',
        vantagens_inclusas: r.vantagens_inclusas,
        desvantagens_inclusas: r.desvantagens_inclusas,
      },
    });
  }
  console.log(`Done: ${RACAS.length} racas seeded.`);
}
```

- [ ] **Step 2: Run and verify**

```bash
cd /opt/role-chat-game/backend && node -e "
import('./prisma/seed_tresdet_racas.js').then(m => m.seedTresdetRacas()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"
```

- [ ] **Step 3: Verify count**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.vantagens.count({ where: { sistema: 'tresdet', subtipo: 'racial' } }).then(c => { console.log('Raciais:', c); db.\$disconnect(); });
"
```

Expected: `Raciais: 45`

- [ ] **Step 4: Commit**

```bash
git add prisma/seed_tresdet_racas.js
git commit -m "feat(3det): seed 45 racial vantagens (raças como vantagens únicas)"
```

---

## Task 3: Seed — Class Vantagens (26 entries)

**Files:**
- Create: `/opt/role-chat-game/backend/prisma/seed_tresdet_classes.js`

- [ ] **Step 1: Create the seed file**

```javascript
// seed_tresdet_classes.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CLASSES = [
  { nome: 'Guerreiro', descricao: 'Especialista em armas e combate. +1 em testes de Força em combate.', custo: 1, nivel: 1, tipo: ['classe'], usar: 0 },
  { nome: 'Mago', descricao: 'Estudioso das artes arcanas. Acesso a magias variadas. +2 PM.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Clérigo', descricao: 'Devoto de uma divindade. Magia Branca básica e cura.', custo: 1, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Paladino', descricao: 'Cavaleiro sagrado. Combate divino com Código de Honra dos Heróis incluso.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Bárbaro', descricao: 'Guerreiro selvagem. Fúria concede +1F e -1A temporário por 1d turnos.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 1 },
  { nome: 'Druida', descricao: 'Guardião da natureza. Magia Natural e Forma de Fera menor.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Ladino', descricao: 'Mestre da furtividade. Ataque Furtivo: +2 dano em alvos surpresos.', custo: 1, nivel: 1, tipo: ['classe', 'furtivo'], usar: 0 },
  { nome: 'Bardo', descricao: 'Artista e inspirador. Aliados próximos ganham +1 em testes por 1d turnos.', custo: 1, nivel: 1, tipo: ['classe', 'suporte'], usar: 1 },
  { nome: 'Ranger', descricao: 'Caçador e explorador. Rastreamento e bônus em combate à distância em terreno natural.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Monge', descricao: 'Mestre do corpo e da mente. Combate Desarmado com F+1 e Deflexão.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Assassino', descricao: 'Mestre da morte silenciosa. Ataque Furtivo aprimorado: +3 dano + uso de venenos.', custo: 2, nivel: 1, tipo: ['classe', 'furtivo'], usar: 0 },
  { nome: 'Necromante', descricao: 'Senhor dos mortos. Magia Negra e capacidade de animar 1 morto-vivo aliado.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Ninja', descricao: 'Guerreiro das sombras. Invisibilidade curta (1 turno) e Ataque Furtivo.', custo: 2, nivel: 1, tipo: ['classe', 'furtivo'], usar: 1 },
  { nome: 'Samurai', descricao: 'Guerreiro honrado do oriente. +1F com espadas. Código de Honra de Combate incluso.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Cavaleiro', descricao: 'Guerreiro montado. +1F quando montado. Montaria inclusa como Aliado.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Pirata', descricao: 'Aventureiro dos mares. Combate Naval e perícias de Crime.', custo: 1, nivel: 1, tipo: ['classe', 'social'], usar: 0 },
  { nome: 'Alquimista', descricao: 'Mestre de poções e transmutações. Cria itens consumíveis com efeitos variados.', custo: 2, nivel: 1, tipo: ['classe', 'crafting'], usar: 0 },
  { nome: 'Inventor', descricao: 'Gênio mecânico. Criação e conserto de máquinas, artefatos e engenhocas.', custo: 1, nivel: 1, tipo: ['classe', 'crafting'], usar: 0 },
  { nome: 'Elementalista', descricao: 'Mago especializado em um elemento. Magia Elemental com +1 em Focus de 1 elemento.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Gladiador', descricao: 'Lutador de arena. Bônus em arenas e coliseus. A torcida o fortalece.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Swashbuckler', descricao: 'Espadachim acrobático. +1H em combate com espadas leves e esgrima.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Caçador de Monstros', descricao: 'Especialista em criaturas sobrenaturais. +2 dano contra monstros e rastreamento.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Guerreiro Mágico', descricao: 'Combate e magia unidos. Combate com F+1 e acesso a 1 escola de magia.', custo: 3, nivel: 1, tipo: ['classe', 'combate', 'magico'], usar: 0 },
  { nome: 'Bruxo', descricao: 'Conjurador com pacto sombrio. Magias de Maldição e vínculo com entidade poderosa.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Feiticeiro', descricao: 'Mago nato. Conjura magias instintivamente sem estudo, mas repertório limitado.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Curandeiro', descricao: 'Especialista em cura. +2 PV recuperados com qualquer magia de cura.', custo: 1, nivel: 1, tipo: ['classe', 'suporte'], usar: 0 },
];

export async function seedTresdetClasses() {
  console.log(`Seeding ${CLASSES.length} 3D&T class vantagens...`);
  for (const c of CLASSES) {
    await prisma.vantagens.upsert({
      where: { nome_sistema: { nome: c.nome, sistema: 'tresdet' } },
      create: { ...c, subtipo: 'classe', sistema: 'tresdet' },
      update: { descricao: c.descricao, custo: c.custo, tipo: c.tipo, subtipo: 'classe', usar: c.usar },
    });
  }
  console.log(`Done: ${CLASSES.length} classes seeded.`);
}
```

- [ ] **Step 2: Run and verify count**

```bash
cd /opt/role-chat-game/backend && node -e "
import('./prisma/seed_tresdet_classes.js').then(m => m.seedTresdetClasses()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"
```

Then verify: `node -e "const{PrismaClient}=require('@prisma/client');const db=new PrismaClient();db.vantagens.count({where:{sistema:'tresdet',subtipo:'classe'}}).then(c=>{console.log('Classes:',c);db.\$disconnect()})"`

Expected: `Classes: 26`

- [ ] **Step 3: Commit**

```bash
git add prisma/seed_tresdet_classes.js
git commit -m "feat(3det): seed 26 class vantagens"
```

---

## Task 4: Update Existing Vantagens — Fix Costs + Add New

**Files:**
- Modify: `/opt/role-chat-game/backend/prisma/seed_tresdet_vantagens.js`

- [ ] **Step 1: Add cost fixes and new vantagens to the existing seed file**

At the end of the existing `VANTAGENS` array in `seed_tresdet_vantagens.js`, add the new entries. Also update the costs of existing entries that are wrong.

Read the existing file first, then append the new entries to the array and fix the costs for: Magia Branca (1→2), Magia Negra (1→2), Magia Elemental (1→2), Voo (1→2), Regeneração (2→3), Assombrado desvantagem (-1→-2).

New vantagens to add (append to array):
```javascript
  // --- New from Manual Alpha ---
  { nome: 'Aliado', descricao: 'Companheiro NPC leal. Pontuação 1 ponto abaixo da sua. Ajuda em combate e aventura.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0, efeito: { tipo: 'aliado', valor: 'nivel-1' } },
  { nome: 'Arcano', descricao: 'Domínio total de magias arcanas. Acesso a todas as escolas de magia conhecidas.', custo: 4, nivel: 3, tipo: ['magico'], usar: 0 },
  { nome: 'Área de Batalha', descricao: 'Seu ataque afeta todos os inimigos em uma área. Aliados também podem ser atingidos.', custo: 2, nivel: 2, tipo: ['ofensiva'], usar: 1 },
  { nome: 'Clericato', descricao: 'Acesso a magias divinas e 3 magias extras de seu Mentor divino.', custo: 1, nivel: 1, tipo: ['magico'], usar: 0 },
  { nome: 'Elementalista', descricao: 'Domínio de 1 elemento natural por ponto investido. Bônus em magias desse elemento.', custo: 1, nivel: 1, tipo: ['magico'], usar: 0 },
  { nome: 'Energia Extra', descricao: 'Gasta 2 PM para recuperar todos os PVs. Por 1pt: só Perto da Morte. Por 2pt: qualquer momento.', custo: 1, nivel: 1, tipo: ['defensiva'], usar: 1 },
  { nome: 'Energia Vital', descricao: 'Recupera PVs de aliados tocando-os. Transfere sua energia vital para curar outros.', custo: 2, nivel: 2, tipo: ['suporte'], usar: 1 },
  { nome: 'Familiar', descricao: 'Animal mágico companheiro com poderes menores e vínculo telepático.', custo: 1, nivel: 1, tipo: ['suporte', 'magico'], usar: 0 },
  { nome: 'Forma Alternativa', descricao: 'Pode assumir outra forma com características diferentes. A mudança leva 1 turno.', custo: 2, nivel: 2, tipo: ['transformacao'], usar: 1 },
  { nome: 'Inimigo', descricao: 'Rival recorrente que atrapalha seus planos. Quanto mais forte, mais pontos dá ao Mestre.', custo: 1, nivel: 1, tipo: ['narrativa'], usar: 0 },
  { nome: 'Ligação Natural', descricao: 'Comunicação instintiva com animais e plantas. Entende a natureza ao redor.', custo: 1, nivel: 1, tipo: ['passiva'], usar: 0 },
  { nome: 'Membros Extras', descricao: 'Braços, tentáculos ou apêndices adicionais. Permite 1 ataque extra por turno.', custo: 2, nivel: 2, tipo: ['ofensiva'], usar: 0 },
  { nome: 'Mente Expandida', descricao: 'Telepatia avançada com controle mental menor. Pode influenciar pensamentos.', custo: 2, nivel: 2, tipo: ['magico'], usar: 1 },
  { nome: 'Mentor', descricao: 'Mestre sábio que ensinou seus poderes. Em momentos difíceis, lembra de ensinamentos valiosos.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0 },
  { nome: 'Paladino', descricao: 'Detectar presença do mal e proteção contra medo para si e aliados próximos.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 1 },
  { nome: 'Paralisia', descricao: 'Paralisar um alvo por 1 turno com toque ou olhar. Alvo faz teste de R para resistir.', custo: 1, nivel: 1, tipo: ['controle'], usar: 1 },
  { nome: 'Parceiro', descricao: 'Aliado que luta em sincronia. Quando juntos, combinam as características mais altas.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0 },
  { nome: 'Patrono', descricao: 'Organização ou NPC poderoso fornece recursos, transporte e reforços quando necessário.', custo: 1, nivel: 1, tipo: ['social'], usar: 0 },
  { nome: 'Poder Oculto', descricao: 'Poder secreto devastador que se manifesta em momentos críticos. +1d por ponto investido.', custo: 1, nivel: 1, tipo: ['ofensiva'], usar: 1 },
  { nome: 'PMs Extras', descricao: '+5 Pontos de Magia por ponto investido nesta vantagem.', custo: 1, nivel: 1, tipo: ['magico'], usar: 0 },
  { nome: 'PVs Extras', descricao: '+5 Pontos de Vida por ponto investido nesta vantagem.', custo: 1, nivel: 1, tipo: ['defensiva'], usar: 0 },
  { nome: 'Reflexão', descricao: 'Rebater ataques à distância de volta ao atacante. Teste de H para refletir.', custo: 2, nivel: 2, tipo: ['defensiva'], usar: 1 },
  { nome: 'Possessão', descricao: 'Controlar o corpo de outro ser temporariamente. Alvo faz teste de R para resistir.', custo: 2, nivel: 2, tipo: ['magico', 'controle'], usar: 1 },
  { nome: 'Riqueza', descricao: 'Recursos financeiros ilimitados. Pode comprar equipamento normal e contratar serviços.', custo: 2, nivel: 1, tipo: ['social'], usar: 0 },
  { nome: 'Separação', descricao: 'Dividir-se em 2 ou mais seres menores, cada um com características reduzidas.', custo: 2, nivel: 2, tipo: ['transformacao'], usar: 1 },
  { nome: 'Tiro Carregável', descricao: 'Concentrar 1 turno para PdF dobrado no próximo ataque. Gasta 2 PM.', custo: 1, nivel: 1, tipo: ['ofensiva'], usar: 1 },
  { nome: 'Torcida', descricao: '+1 em combate quando aliados ou público torcem por você.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0 },
  { nome: 'Transferência de Energia', descricao: 'Transferir seus PVs ou PMs para aliados ao toque.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 1 },
  { nome: 'Xamã', descricao: 'Comunicação com espíritos e magias espirituais. Pode pedir conselhos aos mortos.', custo: 1, nivel: 1, tipo: ['magico'], usar: 1 },
```

- [ ] **Step 2: Fix costs of existing entries in the array**

Find and update these in the VANTAGENS array:
- `Magia Branca`: custo 1 → 2
- `Magia Negra`: custo 1 → 2
- `Magia Elemental`: custo 1 → 2
- `Voo` (Voo): custo 1 → 2
- `Regeneração`: custo 2 → 3

- [ ] **Step 3: Run seed and verify**

```bash
node -e "import('./prisma/seed_tresdet_vantagens.js').then(m => m.default ? m.default() : m.seedTresdetVantagens()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });"
```

Verify total: should be ~52 normal vantagens (24 existing + 28 new)

- [ ] **Step 4: Commit**

```bash
git add prisma/seed_tresdet_vantagens.js
git commit -m "feat(3det): add 28 new vantagens from Manual Alpha + fix 5 costs"
```

---

## Task 5: Seed — New Desvantagens + Fix Costs

**Files:**
- Modify: `/opt/role-chat-game/backend/prisma/seed_tresdet_desvantagens.js`

- [ ] **Step 1: Add new desvantagens and fix costs**

Append to existing DESVANTAGENS array:
```javascript
  // --- New narrative-heavy desvantagens ---
  { nome: 'Ponto Fraco', descricao: 'Sua técnica de luta tem uma fraqueza. Inimigos que a descobrem ganham H+1 contra você.', custo: -1, nivel: 1, tipo: ['combate'] },
  { nome: 'Protegido Indefeso', descricao: 'Alguém que você deve proteger com a própria vida. Vilões vão usá-lo contra você.', custo: -1, nivel: 1, tipo: ['narrativa'] },
  { nome: 'Cleptomaníaco', descricao: 'Você rouba coisas que não precisa. Teste de R para resistir quando surge oportunidade.', custo: -1, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Compulsivo', descricao: 'Existe algo que precisa fazer constantemente. Se ficar mais de 1h sem fazer, falha testes de R.', custo: -1, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Mentiroso', descricao: 'Nunca diz a verdade. Teste de R-3 para dizer algo verdadeiro, mesmo para aliados.', custo: -1, nivel: 1, tipo: ['psicologico', 'social'] },
  { nome: 'Paranóico', descricao: 'Não confia em ninguém. Nunca aceita ajuda. Recupera PVs como em lugar inadequado.', custo: -1, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Megalomaníaco', descricao: 'Acredita ser invencível. Nunca foge, nunca se rende, ignora perigos mortais.', custo: -1, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Fobia Rara', descricao: 'Medo terrível de algo incomum (25% do tempo). Teste de R ou foge em pânico.', custo: -1, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Fobia Comum', descricao: 'Medo de algo encontrado frequentemente (50%). Teste de R ou foge em pânico.', custo: -2, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Fobia Constante', descricao: 'Medo de algo quase sempre presente. Teste de R constante ou foge em pânico.', custo: -3, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Fantasia', descricao: 'Acredita ser alguém ou algo que não é. Anuncia sua fantasia para todos à volta.', custo: -1, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Dupla Personalidade', descricao: 'Outra personalidade com características diferentes. Muda aleatoriamente (4-6 no dado).', custo: -2, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Jurado de Morte', descricao: 'Inimigo mortal implacável que não descansará até destruí-lo. Aparece nos piores momentos.', custo: -3, nivel: 1, tipo: ['narrativa'] },
  { nome: 'Maldição Hereditária', descricao: 'Maldição de família com efeitos recorrentes e imprevisíveis. O Mestre decide quando ataca.', custo: -3, nivel: 1, tipo: ['maldicao'] },
  { nome: 'Transformação Incontrolável', descricao: 'Muda de forma em situações de estresse sem controle. O Mestre decide o gatilho.', custo: -3, nivel: 2, tipo: ['transformacao'] },
  { nome: 'Dívida Impagável', descricao: 'Deve favor a alguém poderoso. Missões obrigatórias quando cobrado.', custo: -2, nivel: 1, tipo: ['narrativa'] },
  { nome: 'Exilado', descricao: 'Banido de sua terra natal. Sem aliados locais, perseguido se retornar.', custo: -1, nivel: 1, tipo: ['social'] },
  { nome: 'Identidade Oculta', descricao: 'Deve esconder quem realmente é. Se descoberto, consequências graves.', custo: -1, nivel: 1, tipo: ['narrativa'] },
  { nome: 'Vício', descricao: 'Dependência que prejudica desempenho. -1 em testes quando em abstinência.', custo: -2, nivel: 1, tipo: ['fisiologico'] },
  { nome: 'Segredo Sombrio', descricao: 'Se descoberto, sua vida muda para sempre. O Mestre sabe o segredo.', custo: -2, nivel: 1, tipo: ['narrativa'] },
  { nome: 'Vingativo', descricao: 'Nunca perdoa. Persegue quem o ofendeu, mesmo quando irracional.', custo: -1, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Covarde', descricao: 'Teste de R para não fugir quando em desvantagem numérica ou contra inimigo forte.', custo: -2, nivel: 1, tipo: ['psicologico'] },
  { nome: 'Vulnerabilidade Elemental', descricao: 'Recebe o dobro de dano de um elemento específico escolhido na criação.', custo: -2, nivel: 1, tipo: ['defensiva'] },
  { nome: 'Marca Amaldiçoada', descricao: 'Marca que atrai problemas, entidades malignas e azar. O Mestre usa contra você.', custo: -2, nivel: 1, tipo: ['maldicao'] },
```

Fix existing costs:
- `Assombrado`: custo -1 → -2

- [ ] **Step 2: Run seed and verify**

Expected total: ~37 desvantagens (13 existing + 24 new)

- [ ] **Step 3: Commit**

```bash
git add prisma/seed_tresdet_desvantagens.js
git commit -m "feat(3det): add 24 new desvantagens (narrative-driven) + fix Assombrado cost"
```

---

## Task 6: Seed Runner + Final Verification

**Files:**
- Create: `/opt/role-chat-game/backend/prisma/seed_tresdet_all.js`

- [ ] **Step 1: Create runner script**

```javascript
// seed_tresdet_all.js
import { seedTresdetRacas } from './seed_tresdet_racas.js';
import { seedTresdetClasses } from './seed_tresdet_classes.js';

async function runAll() {
  console.log('=== 3D&T Full Catalog Seed ===\n');
  await seedTresdetRacas();
  await seedTresdetClasses();
  // Vantagens and desvantagens use their existing seed entry points
  console.log('\nNote: Run seed_tresdet_vantagens.js and seed_tresdet_desvantagens.js separately.');
  console.log('\n=== Done ===');
  process.exit(0);
}

runAll().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run full verification**

```bash
cd /opt/role-chat-game/backend && node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const raciais = await db.vantagens.count({ where: { sistema: 'tresdet', subtipo: 'racial' } });
  const classes = await db.vantagens.count({ where: { sistema: 'tresdet', subtipo: 'classe' } });
  const normais = await db.vantagens.count({ where: { sistema: 'tresdet', subtipo: null } });
  const desvs = await db.desvantagens.count({ where: { sistema: 'tresdet' } });
  console.log('Raciais:', raciais);
  console.log('Classes:', classes);
  console.log('Normais:', normais);
  console.log('Desvantagens:', desvs);
  console.log('Total vantagens:', raciais + classes + normais);
  console.log('Total geral:', raciais + classes + normais + desvs);
  db.\$disconnect();
})();
"
```

Expected:
```
Raciais: 45
Classes: 26
Normais: ~52
Desvantagens: ~37
Total vantagens: ~123
Total geral: ~160
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed_tresdet_all.js
git commit -m "feat(3det): add seed runner for full catalog"
```

---

## Task 7: Update MestreCriador Prompt + Frontend Limits

**Files:**
- Modify: `/opt/role-chat-game/backend/agents/MestreCriador/prompts/sistema.js` (promptTresDet function)
- Modify: `/opt/role-chat-game/frontend/src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js`

- [ ] **Step 1: Update promptTresDet to include tier limits and narrative philosophy**

In `sistema.js`, find the `promptTresDet` function and add these rules to the system prompt:

```
## Regras de Limites por Tier
- Novato (5pts): max 2 vantagens, max -4 pts em desvantagens
- Lutador (7pts): max 3 vantagens, max -5 pts em desvantagens
- Campeão (10pts): max 4 vantagens, max -6 pts em desvantagens
- Lenda (12pts): max 5 vantagens, max -6 pts em desvantagens

## Raças (Vantagens Únicas)
- Cada personagem pode ter no máximo 1 raça (subtipo: racial)
- Raça NAO conta no limite de quantidade de vantagens
- Vantagens e desvantagens inclusas no pacote racial NAO contam nos limites
- Raça custa pontos do pool normalmente

## Filosofia de Desvantagens
- Desvantagens sao MOTOR NARRATIVO — quanto mais complicam a historia, mais pontos devolvem
- Ao sugerir desvantagens, priorize as que dao material para voce como Mestre complicar a vida do jogador
- Desvantagens de -3 pontos (Jurado de Morte, Maldição Hereditária, Fobia Constante) sao as mais impactantes narrativamente
- Incentive o jogador a pegar desvantagens, explicando como elas tornam o personagem mais interessante

## Classes
- Classes sao vantagens normais (subtipo: classe) que contam no limite de quantidade
- Representam treinamento, nao natureza — diferente de raças
```

- [ ] **Step 2: Update ficha-livre.model.js with tier limits**

Add constants and validation:

```javascript
const TIER_LIMITS = {
  novato:  { maxVantagens: 2, maxDesvantagemPts: -4 },
  lutador: { maxVantagens: 3, maxDesvantagemPts: -5 },
  campeao: { maxVantagens: 4, maxDesvantagemPts: -6 },
  lenda:   { maxVantagens: 5, maxDesvantagemPts: -6 },
};
```

Add derived computations:
```javascript
const tierLimits = TIER_LIMITS[nivelPoder] || TIER_LIMITS.lutador;

// Count only non-racial vantagens for the limit
const vantagensContaveis = vantagensIds.filter(id => {
  const v = vantagensCatalogo.find(x => String(x.id) === String(id));
  return v?.subtipo !== 'racial';
}).length;

const limiteVantagensAtingido = vantagensContaveis >= tierLimits.maxVantagens;
const limiteDesvantagensAtingido = pontosDesvantagens <= tierLimits.maxDesvantagemPts;
```

Update `adicionarVantagem` to check limit:
```javascript
const adicionarVantagem = useCallback((id) => {
  const sid = String(id);
  if (vantagensIds.includes(sid)) return;
  const v = vantagensCatalogo.find(x => String(x.id) === sid);
  if (!v) return;
  if (v.custo > 0 && v.custo > pontosRestantes) return;
  // Check quantity limit (racial doesn't count)
  if (v.subtipo !== 'racial' && vantagensContaveis >= tierLimits.maxVantagens) return;
  // Check only 1 racial
  if (v.subtipo === 'racial' && vantagensIds.some(vid => {
    const existing = vantagensCatalogo.find(x => String(x.id) === vid);
    return existing?.subtipo === 'racial';
  })) return;
  setVantagensIds(prev => [...prev, sid]);
}, [vantagensIds, vantagensCatalogo, pontosRestantes, vantagensContaveis, tierLimits]);
```

Update `adicionarDesvantagem` to check points limit:
```javascript
const adicionarDesvantagem = useCallback((id) => {
  const sid = String(id);
  if (desvantagensIds.includes(sid)) return;
  const d = desvantagensCatalogo.find(x => String(x.id) === sid);
  if (!d) return;
  if (pontosDesvantagens + d.custo < tierLimits.maxDesvantagemPts) return;
  setDesvantagensIds(prev => [...prev, sid]);
}, [desvantagensIds, desvantagensCatalogo, pontosDesvantagens, tierLimits]);
```

Export the new values: `limiteVantagensAtingido`, `limiteDesvantagensAtingido`, `tierLimits`, `vantagensContaveis`

- [ ] **Step 3: Build frontend**

```bash
cd /opt/role-chat-game/frontend && NODE_OPTIONS="--max-old-space-size=4096" npx vite build 2>&1 | tail -3
```

- [ ] **Step 4: Deploy**

```bash
sudo rm -rf /var/www/lunaria-front/* && sudo cp -r dist/* /var/www/lunaria-front/
```

- [ ] **Step 5: Restart backend**

```bash
pm2 restart lunaria-back --update-env
```

- [ ] **Step 6: Commit and push**

```bash
cd /opt/role-chat-game/backend && git add agents/MestreCriador/prompts/sistema.js && git commit -m "feat(3det): add tier limits and narrative philosophy to MestreCriador prompt"
cd /opt/role-chat-game/frontend && git add src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js && git commit -m "feat(3det): enforce tier limits on vantagens quantity and desvantagens points"
```

---

## Task 8: E2E Verification

- [ ] **Step 1: Verify catalog loads in ficha livre**

Navigate to `/novo-personagem?sistema=tresdet`. Open catalog modal. Verify:
- Racial vantagens appear (Anão, Elfo, Meio-Dragão, etc.)
- Classes appear (Guerreiro, Mago, etc.)
- Normal vantagens appear (Aliado, Arcano, etc.)
- Costs are correct (Magia Branca = 2, Regeneração = 3, Arcano = 4, Fantasma = 5)

- [ ] **Step 2: Verify tier limits**

As Lutador (7pts):
- Add 3 non-racial vantagens → 4th should be blocked
- Add racial (Elfo 2pts) → should work (doesn't count in limit)
- Add desvantagens until -5pts → next one should be blocked

- [ ] **Step 3: Verify desvantagens catalog**

Open desvantagens catalog. Verify:
- New narrative desvantagens appear (Jurado de Morte -3, Fobia Constante -3, etc.)
- Cost range: -1 to -3

- [ ] **Step 4: Push all**

```bash
cd /opt/role-chat-game/backend && git push origin main
cd /opt/role-chat-game/frontend && git push origin main
```
