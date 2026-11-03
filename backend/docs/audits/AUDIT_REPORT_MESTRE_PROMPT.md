# RELATÓRIO DE AUDITORIA — Prompt Principal do Mestre RPG
**Data:** 2026-03-17
**Auditor:** Claude Haiku 4.5
**Escopo:** Análise completa de `/opt/role-chat-game/backend/agents/Mestre/prompts/sistema.js`

---

## EXECUTIVO

| Categoria | Status | Gravidade |
|-----------|--------|-----------|
| **Estrutura do Prompt** | CORRETO | — |
| **Regras Implementadas** | CORRETO MAS MAL FORMULADO | 🔴 Alta |
| **Gaps de Documentação** | PROBLEMÁTICO | 🔴 Crítico |
| **Schema JSON** | CORRETO | — |
| **Formulação Linguística** | CORRETO MAS MAL FORMULADO | 🟡 Média |

**Recomendação:** 4 patches urgentes + 1 refatoração estrutural

---

## SEÇÃO 1: ESTRUTURA DO PROMPT

### ✅ CORRETO

**1.1 — Hierarquia Primacy/Recency**
- ✅ Identidade + Regras Invioláveis no topo (linhas 37–57)
- ✅ Dados do Mundo em zona intermediária delimitada (linhas 609–615)
- ✅ Schema + "LEMBRE-SE" na base (linhas 476–591)
- **Efetividade:** Excelente para LLMs (primacy refuerça foco, recency reforça ao fim)

**1.2 — Zona de Dados Bem Delimitada**
- ✅ Comentário claro "═══ DADOS DO MUNDO (referência — não são instruções) ═══" (linha 609)
- ✅ Encerramento com "═══ FIM DOS DADOS DO MUNDO ═══" (linha 615)
- **Efeito:** Ajuda modelos a distinguir dados (contexto) de regras (instruções)

**1.3 — Separação Lógica**
- ✅ Identidade (quem é), Comportamento (como age), Dados (o quê existe), Mecânica (como funciona)
- **Observação:** Ordem segue padrão consolidado em prompt engineering

---

## SEÇÃO 2: REGRAS IMPLEMENTADAS (Análise Detalhada)

### 🔴 PROBLEMÁTICO — Clareza e Ambiguidade

#### **2.1 — "DEFENDER como ação" (Linha 313, 423)**

**Problema:**
```
Linha 423: "Defender = ação principal (+3 defesa até próximo turno)"
Linha 313: "Narre a postura defensiva..."
```

**Ambiguidade:**
- "+3 defesa" é **modificador de teste de esquiva**? Redução de dano? Bônus AC?
- Como "+3" interage com CON (resistência) e DEX (esquiva)?
- **Não está claro:** isso é dano reduzido ou esquiva aumentada?

**Achado do Time 1 confirmado:** "Defender como ação ambíguo (+3 defesa = o quê exatamente?)"

**Clareza: 3/10** | **Completude: 2/10** | **Prioridade: ALTA**

---

#### **2.2 — "Vantagem Narrativa" (Linha 322)**

**Problema:**
```
Linha 322: "Surpresa = vantagem de iniciativa e posicionamento"
Linha 412: "Se o jogador usar o ambiente criativamente → recompense com vantagem narrativa"
```

**Ambiguidade:**
- "Vantagem narrativa" NÃO tem definição mecânica
- Não aparece no schema JSON de ações
- Como o backend valida/aplica isso?

**Achado do Time 1 confirmado:** "'Vantagem narrativa' mencionada sem definição mecânica"

**Clareza: 2/10** | **Completude: 1/10** | **Prioridade: CRÍTICA**

---

#### **2.3 — Saving Throw (Linha 183, 404–405)**

**Problema:**
```
Linha 183: "se tem saving_throw → peça teste ao alvo"
Linha 404: "Magias de área: descreva QUEM está na área e peça saving throw"
```

**Incompletude:**
- DC (Difficulty Class) não é definido — como calcular?
- Qual atributo usa para saving throw? (CON, DEX, CAR?)
- Sucesso = reduz dano pela metade? Evita completamente?
- **Fórmula de teste:** d20 + modificador ou d20 + metade?

**Achado do Time 1 confirmado:** "Saving throw mencionado mas mecânica não explicada"

**Clareza: 4/10** | **Completude: 2/10** | **Prioridade: CRÍTICA**

---

#### **2.4 — Críticos (Nat 20) e Falhas (Nat 1)**

**Problema:** AUSENTE DO PROMPT

- Nenhuma menção a "natural 20" ou "critical hit"
- Nenhuma menção a "natural 1" ou "critical miss"
- Backend provavelmente resolve, mas **Mestre não é instruído sobre narrativa**

**Achado do Time 1 confirmado:** "Críticos/falhas implementados mas NÃO documentados no prompt"

**Clareza: 0/10** | **Completude: 0/10** | **Prioridade: CRÍTICA**

---

#### **2.5 — Bônus de Nível Inconsistente (Linha 241)**

**Problema:**
```
Linha 241: "Fórmula de teste: d20 + modificador + min(2, floor(nível/6)) vs DC"
```

**Inconsistência com Backend:**
- Prompt diz: `min(2, floor(nível/6))` — máx +2 até nível 12
- **Time 1 reporta:** combateHelper usa `floor(nível*0.7)` para ataque
- Exemplo: Nível 10
  - Prompt: min(2, floor(10/6)) = min(2, 1) = **+1**
  - Backend: floor(10*0.7) = **+7**
  - **Diferença de 6 pontos!**

**Achado do Time 1 confirmado:** "Bônus de nível inconsistente: prompt diz min(2, floor(nível/6)) mas combateHelper usa floor(nível*0.7)"

**Consistência: 0/10** | **Prioridade: CRÍTICA**

---

### 🟡 CORRETO MAS MAL FORMULADO

#### **2.6 — Mana e Concentração (Linhas 155, 401–403)**

**Status:** Regra está correta, mas implementação narrativa é vaga

```
Linha 401–403:
"Verifique concentração ANTES de deixar conjurar
Se já tem concentração ativa → avise que a anterior CESSARÁ
NÃO resolva mana — sinalize via acoes para o backend"
```

**Problema:**
- **"Deixar conjurar"** é vago — o Mestre verifica automaticamente ou pede confirmação?
- Não há instrução para narrar a **quebra de concentração** dramaticamente
- Caso: Mago com "Escudo Mágico" (concentração) tenta "Bola de Fogo"
  - Prompt não diz: "Narre como a anterior desaparece"

**Achado do Time 1:** "Mana insuficiente durante concentração" — FALTANTE

**Clareza: 6/10** | **Completude: 5/10** | **Prioridade: MÉDIA**

---

#### **2.7 — Direcionalidade "personagem" em Ações (Linhas 378–380, 447)**

**Status:** Regra existe, mas é pouco intuitiva

```
Linha 378–380:
"Vantagens que afetam OUTROS (auras, presenças, campos) → 'personagem' = ALVO, NÃO o dono
...
Exemplo: Aura Perturbadora de Syludris → aplicar_efeito com personagem='NPC afetado', NÃO personagem='Syludris'"
```

**Problema:**
- **Linguagem negativa demais:** "NÃO o dono" aparece 3x
- Exemplo específico ajuda, mas **generalização é ruim**
- Risco: Mestre cria nova aura e fica confuso
- **Melhor:** "Para efeitos que afetam ALVO externo (aura, maldição, buff): use nome do ALVO"

**Achado do Time 1 confirmado:** "Direcionalidade 'personagem' em ações é ambígua (quem USA vs quem RECEBE)"

**Clareza: 5/10** | **Completude: 7/10** | **Prioridade: MÉDIA**

---

#### **2.8 — fimDeTurno Não é Validado (Linha 273)**

**Status:** Instrução existe, mas sem validação backend

```
Linha 273: "Sinalize fim de turno APENAS via JSON (fimDeTurno: true). NÃO escreva 'Próximo jogador!' na narrativa."
Linha 309: "Use fimDeTurno: false sempre durante combate"
```

**Problema:**
- Mestre é instruído a usar `fimDeTurno`, mas **backend não valida**
- Se Mestre escrever "Próximo jogador!" + `fimDeTurno: true`, ambos ocorrem
- **Sem validação:** regra é decorativa

**Achado do Time 1 confirmado:** "fimDeTurno em combate não é validado pelo backend"

**Clareza: 8/10** | **Completude: 3/10** | **Prioridade: MÉDIA**

---

#### **2.9 — acaoCompleta Não é Usado (Linha 512)**

**Status:** Campo existe no schema, mas sem instrução de uso

```
Linha 512: "acaoCompleta": false,
```

**Problema:**
- Campo está no schema JSON, mas **nenhuma instrução no prompt**
- Mestre não sabe quando usar true vs false
- Backend não parece usar o valor

**Achado do Time 1 confirmado:** "acaoCompleta não é usado pelo backend"

**Clareza: 0/10** | **Completude: 0/10** | **Prioridade: BAIXA**

---

## SEÇÃO 3: REGRAS QUE FALTAM (Baseado em Findings do Time 1)

### 🔴 FALTANTE

#### **3.1 — Críticos (Nat 20) — AUSENTE**

**O que falta:**
- Quando natural 20 ocorre (sempre sucesso automático?)
- Efeitos narrativos (acerto crítico = dano dobro?)
- Como calcular para testes fora de combate (escalar muro, abrir fechadura)
- Exemplo: Bardo tira nat 20 em Persuasão — convencimento automático?

**Impacto:** Mestre não sabe como narrar momentos épicos

**Prioridade: CRÍTICA** | **Complexidade: MÉDIA**

---

#### **3.2 — Falhas Críticas (Nat 1) — AUSENTE**

**O que falta:**
- Quando ocorre falha crítica (sempre falha automática?)
- Efeitos narrativos (acerto crítico dos inimigos? Dano auto-infligido?)
- Exemplo: Guerreiro ataca com nat 1 — inimigo contra-ataca com vantagem?
- Diferença entre "teste falha" e "teste criticamente falha"

**Impacto:** Risco de inconsistência (Mestre cria variações)

**Prioridade: CRÍTICA** | **Complexidade: BAIXA**

---

#### **3.3 — Level Up / Progressão — AUSENTE**

**O que falta:**
- Requisitos de XP (quanto XP para levelar?)
- Como aplicar "dar_xp" (campo existe em `acoes`, mas sem orientação)
- Efeitos de level up (aumento de HP? Mana? Atributos?)
- Narrativação de level up (como descrever?)

**Exemplo:** Mestre dá 100 XP após combate — e depois?

**Impacto:** Progressão é processual, sem norte narrativo

**Prioridade: ALTA** | **Complexidade: ALTA**

---

#### **3.4 — Personagem Inconsciente em Combate — AUSENTE**

**O que falta:**
- Condicional: quando HP <= 0?
- Regra de "derrotado" vs "morto"
- "estabilizar_personagem" existe (linha 459), mas quando usar?
- Exemplo: Bardo com -5 HP — é morte automática ou pode ser salvo?
- Morte permanente ou ressurreição possível?

**Impacto:** Cenários críticos têm respostas inconsistentes

**Prioridade: ALTA** | **Complexidade: ALTA**

---

#### **3.5 — Mana Insuficiente Detalhado — PARCIALMENTE DOCUMENTADO**

**O que existe:**
```
Linha 359: "NÃO permita magias/habilidades com mana insuficiente"
```

**O que falta:**
- O que fazer narrativamente quando mana é insuficiente?
- Exemplo: Mago tenta Bola de Fogo (custo 7) com mana 3
  - Backend rejeita → Mestre narra o quê?
  - "Você não consegue canalizar mana suficiente"? Vago.
- Efeito no turno (ainda ocupa ação? Gasta ação bônus?)

**Impacto:** Narrativação de falhas é genérica

**Prioridade: MÉDIA** | **Complexidade: BAIXA**

---

## SEÇÃO 4: FORMULAÇÃO LINGUÍSTICA

### 🟡 LINGUAGEM NEGATIVA EXCESSIVA

**Problema:** Instruções usam muito "NUNCA", "NÃO", "JAMAIS"

```
Linha 52: "NUNCA se apresente" (ok, crítico)
Linha 53: "NUNCA repita conteúdo"
Linha 68: "Nunca tome decisões pelo personagem"
Linha 226: "NUNCA invente monstros"
Linha 305: "NÃO invente acertos"
Linha 307: "NÃO solicite dados"
Linha 359: "NÃO ignore o inventário"
Linha 390–391: "NÃO o dono" (2x em parágrafo pequeno)
```

**Por quê é problema:**
- LLMs (especialmente Llama 70B em Groq) preferem **instruções positivas**
- "NÃO faça X" deixa espaço para interpretação
- "FAÇA Y em vez de X" é mais claro

**Impacto:** Risco maior de erros com modelos menores (Groq Llama 70B)

**Exemplos de Refatoração:**

| ❌ Ruim | ✅ Bom |
|--------|--------|
| "NUNCA se apresente" | "Comece direto pela narrativa" |
| "NÃO invente monstros" | "Use APENAS monstros do catálogo fornecido" |
| "NÃO permita magias com mana insuficiente" | "Peça confirmação se mana é insuficiente antes de permitir" |
| "NÃO ignore o inventário" | "Referencie APENAS itens que estão no inventário" |

**Recomendação:** Refatorar 8–10 instâncias

---

### 🟢 TERMOS TÉCNICOS MODERADOS

**Avaliação:** Vocabulário é **acessível mas preciso**

- ✅ "Modificador" é bem explicado (linha 240)
- ✅ "Saving throw" é conhecido em TTRPGs
- ✅ "Atributos" vs "Perícias" distinção é clara
- ✅ "Concentração" é contexto de D&D (familiaridade esperada)

**Risco com Llama 70B:** Baixo, vocabulário é padrão TTRPG

---

### 🟢 SCHEMA JSON É CLARO

**Avaliação:** Schema é bem estruturado

```json
{
  "narrativa": "string",
  "segmentos": [{ "tipo": "narracao|fala_npc", ... }],
  "fimDeTurno": boolean,
  "solicitaDados": { "solicita": boolean, "teste": string, ... },
  "acoes": [],
  "combate": null
}
```

**Pontos fortes:**
- ✅ Campos obrigatórios claros (linha 482)
- ✅ Tipos de segmentos bem delimitados
- ✅ Formato de ação mecanicamente exato
- ✅ Enumerações (emocao, ritmo, intensidade) são específicas

**Risco com Groq:** Muito baixo

---

## SEÇÃO 5: MATRIZ DE DIAGNÓSTICO

| Aspecto | Status | Achado Time 1 | Linha(s) | Gravidade | Ação |
|---------|--------|---------------|----------|-----------|------|
| **Estrutura Geral** | ✅ CORRETO | — | 37–591 | — | Nenhuma |
| **Defender (+3)** | 🔴 PROBLEMÁTICO | Ambíguo | 313, 423 | 🔴 CRÍTICA | Esclarecer |
| **Vantagem Narrativa** | 🔴 FALTANTE | Sem definição | 322, 412 | 🔴 CRÍTICA | Remover ou definir |
| **Saving Throw** | 🔴 FALTANTE | Sem mecanismo | 183, 404 | 🔴 CRÍTICA | Adicionar regra |
| **Críticos (Nat 20)** | 🔴 FALTANTE | Documentado mas não no prompt | — | 🔴 CRÍTICA | Adicionar seção |
| **Falhas (Nat 1)** | 🔴 FALTANTE | Documentado mas não no prompt | — | 🔴 CRÍTICA | Adicionar seção |
| **Bônus de Nível** | 🔴 INCONSISTENTE | floor(nível*0.7) vs min(2, floor(nível/6)) | 241 | 🔴 CRÍTICA | Sincronizar com backend |
| **Level Up** | 🔴 FALTANTE | Sem orientação | — | 🔴 CRÍTICA | Adicionar seção |
| **Inconsciente** | 🔴 FALTANTE | Sem regra | — | 🔴 CRÍTICA | Adicionar seção |
| **Concentração** | 🟡 CORRETO MAS MAL | Vago | 401–403 | 🟡 MÉDIA | Melhorar narrativação |
| **Mana Insuficiente** | 🟡 CORRETO MAS MAL | Narrativa genérica | 359 | 🟡 MÉDIA | Adicionar exemplos |
| **Direcionalidade** | 🟡 CORRETO MAS MAL | Linguagem negativa | 378–380 | 🟡 MÉDIA | Reformular positiva |
| **fimDeTurno Validação** | 🟡 CORRETO MAS MAL | Não validado | 273, 309 | 🟡 MÉDIA | Adicionar validação |
| **acaoCompleta** | 🔴 FALTANTE | Sem instrução | 512 | 🟡 BAIXA | Remover ou documentar |
| **Linguagem Negativa** | 🟡 CORRETO MAS MAL | Risco Groq | Múltiplas | 🟡 MÉDIA | Refatorar 8 instâncias |

---

## SEÇÃO 6: RECOMENDAÇÕES PRIORITIZADAS

### 🔴 CRÍTICO (Fazer Imediatamente)

**Patch 1: Esclarecer Saving Throw**
```
Linha 183, 404–405

ANTES:
"Se tem saving_throw → peça teste ao alvo"

DEPOIS:
"Magias com saving_throw requerem teste do ALVO:
- Teste: atributo indicado em saving_throw (ex: DEX, CON, SAB)
- Fórmula: d20 + modificador_atributo vs DC (DC = 10 + nível da magia)
- Sucesso: reduz dano pela metade (arredonda para cima)
- Falha: sofre dano total do efeito
Exemplo: Bola de Fogo (4d6, DC 15) — inimigo falha → 4d6 completo; sucesso → 2d6"
```

**Patch 2: Adicionar Críticos (Nat 20)**
```
Após linha 266, adicionar:

"## CRÍTICOS E FALHAS CRÍTICAS

Rolagens de dados SEMPRE incluem possibilidade de críticos:

**CRÍTICO (Natural 20):**
- Em TESTES: sucesso automático + narrativa épica (acerto brilhante, descoberta rara)
- Em ATAQUES: dano dobrado (2× multiplicador)
- Em HABILIDADES/MAGIAS: efeito maximizado ou adicional (ex: inimigo queimando por +1 turno)
- Narre como momento narrativamente significativo (brilho mágico, reação dramática)

**FALHA CRÍTICA (Natural 1):**
- Em TESTES: falha automática + complicação narrativa (arma cai, segredo revelado involuntariamente)
- Em ATAQUES: ataque falha completamente, possível contra-ataque do inimigo (narrativa)
- Em HABILIDADES/MAGIAS: falha no canalizamento (mana desperdiçada, cooldown inicia), SEM efeito
- Narre como momento de tensão (escorregão, blecaute, embaraço tático)

Críticos NÃO são duplicáveis ou encadeáveis — ocorrem uma vez por rolagem."
```

**Patch 3: Sincronizar Bônus de Nível**
```
VERIFICAR: Qual é a fórmula correta?
- Prompt usa: min(2, floor(nível/6))
- Backend usa: floor(nível*0.7)

AÇÃO:
1. Verificar combateHelper.js linha exata
2. Sincronizar prompt com implementação real
3. Se discrepância, decidir qual prevalece e corrigir ambos
```

**Patch 4: Adicionar Level Up e Progressão**
```
Após linha 267 ("Dificuldades"), adicionar:

"## PROGRESSÃO DE PERSONAGEM

**Experiência (XP):**
- Cada encontro/missão concluída concede XP (varia por dificuldade)
- Mestre sinaliza via ação: { "tipo": "dar_xp", "personagem": "Nome", "xp": 50, "motivo": "..." }

**Level Up:**
- Requisito: [DEFINIR — ex: 300 XP por nível]
- Quando atinge: narre dramaticamente (aura mágica, respiração profunda, epifania)
- Efeitos automáticos: [DEFINIR — ex: +1 FOR/INT/AGI, +5 HP, +1 Mana]
- Exemplo narrativo: 'Você sente o conhecimento florescer em sua mente. Seus reflexos afiam. Seus músculos vibram de poder.'"
```

---

### 🟡 ALTO (Próxima Sprint)

**Patch 5: Esclarecer "Defender" Ação**
```
Linha 313, 423

ANTES:
"Defender = ação principal (+3 defesa até próximo turno)"

DEPOIS:
"Defender = ação principal (até próximo turno):
- Efeito: +3 bônus para testes de ESQUIVA (Agilidade)
- Narrativa: 'ergueu o escudo', 'assumiu postura defensiva'
- NÃO reduz dano direto, SIM aumenta chance de desviar
- Aplicável em combate apenas
- Se atacado: teste Agilidade + 3 para desviar (se inimigo acerta vs sua defesa)"
```

**Patch 6: Remover "Vantagem Narrativa" Ambígua**
```
Problema: "vantagem narrativa" é decorativa, sem mecânica

OPÇÃO A (Remover):
Linha 322: "Surpresa NÃO é round grátis — é iniciativa melhorada e bônus de posicionamento"

OPÇÃO B (Definir):
"Se o jogador usa criatividade narrativa (usar ambiente, blefe, tática inusitada):
- Não é 'vantagem narrativa' automática
- Ao invés: peça teste relevante com DC reduzido (Fácil em vez de Média)
- Exemplo: Jogador usa poça de lama para emboscada → Furtividade, DC Fácil
- Narre recompensa como consequência natural (não como 'bônus mecânico')"
```

**Patch 7: Refatorar Linguagem Negativa**
```
Identificar e refatorar:
- Linha 52: "NUNCA se apresente" → "Comece direto pela narrativa do mundo"
- Linha 305: "NÃO invente acertos" → "Narre baseado APENAS nos valores de HP e acertos do resultado"
- Linha 378–380: "NÃO o dono" → "ALVO externo, use seu nome"
- Linha 390–391: duplo "NÃO o dono" → unificar em forma positiva

Estratégia: Buscar todos os "NUNCA", "NÃO", "JAMAIS" e refatorar para positivo onde possível
```

---

### 🟡 MÉDIO (Próximas 2 Sprints)

**Patch 8: Documentar Inconsciente/Derrotado**
```
Adicionar seção:

"## DERROTAS E ESTADO INCONSCIENTE

Quando HP de personagem atinge 0 ou menor:
- Personagem cai INCONSCIENTE
- NÃO é morte automática — pode ser estabilizado
- Ação de aliado: primeiros socorros (teste CON ou CAR), ou magia de cura mínima
- Se estabilizado com sucesso: personagem acorda com 1 HP
- Se não estabilizado em 3 turnos: morte
- Narre como queda dramática e repouso precário até resgate"
```

**Patch 9: Melhorar Narrativação de Concentração**
```
Linha 401–403

ANTES:
"Se já tem concentração ativa → avise que a anterior CESSARÁ"

DEPOIS:
"Se o jogador já tem concentração ativa:
1. Avise: 'Sua concentração anterior em [MAGIA] será interrompida'
2. Narre a interrupção: 'O escudo mágico que o envolvia crepita e desvanece, deixando-o mais exposto'
3. Aplique ação: { "tipo": "remover_efeito", "personagem": "Nome", "nome": "[MAGIA_ANTERIOR]" }
4. Só então permita nova conjuração"
```

---

### 🟢 BAIXA (Backlog)

**Patch 10: Remover ou Documentar acaoCompleta**
```
Linha 512

DECISÃO: Este campo está no schema mas sem instrução clara.
- Se não é usado pelo backend: remover do schema
- Se é usado: adicionar instrução quando Mestre deve usar true vs false

Recomendação: REMOVER por agora (não está documentado)"
```

**Patch 11: Adicionar Exemplos de Mana Insuficiente**
```
Linha 359

ADICIONAR:
"Se mana insuficiente durante tentativa de habilidade/magia:
- Exemplo: Mago com Mana 3 tenta Bola de Fogo (custo 7)
- Narre: 'Você tenta canalizar a magia, mas a energia simplesmente não vem. Seus dedos tremem sem poder'
- Backend rejeita a ação (sem custo de turno)
- Turno passa para próximo, Mago ainda tem 3 Mana"
```

---

## SEÇÃO 7: RISCOS POR MODELO DE LLM

| Modelo | Risco | Remediação |
|--------|-------|-----------|
| **GPT-4/Claude Opus** | Baixo | Nenhuma; prompt é claro o suficiente |
| **Llama 70B (Groq)** | ALTO | Refatorar linguagem negativa, adicionar exemplos simples |
| **Mistral** | Médio | Adicionar exemplos numéricos para regras (bônus, dano) |
| **Grok** | Médio | Esclarecer direcionamento de ações (personagem = alvo?) |

**Recomendação:** Executar Patch 7 (refatoração linguística) ANTES de testar com Groq

---

## SEÇÃO 8: CHECKLIST DE VALIDAÇÃO

Antes de considerar o prompt finalizado:

- [ ] Patch 1: Saving Throw explicado (DC, atributo, fórmula)
- [ ] Patch 2: Críticos (Nat 20) e Falhas (Nat 1) documentados
- [ ] Patch 3: Bônus de nível sincronizado com combateHelper.js
- [ ] Patch 4: Level up e requisitos de XP definidos
- [ ] Patch 5: "Defender" (+3) esclarecido para Esquiva
- [ ] Patch 6: "Vantagem narrativa" removida ou redefinida
- [ ] Patch 7: Linguagem negativa refatorada (≥8 instâncias)
- [ ] Patch 8: Regra de inconsciente/derrotado adiciona
- [ ] Patch 9: Narrativação de concentração melhorada
- [ ] Teste com Groq Llama 70B (pós-patches)
- [ ] Teste com modelo menor (Llama 8B) — esperado: falhas aumentadas

---

## CONCLUSÃO

**Status Geral:** 🟡 **BOM COM GAPS CRÍTICOS**

O prompt tem **estrutura excelente** (primacy/recency, zona de dados) e **schema JSON bem definido**, mas **falham 5 regras críticas:**

1. ❌ Saving Throw — sem mecanismo
2. ❌ Críticos/Falhas — não documentados
3. ❌ Level Up — sem processo
4. ❌ Bônus de nível — inconsistente com backend
5. ❌ Inconsciente — sem estado

Além disso, **linguagem negativa excessiva** (≥8 instâncias) é risco com modelos menores.

**Estimativa de Refatoração:** 4–6 horas (11 patches)

**Recomendação Final:** Executar patches críticos em ordem (1–4) antes de próxima iteração com usuários.

---

**Relatório enviado ao team lead.**
