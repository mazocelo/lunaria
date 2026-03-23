# Sistema de Dinheiro + Itens 3D&T — Design Spec

**Data:** 2026-03-23
**Objetivo:** Sistema de economia completo + catálogo de itens para 3D&T Alpha (extensível para Lunaria e D&D).

## Resumo

Duas frentes:
1. **Economia** — campo moedas no personagem, cálculo de dinheiro inicial, compra/venda, loja com comerciantes NPC
2. **Itens 3D&T** — tabela separada dos equipamentos genéricos, com 5 tipos, catálogo extraído dos manuais via Gemini

---

## Schema

### personagens

Novo campo:
```
moedas Int @default(0)
```

Valor negativo = dívida (regra 3D&T). Tipo Int — valores sempre inteiros (arredonda pra baixo em vendas).

### itens_tresdet (NOVA TABELA)

Tabela separada de `equipamentos` — o 3D&T tem modelo fundamentalmente diferente (poderes compostos, custo em PEs, limites por tipo).

```prisma
model itens_tresdet {
  id             Int      @id @default(autoincrement())
  nome           String   @db.VarChar(200)
  descricao      String?
  tipo           String   @db.VarChar(30)    // consumivel, pergaminho, arma, armadura, acessorio
  custo_pe       Int      @default(0)        // custo em Pontos de Experiência
  preco_moedas   Int      @default(0)        // preço em Moedas (pra comércio)
  poderes        Json?                       // poderes mágicos compostos (armas/armaduras)
  efeito         String?                     // efeito textual (consumíveis/acessórios)
  empilhavel     Boolean  @default(false)    // true pra consumíveis e pergaminhos
  raridade       String?  @db.VarChar(30)    // comum, incomum, raro, lendario
  imagem         String?  @db.VarChar(500)
  magia_vinculada String? @db.VarChar(200)   // pra pergaminhos: nome da magia contida

  personagem_item_tresdet personagem_item_tresdet[]

  @@unique([nome])
}
```

**5 tipos:**

| Tipo | Empilhável | Limite equipado | Exemplos |
|------|------------|-----------------|----------|
| `consumivel` | Sim | N/A (usa e descarta) | Cura Menor, Poção de Voo, Antídoto |
| `pergaminho` | Sim | N/A (usa e descarta) | Pergaminho de Bola de Fogo |
| `arma` | Não | 1 por vez | Arma +2, Espada Vorpal, Arma Venenosa |
| `armadura` | Não | 1 por vez | Armadura +3, Armadura Incorpórea |
| `acessorio` | Não | Max 2 por vez | Anel de Vivara, Medalhão de Renasa |

### personagem_item_tresdet (NOVA TABELA)

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

### personagem_equipamento (já existe — Lunaria/D&D)

Novos campos:
```
quantidade Int @default(1)
equipado   Boolean @default(false)
```

PK mantém `@@id([personagem_id, equipamento_id])` — compra usa `upsert` com increment.

---

## Cálculo de Dinheiro Inicial (3D&T)

Baseado nas regras oficiais do 3D&T Alpha.

### Base

```
dinheiro_inicial = 1d6 × 100
```

### Modificadores por vantagens/desvantagens

Matching por nome (case-insensitive, includes). Vantagens/desvantagens que não existem no banco são ignoradas.

| Vantagem/Desvantagem | Modificador | Match no banco |
|----------------------|-------------|----------------|
| Aparência Inofensiva | +1d6×50 | nome includes "Aparência Inofensiva" |
| Boa Fama | +1d6×50 | nome includes "Boa Fama" |
| Genialidade | +2d6×100 | nome includes "Genialidade" |
| Patrono | +2d6×100 | nome includes "Patrono" |
| Torcida | +1d6×10 | nome includes "Torcida" |
| Perícia (qualquer) | +2d6×100 | tipo === "pericia" |
| Especialização (qualquer) | +1d6×50 | tipo === "especializacao" |
| Assombrado | -1d6×10 | nome includes "Assombrado" |
| Maldição | -1d6×10 | nome includes "Maldição" |
| Código de Honra | -1d6×10 | nome includes "Código de Honra" |
| Clericato | -1d6×10 | nome includes "Clericato" |
| Paladino | -1d6×10 | nome includes "Paladino" |
| Inculto | -1d6×100 | nome includes "Inculto" |
| Insano | -1d6×50 | nome includes "Insano" |
| Má Fama | -1d6×100 | nome includes "Má Fama" |
| Monstruoso | -1d6×10 | nome includes "Monstruoso" |

### Riqueza

Personagens com vantagem **Riqueza** (nome includes "Riqueza") ignoram todo o cálculo acima:
```
dinheiro_inicial = 1d6 × 100_000_000
```

### Dívida

Se o resultado for negativo, o personagem começa com dívida (moedas < 0). Personagens em dívida **não podem comprar itens** — dinheiro ganho durante aventuras é aplicado automaticamente pra saldar a dívida.

---

## Catálogo de Itens 3D&T (Seed via Gemini)

### Script: `scripts/seed-itens-tresdet.js`

Usa Gemini pra ler os 3 PDFs na raiz do projeto e extrair todos os itens:

**PDFs fonte:**
- `1-Manual3dtAlpha-EdioRevisada.pdf` — Parte 8: Objetos Mágicos (itens de cura, pergaminhos, poções, armas mágicas, armaduras mágicas, acessórios)
- `3D&T Alpha - MAGIAS.pdf` — magias adicionais (pergaminhos derivados)
- `3dt-alpha-manual-da-magia-biblioteca-elfica.pdf` — mais magias (pergaminhos derivados)

**Fluxo do script:**
1. Envia páginas relevantes do PDF pro Gemini com prompt estruturado
2. Gemini retorna JSON com itens extraídos
3. Script valida e insere via Prisma `createMany` com `skipDuplicates`

**Itens a extrair do manual principal (Parte 8):**

Consumíveis:
- Cura Menor (1 PE), Cura Maior (3 PEs), Cura Total (5 PEs)
- Magia Menor (3 PEs), Magia Maior (10 PEs), Magia Total (20 PEs)
- Cura & Magia Menores (5 PEs), Cura & Magia Maiores (15 PEs), Cura & Magia Totais (30 PEs)
- Antídoto Menor (3 PEs), Antídoto Maior (10 PEs), Antídoto Total (30 PEs)

Armas Mágicas (poderes como JSON):
- Bônus Mágico +1 a +5 (10-100 PEs)
- Anti-Inimigo (10 PEs), Assassina (20 PEs), Ataque Especial (5 PEs)
- Espiritual (20 PEs), Flagelo (5 PEs cada), Sagrada (30 PEs)
- Veloz (5 PEs), Venenosa (15 PEs), Vorpal (30 PEs)

Armaduras Mágicas (poderes como JSON):
- Bônus Mágico +1 a +5 (10-100 PEs)
- Armadura Extra (variável), Confortável (5 PEs), Incorpórea (30 PEs)
- Invulnerável (variável), Magia Irresistível (variável)
- Submarina (10 PEs), Toque de Energia (5 PEs), Voadora (20 PEs)

Acessórios:
- Anel de Anulação (5 PEs), Anel de Competência (15 PEs)
- Anel do Dragão (30 PEs), Anel de Vivara (40 PEs)
- Bola de Cristal (10 PEs), Brincos de Seraya (30 PEs)
- Brincos de Arcanys (5 PEs cada), Colar do Mar (10 PEs)
- Coroa da Resistência Espiritual (20 PEs), Escudo da Lua (20 PEs)
- Medalhão de Vivara (40 PEs), Medalhão de Renasa (10 PEs)
- Medalhão de Arcanys (60 PEs)

---

## Backend

### Helper: `helpers/economiaHelper.js` (cálculos puros)

```
calcularDinheiroInicial(vantagens, desvantagens)
  → Int (moedas iniciais, pode ser negativo)
  → lógica pura, sem DB

calcularPrecoVenda(preco)
  → Math.floor(preco * 0.5)
```

### Service: `services/economiaService.js` (operações com DB)

Todas as operações usam `prisma.$transaction()` pra garantir consistência.

```
processarCompra(personagemId, itemId, quantidade, sistema)
  → $transaction:
    → busca personagem.moedas e item.preco_moedas (ou equipamento.preco)
    → valida moedas >= preco × quantidade (rejeita se em dívida)
    → deduz moedas
    → upsert inventário (increment quantidade)
  → retorna { sucesso, saldoAtual, item }

processarVenda(personagemId, itemId, quantidade, sistema)
  → $transaction:
    → valida item existe no inventário com quantidade suficiente
    → valorVenda = Math.floor(preco * 0.5) × quantidade
    → credita moedas
    → decrementa quantidade (deleta registro se quantidade chega a 0)
  → retorna { sucesso, saldoAtual, valorRecebido }

equiparItem(personagemId, itemId, sistema)
  → valida limites por tipo:
    - arma: max 1 equipada
    - armadura: max 1 equipada
    - acessorio: max 2 equipados
    - consumivel/pergaminho: não pode equipar
  → marca equipado = true

desequiparItem(personagemId, itemId, sistema)
  → marca equipado = false
```

### Controller: rotas aninhadas sob `/personagens/:id/`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/personagens/:id/saldo` | Retorna moedas atuais |
| GET | `/personagens/:id/inventario` | Lista itens com quantidade e status equipado |
| POST | `/personagens/:id/comprar` | Body: `{ itemId, quantidade, sistema }` |
| POST | `/personagens/:id/vender` | Body: `{ itemId, quantidade, sistema }` |
| POST | `/personagens/:id/equipar` | Body: `{ itemId, sistema }` |
| POST | `/personagens/:id/desequipar` | Body: `{ itemId, sistema }` |

Auth: `requireResourceOwnerOrSuperAdmin('Personagem')` em todas as rotas de escrita.

O campo `sistema` determina se opera em `itens_tresdet`/`personagem_item_tresdet` ou `equipamentos`/`personagem_equipamento`.

### Integração com criação

`personagemTresDetService.criarPersonagemTresDet()`:
- Dentro da `$transaction` existente de criação
- Chama `calcularDinheiroInicial(vantagens, desvantagens)`
- Salva resultado em `personagens.moedas`

### Integração com Mestre IA

O Mestre pode processar comércio via chat:
- Jogador diz "compro a espada longa"
- Mestre detecta intent de compra
- Chama `economiaService.processarCompra()` internamente
- Narra o resultado ("O ferreiro entrega a espada. -150 Moedas")

### Integração com combate

`turnStateBuilder` considera apenas itens com `equipado = true` para bônus de combate. Itens na mochila (`equipado = false`) não influenciam stats.

---

## Frontend

### Loja (durante o jogo)

- Mestre narra comerciante → emite evento WebSocket `comerciante_disponivel` com `{ npcNome, itens: [...] }`
- Frontend abre painel lateral "Loja do {npcNome}"
- Cada item mostra: nome, imagem (se houver), preço, raridade, descrição
- Botão "Comprar" → `POST /personagens/:id/comprar`
- Feedback no chat: "Você comprou X por Y Moedas"
- Saldo visível no topo do painel

### Inventário (expandido)

O InventarioPanel existente expande para mostrar:
- Saldo de moedas no topo
- Seção "Equipado" — itens com `equipado = true`, botão "Desequipar"
- Seção "Mochila" — itens com `equipado = false`, botão "Equipar"
- Quantidade por item empilhável
- Botão "Vender" (visível quando comerciante disponível)
- Limites de equip visíveis (1 arma, 1 armadura, 2 acessórios)

### Wizard (criação 3D&T)

- Após etapa de vantagens/desvantagens, calcula preview do dinheiro inicial
- Mostra: "Você começa com X Moedas" + breakdown dos modificadores
- Dinheiro final salvo ao confirmar criação

### Ficha de Personagem

- Mostra saldo de moedas na ficha (FichaPersonagemModal)
- Valor formatado com ícone de moeda
- Visível tanto na ficha do wizard quanto na ficha durante o jogo

---

## Extensibilidade

O campo `moedas` no personagem é agnóstico de sistema. Cada game-system define:
- Como calcular dinheiro inicial (3D&T: 1d6×100, D&D: por classe/background, Lunaria: TBD)
- Nome da moeda (Moeda, Gold Piece, etc.)
- Regras de venda (50% é padrão, pode variar)
- Tabela de itens (3D&T: `itens_tresdet`, Lunaria/D&D: `equipamentos`)

A lógica de cálculo fica em `game-systems/{sistema}/characterEngine.js`. O service genérico delega.
