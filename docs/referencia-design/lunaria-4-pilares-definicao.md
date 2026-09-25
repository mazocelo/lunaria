# LUNARIA — Definição dos 4 Pilares

> Documento de referência para categorização de toda habilidade, magia, vantagem e desvantagem do sistema Lunaria.
> Versão 1.0 — Março 2026

---

## Visão Geral

Todo elemento mecânico de um personagem no Lunaria pertence a **exatamente um** dos 4 pilares. Não existe sobreposição — se algo parece pertencer a dois pilares, a regra de decisão abaixo resolve.

| Pilar | Tabela no banco | O que é | Quem ativa | Custa recurso? |
|-------|-----------------|---------|------------|----------------|
| **Vantagem** | `vantagens` | Traço passivo permanente | Ninguém (auto-aplicado) | Não |
| **Desvantagem** | `desvantagens` | Falha com gatilho narrativo | O Mestre IA | Não (penaliza) |
| **Habilidade** | `habilidades` | Ação ativa de classe/treino | O Jogador | Sim (mana/stamina/cooldown) |
| **Magia** | `magias` | Feitiço do catálogo universal | O Jogador | Sim (mana + concentração) |

---

## PILAR 1 — VANTAGENS

### Definição

Vantagem é um **traço permanente que modifica o personagem de forma passiva ou situacional**. Ela não precisa ser ativada, não consome recursos e não gasta ação em combate. Vantagens representam talentos inatos, treinamento de vida, características físicas ou aptidões naturais.

**Inspiração:** 3D&T Alpha (Vantagens) + Daemon (Aprimoramentos positivos) + D&D 5e (Feats passivos)

### Regras fundamentais

1. **Nunca custa mana, stamina ou qualquer recurso** para funcionar
2. **Nunca consome ação** no turno (não é ação, ação bônus, nem reação)
3. **Sempre tem um bonus mecânico** no campo `bonus` (array de `{atributo, valor}`)
4. **O Mestre IA aplica automaticamente** — o jogador não precisa declarar
5. **Permanente** salvo se a fonte for removida (ex: maldição curada, raça alterada)

### Fontes possíveis

- **Criação:** comprada com Pontos de Criação (custo 1-3)
- **Raça:** concedida pela raça do personagem (custo 0, embutido na raça)
- **Classe:** concedida pela classe (custo 0, tipo "classe")
- **Narrativa:** concedida pelo Mestre durante o jogo (bênção, treino especial)

### Campos obrigatórios no JSON

```json
{
  "nome": "Alerta",
  "descricao": "+3 em iniciativa. Nunca é surpreendido se estiver consciente.",
  "custo": 2,
  "tipo": ["combate", "passiva"],
  "bonus": [{"atributo": "iniciativa", "valor": 3}],
  "restricao": null,
  "dano_base": null,
  "efeito": {"descricao": "+3 em iniciativa. Nunca é surpreendido se estiver consciente"},
  "usar": 0,
  "elemento": [],
  "nivel": 1,
  "requisitos": null,
  "hp_bonus": 0,
  "mana_bonus": 0
}
```

### Campo `usar`

- `0` = passiva pura (Mestre aplica automaticamente sempre)
- `1` = situacional (Mestre aplica quando a condição é atendida, mas ainda sem custo de recurso)

**Importante:** `usar: 1` NÃO significa que é uma habilidade ativa. Significa que a vantagem tem efeito situacional — ex: "Bloqueio com Escudo" bloqueia 1 ataque por combate. O jogador declara o uso, mas **não gasta mana nem ação principal**.

### Teste de pertencimento

Para verificar se algo é uma vantagem, responda SIM a TODAS:

- [ ] É permanente (não tem duração em turnos)?
- [ ] Não custa mana para funcionar?
- [ ] Não gasta a ação principal do turno?
- [ ] Não tem cooldown em turnos?
- [ ] Modifica um atributo, teste ou capacidade do personagem?

Se alguma resposta for NÃO → **não é uma vantagem**, é uma habilidade ou magia.

### Exemplos corretos

| Vantagem | Por que é vantagem |
|----------|-------------------|
| Visão Noturna | Passiva, sempre ativa no escuro, sem custo |
| Sortudo | Modifica chance de acerto crítico permanentemente |
| Durão | +3 PV por nível, sempre ativo |
| Vontade de Ferro | +3 resistência mental, sem ativação |
| Herbalismo | Sabe identificar plantas, sem custo por uso |

### O que NÃO é vantagem

| Errado | Por que está errado | Pilar correto |
|--------|--------------------|---------------|
| Bola de Fogo | Custa mana, gasta ação, tem cooldown | Magia |
| Disparo Arcano | Causa dano direto, custa mana | Magia |
| Golpe Devastador | Gasta stamina, consome ação | Habilidade |
| Cura Relâmpago | Custa mana, gasta ação | Magia |

---

## PILAR 2 — DESVANTAGENS

### Definição

Desvantagem é uma **falha, limitação ou maldição que o personagem carrega** e que o Mestre IA **ativa quando as condições narrativas se alinham**. Desvantagens criam drama, complicam decisões e dão profundidade ao personagem. São o único pilar que o **Mestre IA dispara**, não o jogador.

**Inspiração:** 3D&T Alpha (Desvantagens) + Daemon (Aprimoramentos negativos) + FATE (Aspectos negativos com Compel)

### Regras fundamentais

1. **Sempre tem penalidade mecânica** — campo `bonus` com valor negativo, ou `dano_base`, ou `dc` + `atributo_teste`
2. **O Mestre IA é responsável por ativar** quando a situação narrativa bate com o gatilho
3. **Devolve Pontos de Criação** na criação do personagem (valor negativo no custo)
4. **Máximo de 3 desvantagens** por personagem e -4 pontos devolvidos
5. **Pode ter teste de resistência** — o jogador rola contra DC para resistir ao efeito

### Modelo de gatilho para o Mestre IA

Cada desvantagem deve ter informações suficientes para o Mestre IA saber QUANDO ativar:

```json
{
  "nome": "Ganancioso",
  "descricao": "Dificuldade em resistir a tesouros e ofertas lucrativas.",
  "custo": -1,
  "tipo": ["psicologico", "narrativa"],
  "bonus": [{"atributo": "resistencia_tentacao", "valor": -2}],
  "efeito": {
    "descricao": "Deve fazer teste de Carisma DC 12 quando vê tesouro para não tentar pegá-lo",
    "dc": 12,
    "atributo_teste": "carisma"
  },
  "usar": 0,
  "nivel": 1,
  "hp_bonus": 0,
  "mana_bonus": 0
}
```

### Como o Mestre IA processa

1. A cada cena, o Mestre verifica as desvantagens de cada personagem
2. Se a situação atual bate com o gatilho (ex: tesouro visível + personagem Ganancioso), ele ativa
3. Se há `dc` e `atributo_teste`, pede teste ao jogador
4. Se falhar no teste, a penalidade se aplica (comportamento forçado, debuff, etc.)
5. Se não há `dc`, a penalidade é **automática e permanente** (ex: Azarado sempre falha crítica em 1-2)

### Categorias de desvantagens

| Categoria | Descrição | Exemplo |
|-----------|-----------|---------|
| `narrativa` | Cria ganchos de história | Procurado, Segredo Sombrio, Rival |
| `psicologico` | Compulsões e medos | Ganancioso, Fobia, Fúria |
| `fisico` | Limitações corporais | Cego de Um Olho, Manco, Alérgico |
| `vulnerabilidade` | Fraqueza elemental | Vulnerável a Fogo, Sensível à Luz |
| `social` | Problemas de reputação | Má Fama, Marcado, Inimigo Jurado |
| `moral` | Códigos restritivos | Código de Honra, Pacifista |
| `passiva` | Penalidade permanente sem gatilho | Azarado, Frágil |

### Teste de pertencimento

- [ ] Representa uma limitação, falha ou fraqueza?
- [ ] Tem penalidade mecânica (bonus negativo, DC, ou dano)?
- [ ] É ativada pela narrativa/situação (não pelo jogador)?
- [ ] Devolve pontos na criação?

---

## PILAR 3 — HABILIDADES

### Definição

Habilidade é uma **ação ativa que o personagem aprendeu através de classe ou treino**, que requer declaração do jogador e consome recursos (mana, stamina, ou usos por descanso) e/ou tempo (ação no turno). Habilidades são **vinculadas a classes** — cada classe concede habilidades específicas, e habilidades genéricas (sem `classe_id`) são raras técnicas que qualquer um pode aprender.

**Inspiração:** D&D 5e (Class Features) + Daemon (Técnicas de combate + Poderes sobrenaturais) + 3D&T (Ataque Especial, Ataque Múltiplo)

### Regras fundamentais

1. **Sempre requer declaração do jogador** — "Eu uso Golpe Devastador"
2. **Sempre consome recurso** — mana (`custo_mana`), ou usos limitados (`usos_por_descanso`), ou tem cooldown (`cooldown_turnos`)
3. **Sempre gasta ação** — ação principal, ação bônus, ou turno cheio (`tempo_conjuracao`)
4. **Pode ter `classe_id`** — vinculada a uma classe específica, ou `null` para genérica
5. **Pode ter `escola_magia: "nenhuma"`** — habilidades físicas/mundanas não têm escola
6. **Tem `categoria`** — `combate_fisico`, `crafting`, `controle`, `suporte`, etc.

### Diferença crucial: Habilidade vs Magia

| Critério | Habilidade | Magia |
|----------|-----------|-------|
| Fonte | Classe ou treino | Catálogo universal compartilhado |
| `classe_id` | Geralmente tem | Sempre `null` |
| `escola_magia` | `"nenhuma"` para físicas | Sempre tem escola (evocação, etc.) |
| Quem pode usar | A classe específica | Qualquer conjurador da tradição |
| Contramagia | Não pode ser dissipada | Pode ser dissipada/contrafeitiçada |
| Componentes | Não precisa | Pode precisar (`componente_material`) |
| Concentração | Raramente | Frequentemente (`usa_concentracao`) |

**Regra de ouro:** Se dois personagens de classes diferentes podem aprender a mesma coisa do catálogo geral → é **magia**. Se é exclusiva de uma classe ou técnica de combate/crafting → é **habilidade**.

### Exceção: Habilidades com escola mágica

Algumas habilidades de classe SÃO mágicas (ex: "Bola de Fogo" do Elementalista, `classe_id: 10`). Elas ficam na tabela `habilidades` porque são **versões de classe** — podem ter custo diferente, dano diferente, ou efeitos únicos comparados à magia genérica de mesmo nome. O Mestre IA reconhece pela `classe_id != null`.

### Campos obrigatórios no JSON

```json
{
  "id": 1,
  "nome": "Bomba Alquímica",
  "descricao": "Arremessa um frasco instável que explode ao contato...",
  "custo_mana": 3,
  "dano_base": "1d8+2",
  "tipo": "dano",
  "elemento": "fogo",
  "nivel_requerido": 1,
  "cooldown_turnos": 0,
  "classe_id": 1,
  "efeito": {"status": "queimando", "duracao": 2, "valor": 2},
  "alvo": "area",
  "alcance": "medio",
  "area_efeito": {"tipo": "esfera", "raio": 3},
  "tempo_conjuracao": "preparacao",
  "usa_concentracao": false,
  "categoria": "crafting",
  "escola_magia": "nenhuma",
  "escalamento": {"por_nivel": "+1d8", "a_cada": 4},
  "pre_requisito": null,
  "raca_id": null,
  "usos_por_descanso": 3,
  "componente_material": [{"item": "Frasco de Vidro", "consumido": true}],
  "saving_throw": "destreza"
}
```

### Categorias de habilidades

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| `combate_fisico` | Ataques, manobras, técnicas de arma | Golpe Brutal, Ataque Giratório |
| `magia_ofensiva` | Habilidade mágica de classe ofensiva | Bola de Fogo (Elementalista) |
| `magia_defensiva` | Habilidade mágica de classe defensiva | Escudo de Fé (Clérigo) |
| `cura` | Habilidades de classe de cura | Imposição de Mãos (Paladino) |
| `suporte` | Buffs e auxílio de classe | Aura de Coragem (Paladino) |
| `controle` | Crowd control de classe | Grito de Guerra (Bárbaro) |
| `utilidade` | Exploração e utilidade de classe | Sentir Armadilhas (Ladino) |
| `social` | Manipulação e persuasão de classe | Performance (Bardo) |
| `crafting` | Criação de itens de classe | Bomba Alquímica (Alquimista) |

### Teste de pertencimento

- [ ] Requer declaração explícita do jogador para ativar?
- [ ] Consome recurso (mana, stamina, usos) OU tem cooldown?
- [ ] Gasta ação no turno (ação, bônus, turno cheio)?
- [ ] É vinculada a uma classe ou representa técnica de combate/ofício?
- [ ] NÃO está no catálogo universal de magias?

Se sim a todas → **Habilidade**.

---

## PILAR 4 — MAGIAS

### Definição

Magia é um **feitiço do catálogo universal** que qualquer personagem conjurador pode aprender, independente de classe. Magias são organizadas por **escola** (8 escolas de D&D) e **círculo** (nível de poder), custam **mana** para conjurar, e seguem regras de **alcance, área, concentração e saving throw**.

**Inspiração:** D&D 5e (Spell list por escola e nível) + Daemon (Caminhos da Magia) + 3D&T (Magia como catálogo de efeitos compráveis com PM)

### Regras fundamentais

1. **Sempre `classe_id: null`** — magias são universais, não pertencem a nenhuma classe
2. **Sempre tem `escola_magia`** — uma das 8 escolas (nunca `"nenhuma"`)
3. **Sempre custa mana** (`custo_mana > 0`, exceto cantrips que custam 0)
4. **Sempre gasta ação** — `tempo_conjuracao` define o tipo
5. **Pode ter concentração** — `usa_concentracao: true` (máximo 1 ativa por vez)
6. **Pode ser dissipada** — Dissipar Magia e Contrafeitiço funcionam contra magias
7. **Pode ter componente material** — ingredientes consumidos ou catalisadores
8. **Qualquer conjurador pode aprender** se atender `nivel_requerido` e `pre_requisito`

### As 8 Escolas

| Escola | Foco | Exemplos |
|--------|------|----------|
| **Evocação** | Dano direto elemental | Bola de Fogo, Relâmpago, Cone de Gelo |
| **Abjuração** | Proteção e anulação | Escudo Arcano, Dissipar Magia, Banimento |
| **Necromancia** | Morte, vida, dreno | Toque Vampírico, Ressurreição, Maldição |
| **Ilusão** | Engano, cópias, medo | Invisibilidade, Imagem Espelhada, Silêncio |
| **Transmutação** | Transformação | Polimorfia, Velocidade, Petrificar |
| **Adivinhação** | Detecção, conhecimento | Detectar Magia, Vidência, Visão Verdadeira |
| **Encantamento** | Controle mental, charme | Charme, Dominar Pessoa, Sono |
| **Conjuração** | Invocar, teleportar | Teletransporte, Invocar Elementar, Teia |

### Círculos (Nível de Poder)

| Círculo | Nível requerido | Custo mana base | Poder |
|---------|----------------|-----------------|-------|
| 0 (Cantrip) | 1 | 0 | Truques básicos |
| 1 | 1 | 1-3 | Magias iniciais |
| 2 | 3 | 3-5 | Magias intermediárias |
| 3 | 5 | 5-8 | Magias avançadas |
| 4 | 7 | 8-10 | Magias poderosas |
| 5 | 9 | 10-15 | Magias épicas |
| 6+ | 12+ | 15+ | Magias lendárias (1x/descanso longo) |

### Campos obrigatórios no JSON

```json
{
  "id": 354,
  "nome": "Bola de Fogo",
  "descricao": "Uma esfera flamejante explode em uma deflagração devastadora...",
  "custo_mana": 7,
  "dano_base": "4d6",
  "tipo": "dano",
  "elemento": "fogo",
  "nivel_requerido": 5,
  "cooldown_turnos": 1,
  "classe_id": null,
  "efeito": {"status": "queimando", "duracao": 2, "valor": 3},
  "alvo": "area",
  "alcance": "longo",
  "area_efeito": {"tipo": "esfera", "raio": 6},
  "tempo_conjuracao": "acao",
  "usa_concentracao": false,
  "categoria": "magia_ofensiva",
  "escola_magia": "evocacao",
  "escalamento": {"por_nivel": "+1d6", "a_cada": 3},
  "pre_requisito": null,
  "raca_id": null,
  "usos_por_descanso": null,
  "componente_material": null,
  "saving_throw": "destreza"
}
```

### Concentração

- Máximo **1 magia de concentração** ativa por vez
- Conjurar outra magia de concentração **encerra a anterior automaticamente**
- Receber dano exige **teste de Resiliência** (DC = maior entre 10 e metade do dano)
- Falha no teste = **perde a concentração** e a magia acaba

### Teste de pertencimento

- [ ] Pertence ao catálogo universal (qualquer conjurador pode aprender)?
- [ ] Tem escola mágica definida (evocação, abjuração, etc.)?
- [ ] `classe_id` é `null`?
- [ ] Custa mana para conjurar?
- [ ] Pode ser dissipada por Dissipar Magia?

Se sim a todas → **Magia**.

---

## Árvore de Decisão Definitiva

Ao criar ou classificar qualquer efeito, siga este fluxo:

```
O efeito é uma LIMITAÇÃO/FALHA do personagem?
├─ SIM → DESVANTAGEM
│
└─ NÃO → O efeito precisa ser ATIVADO pelo jogador?
          ├─ NÃO → VANTAGEM (passiva, auto-aplicada)
          │
          └─ SIM → O efeito pertence ao catálogo UNIVERSAL de magia?
                    (qualquer conjurador aprende, tem escola, classe_id=null)
                    ├─ SIM → MAGIA
                    │
                    └─ NÃO → HABILIDADE (de classe ou treino)
```

### Casos ambíguos e como resolver

| Caso | Decisão | Justificativa |
|------|---------|---------------|
| Raça dá uma magia (ex: Tiefling conjura chamas) | **Habilidade** com `raca_id` | É racial, não do catálogo universal |
| Classe dá versão especial de uma magia | **Habilidade** com `classe_id` | Versão de classe ≠ magia genérica |
| Traço que ativa 1x por combate sem custo | **Vantagem** com `usar: 1` | Sem custo de recurso = vantagem situacional |
| Traço que custa mana para ativar | **Habilidade** | Custo de mana = recurso = habilidade |
| Maldição recebida durante o jogo | **Desvantagem** com `source: "curse"` | É uma limitação imposta |
| Buff que o personagem aplica em si mesmo | **Magia** se universal, **Habilidade** se de classe | Depende da fonte |

---

## Processamento pelo Mestre IA

### Pipeline por pilar

**Vantagens (pré-check automático):**
```
Antes de qualquer teste/ação:
1. Carregar vantagens ativas do personagem
2. Para cada vantagem, verificar se a condição bate com a situação
3. Aplicar bonus automaticamente (sem perguntar ao jogador)
4. Narrar o efeito naturalmente ("Seus olhos élficos cortam a escuridão...")
```

**Desvantagens (gatilho narrativo):**
```
Após cada mudança de cena/situação:
1. Verificar desvantagens de cada personagem presente
2. Se a situação bate com o gatilho da desvantagem:
   a. Se tem DC → pedir teste ao jogador
   b. Se não tem DC → aplicar penalidade automática
3. Narrar a complicação ("Sua ganância fala mais alto...")
4. Registrar que a desvantagem foi ativada (para tracking)
```

**Habilidades (jogador declara):**
```
Quando jogador declara uso de habilidade:
1. Verificar se conhece a habilidade (classe/treino)
2. Verificar recurso disponível (mana/stamina/usos)
3. Verificar cooldown (turnos restantes)
4. Verificar ação disponível (ação/bônus/turno cheio)
5. Deduzir recurso
6. Resolver efeito (dano, buff, controle)
7. Aplicar cooldown
8. Narrar resultado
```

**Magias (jogador declara):**
```
Quando jogador declara conjuração de magia:
1. Verificar se conhece a magia (tradição/nível)
2. Verificar mana disponível
3. Verificar concentração (já tem outra ativa?)
4. Verificar componentes materiais (se necessário)
5. Verificar alcance e alvo válido
6. Deduzir mana
7. Se concentração → encerrar anterior, registrar nova
8. Resolver efeito (com saving throw se aplicável)
9. Narrar resultado
```

---

## Resumo Numérico do Catálogo

| Pilar | Tabela | Quantidade | IDs |
|-------|--------|-----------|-----|
| Vantagens | `vantagens` | 152 | 1-152 (por index) |
| Desvantagens | `desvantagens` | 102 | 1-102 (por index) |
| Habilidades | `habilidades` | 337 | 1-337 |
| Magias | `magias` | 160 | 338-497 |
| **Total** | | **751** | |

Classes: 26 | Raças: 40 | **Total geral: 817 itens**

---

## Regra de Não-Duplicação

- Uma magia genérica (catálogo universal) pode ter uma **versão de classe** na tabela habilidades com mesmo nome mas `classe_id != null`. Isso é permitido — a versão de classe pode ter custo, dano ou efeito diferente.
- Uma vantagem **nunca** deve duplicar uma magia. Se algo causa dano direto e custa mana → é magia ou habilidade, não vantagem.
- Uma desvantagem **nunca** deve ser benéfica. Se algo tem efeito positivo líquido → é vantagem.
