# Auditoria: Como a LLM Interpreta as Regras

**Data:** 2026-03-17
**Método:** 5 engenheiros de prompt analisando comportamento real de Gemini 2.5 Flash, Llama 3.3 70B, Claude Haiku

---

## VEREDICTO GERAL

**~130 instruções por turno. ~60-65% de compliance efetiva.**

O sistema funciona para as regras estruturais (JSON, segmentos, início de narrativa), mas falha sistematicamente em regras que exigem **raciocínio proativo**, **state tracking**, ou **autocontenção criativa**.

---

## MAPA DE COMPLIANCE — Todas as Regras

### REGRAS QUE FUNCIONAM (>80% compliance)

| Regra | Gemini | Llama | Claude | Por que funciona |
|-------|:------:|:-----:|:------:|-----------------|
| d20=1 sempre erra | 95% | 90% | 95% | Alinhado com treinamento D&D; absoluta; sem condições |
| Produzir JSON (estrutura básica) | 95% | 65% | 90% | Reforço massivo: topo + schema + recency + JSON mode (Gemini) |
| Começar direto na narrativa | 90% | 70% | 90% | Regra #1 + LEMBRE-SE (sandwich pattern) |
| Idioma PT-BR | 95% | 80% | 95% | Default do prompt inteiro |
| Combate: respeitar resultado mecânico como verdade | 85% | 70% | 85% | Dado concreto no contexto imediato |
| fimDeTurno: true no turno final | 85% | 70% | 85% | Instrução enfática + ⚠️ IMPORTANTE |
| Ações simples sem teste | 85% | 75% | 90% | Exemplos concretos; alinhado com senso comum |

### REGRAS PARCIAIS (40-80% compliance)

| Regra | Gemini | Llama | Claude | O que a LLM faz em vez disso |
|-------|:------:|:-----:|:------:|------------------------------|
| Avançar cena com info nova (R2) | 75% | 60% | 80% | Repete descrições de NPCs/ambiente em sessões longas |
| Avançar cena em ação vaga (R3) | 50% | 40% | 70% | **Over-aplica**: qualquer input curto → avanço excessivo. Conflita com "decisões pertencem ao PJ" |
| Seguir roteiro (R4) | 65% | 45% | 70% | Gemini faz railroad; Llama ignora roteiro; Claude inconsistente |
| JSON válido (Llama) | — | 55% | — | 35% parse direto, 35% precisa cleanup, 20% regex, 5% falha |
| Segmentos separados (narração vs fala_npc) | 80% | 55% | 85% | Llama joga tudo em 1 segmento monolítico |
| segmentos[].tipo correto | 85% | 70% | 90% | Llama inventa: "dialogo", "descricao", "acao", "ambiente" |
| solicitaDados sincronizado com narrativa | 75% | 55% | 85% | **Dessincronia 25-35%**: narrativa pede dado mas JSON diz solicita:false |
| Campo metadados preenchido | 80% | 50% | 85% | Llama omite completamente em 50% das respostas |
| Gancho concreto no fim (não pergunta ampla) | 65% | 50% | 70% | Reformula "o que faremos?" para "como desejam prosseguir?" — mesma função |
| Desvantagens: ativar em gatilho óbvio | 50% | 30% | 55% | Só funciona com gatilho EXTREMAMENTE óbvio (claustrofobia em caverna) |
| Habilidades ativas (jogador declara) | 85% | 65% | 85% | Funciona porque é REATIVO; falha na inferência sem nome explícito |
| narracao.emocao dentro do enum | 88% | 55% | 90% | Llama inventa: "medo", "esperança", "raiva", "curiosidade" |
| Calibrar intensidade por HP | 70% | 30% | 65% | Llama não faz aritmética de %; narra pelo "clima" da cena |
| Memória semântica: formato correto | 65% | 35% | 70% | Llama: formato errado ~40%; todos: over-registram fatos triviais |
| Semear pistas de plot twists sutilmente | 60% | 30% | 65% | Llama revela diretamente ou ignora; Gemini faz pistas óbvias demais |
| Templates de narração por tipo de ação (6 tipos) | 70% | 45% | 80% | DEFESA é o pior: narram como "não fez nada"; FUGA(falha) vira fuga parcial |

### REGRAS QUE FALHAM (<40% compliance)

| Regra | Gemini | Llama | Claude | Por que falha |
|-------|:------:|:-----:|:------:|---------------|
| **Vantagens passivas: verificar ANTES de cada teste** | 25% | 10% | 40% | Exige raciocínio proativo que LLMs não fazem. Modelo autoregressivo não faz "pre-check" |
| **`personagem` = RECEBE vs EXECUTA nas ações** | 60% | 40% | 70% | Contra-intuitivo; 5 categorias de direcionalidade; em prosa não em tabela |
| **`stage: "posTeste"` / `dependeDeTeste`** | 20% | 0% | 40% | Conceito de pipeline de processamento, não narrativo |
| **Limite de 2 desvantagens por cena** | 30% | 10% | 35% | State tracking que LLMs não fazem naturalmente |
| **Tracking PJ vs NPC com mesmo nome** | 20% | 10% | 40% | LLMs não têm mecanismo de tracking de entidades |
| **Re-registrar memórias evictadas** | 20% | 10% | 25% | Workflow de 3 passos que compete com tarefa principal (narrar) |
| **Prefira respostas curtas e concretas** | 40% | 35% | 45% | Compete com "narrativa imersiva, mínimo 3 frases, 2+ sentidos" |
| **npcs_presentes: [] para limpar, omitir para preservar** | 50% | 35% | 55% | Semântica sutil demais; modelos invertem o significado |
| **"EXCLUSIVAMENTE baseado no resultado mecânico"** | 60% | 30% | 70% | Contra o gradiente de treinamento; LLMs querem narrar cinematicamente |
| **Foreshadowing sutil (condenser)** | 55% | 30% | 60% | Modelos copiam texto literal do foreshadowing em vez de semear |
| **Roleplay lateral: usar só para colorir, não canonizar** | 40% | 30% | 45% | Distinção "colorir vs canonizar" sutil demais |
| **Aplicar bônus numéricos (+2 percepção) como modificador** | 50% | 20% | 55% | Tratam como flavor text, não como mecânica |
| **AGI vs DEX distinção consistente** | 65% | 25% | 70% | Viés D&D 5e onde DEX = tudo. Regra enterrada na linha 267 |
| **dano_ambiental vs aplicar_dano** | 55% | 20% | 55% | dano_ambiental não existe no vocabulário mental de RPG genérico |

---

## TOP 10 — CONFLITOS DE INSTRUÇÕES IDENTIFICADOS

| # | Conflito | Efeito na LLM |
|---|---------|---------------|
| 1 | **R3 "avance a cena em ação vaga"** vs **"decisões pertencem ao personagem"** | Double-bind: LLM avança demais (Gemini/Llama) ou paralisa (Claude). Nenhum critério de desempate. |
| 2 | **"Narre EXCLUSIVAMENTE baseado no resultado"** vs **instinto criativo do modelo** | LLM adiciona 30-70% de detalhes inventados. Dano 3 vira "golpe devastador". |
| 3 | **R4 "siga progressão do roteiro"** vs **"ADAPTE-SE às ações dos jogadores"** | Gemini faz railroad (60%). Llama ignora roteiro (70%). |
| 4 | **"Prefira respostas curtas"** (turno.js) vs **"mínimo 3 frases, 2+ sentidos"** (schema) | Schema vence por posição de primacy. Respostas ficam 3-5 parágrafos. |
| 5 | **"Comece DIRETO na narrativa"** (R1) vs **"Explique por que ele está ali"** (turno.js) | Compatíveis na prática, mas criam hesitação em Claude. |
| 6 | **"Roteiro como GUIA"** vs **"Roteiro como bússola"** vs **"Siga a progressão"** | 3 intensidades diferentes da mesma regra. LLM não sabe qual seguir. |
| 7 | **Dano DOBRADO em crítico** (linha 284) vs **"Sistema resolve TODA mecânica"** (linha 320) | Quem dobra? O LLM ou o sistema? Ambiguidade gera comportamento inconsistente. |
| 8 | **13 instruções de continuidade** + **12 instruções do GUIA** (mesmo turno) | Redundância dilui atenção. Instruções 8-13 de qualquer bloco: ~35% compliance. |
| 9 | **"Registre fatos INÉDITOS"** vs **ausência de mecanismo de verificação** | LLM não tem como verificar. Re-registra com wording diferente. |
| 10 | **"[] = limpar NPCs"** vs **"omitir = preservar"** | Semântica invertida para a intuição do modelo. Erros em ambas as direções. |

---

## REVISORES — ACURÁCIA REAL ESTIMADA

| Revisor | True Positive | True Negative | False Positive | False Negative | Veredicto |
|---------|:---:|:---:|:---:|:---:|-----------|
| Árbitro Mecânico | 70% | 90% | 5% | 25% | **Útil** — detecta erros mecânicos explícitos |
| Continuista | 35% | 85% | 10% | 55% | **Fraco** — contexto insuficiente (300 chars roteiro) |
| Gancho Narrativo | 60% | 80% | 15% | 25% | **Útil mas perigoso** — reescreve demais quando corrige |

**Continuista é o elo mais fraco:** Com 300 chars de roteiro, as verificações de alucinação, antecipação de roteiro e fato não-sustentado são quase inoperantes.

---

## TOP 15 — RECOMENDAÇÕES POR IMPACTO

### Backend deve resolver (LLM não consegue)

| # | Recomendação | Problema que resolve | Impacto |
|---|-------------|---------------------|---------|
| 1 | **Injetar "Vantagens passivas aplicáveis:" pré-filtradas no bloco de estado do turno** | Passivas ignoradas 60-90% | CRÍTICO |
| 2 | **Separar campo `personagem` em `executor` + `alvo`** (ou resolver no backend) | Inversão executor/alvo 30-60% | CRÍTICO |
| 3 | **Remover `stage`/`dependeDeTeste` do prompt; resolver no backend** | Omitido 60-100% — backend sabe quando tem teste pendente | ALTO |
| 4 | **Injetar "desvantagens_ativadas_cena: 1/2" no bloco de estado** | Limite de 2 ignorado 70-90% | ALTO |
| 5 | **Renomear NPCs com conflito PJ/NPC antes de chegar ao prompt** | Tracking impossível para LLMs | ALTO |
| 6 | **Truncar respostas assistant no histórico** (remover acoes/metadados/solicitaDados) | Economia ~1500 tokens + reduz ruído | ALTO |

### Prompt deve ser reescrito

| # | Recomendação | Problema que resolve | Impacto |
|---|-------------|---------------------|---------|
| 7 | **R3: adicionar "Avance COM ELEMENTOS AMBIENTAIS, nunca decida ações do PJ"** | Conflito R3 vs decisões do jogador | CRÍTICO |
| 8 | **Mover AGI vs DEX para DENTRO da lista de testes: "Esquiva (AGI), Furtividade (DEX)"** | Distinção ignorada por viés D&D 5e | ALTO |
| 9 | **Adicionar "Responda EXCLUSIVAMENTE com JSON" na versão full do schema** (já existe na compacta) | Full permite preamble/posttext | ALTO |
| 10 | **Reduzir bloco de continuidade de 13 para 5-6 instruções essenciais** | Instruções 8-13: ~35% compliance. São ruído. | ALTO |
| 11 | **Substituir prosa de direcionalidade por tabela inline em cada tipo de ação** | Regra abstrata demais em 5 categorias | ALTO |
| 12 | **Consolidar 3 intensidades de "seguir roteiro" em 1 regra com critério claro** | Gemini railroad 60%, Llama ignora 70% | MÉDIO |
| 13 | **Aumentar roteiro truncado no Continuista de 300 para 800 chars** | Continuista quase inoperante para alucinação/spoiler | MÉDIO |
| 14 | **Gancho: instruir "copie texto original, altere apenas últimas 2 frases"** | Reescrita excessiva de 40-60% do texto | MÉDIO |
| 15 | **Repetir regra de resultado mecânico INLINE no bloco de combate a cada rodada** | "EXCLUSIVAMENTE" no system prompt perde força após milhares de tokens | MÉDIO |

---

## TAXA DE JSON PARSE POR MODELO

| Nível | Gemini Flash (JSON mode) | Llama 3.3 70B | Claude Haiku |
|-------|:---:|:---:|:---:|
| Parse direto | 95% | 35% | 85% |
| + Markdown cleanup | 98% | 70% | 95% |
| + Regex extraction | 99% | 90% | 98% |
| + XML fallback | 99% | 95% | 99% |
| **Falha total** | **<1%** | **5%** | **<1%** |

### Malformações NÃO capturadas pelo parser:
- Trailing commas `{...,}` — 3-5% Llama
- Aspas simples `{'key': 'val'}` — 2-3% Llama
- Valores numéricos como string `"importancia": "3"` — 10-15% Llama
- JSON duplicado na resposta — 1% Llama

---

## TOP 10 PATOLOGIAS DE OUTPUT (por frequência)

| # | Patologia | Frequência | Modelos afetados | Impacto |
|---|-----------|:---:|---|---|
| 1 | Dessincronia narrativa↔JSON em solicitaDados | 25-35% | Todos (Llama pior) | ALTO — jogador vê pedido de dado que sistema não processa |
| 2 | Over-registration de memória semântica | 30-40% | Todos | MÉDIO-ALTO — memória fica ruidosa ao longo da campanha |
| 3 | Preâmbulo/pós-texto fora do JSON | 30-40% | Llama | BAIXO (parser captura) mas gasta tokens |
| 4 | Segmento único monolítico | 20-30% | Llama | MÉDIO — perde-se diferenciação narrador/NPC |
| 5 | Inversão executor/alvo em ações | 20-30% | Todos (Llama pior) | ALTO — backend aplica efeito na entidade errada |
| 6 | Metadados omitidos ou vazios | 25-35% | Llama | MÉDIO — degradação silenciosa de contexto |
| 7 | Valores de enum inventados | 40-45% | Llama | BAIXO — frontend pode ignorar |
| 8 | Resultado mecânico "embelezado" | 30-70% | Todos (Llama pior) | ALTO — dano 3 vira "golpe devastador" |
| 9 | npcs_presentes semântica invertida | 15-20% | Todos | MÉDIO — NPCs fantasma ou lista limpa prematura |
| 10 | fimDeTurno prematuro/atrasado | 15-20% | Llama prematuro, Gemini atrasado | MÉDIO — fluxo de jogo afetado |

---

*Relatórios completos dos 5 engenheiros em `/tmp/claude-1000/-opt/.../tasks/`*
*PE1: Core, PE2: Combate, PE3: Schema/JSON, PE4: Turnos, PE5: Revisores*
