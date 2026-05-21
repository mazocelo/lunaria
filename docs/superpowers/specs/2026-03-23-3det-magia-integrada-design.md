# Design: Integração de Magias 3D&T Alpha

> ⚠️ **Superseded by `2026-05-20-modelo-hibrido-hm-design.md`** (seções §"Decisões
> Técnicas" e §"Parte 2: Conjuração em Combate" — o contrato comum das engines
> `getMagiasConhecidas`/`getMagiasDisponiveis`/`getSlotsInfo` passa a ser definido na
> spec de 2026-05-20, §5). A spec de 2026-05-20 é a **referência canônica** do
> sistema H&M. As decisões de schema desta spec (`magias_tresdet`,
> `personagem_magia_tresdet`, conjuração por PM sem slots) seguem válidas.

## Contexto

O sistema 3D&T Alpha no Lunaria tem 100+ magias em `magias_tresdet` com `focus_requisito` mapeando as escolas tradicionais (Branca, Negra, Elemental) para os 6 Focus elementais (Fogo, Agua, Terra, Ar, Luz, Trevas). A infraestrutura existe mas está desconectada do gameplay. Este design fecha o ciclo completo em 3 entregas independentes.

### Regras Oficiais Relevantes (Manual 3D&T Alpha)
- PV = R × 5 (mínimo 1)
- PM = R × 5 (mínimo 1) — TODOS os personagens têm PM, não só mages
- Descanso recupera: rola R × d6 para PV + R × d6 para PM (separados, capped no máximo)
- Magia existe em 3 tipos: Branca, Negra, Elemental → adaptados para 6 Focus
- Sem limite de magias conhecidas — limitação é PM por uso
- Conjuração pode ser via texto (jogador descreve) ou ActionDock (atalho visual)

## Parte 1: Seleção de Magias na Ficha Livre

### Conceito
Nova seção "Grimório" na ficha-livre, entre FocusSection e Equipamentos. Mostra magias cujo `focus_requisito` é atendido pelos Focus atuais do personagem.

### Filtro de Elegibilidade
Uma magia com `focus_requisito: [{fogo: 2}, {luz: 1}]` exige Fogo ≥ 2 E Luz ≥ 1. Todos os itens do array devem ser atendidos (AND). Cada entry do array tem exatamente uma chave (invariante garantida pelos seeds).

### Componente: GrimorioTresDetSection
- Busca por nome + filtro por elemento (chips dos 6 focus)
- Cards: nome, escola, custo_pm, alcance, duração, descrição truncada
- Magias inelegíveis: visíveis mas desabilitadas (opacity + tooltip "Requer Fogo 3")
- Sem limite de seleção (manual não impõe quantidade)

### Dados
- Endpoint existente: `GET /magias-tresdet` (retorna focus_requisito)
- Filtro de elegibilidade: frontend (focus muda em tempo real)
- Persistência: campo `magias_ids` no payload de criação

### Backend
- Nova tabela `personagem_magia_tresdet` (join table com FK para `personagens` e `magias_tresdet`)
  - Campos: `id`, `personagem_id` (FK), `magia_tresdet_id` (FK), `origem` ('criacao'|'npc'|'evento'), `created_at`
  - Unique constraint: `[personagem_id, magia_tresdet_id]`
  - Cascade delete em ambos os lados
- Nota: `hm_personagem` NÃO pode ser reutilizada pois tem FK para `habilidades_magias` (tabela Lunaria)
- Adaptar `POST /personagens` (service `personagemTresDetService.js`) para aceitar `magias_ids` e persistir na nova tabela

### Model (ficha-livre.model.js)
- Novo state: `magiasIds` (array de IDs selecionados)
- Novo state: `magiasCatalogo` (carregado de /magias-tresdet)
- Computed: `magiasDisponiveis` — filtra catálogo por focus_requisito vs focus atual
- Ao mudar Focus, magias que deixam de ser elegíveis são removidas automaticamente
- Draft persistence inclui magiasIds

### View (ficha-livre.view.jsx)
- Nova seção entre FocusSection e Equipamentos
- Stagger animation: Grimório em wa-stagger-5, Equipamentos vira wa-stagger-6, Historia vira wa-stagger-7

## Parte 2: Conjuração em Combate + Descanso

### Conjuração
- Buscar magia em `magias_tresdet` (não em `habilidades_magias`)
- Consumir `custo_pm` do PM atual. O campo é `VarChar(50)` — parsear valor numérico base (ex: "3" → 3, "1 a 5" → mínimo 1, "2 PMs por turno" → 2). Custos variáveis: Mestre IA define o valor no intent
- Validar Focus do personagem vs `focus_requisito`
- Sem cooldown/slots — limitação é PM disponível
- Emitir evento `magia_conjurada` com mesma estrutura do Lunaria
- Dois caminhos: via texto (Mestre IA resolve) ou via ActionDock (intent automático)

### Descanso
- Novo handler `processarDescanso`
- PV: rola R dados d6, soma, adiciona ao PV atual (cap no máximo)
- PM: rola R dados d6, soma, adiciona ao PM atual (cap no máximo)
- Retorna breakdown dos dados (ex: "PV: 3+5+2 = +10, PM: 4+1+6 = +11")
- Trigger: Mestre IA via narrativa OU jogador solicita

### Frontend (ActionDock)
- Seção magias 3D&T usa `magias_tresdet` ao invés de `habilidades_magias`
- Mostra custo PM, desabilita se PM insuficiente
- Botão/ação de descanso visível fora do combate

## Parte 3: Grimório Persistente

### Na Ficha (FichaPersonagemModal)
- Nova seção "Magias" ao lado das stats
- Lista compacta: nome, custo PM, escola/focus, alcance
- Clique expande descrição
- Badge com contagem total

### Painel Dedicado
- Acessível via botão no menu do jogo (ícone grimório)
- Grid com cards completos
- Filtro por elemento + busca por nome
- PM atual/máximo no topo
- Cada card: nome, custo PM, alcance, duração, descrição, focus requerido (chips)
- Fora do combate: consulta. Em combate: clique → gera intent

### Dados
- Usa `personagem_magia_tresdet` para carregar magias do personagem
- Include magias 3D&T no `GET /personagens/:id`

## Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Tabela de magias | `magias_tresdet` separada | Já existe, campos específicos (focus_requisito, custo_pm string) |
| Filtro elegibilidade | Frontend | Focus muda em tempo real na ficha-livre |
| Limite de magias | Sem limite | Manual não impõe quantidade |
| PM para todos | Sim | Manual p.25: "Todos os personagens começam com 5 PMs para cada ponto de R" |
| Descanso | R×d6 individual | Manual: PV e PM recuperam separadamente |
| Persistência magias | Nova `personagem_magia_tresdet` | `hm_personagem` tem FK para `habilidades_magias` (Lunaria), incompatível |

## Fora de Escopo
- Regeneração de mana para Lunaria (outro design)
- Itens mágicos 3D&T
- Vantagem "Pontos de Magia Extras" (modificador de PM)
- Magia Irresistível e outras vantagens que afetam conjuração
