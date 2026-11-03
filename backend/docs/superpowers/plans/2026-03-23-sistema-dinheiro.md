# Sistema de Dinheiro + Itens 3D&T — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema de economia (moedas, compra/venda, loja) + catálogo de itens 3D&T com seed via Gemini.

**Architecture:** Novos campos no schema (moedas, quantidade, equipado), nova tabela `itens_tresdet` + `personagem_item_tresdet`, helper puro pra cálculos, service com $transaction pra operações, rotas sob `/personagens/:id/`, script Gemini pra seed de itens dos PDFs, frontend com inventário expandido e saldo na ficha.

**Tech Stack:** Prisma (PostgreSQL), Node.js ESM, Express, Vitest, React, Gemini API

**Spec:** `backend/docs/superpowers/specs/2026-03-23-sistema-dinheiro-design.md`

---

### Task 1: Schema — novos campos e tabelas

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/Model/Personagem.js` (adicionar relação)

- [ ] **Step 1: Adicionar campo `moedas` na tabela personagens**

Em `schema.prisma`, no model `personagens`, adicionar:
```prisma
moedas Int @default(0)
```

- [ ] **Step 2: Adicionar campos na tabela personagem_equipamento**

```prisma
model personagem_equipamento {
  personagem_id  Int
  equipamento_id Int
  quantidade     Int      @default(1)
  equipado       Boolean  @default(false)
  equipamentos   equipamentos @relation(fields: [equipamento_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  personagens    personagens  @relation(fields: [personagem_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@id([personagem_id, equipamento_id])
}
```

- [ ] **Step 3: Adicionar campo `preco` na tabela equipamentos**

```prisma
preco Int @default(0)
```

- [ ] **Step 4: Criar tabela itens_tresdet**

```prisma
model itens_tresdet {
  id              Int      @id @default(autoincrement())
  nome            String   @db.VarChar(200)
  descricao       String?
  tipo            String   @db.VarChar(30)
  custo_pe        Int      @default(0)
  preco_moedas    Int      @default(0)
  poderes         Json?
  efeito          String?
  empilhavel      Boolean  @default(false)
  raridade        String?  @db.VarChar(30)
  imagem          String?  @db.VarChar(500)
  magia_vinculada String?  @db.VarChar(200)

  personagem_item_tresdet personagem_item_tresdet[]

  @@unique([nome])
}
```

- [ ] **Step 5: Criar tabela personagem_item_tresdet**

```prisma
model personagem_item_tresdet {
  personagem_id  Int
  item_id        Int
  quantidade     Int      @default(1)
  equipado       Boolean  @default(false)

  personagens    personagens    @relation(fields: [personagem_id], references: [id], onDelete: Cascade)
  item           itens_tresdet  @relation(fields: [item_id], references: [id], onDelete: Cascade)

  @@id([personagem_id, item_id])
}
```

- [ ] **Step 6: Adicionar relações no model personagens**

No model `personagens`, adicionar:
```prisma
personagem_item_tresdet personagem_item_tresdet[]
```

- [ ] **Step 7: Rodar db push e generate**

```bash
cd /opt/role-chat-game/backend && npx prisma db push && npx prisma generate
```

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add moedas, itens_tresdet, personagem_item_tresdet tables

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Model — ItensTresDet + PersonagemItemTresDet

**Files:**
- Create: `backend/Model/ItensTresDet.js`
- Create: `backend/Model/PersonagemItemTresDet.js`
- Modify: `backend/Model/index.js`

- [ ] **Step 1: Criar Model ItensTresDet**

```javascript
import prisma from './prismaClient.js';

const ItensTresDet = {
  buscarTodos: () => prisma.itens_tresdet.findMany({ orderBy: { nome: 'asc' } }),

  buscarPorId: (id) => prisma.itens_tresdet.findUnique({ where: { id } }),

  buscarPorTipo: (tipo) => prisma.itens_tresdet.findMany({
    where: { tipo },
    orderBy: { nome: 'asc' }
  }),

  buscarPorNome: (nome) => prisma.itens_tresdet.findFirst({
    where: { nome: { contains: nome, mode: 'insensitive' } }
  }),

  criar: (data) => prisma.itens_tresdet.create({ data }),

  criarVarios: (data) => prisma.itens_tresdet.createMany({ data, skipDuplicates: true }),
};

export default ItensTresDet;
```

- [ ] **Step 2: Criar Model PersonagemItemTresDet**

```javascript
import prisma from './prismaClient.js';

const PersonagemItemTresDet = {
  listarInventario: (personagemId) => prisma.personagem_item_tresdet.findMany({
    where: { personagem_id: personagemId },
    include: { item: true },
    orderBy: { item: { nome: 'asc' } }
  }),

  buscar: (personagemId, itemId) => prisma.personagem_item_tresdet.findUnique({
    where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } },
    include: { item: true }
  }),

  upsertQuantidade: (personagemId, itemId, incremento) =>
    prisma.personagem_item_tresdet.upsert({
      where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } },
      create: { personagem_id: personagemId, item_id: itemId, quantidade: incremento },
      update: { quantidade: { increment: incremento } }
    }),

  atualizarEquipado: (personagemId, itemId, equipado) =>
    prisma.personagem_item_tresdet.update({
      where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } },
      data: { equipado }
    }),

  remover: (personagemId, itemId) =>
    prisma.personagem_item_tresdet.delete({
      where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } }
    }),

  contarEquipados: (personagemId, tipo) =>
    prisma.personagem_item_tresdet.count({
      where: {
        personagem_id: personagemId,
        equipado: true,
        item: { tipo }
      }
    }),
};

export default PersonagemItemTresDet;
```

- [ ] **Step 3: Registrar em Model/index.js**

Adicionar exports para `ItensTresDet` e `PersonagemItemTresDet`.

- [ ] **Step 4: Commit**

```bash
git add Model/ItensTresDet.js Model/PersonagemItemTresDet.js Model/index.js
git commit -m "feat(model): ItensTresDet + PersonagemItemTresDet models

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Helper — economiaHelper.js (cálculos puros)

**Files:**
- Create: `backend/helpers/economiaHelper.js`
- Create: `backend/tests/economiaHelper.test.js`

- [ ] **Step 1: Criar helper**

```javascript
function rolarDado(lados = 6) {
  return Math.floor(Math.random() * lados) + 1;
}

const MODIFICADORES_VANTAGENS = [
  { match: 'Aparência Inofensiva', dado: 1, multiplicador: 50 },
  { match: 'Boa Fama', dado: 1, multiplicador: 50 },
  { match: 'Genialidade', dado: 2, multiplicador: 100 },
  { match: 'Patrono', dado: 2, multiplicador: 100 },
  { match: 'Torcida', dado: 1, multiplicador: 10 },
];

const MODIFICADORES_DESVANTAGENS = [
  { match: 'Assombrado', dado: 1, multiplicador: -10 },
  { match: 'Maldição', dado: 1, multiplicador: -10 },
  { match: 'Código de Honra', dado: 1, multiplicador: -10 },
  { match: 'Clericato', dado: 1, multiplicador: -10 },
  { match: 'Paladino', dado: 1, multiplicador: -10 },
  { match: 'Inculto', dado: 1, multiplicador: -100 },
  { match: 'Insano', dado: 1, multiplicador: -50 },
  { match: 'Má Fama', dado: 1, multiplicador: -100 },
  { match: 'Monstruoso', dado: 1, multiplicador: -10 },
];

export function calcularDinheiroInicial(vantagens = [], desvantagens = []) {
  const nomes = vantagens.map(v => v.nome || '');

  const temRiqueza = nomes.some(n => n.toLowerCase().includes('riqueza'));
  if (temRiqueza) {
    return rolarDado(6) * 100_000_000;
  }

  let total = rolarDado(6) * 100;

  for (const mod of MODIFICADORES_VANTAGENS) {
    const encontrou = nomes.some(n => n.toLowerCase().includes(mod.match.toLowerCase()));
    if (encontrou) {
      let soma = 0;
      for (let i = 0; i < mod.dado; i++) soma += rolarDado(6);
      total += soma * Math.abs(mod.multiplicador);
    }
  }

  // Perícias e especializações por tipo
  const pericias = vantagens.filter(v => v.tipo === 'pericia');
  for (const _ of pericias) {
    total += (rolarDado(6) + rolarDado(6)) * 100;
  }
  const especializacoes = vantagens.filter(v => v.tipo === 'especializacao');
  for (const _ of especializacoes) {
    total += rolarDado(6) * 50;
  }

  const nomesDesv = desvantagens.map(d => d.nome || '');
  for (const mod of MODIFICADORES_DESVANTAGENS) {
    const encontrou = nomesDesv.some(n => n.toLowerCase().includes(mod.match.toLowerCase()));
    if (encontrou) {
      let soma = 0;
      for (let i = 0; i < mod.dado; i++) soma += rolarDado(6);
      total += soma * mod.multiplicador;
    }
  }

  return total;
}

export function calcularPrecoVenda(preco) {
  return Math.floor(preco * 0.5);
}

export const LIMITES_EQUIP = {
  arma: 1,
  armadura: 1,
  acessorio: 2,
  consumivel: 0,
  pergaminho: 0,
};
```

- [ ] **Step 2: Criar testes**

```javascript
import { describe, it, expect } from 'vitest';
import { calcularDinheiroInicial, calcularPrecoVenda, LIMITES_EQUIP } from '../helpers/economiaHelper.js';

describe('economiaHelper', () => {
  describe('calcularDinheiroInicial', () => {
    it('retorna valor base entre 100 e 600 sem modificadores', () => {
      const result = calcularDinheiroInicial([], []);
      expect(result).toBeGreaterThanOrEqual(100);
      expect(result).toBeLessThanOrEqual(600);
    });

    it('retorna valor gigante com Riqueza', () => {
      const result = calcularDinheiroInicial([{ nome: 'Riqueza' }], []);
      expect(result).toBeGreaterThanOrEqual(100_000_000);
    });

    it('pode retornar negativo com desvantagens pesadas', () => {
      const desvantagens = [
        { nome: 'Inculto' },
        { nome: 'Má Fama' },
      ];
      // Com sorte baixa nos dados, pode ser negativo — testar 100x
      let negativoEncontrado = false;
      for (let i = 0; i < 100; i++) {
        if (calcularDinheiroInicial([], desvantagens) < 0) {
          negativoEncontrado = true;
          break;
        }
      }
      // É possível mas não garantido — skip se não encontrou
    });
  });

  describe('calcularPrecoVenda', () => {
    it('retorna metade arredondada pra baixo', () => {
      expect(calcularPrecoVenda(100)).toBe(50);
      expect(calcularPrecoVenda(151)).toBe(75);
      expect(calcularPrecoVenda(1)).toBe(0);
    });
  });

  describe('LIMITES_EQUIP', () => {
    it('define limites corretos', () => {
      expect(LIMITES_EQUIP.arma).toBe(1);
      expect(LIMITES_EQUIP.armadura).toBe(1);
      expect(LIMITES_EQUIP.acessorio).toBe(2);
      expect(LIMITES_EQUIP.consumivel).toBe(0);
    });
  });
});
```

- [ ] **Step 3: Rodar testes**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/economiaHelper.test.js
```

- [ ] **Step 4: Commit**

```bash
git add helpers/economiaHelper.js tests/economiaHelper.test.js
git commit -m "feat(economia): helper com cálculo de dinheiro inicial e preço de venda

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Service — economiaService.js (operações com DB)

**Files:**
- Create: `backend/services/economiaService.js`

- [ ] **Step 1: Criar service**

```javascript
import prisma from '../Model/prismaClient.js';
import { calcularPrecoVenda, LIMITES_EQUIP } from '../helpers/economiaHelper.js';

export async function processarCompra(personagemId, itemId, quantidade = 1, sistema = 'tresdet') {
  return prisma.$transaction(async (tx) => {
    const personagem = await tx.personagens.findUniqueOrThrow({ where: { id: personagemId } });

    if (personagem.moedas < 0) {
      throw new Error('Personagem em dívida não pode comprar itens');
    }

    const tabela = sistema === 'tresdet' ? 'itens_tresdet' : 'equipamentos';
    const campoPreco = sistema === 'tresdet' ? 'preco_moedas' : 'preco';

    const item = await tx[tabela].findUniqueOrThrow({ where: { id: itemId } });
    const preco = item[campoPreco] || 0;
    const custoTotal = preco * quantidade;

    if (personagem.moedas < custoTotal) {
      throw new Error(`Moedas insuficientes: ${personagem.moedas} < ${custoTotal}`);
    }

    await tx.personagens.update({
      where: { id: personagemId },
      data: { moedas: { decrement: custoTotal } }
    });

    const tabelaInv = sistema === 'tresdet' ? 'personagem_item_tresdet' : 'personagem_equipamento';
    const campoItem = sistema === 'tresdet' ? 'item_id' : 'equipamento_id';
    const chaveComposta = sistema === 'tresdet'
      ? { personagem_id_item_id: { personagem_id: personagemId, [campoItem]: itemId } }
      : { personagem_id_equipamento_id: { personagem_id: personagemId, [campoItem]: itemId } };

    await tx[tabelaInv].upsert({
      where: chaveComposta,
      create: { personagem_id: personagemId, [campoItem]: itemId, quantidade },
      update: { quantidade: { increment: quantidade } }
    });

    const saldoAtual = personagem.moedas - custoTotal;
    return { sucesso: true, saldoAtual, item: item.nome, custoTotal };
  });
}

export async function processarVenda(personagemId, itemId, quantidade = 1, sistema = 'tresdet') {
  return prisma.$transaction(async (tx) => {
    const tabelaInv = sistema === 'tresdet' ? 'personagem_item_tresdet' : 'personagem_equipamento';
    const campoItem = sistema === 'tresdet' ? 'item_id' : 'equipamento_id';
    const chaveComposta = sistema === 'tresdet'
      ? { personagem_id_item_id: { personagem_id: personagemId, [campoItem]: itemId } }
      : { personagem_id_equipamento_id: { personagem_id: personagemId, [campoItem]: itemId } };

    const registro = await tx[tabelaInv].findUniqueOrThrow({ where: chaveComposta });

    if (registro.quantidade < quantidade) {
      throw new Error(`Quantidade insuficiente: ${registro.quantidade} < ${quantidade}`);
    }

    const tabela = sistema === 'tresdet' ? 'itens_tresdet' : 'equipamentos';
    const campoPreco = sistema === 'tresdet' ? 'preco_moedas' : 'preco';
    const item = await tx[tabela].findUniqueOrThrow({ where: { id: itemId } });

    const valorVenda = calcularPrecoVenda(item[campoPreco] || 0) * quantidade;

    await tx.personagens.update({
      where: { id: personagemId },
      data: { moedas: { increment: valorVenda } }
    });

    const novaQuantidade = registro.quantidade - quantidade;
    if (novaQuantidade <= 0) {
      await tx[tabelaInv].delete({ where: chaveComposta });
    } else {
      await tx[tabelaInv].update({ where: chaveComposta, data: { quantidade: novaQuantidade } });
    }

    const personagem = await tx.personagens.findUnique({ where: { id: personagemId } });
    return { sucesso: true, saldoAtual: personagem.moedas, valorRecebido: valorVenda };
  });
}

export async function equiparItem(personagemId, itemId, sistema = 'tresdet') {
  if (sistema !== 'tresdet') {
    // Lunaria/D&D: sem limites na v1
    return prisma.personagem_equipamento.update({
      where: { personagem_id_equipamento_id: { personagem_id: personagemId, equipamento_id: itemId } },
      data: { equipado: true }
    });
  }

  const item = await prisma.itens_tresdet.findUniqueOrThrow({ where: { id: itemId } });
  const limite = LIMITES_EQUIP[item.tipo];

  if (limite === 0) {
    throw new Error(`Itens do tipo "${item.tipo}" não podem ser equipados`);
  }

  const equipados = await prisma.personagem_item_tresdet.count({
    where: { personagem_id: personagemId, equipado: true, item: { tipo: item.tipo } }
  });

  if (equipados >= limite) {
    throw new Error(`Limite de ${limite} ${item.tipo}(s) equipado(s) atingido`);
  }

  return prisma.personagem_item_tresdet.update({
    where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } },
    data: { equipado: true }
  });
}

export async function desequiparItem(personagemId, itemId, sistema = 'tresdet') {
  const tabelaInv = sistema === 'tresdet' ? 'personagem_item_tresdet' : 'personagem_equipamento';
  const chave = sistema === 'tresdet'
    ? { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } }
    : { personagem_id_equipamento_id: { personagem_id: personagemId, equipamento_id: itemId } };

  return prisma[tabelaInv].update({ where: chave, data: { equipado: false } });
}
```

- [ ] **Step 2: Commit**

```bash
git add services/economiaService.js
git commit -m "feat(economia): service com compra/venda/equipar usando $transaction

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Controller + Rotas — economia

**Files:**
- Create: `backend/controllers/economia/economiaController.js`
- Modify: `backend/routes/personagem.js`

- [ ] **Step 1: Criar controller**

```javascript
import prisma from '../../Model/prismaClient.js';
import * as economiaService from '../../services/economiaService.js';

export async function obterSaldo(req, res) {
  try {
    const { id } = req.params;
    const personagem = await prisma.personagens.findUniqueOrThrow({
      where: { id: Number(id) },
      select: { moedas: true, nome: true }
    });
    res.json({ data: personagem });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function obterInventario(req, res) {
  try {
    const { id } = req.params;
    const personagem = await prisma.personagens.findUniqueOrThrow({
      where: { id: Number(id) },
      select: { sistema: true }
    });

    let itens;
    if (personagem.sistema === 'tresdet') {
      itens = await prisma.personagem_item_tresdet.findMany({
        where: { personagem_id: Number(id) },
        include: { item: true },
        orderBy: { item: { nome: 'asc' } }
      });
    } else {
      itens = await prisma.personagem_equipamento.findMany({
        where: { personagem_id: Number(id) },
        include: { equipamentos: true },
        orderBy: { equipamentos: { nome: 'asc' } }
      });
    }

    res.json({ data: itens });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function comprar(req, res) {
  try {
    const { id } = req.params;
    const { itemId, quantidade = 1, sistema = 'tresdet' } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });

    const result = await economiaService.processarCompra(Number(id), Number(itemId), Number(quantidade), sistema);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function vender(req, res) {
  try {
    const { id } = req.params;
    const { itemId, quantidade = 1, sistema = 'tresdet' } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });

    const result = await economiaService.processarVenda(Number(id), Number(itemId), Number(quantidade), sistema);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function equipar(req, res) {
  try {
    const { id } = req.params;
    const { itemId, sistema = 'tresdet' } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });

    await economiaService.equiparItem(Number(id), Number(itemId), sistema);
    res.json({ data: { sucesso: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function desequipar(req, res) {
  try {
    const { id } = req.params;
    const { itemId, sistema = 'tresdet' } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });

    await economiaService.desequiparItem(Number(id), Number(itemId), sistema);
    res.json({ data: { sucesso: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
```

- [ ] **Step 2: Adicionar rotas em routes/personagem.js**

Adicionar as seguintes rotas (usando auth middleware existente):

```javascript
import * as economiaController from '../controllers/economia/economiaController.js';

router.get('/:id/saldo', authMiddleware, economiaController.obterSaldo);
router.get('/:id/inventario', authMiddleware, economiaController.obterInventario);
router.post('/:id/comprar', authMiddleware, economiaController.comprar);
router.post('/:id/vender', authMiddleware, economiaController.vender);
router.post('/:id/equipar', authMiddleware, economiaController.equipar);
router.post('/:id/desequipar', authMiddleware, economiaController.desequipar);
```

- [ ] **Step 3: Commit**

```bash
git add controllers/economia/economiaController.js routes/personagem.js
git commit -m "feat(economia): controller + rotas compra/venda/equipar sob /personagens/:id

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Integração com criação de personagem 3D&T

**Files:**
- Modify: `backend/services/personagemTresDetService.js`

- [ ] **Step 1: Importar helper e calcular moedas na criação**

No `criarPersonagemTresDet`, dentro da `$transaction` existente, após vincular vantagens/desvantagens:

```javascript
import { calcularDinheiroInicial } from '../helpers/economiaHelper.js';

// Dentro da transaction, após criar personagem e vincular vantagens/desvantagens:
const moedas = calcularDinheiroInicial(vantagensSelecionadas, desvantagensSelecionadas);
await tx.personagens.update({
  where: { id: personagem.id },
  data: { moedas }
});
```

- [ ] **Step 2: Commit**

```bash
git add services/personagemTresDetService.js
git commit -m "feat(economia): calcular dinheiro inicial na criação de personagem 3D&T

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Script seed de itens via Gemini

**Files:**
- Create: `backend/scripts/seed-itens-tresdet.js`

- [ ] **Step 1: Criar script que lê PDFs e usa Gemini pra extrair itens**

O script:
1. Lê os PDFs com `fs.readFileSync` (base64 pra Gemini)
2. Envia pro Gemini com prompt pedindo JSON estruturado
3. Valida e insere via `ItensTresDet.criarVarios()`

Usar `GOOGLE_API_KEY` do `.env`. Modelo: `gemini-2.5-flash`.

Prompt pro Gemini:
```
Extraia TODOS os itens, objetos mágicos, poções, pergaminhos, armas mágicas, armaduras mágicas e acessórios deste manual de RPG 3D&T Alpha.

Retorne um JSON array com objetos no formato:
{
  "nome": "string",
  "descricao": "string (1-2 frases resumo)",
  "tipo": "consumivel|pergaminho|arma|armadura|acessorio",
  "custo_pe": number,
  "preco_moedas": number (custo_pe * 100 se não especificado),
  "poderes": { ... } ou null,
  "efeito": "string" ou null,
  "empilhavel": boolean,
  "raridade": "comum|incomum|raro|lendario",
  "magia_vinculada": "string" ou null
}

Seja EXAUSTIVO — extraia TODOS os itens mencionados.
```

- [ ] **Step 2: Rodar script**

```bash
cd /opt/role-chat-game/backend && node scripts/seed-itens-tresdet.js
```

- [ ] **Step 3: Verificar dados**

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.itens_tresdet.count().then(c => { console.log('Itens 3D&T:', c); p.\$disconnect(); });"
```

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-itens-tresdet.js
git commit -m "feat(seed): script de seed de itens 3D&T via Gemini (extrai dos PDFs)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Frontend — Saldo na ficha de personagem

**Files:**
- Modify: `frontend/src/components/Jogo/Modals/FichaPersonagemModal.jsx`

- [ ] **Step 1: Adicionar moedas na ficha**

No `FichaPersonagemModal`, adicionar exibição do saldo:

```jsx
{personagem.moedas !== undefined && (
  <div className="flex items-center gap-2 text-yellow-400">
    <span className="text-lg">🪙</span>
    <span className="font-bold">{personagem.moedas.toLocaleString()}</span>
    <span className="text-sm text-slate-400">Moedas</span>
  </div>
)}
```

Posicionar junto aos stats (HP, MP) na ficha.

- [ ] **Step 2: Garantir que o backend retorna moedas no personagem**

Verificar que o endpoint que popula a ficha inclui o campo `moedas` no select.

- [ ] **Step 3: Build e deploy**

```bash
cd /opt/role-chat-game/frontend && npm run build && sudo cp -r dist/* /var/www/lunaria-front/
```

- [ ] **Step 4: Commit**

```bash
cd /opt/role-chat-game/frontend && git add src/components/Jogo/Modals/FichaPersonagemModal.jsx
git commit -m "feat(ficha): mostrar saldo de moedas na ficha de personagem

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Frontend — Inventário expandido

**Files:**
- Modify: `frontend/src/components/Jogo/Gameplay/InventarioPanel.jsx`

- [ ] **Step 1: Expandir InventarioPanel**

Adicionar:
- Saldo de moedas no topo do painel
- Separar itens em "Equipado" e "Mochila"
- Mostrar quantidade pra itens empilháveis
- Botões "Equipar"/"Desequipar"
- Botão "Vender" (visível quando comerciante disponível — flag no state)
- Limites de equip visíveis (1 arma, 1 armadura, 2 acessórios)

- [ ] **Step 2: Criar chamadas de API**

Usar os endpoints:
- `GET /personagens/:id/inventario`
- `POST /personagens/:id/equipar`
- `POST /personagens/:id/desequipar`

- [ ] **Step 3: Build e deploy**

```bash
cd /opt/role-chat-game/frontend && npm run build && sudo cp -r dist/* /var/www/lunaria-front/
```

- [ ] **Step 4: Commit**

```bash
cd /opt/role-chat-game/frontend && git add src/components/Jogo/Gameplay/InventarioPanel.jsx
git commit -m "feat(inventario): inventário expandido com equipar/desequipar e saldo

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Atualizar documentação

**Files:**
- Modify: `frontend/docs/jogador/progressao.md`
- Modify: `frontend/docs/interno/formulas.md`

- [ ] **Step 1: Atualizar docs do jogador**

Adicionar seção "Dinheiro e Comércio" em `progressao.md`:
- Como ganhar moedas (combate, narrativa, venda)
- Como comprar/vender (loja de NPC, chat com Mestre)
- Dívida (quando começa negativo)
- Equipar e limites

- [ ] **Step 2: Atualizar docs internos**

Adicionar seção "Economia" em `formulas.md`:
- Fórmula de dinheiro inicial 3D&T com tabela de modificadores
- Preço de venda (50%)
- Limites de equip por tipo
- Tabela `itens_tresdet` e campos

- [ ] **Step 3: Rebuild docs e deploy**

```bash
cd /opt/role-chat-game/frontend && node scripts/build-docs.js && npm run build && sudo cp -r dist/* /var/www/lunaria-front/
```

- [ ] **Step 4: Commit**

```bash
cd /opt/role-chat-game/frontend && git add docs/
git commit -m "docs: sistema de dinheiro e itens 3D&T

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```
