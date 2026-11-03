# Spec: Loja do Mestre — Wizard 3D&T

**Data:** 2026-03-23
**Status:** Aprovado
**Versão:** 1.0

---

## 1. Objetivo

Após a criação de personagem 3D&T, abrir modal "Loja do Mestre" onde o jogador gasta suas moedas iniciais comprando itens da tabela `itens_tresdet`.

## 2. Fluxo

1. Wizard 3D&T chega na etapa "Resumo" e jogador confirma criação
2. Personagem é criado no banco (com moedas calculadas por `calcularDinheiroInicial`)
3. Modal "Loja do Mestre" abre automaticamente com:
   - Saldo de moedas do personagem
   - Catálogo de itens `itens_tresdet` agrupados por tipo
   - Carrinho de compras com total
4. Jogador seleciona itens e quantidades
5. Ao confirmar, cada item é comprado via `POST /personagens/:id/comprar`
6. Modal fecha, navega para ficha do personagem

## 3. Backend

### Nova rota: `GET /itens-tresdet`

Controller + rota para listar itens do catálogo 3D&T.

**Controller:** `backend/controllers/itensTresdet/itensTresDetController.js`
```js
async function listarItens(req, res) {
  const itens = await db.ItensTresDet.buscarTodos();
  return res.json({ success: true, data: itens });
}
```

**Rota:** `backend/routes/itensTresdet.js`
```
GET / → listarItens (auth: authMiddleware)
```

**Registrar em `server.js`** ou no router principal.

### Rota existente reutilizada
- `POST /personagens/:id/comprar` — já funciona para `sistema: 'tresdet'` via `processarCompra`

## 4. Frontend

### Componente: `LojaMestreModal`

**Arquivo:** `frontend/src/components/Jogo/LojaMestreModal.jsx`

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `personagemId: number`
- `moedas: number` — saldo inicial

**Comportamento:**
- Ao abrir: `GET /itens-tresdet` para carregar catálogo
- Agrupa itens por tipo (arma, armadura, acessório, consumível, pergaminho)
- Filtro por tipo (tabs ou botões)
- Cada item mostra: nome, tipo, raridade, preço, efeito/descrição
- Botão "+" para adicionar ao carrinho (consumíveis permitem quantidade > 1)
- Carrinho lateral/inferior com total e botão "Confirmar compras"
- Saldo atualiza em tempo real (saldo - total carrinho)
- Bloqueia confirmação se total > saldo
- Ao confirmar: `POST /personagens/:id/comprar` para cada item no carrinho
- Mostra loading durante compras, fecha ao finalizar

### Integração no Wizard

**Arquivo:** Wizard do 3D&T (componente de resumo/finalização)

Após criação bem-sucedida do personagem:
1. Recebe `personagemId` e `moedas` do response
2. Abre `LojaMestreModal` com esses dados
3. Ao fechar o modal (com ou sem compras): navega para ficha

## 5. O que NÃO muda
- Pipeline de criação do personagem 3D&T
- `calcularDinheiroInicial` (já funciona)
- `processarCompra` (já funciona para tresdet)
- Etapa "equipamentos" do WIZARD_STAGES (pode ser removida ou mantida como skip)

## 6. Ordem de implementação
1. Backend: controller + rota `GET /itens-tresdet`
2. Frontend: componente `LojaMestreModal`
3. Frontend: integrar modal no wizard 3D&T pós-criação
