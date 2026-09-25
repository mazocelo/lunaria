# Auditoria: Salvamento de Atributos com Bonus de Raca/Classe

## Contexto
O frontend envia `atributosBase` (60 pontos distribuidos). O backend deve somar bonus de raca/classe antes de gravar no DB. O gameplay (combate, HP, mana, esquiva) le `personagem.forca`, etc. direto do DB, entao o valor salvo DEVE incluir os bonus.

## Status Atual (verificar)
- O controller `personagemController.js` ja tem codigo nas linhas ~301-319 que soma bonus via `parsearBonusEntidade()`
- Confirmar se `parsearBonusEntidade` existe e funciona corretamente

---

## Roteiro de Auditoria

### 1. Verificar `parsearBonusEntidade`

**Arquivo**: `Backend/controllers/personagem/personagemController.js` (ou helper importado)

- [ ] Funcao existe e esta importada corretamente
- [ ] Parseia bonus JSON string (ex: `'{"forca":"+2","constituicao":"+1"}'`)
- [ ] Retorna objeto com as 6 chaves zeradas por default: `{ forca:0, destreza:0, constituicao:0, inteligencia:0, agilidade:0, carisma:0 }`
- [ ] Trata formatos variados do bonus:
  - `{ "forca": "+2" }` (string com sinal)
  - `{ "forca": 2 }` (numero direto)
  - `{ "forca": "-1" }` (penalidade)
  - `null` / `undefined` / string vazia (retorna zeros)
  - Bonus com campos nao-atributo (ex: `vantagens`, `desvantagens`) sao ignorados
- [ ] Nao quebra com JSON malformado

### 2. Verificar aplicacao no controller

**Arquivo**: `Backend/controllers/personagem/personagemController.js` (~linhas 296-320)

- [ ] `racaBonusRaw` e `classeBonusRaw` sao populados corretamente (linhas ~236, 245)
- [ ] `parsearBonusEntidade` e chamado para ambos (raca E classe)
- [ ] Soma e aplicada nos 6 atributos antes do `create`:
  ```
  forca: (forca || 10) + bonusAttrRaca.forca + bonusAttrClasse.forca
  ```
- [ ] Nao ha cap/clamp que limite o resultado (ex: max 20?)
- [ ] Validacao `validarAtributosCriacao` roda ANTES da soma de bonus (valida os 60 pontos base)

### 3. Verificar `criacaoPersonagemHelper.js`

**Arquivo**: `Backend/helpers/criacaoPersonagemHelper.js`

- [ ] Validacao verifica soma = 60 nos valores BASE (sem bonus)
- [ ] Range por atributo: 5-16 (base, sem bonus)
- [ ] Nao interfere nos valores finais apos bonus

### 4. Verificar frontend envia valores corretos

**Arquivo**: `Frontend/src/Pages/Personagem/Wizard/wizard.model.js` (~linha 757)

- [ ] Envia `s.atributosBase` (NAO `atributosFinal`) — correto, pois backend aplica bonus
- [ ] Os 6 campos sao enviados como valores numericos inteiros
- [ ] `raca_id` e `classe_id` sao enviados (necessarios para o backend buscar o bonus)

### 5. Verificar consumidores dos atributos no gameplay

**Arquivo**: `Backend/helpers/combateHelper.js`

- [ ] `calcularHP()` (linha ~186): usa `personagem.constituicao` — OK se DB tem valor com bonus
- [ ] `calcularMana()` (linha ~197): usa `personagem.inteligencia` — idem
- [ ] `calcularEsquiva()` (linha ~247): usa `personagem.agilidade` e `personagem.destreza` — idem

**Arquivo**: `Backend/helpers/testeHelper.js`

- [ ] Testes de habilidade usam atributos do personagem — verificar se le do DB

**Arquivo**: `Backend/Model/PersonagemSessao.js` (linha ~70)

- [ ] `getEstadoInicial` monta estado com `personagem.forca`, etc. — valores do DB

### 6. Verificar ficha do personagem (frontend)

**Arquivo**: `Frontend/src/Pages/Personagem/Ver/personagem-ver.view.jsx`

- [ ] Secao de atributos exibe valores do DB (ja com bonus incluido)
- [ ] Secao "Raca & Classe" mostra bonus separadamente via `formatBonus()` — informativo
- [ ] Nao ha "dupla contagem" (exibir valor com bonus + bonus separado somados)

### 7. Verificar edicao de personagem (se existir)

- [ ] Se existe rota de edicao de atributos, ela tambem aplica bonus?
- [ ] Ou a edicao so permite mudar campos nao-atributo?
- [ ] Ao trocar raca/classe, os bonus antigos sao removidos e novos aplicados?

---

## Teste Pratico

### Teste 1: Criar personagem com raca que tem bonus
1. Criar personagem com Anao (bonus: `+2 constituicao`)
2. Distribuir: forca=10, destreza=10, constituicao=10, inteligencia=10, agilidade=10, carisma=10
3. **Esperado no DB**: `constituicao = 12` (10 + 2)
4. Verificar: `SELECT forca, destreza, constituicao, inteligencia, agilidade, carisma FROM personagens WHERE id = <ID>`

### Teste 2: Verificar HP calculado
1. Com o personagem do Teste 1 (constituicao=12, nivel=1)
2. `modConstituicao = floor((12-10)/2) = 1`
3. `HP = max(1, 10 + (1*2) + (1*1)) = 13`
4. Verificar se o HP exibido no jogo e 13

### Teste 3: Classe com bonus
1. Criar personagem com classe que tem bonus de atributo
2. Verificar se bonus de classe tambem e somado
3. Verificar se bonus de raca + classe acumulam corretamente

### Teste 4: Raca/classe sem bonus de atributo
1. Criar personagem com raca/classe que NAO tem bonus de atributo
2. Verificar que atributos salvos = valores base distribuidos
3. `parsearBonusEntidade` retorna zeros sem erro

### Teste 5: Personagens existentes
1. Consultar personagens ja criados antes do fix
2. Se foram criados SEM bonus aplicado, seus atributos estao incorretos
3. **Necessario script de migracao?** Recalcular atributos de personagens existentes

---

## Query de Auditoria (SQL)

```sql
-- Verificar personagens com raca/classe que tem bonus de atributo
-- e comparar valores salvos com o esperado
SELECT
  p.id, p.nome, p.nivel,
  p.forca, p.destreza, p.constituicao,
  p.inteligencia, p.agilidade, p.carisma,
  p.forca + p.destreza + p.constituicao + p.inteligencia + p.agilidade + p.carisma AS soma_total,
  r.nome AS raca, r.bonus AS raca_bonus,
  c.nome AS classe, c.bonus AS classe_bonus
FROM personagens p
LEFT JOIN racas r ON r.id = p.raca_id
LEFT JOIN classes c ON c.id = p.classe_id
WHERE p.deleted_at IS NULL
ORDER BY p.id DESC
LIMIT 20;
```

Se `soma_total = 60` para personagens com bonus de raca/classe, os bonus NAO foram aplicados.
Se `soma_total > 60`, os bonus FORAM aplicados corretamente.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| `parsearBonusEntidade` nao existe ainda | Outra sessao vai criar — verificar implementacao |
| Personagens antigos com atributos incorretos | Script de migracao para recalcular |
| Dupla aplicacao (frontend + backend) | Frontend DEVE enviar `atributosBase`, NAO `atributosFinal` |
| Bonus negativo (penalidade racial) | Atributo pode ficar < 5 apos bonus — decidir se permitir |
| JSON bonus malformado no DB | `parsearBonusEntidade` deve ter try/catch com fallback para zeros |
