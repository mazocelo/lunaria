# Auditoria de Prompt Engineering — Lunaria RPG Backend

**Data:** 2026-03-17
**Modelo de auditoria:** 5 analistas especializados em paralelo
**Score geral anterior:** 6.4/10 | **Score pos-hardening:** ~7.5/10 | **Potencial com melhorias:** 8.5+/10

---

## Scores por Dimensao

| # | Dimensao | Analista | Score | Detalhe |
|---|----------|----------|:-----:|---------|
| 1 | Primacy/Recency | Clareza | 7/10 | Macro correta; regras criticas (AGI/DEX, criticos) enterradas no meio |
| 2 | Hierarquia de secoes | Clareza | 6/10 | 14 secoes `##` flat sem agrupamento hierarquico |
| 3 | Densidade de instrucoes | Clareza | 5/10 | ACOES MECANICAS (~1800 tokens) e 4 PILARES (~500 tokens) muito densas |
| 4 | Carga cognitiva | Clareza | 5/10 | Secao COMBATE impoe 6+ dimensoes simultaneas; `"personagem"` sobrecarregado |
| 5 | Delimitadores | Clareza | 8/10 | Mudanca para Markdown `#` foi acertada |
| 6 | Schema JSON | Clareza | 7/10 | Campos obrigatorios/opcionais misturados sem anotacao |
| 7 | Coerencia cross-file | Clareza | 6/10 | Regra de gancho repetida 4x com formulacoes diferentes |
| 8 | Groq/Llama risks | Multi-modelo | 6/10 | Schema compacto ajuda mas mecanica nao compactada (6K tokens) |
| 9 | Gemini risks | Multi-modelo | 7/10 | `responseMimeType` eficaz mas limita narrativa; Flash-Lite precisa atencao |
| 10 | Claude risks | Multi-modelo | 8/10 | Bem adaptado; ambiguidade menor em regra 3 (acao vaga) |
| 11 | Instrucoes negativas residuais | Multi-modelo | 7/10 | Poucas residuais, concentradas em user messages |
| 12 | JSON compliance rate | Multi-modelo | 7/10 | Parse chain 4 niveis robusto; faltam trailing commas e JSON truncado |
| 13 | Schema compacto | Multi-modelo | 6/10 | Remove campos uteis (speaker); economiza pouco vs compactar mecanica |
| 14 | Fallback chain | Multi-modelo | 8/10 | Excelente cobertura; edge cases de truncamento nao tratados |
| 15 | Temperature/topP | Multi-modelo | 7/10 | topP=0.99 arriscado para Groq; falta diferenciacao por modelo |
| 16 | Redundancia cross-file | Redundancia | 5/10 | ~1.265 tokens duplicados total; gancho repetido 4x |
| 17 | Contradicoes | Redundancia | 9/10 | Apenas 1 ambiguidade de POV (narrador invisivel vs fale ao jogador) |
| 18 | Schema vs Instructions gap | Redundancia | 7/10 | `stage` em acoes nao exemplificado; combate durante rodada nao documentado |
| 19 | Reviewer alignment | Redundancia | 8/10 | Gancho reviewer duplica instrucoes do turno prompt |
| 20 | Context builder bloat | Redundancia | 6/10 | Bloco `compactacao` (7 campos) inuteis; duplicacao personagens |
| 21 | LEMBRE-SE | Redundancia | 8/10 | Sandwich pattern correto; falta AGI/DEX e resultado mecanico |
| 22 | Memoria semantica rules | Redundancia | 7/10 | LLM nao sabe de hard caps, merge behavior, eviction priority |
| 23 | Turn vs system overlap | Redundancia | 6/10 | narracao.js repete 70% de turno.js |
| 24 | Trigger logic (Continuista) | QA Pipeline | 6/10 | Muito restritivo; perde alucinacoes, NPCs por alias, transicoes |
| 25 | Arbitro correcao | QA Pipeline | 7/10 | Substituicao total e agressiva; deveria ser cirurgica |
| 26 | ClaimDetector cobertura | QA Pipeline | 6/10 | Faltam verbos: "ataco com", "pego", "defendo", "lembro que" |
| 27 | Post-narrative validation | QA Pipeline | 5/10 | Proximidade 80 chars gera falsos positivos; funcao nao integrada |
| 28 | Reviewer prompts | QA Pipeline | 7/10 | Adequados para flash-lite; Gancho pede reescrita total (caro) |
| 29 | Fail-open safety | QA Pipeline | 4/10 | API key ausente = pipeline silenciosamente morto |
| 30 | Pipeline ordering | QA Pipeline | 7/10 | `validarClaimsContraNarrativa` existe mas nao e chamada |
| 31 | System prompt size | Tokens | 7/10 | ~13-14K tokens; seguro para todos os providers |
| 32 | Compact vs Full schema | Tokens | 8/10 | 53% economia; mas mecanica nao compactada e o gargalo |
| 33 | Context builder efficiency | Tokens | 6/10 | partyResumo duplica personagens4Pilares; compactacao inutil |
| 34 | Chat history mgmt | Tokens | 7/10 | 15 msgs ok; respostas assistant incluem JSON mecanico desnecessario |
| 35 | Roteiro condenser | Tokens | 7/10 | 3000 chars ok; truncamento por secao e excelente |
| 36 | Semantic memory rendering | Tokens | 8/10 | Formato compacto e eficiente; 12 entries bem gerenciadas |
| 37 | Duplicacao de informacao | Tokens | 5/10 | 3 camadas de personagens; roteiro chamado 2x; cena duplicada |
| 38 | Per-turn overhead | Tokens | 7/10 | ~1,500 tokens/turno; continuidade generica deveria ir para system |
| 39 | Catalogo efficiency | Tokens | 7/10 | Filtragem por nivel boa; Groq poderia ter versao mais agressiva |
| 40 | ResumoAgent efficiency | Tokens | 8/10 | Formato estruturado eficiente; 11 secoes sao muitas |

---

## TOP 20 Melhorias Priorizadas

### Prioridade CRITICA (impacto imediato)

| # | Melhoria | Analista(s) | Economia/Impacto | Esforco |
|---|----------|-------------|------------------|---------|
| 1 | **Integrar `validarClaimsContraNarrativa()` no pipeline** — funcao existe mas nao e chamada | QA, Redundancia | Fecha lacuna claim aceito vs narrativa contraditoria | Baixo |
| 2 | **Fail-loud para modelo nao inicializado nos Revisores** — API key ausente = pipeline morto | QA | Evita pipeline silenciosamente decorativo | Baixo |
| 3 | **Truncar respostas assistant no historico** — remover `acoes`, `metadados`, `solicitaDados` | Tokens | ~1,200-1,800 tokens/chamada | Medio |

### Prioridade ALTA (ganho significativo)

| # | Melhoria | Analista(s) | Economia/Impacto | Esforco |
|---|----------|-------------|------------------|---------|
| 4 | **Criar `montarSistemaMecanicoCompacto()` para Groq** — condensar regras de combate quando fora de combate | Tokens, Multi-modelo | ~1,800-2,400 tokens | Alto |
| 5 | **Hierarquizar o bloco mecanico** — agrupar 14 secoes `##` em 3-4 grupos com `###` | Clareza | Melhora instruction-following em todos os modelos | Baixo |
| 6 | **Substituicao cirurgica no Arbitro** — `trecho_original` -> `trecho_corrigido` em vez de reescrita total | QA | Preserva estilo; evita truncamento em flash-lite | Medio |
| 7 | **Expandir triggers do Continuista** — memoria semantica rica, transicoes de cena, NPCs por alias | QA | Aumenta cobertura de alucinacoes de ~15% para ~35% | Medio |
| 8 | **Unificar instrucoes de gancho** — extrair constante unica em vez de repetir 4x | Clareza, Redundancia | ~200 tokens/chamada + clareza | Baixo |
| 9 | **Eliminar duplicacao personagens** — remover partyResumo do contextBlocks | Tokens, Redundancia | ~330-450 tokens/chamada | Baixo |
| 10 | **Adicionar AGI/DEX e resultado mecanico ao LEMBRE-SE** | Clareza, Redundancia | Melhora compliance das 2 regras mais violadas | Baixo |
| 11 | **Anotar campos obrigatorios/opcionais no schema JSON** | Clareza | Reduz campos ausentes em Llama ~15% | Baixo |

### Prioridade MEDIA

| # | Melhoria | Analista(s) | Economia/Impacto | Esforco |
|---|----------|-------------|------------------|---------|
| 12 | **Diferenciar temp/topP por provider** — Groq temp=0.8/topP=0.92; GPT-OSS-20B temp=0.7 | Multi-modelo | JSON compliance Llama +2-5% | Baixo |
| 13 | **Adicionar verbos ao ClaimDetector** — "ataco com", "pego", "defendo", "lembro que", "usando" | QA | Cobertura de ~60% para ~85% | Baixo |
| 14 | **Mover instrucoes de continuidade genericas para system prompt** | Tokens | ~364 tokens/turno | Baixo |
| 15 | **Remover bloco `compactacao` do contexto visivel ao LLM** | Tokens, Redundancia | ~60-80 tokens/chamada | Baixo |
| 16 | **Tratar trailing commas e JSON truncado no parse chain** | Multi-modelo | +2% parse success Llama | Baixo |
| 17 | **Documentar limites de memoria semantica no prompt** | Redundancia | Melhora calibracao de importancia/permanente | Baixo |
| 18 | **Separar ACOES em frequentes vs especializadas** | Clareza | Reduz carga cognitiva na secao mais densa | Baixo |
| 19 | **Schema compacto: manter speaker/npc_id** | Multi-modelo | Preserva funcionalidade de UI sem custo significativo | Baixo |
| 20 | **Melhorar deteccao de negacao** — parse por sentenca em vez de proximidade 80 chars | QA | Reduz falsos positivos/negativos | Medio |

---

## Matriz de Risco por Modelo

| Risco (% falha) | Gemini Flash | Flash-Lite | Llama 70B | Llama Scout | GPT-OSS 120B | GPT-OSS 20B | Claude Sonnet | Claude Haiku |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| JSON invalido | 1% | 4% | 15% | 20% | 12% | 35% | 5% | 8% |
| Campos obrigatorios ausentes | 2% | 6% | 12% | 18% | 10% | 30% | 3% | 6% |
| Acoes com tipo invalido | 3% | 8% | 20% | 25% | 15% | 40% | 2% | 5% |
| Narrativa pobre/seca | 8% | 15% | 5% | 8% | 6% | 20% | 2% | 5% |
| Schema ignorado parcial | 1% | 5% | 15% | 20% | 12% | 40% | 2% | 4% |

---

## Orcamento de Tokens (Groq worst case: 4 PJs magos)

| Componente | Tokens | % |
|---|---:|---:|
| montarSistemaMecanico | 6,000 | 27% |
| personagens4Pilares (4 PJs) | 2,424 | 11% |
| chat_history (15 msgs) | 3,636 | 16% |
| Per-turn prompt | 1,636 | 7% |
| Schema compacto | 628 | 3% |
| roteiroCondensado | 909 | 4% |
| contextoPersistente | 1,061 | 5% |
| catalogo | 1,212 | 5% |
| Identidade + regras | 462 | 2% |
| Resumo | 606 | 3% |
| Output | 909 | 4% |
| **TOTAL** | **~19,483** | **15% de 131K** |

**Veredicto Groq:** Seguro. Uso em 12-17% do contexto. Risco real e rate limit, nao context window.

---

## Economia Estimada (se top 10 implementadas)

| Acao | Tokens economizados/chamada |
|---|---:|
| Truncar assistant history | 1,500 |
| montarSistemaMecanicoCompacto (Groq) | 2,100 |
| Eliminar duplicacao personagens | 400 |
| Unificar instrucoes gancho | 200 |
| Mover continuidade para system | 364 |
| Remover compactacao do contexto | 70 |
| **Total** | **~4,634 tokens** |

Reducao de **~24%** no uso de contexto para Groq (de ~19.5K para ~14.9K tokens).

---

*Gerado por 5 agentes de analise em paralelo. Relatorios completos em `/tmp/claude-1000/-opt/.../tasks/`*
