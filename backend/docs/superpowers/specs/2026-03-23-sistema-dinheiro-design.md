# Sistema de Dinheiro — Design Spec

**Data:** 2026-03-23
**Objetivo:** Sistema de economia completo para 3D&T Alpha (extensível para Lunaria e D&D).

## Resumo

Adicionar moeda ao jogo: campo no personagem, preço nos equipamentos, cálculo de dinheiro inicial na criação, compra/venda durante o jogo, loja com comerciantes NPC, inventário expandido com equipar/desequipar.

---

## Schema

### personagens

Novo campo:
```
moedas Int @default(0)
```

Valor negativo = dívida (regra 3D&T). Tipo Int — valores sempre inteiros (arredonda pra baixo em vendas).

### equipamentos

Novo campo:
```
preco Int @default(0)
```

Mantém `preco_sugerido` (String) para legado. O novo `preco` é numérico inteiro em Moedas.

### personagem_equipamento (já existe)

Novos campos:
```
quantidade Int @default(1)
equipado   Boolean @default(false)
```

- `equipado = true` → item no corpo do personagem
- `equipado = false` → item na mochila/inventário
- `quantidade` → suporta itens empilháveis (poções, materiais)
- PK mantém `@@id([personagem_id, equipamento_id])` — compra usa `upsert` com increment na quantidade

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
processarCompra(personagemId, equipamentoId, quantidade)
  → $transaction:
    → busca personagem.moedas e equipamento.preco
    → valida moedas >= preco × quantidade (rejeita se em dívida)
    → deduz moedas
    → upsert personagem_equipamento (increment quantidade)
  → retorna { sucesso, saldoAtual, item }

processarVenda(personagemId, equipamentoId, quantidade)
  → $transaction:
    → valida item existe no inventário com quantidade suficiente
    → valorVenda = Math.floor(preco * 0.5) × quantidade
    → credita moedas
    → decrementa quantidade (deleta registro se quantidade chega a 0)
  → retorna { sucesso, saldoAtual, valorRecebido }

equiparItem(personagemId, equipamentoId)
  → marca equipado = true

desequiparItem(personagemId, equipamentoId)
  → marca equipado = false
```

### Controller: `controllers/personagem/personagemController.js` (rotas existentes expandidas)

Segue o padrão existente de rotas aninhadas sob `/personagens/:id/`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/personagens/:id/saldo` | Retorna moedas atuais |
| GET | `/personagens/:id/inventario` | Lista itens com quantidade e status equipado |
| POST | `/personagens/:id/comprar` | Body: `{ equipamentoId, quantidade }` |
| POST | `/personagens/:id/vender` | Body: `{ equipamentoId, quantidade }` |
| POST | `/personagens/:id/equipar` | Body: `{ equipamentoId }` |
| POST | `/personagens/:id/desequipar` | Body: `{ equipamentoId }` |

Auth: `requireResourceOwnerOrSuperAdmin('Personagem')` em todas as rotas de escrita.

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
- Sem limite de equip slots na v1 (restrições por sistema adicionadas depois)

### Wizard (criação 3D&T)

- Após etapa de vantagens/desvantagens, calcula preview do dinheiro inicial
- Mostra: "Você começa com X Moedas" + breakdown dos modificadores
- Dinheiro final salvo ao confirmar criação

---

## Extensibilidade

O campo `moedas` e `preco` são agnósticos de sistema. Cada game-system define:
- Como calcular dinheiro inicial (3D&T: 1d6×100, D&D: por classe/background, Lunaria: TBD)
- Nome da moeda (Moeda, Gold Piece, etc.)
- Regras de venda (50% é padrão, pode variar)

A lógica de cálculo de dinheiro inicial fica em `game-systems/{sistema}/characterEngine.js`. O service genérico (`economiaService.js`) delega pra o engine do sistema.
