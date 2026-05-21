# Sistema de Habilidades & Magias — Design Spec

**Data:** 2026-03-21
**Status:** Aprovado
**Escopo:** Reestruturação do sistema de habilidades/magias com aprendizado, slots e progressão

---

## 1. Problema

O sistema atual não tem conceito de "aprender" ou "escolher" habilidades/magias. Todo personagem recebe automaticamente todas as 429 magias universais do catálogo + habilidades de raças que não são suas. Não existe vínculo personagem ↔ magia, nem progressão de slots.

### Bugs decorrentes (confirmados em teste)
- 161 magias disponíveis para um Ninja Lv3 (incluindo Bola de Fogo de Elementalista)
- 18 habilidades com raciais de outras raças (Chifrada Brutal do Minotauro para Meio-Gênio)
- "Lacerar — Habilidade não encontrada" no combate
- Nenhuma etapa no wizard para escolher magias

---

## 2. Decisões de Design

| Decisão | Escolha |
|---|---|
| Tabela separada para magias? | **Não** — catálogo unificado `habilidades_magias` |
| Diferenciador magia vs técnica | `escola_magia IS NOT NULL AND escola_magia != 'nenhuma'` = magia. NULL ou 'nenhuma' = técnica de combate |
| Modelo de slots | **Classe define**, raça habilita/bloqueia (`pode_magia`) |
| Disponibilidade | Classe define escolas permitidas via N:N |
| Progressão de magia | Automática por nível do personagem (coluna `escalamento`) |
| Aprendizado | Criação (wizard) + NPCs in-game |
| Vantagens e slots | Vantagens podem conceder slots extras ou acesso a escolas |
| Upgrades | JSON `escalamento` com array de upgrades por nível |
| Nomenclatura | Tabela: `habilidades_magias`, vínculos: prefixo `hm_` |

---

## 3. Modelo de Dados

### 3.1 Rename: `habilidades` → `habilidades_magias`

Renomear tabela, Model, Controller, Seeds, helpers e frontend. A estrutura de colunas permanece igual. Atualizar todas as referências no código.

**Campos `classe_id` e `raca_id` deprecados:** Após popular `hm_classe`, os campos `classe_id` e `raca_id` na tabela principal ficam como legado. Manter temporariamente para rollback, remover em sprint futuro. A constraint `@@unique([nome, classe_id])` será substituída por `@@unique([nome])`. A fonte de verdade para associação classe ↔ habilidade passa a ser `hm_classe`.

**FK `receitas.habilidade_id`:** A tabela `receitas` referencia `habilidades`. Renomear a FK para apontar para `habilidades_magias` no schema Prisma.

**Cascade delete:** `hm_personagem` usa `onDelete: Cascade` em ambas as FKs. Se o personagem ou a habilidade for deletada, o vínculo é removido automaticamente.

### 3.2 Nova tabela: `hm_classe` (N:N — quais classes acessam cada habilidade/magia)

```
model hm_classe {
  id               Int               @id @default(autoincrement())
  habilidade_id    Int                // FK → habilidades_magias
  classe_id        Int                // FK → classes

  habilidades_magias habilidades_magias @relation(fields: [habilidade_id], references: [id])
  classes            classes            @relation(fields: [classe_id], references: [id])

  @@unique([habilidade_id, classe_id])
}
```

**Migração:** Popular baseado no campo `classe_id` atual de cada habilidade. Habilidades universais (`classe_id: null, raca_id: null`) recebem um registro em `hm_classe` para **cada classe que tenha slots > 0** (classes com `hm_slots_classe.slots > 0` no nível 1, ou todas as classes para técnicas de combate). Habilidades raciais (`raca_id != null`) NÃO entram em `hm_classe` — são auto-concedidas via `hm_personagem` com `origem: "racial"` durante criação do personagem.

**Nova tabela opcional: `hm_raca`** (N:N — habilidades raciais por raça). Mesmo modelo que `hm_classe`, permite que habilidades raciais sejam compartilhadas entre raças similares. Popular baseado no campo `raca_id` atual.

### 3.3 Nova tabela: `hm_personagem` (magias/habilidades que o personagem conhece)

```
model hm_personagem {
  id               Int               @id @default(autoincrement())
  personagem_id    Int                // FK → personagens
  habilidade_id    Int                // FK → habilidades_magias
  origem           String             // "criacao", "npc", "vantagem", "racial"
  created_at       DateTime           @default(now())

  personagens        personagens        @relation(fields: [personagem_id], references: [id])
  habilidades_magias habilidades_magias @relation(fields: [habilidade_id], references: [id])

  @@unique([personagem_id, habilidade_id])
}
```

**Nível da magia = nível do personagem.** Não existe campo de nível na tabela de vínculo. Os upgrades ativos são determinados consultando `escalamento` da magia filtrado pelo `nivel` do personagem.

### 3.4 Nova tabela: `hm_slots_classe` (progressão de slots de magia por classe/nível)

```
model hm_slots_classe {
  id          Int      @id @default(autoincrement())
  classe_id   Int      // FK → classes
  nivel       Int      // Nível do personagem (1-20)
  slots       Int      // Quantidade de slots de magia nesse nível

  classes classes @relation(fields: [classe_id], references: [id])

  @@unique([classe_id, nivel])
}
```

**Progressão:** A tabela deve ter uma linha para cada nível 1-20 por classe. Consulta usa `WHERE classe_id = X AND nivel = Y` (exato, sem interpolação). Classes sem magia (Guerreiro) não precisam de linhas — ausência = 0 slots.

**Exemplo de progressão (valores ilustrativos, balanceamento final no seed):**

| Classe | Nv1 | Nv5 | Nv10 | Nv15 | Nv20 |
|---|---|---|---|---|---|
| Mago | 4 | 8 | 13 | 18 | 23 |
| Ninja | 2 | 4 | 7 | 10 | 12 |
| Druida | 3 | 7 | 11 | 15 | 19 |
| Guerreiro | — | — | — | — | — |
| Paladino | 0 | 2 | 5 | 8 | 10 |

**Nota:** Slots = magias (escola_magia != 'nenhuma'). Técnicas de combate (escola_magia = 'nenhuma') não consomem slots — são dadas pelo Mestre no wizard e aprendidas por progressão de classe.

### 3.5 Alteração: campo `pode_magia` na tabela `racas`

```
pode_magia Boolean @default(true)
```

Raças como Orc, Golem, Androide teriam `pode_magia: false` → slots de magia ignorados independente da classe.

### 3.6 Coluna `escalamento` enriquecida

O campo `escalamento` (JSON) na tabela `habilidades_magias` passa de formato simples para array de upgrades:

**Formato atual:**
```json
{ "por_nivel": "+1d6", "a_cada": 4 }
```

**Formato novo:**
```json
{
  "upgrades": [
    {
      "nivel": 1,
      "dano_base": "1d6+1",
      "descricao": "Projétil flamejante básico"
    },
    {
      "nivel": 5,
      "dano_base": "2d6+2",
      "descricao": "Chamas mais intensas",
      "efeito": { "status": "queimando", "duracao": 2 }
    },
    {
      "nivel": 10,
      "dano_base": "3d6+4",
      "descricao": "Explosão expandida",
      "area_efeito": { "tipo": "esfera", "raio": 5 }
    }
  ]
}
```

O combate resolve o upgrade ativo: maior `nivel` do array que seja `<= nivel_personagem`.

---

## 4. Wizard de Criação — Nova Etapa "Grimório"

### 4.1 Fluxo atualizado do wizard

1. boas_vindas (nome)
2. raca (linhagem)
3. classe (vocação)
4. background (origens)
5. desvantagens (marcas)
6. vantagens (dons)
7. atributos (essência)
8. equipamentos (arsenal — Mestre IA dá itens)
9. habilidades (técnicas — Mestre IA dá técnicas de combate)
10. **grimório** (jogador escolhe magias nos slots disponíveis)
11. resumo (destino)

### 4.2 Etapa "Grimório" — Comportamento

- Só aparece se `raca.pode_magia === true` E `classe tem slots > 0 no nível 1`
- Mostra slots disponíveis (ex: "3 slots de magia")
- Lista magias disponíveis filtradas por:
  - `hm_classe` com a classe do personagem
  - `nivel_requerido <= 1` (criação)
  - `raca.pode_magia === true`
- Jogador seleciona magias até preencher slots
- Pode deixar slots vazios (para comprar depois de NPCs)
- Ao confirmar, cria registros em `hm_personagem` com `origem: "criacao"`

### 4.3 Separação da etapa atual de equipamentos

A etapa 8 atual ("equipamentos") que hoje dá equipamentos + habilidades via Mestre IA será dividida:
- **Etapa 8 "Equipamentos"**: Mestre IA sugere itens iniciais
- **Etapa 9 "Habilidades"**: Mestre IA sugere técnicas de combate da classe (escola_magia = 'nenhuma')
- **Etapa 10 "Grimório"**: Jogador escolhe magias (UI de seleção, não IA)

---

## 5. Aprendizado de Magias via NPCs

### 5.1 Conceito

Durante sessões de jogo, o Mestre IA pode apresentar NPCs que ensinam magias. O jogador pode "comprar" magias novas gastando gold ou completando quests.

### 5.2 Mecânica

- NPC oferece lista de magias disponíveis (filtradas por classe do jogador via `hm_classe`)
- Magia deve ter `nivel_requerido <= nivel_personagem`
- Personagem deve ter slots disponíveis (`hm_slots_classe.slots - count(hm_personagem magias)`)
- Ao aprender, cria registro em `hm_personagem` com `origem: "npc"`
- Gold/custo definido por `nivel_requerido` da magia × multiplicador

### 5.3 Implementação futura

O sistema de NPCs vendedores é uma feature separada que depende deste design de dados estar implementado. Pode ser feito em sprint posterior — o importante agora é que o modelo de dados suporte.

---

## 6. Interação com Vantagens

### 6.1 Vantagens que concedem slots extras

Vantagens como "Feitiços Arcanos Variados" podem:
- Adicionar N slots de magia bonus
- Campo `bonus` da vantagem: `{ "slots_magia_bonus": 2 }`

Cálculo total de slots: `hm_slots_classe.slots + sum(vantagens.bonus.slots_magia_bonus)`

### 6.2 Vantagens que expandem acesso a escolas/classes

Vantagens como "Afinidade Arcana" podem:
- Permitir aprender magias de escolas que a classe normalmente não acessa
- Campo `bonus` da vantagem: `{ "escolas_extra": ["necromancia", "conjuracao"] }`

Filtragem de magias disponíveis: `hm_classe da classe do personagem` + `escolas_extra das vantagens`

### 6.3 Vantagens ativáveis que são magias

Vantagens com `usar >= 1` e natureza mágica (Campo de Força, Teleporte Curto, etc.) continuam funcionando como hoje — são ações de combate via `getActivatableAdvantages()`. Não consomem slots de magia.

---

## 7. Combate — Adaptações

### 7.1 `ownedActionsHelper.js`

Atualizar `getExplicitOwnedSkills` e `getExplicitOwnedSpells` para consultar `hm_personagem`:

```
Habilidades do personagem =
  hm_personagem JOIN habilidades_magias
  WHERE personagem_id = X
  AND escola_magia = 'nenhuma'

Magias do personagem =
  hm_personagem JOIN habilidades_magias
  WHERE personagem_id = X
  AND escola_magia != 'nenhuma'
```

### 7.2 Resolução de upgrades no combate

Quando uma magia é usada em combate:
1. Buscar `escalamento.upgrades` da magia
2. Filtrar upgrades onde `nivel <= nivel_personagem`
3. Usar o upgrade de maior nível como stats ativos (dano_base, efeito, area_efeito, etc.)
4. Se não há upgrades, usar stats base da magia

### 7.3 Frontend — Lista de habilidades/magias no combate

Em vez de carregar todo o catálogo, carregar apenas `hm_personagem` do jogador. Isso resolve automaticamente:
- Bug das 161 magias (só mostra o que o personagem aprendeu)
- Bug das habilidades de outras raças (só mostra o que foi vinculado)
- Bug "Habilidade não encontrada" (backend valida contra `hm_personagem`)

---

## 8. Migração

### 8.1 Rename da tabela

1. Renomear `habilidades` → `habilidades_magias` no schema Prisma
2. `prisma db push` para aplicar
3. Buscar/substituir em todo o código:
   - Model: `Habilidade` → `HabilidadeMagia`
   - Controller: `habilidadesController` → `habilidadesMagiasController`
   - Rotas: `/habilidades` → `/habilidades-magias`
   - Frontend: todas as referências
   - Seeds: arquivos de seed
   - Helpers: combateHelper, personagensHelper, ownedActionsHelper, claimDetector, etc.

### 8.2 Criar novas tabelas

1. `hm_classe` — popular baseado no `classe_id` atual de cada habilidade + lógica para universais
2. `hm_personagem` — inicialmente vazio (personagens existentes precisam de migração manual ou script)
3. `hm_slots_classe` — popular com tabela de progressão por classe

### 8.3 Popular `pode_magia` nas raças

Script para setar `pode_magia: false` para raças sem aptidão mágica (Orc, Golem, Androide, etc.).

### 8.4 Migrar `escalamento` para formato novo

Script para converter o formato simples `{ "por_nivel": "+1d6", "a_cada": 4 }` para o formato de array de upgrades.

### 8.5 Migrar personagens existentes

**Política:** Personagens existentes recebem habilidades raciais automáticas + magias iniciais até o limite de slots do nível 1 da sua classe.

Script de migração:
1. Para cada personagem, inserir em `hm_personagem` todas as habilidades raciais da sua raça com `origem: "racial"`
2. Para cada personagem com `raca.pode_magia = true`, selecionar magias aleatórias (ou as de menor `nivel_requerido`) da sua classe via `hm_classe`, até preencher os slots do nível 1
3. Inserir com `origem: "criacao"`
4. Personagens que usaram magias em sessões anteriores que não estejam no seu novo vínculo: aceitar a perda (eram magias que nunca deveriam ter sido acessíveis)

### 8.6 Compatibilidade do `escalamento`

Durante a migração do formato `escalamento`, o combate deve suportar **ambos os formatos**:
- Formato legado: `{ "por_nivel": "+1d6", "a_cada": 4 }` — usar fórmula dinâmica
- Formato novo: `{ "upgrades": [...] }` — usar array de upgrades

A detecção é simples: se `escalamento.upgrades` é array, usar formato novo. Senão, usar legado. Após migração completa, remover suporte ao legado.

---

## 9. Fora de escopo (sprints futuros)

- Sistema de NPCs vendedores de magias (in-game)
- UI de "Grimório" fora do wizard (menu do personagem para gerenciar magias)
- Migração de vantagens que são magias para a tabela unificada
- Sistema de "desaprender" magias para liberar slots
- Magias de pergaminho/item (uso único sem ocupar slot)
