# 3D&T Alpha — Ficha Livre (Redesign do Wizard)

## Objetivo

Substituir o wizard linear do 3D&T por uma ficha livre de página única onde o jogador distribui pontos livremente entre Características, Vantagens, Focus Elementais e Desvantagens, com feedback em tempo real. O Mestre Criador fica disponível como painel lateral colapsável.

## Contexto

O wizard linear atual (8 steps sequenciais) não se adequa ao 3D&T Alpha porque:
- O sistema usa **pool único de pontos** compartilhado entre Características, Vantagens e Focus
- Forçar ordem linear obriga o jogador a ir e voltar entre steps
- O step "Conceito" era redundante com "História/Destino"
- Vantagens no 3D&T cobrem o papel de raças e classes de outros sistemas, então precisam ser o centro da criação

## Mecânica de Pontos

### Nível de Poder
Define o total de pontos disponíveis:

| Nível | Pontos |
|-------|--------|
| Novato | 5 |
| Lutador | 7 |
| Campeão | 10 |
| Lenda | 12 |

### Pool Único
Todos os gastos saem do mesmo pool:
- **Características** (F/H/R/A/PdF): 1 ponto por nível, range 0-5
- **Vantagens**: custo variável por item (1-3 pts)
- **Focus Elementais**: 1 ponto por nível, range 0-5, por elemento
- **Desvantagens**: devolvem pontos ao pool (-1 a -3 pts), sem cap total (diferente de Lunaria que limita a -3)

### Regras de Pool
- Botões +/- ficam **desabilitados** quando pontosRestantes = 0 (não permite overspend temporário)
- Ao reduzir Nível de Poder com pontos já gastos, auto-remove na ordem: Focus (maior valor primeiro) → Características (PdF → A → R → H → F) → Vantagens (última adicionada primeiro)
- `pontosRestantes` é sempre uma computação derivada do state, nunca armazenado diretamente

### Stats Derivados
- PV = 5 × Resistência
- PM = 5 × max(Habilidade, Poder de Fogo) — somente se possui vantagem de Magia

### Focus Elementais
6 elementos: Fogo, Água, Terra, Ar, Luz, Trevas. Cada nível custa 1 ponto do pool. A seção fica **bloqueada** até o jogador comprar uma vantagem de Magia. "Vantagem de Magia" = qualquer vantagem com `tipo: 'magico'` (Magia Branca, Magia Negra, Magia Elemental). Se o jogador possui múltiplas vantagens mágicas e remove uma, Focus permanece acessível enquanto pelo menos uma vantagem mágica existir. Ao remover a última vantagem mágica, pontos de Focus são zerados e devolvidos ao pool.

### Decisões Técnicas
- **State management**: hook local (`useTresDetFichaModel`) seguindo o padrão do `useWizardModel`
- **Componentes existentes**: `TresDetCaracteristicasBlock` e `TresDetVantagensBlock` NÃO serão reutilizados (foram desenhados para pool separado). Novos componentes serão criados para o pool único.
- **Mestre**: novo hook `useMestreFichaLivre` (o `useMestreInteraction` depende de navegação linear)
- **Draft**: localStorage básico (save on state change, restore on mount) incluído nesta fase
- **Backend**: `POST /personagens` com `sistema: 'tresdet'` já aceita payload sem `raca_id`/`classe_id`. Campos `nivelPoder` e `focus` são novos e precisam de migração no backend.
- **Equipamentos**: seção renderiza com texto "Em breve" (catálogo não existe ainda), payload envia `equipamentosIds: []`

## Layout

### Desktop (>768px)
```
┌────────────────────────────────────────────────────────────┐
│  ← Voltar    3D&T Alpha — Ficha de Personagem    [Mestre] │
├────────────────────────────────────────────────────────────┤
│  Nivel: ○Nov ●Lut ○Cam ○Len    ████░░░ 2/7 restantes     │
├───────────────────────────────────────┬────────────────────┤
│  FICHA (scroll)                       │  MESTRE (colapsável│
│                                       │  começa fechado)   │
│  [Nome]                               │                    │
│  [Características F/H/R/A/PdF]        │  Chat com IA       │
│  [Vantagens] [Desvantagens]           │  Sugestões clicáveis│
│  [Focus Elementais]                   │                    │
│  [Equipamentos]                       │                    │
│  [História]                           │                    │
│  [Criar Personagem]                   │  [Input]           │
└───────────────────────────────────────┴────────────────────┘
```

### Mobile (<768px)
- Seções empilhadas verticalmente (scroll)
- Vantagens e Desvantagens em coluna única (não lado a lado)
- Focus grid 2 colunas (não 3)
- Mestre Criador acessível via botão flutuante (abre drawer lateral)

## Seções da Ficha

### 1. Barra Superior (fixa)
- Botão voltar → `/personagens`
- Título "3D&T Alpha — Ficha de Personagem"
- Botão "Mestre Criador" (toggle painel lateral)

### 2. Barra de Pontos (fixa, abaixo do topo)
- Seletor de Nível de Poder (Novato/Lutador/Campeão/Lenda)
- Track visual com pips coloridos por categoria:
  - Roxo = Características
  - Amarelo = Vantagens
  - Azul = Focus
  - Verde = Desvantagens (pontos recuperados)
- Contador "X/Y pontos restantes"
- Ao reduzir Nível de Poder com pontos já gastos, auto-remove do fim (Focus primeiro, depois Características)

### 3. Nome
- Input de texto simples

### 4. Características
- Grid 5 colunas: Força, Habilidade, Resistência, Armadura, Poder de Fogo
- Cada card: label, valor grande, botões +/-
- Stats derivados abaixo: PV e PM
- Badge mostra total de pontos investidos

### 5. Vantagens + Desvantagens (lado a lado desktop, empilhado mobile)

**Vantagens:**
- Lista de cards selecionados (nome, descrição curta, custo, botão remover)
- Botão "+ Adicionar vantagem" → abre Modal/Drawer com catálogo filtrável:
  - Busca por texto
  - Filtro por tipo (ofensiva, defensiva, mágica, passiva, movimento)
  - Filtro por tier/nível
  - Card mostra: nome, custo, tipo, descrição
  - Clicar adiciona à ficha e fecha modal
- Badge mostra total de pontos gastos

**Desvantagens:**
- Mesma estrutura, custo aparece como negativo (devolve pontos)
- Badge mostra pontos recuperados

### 6. Focus Elementais
- **Bloqueado** se não possui vantagem de Magia (overlay com mensagem)
- Grid 3 colunas (2 no mobile): Fogo, Água, Terra, Ar, Luz, Trevas
- Cada card: emoji, label, valor, botões +/-, custo "1 pt cada nível"
- Cards com pontos investidos ficam highlighted (borda azul)
- Badge mostra total de pontos investidos

### 7. Equipamentos
- Lista simples com botão adicionar
- Sem custo de pontos (3D&T não usa pontos para equipamentos)

### 8. História & Background
- Textarea para texto livre
- Sem custo de pontos

### 9. Botão Criar Personagem
- Desabilitado se nome vazio ou pontos negativos
- Ao clicar, salva personagem via API

## Painel do Mestre Criador

- Começa **colapsado** (não visível)
- Toggle via botão no topo
- Chat bidirecional com a IA do Mestre Criador
- O Mestre **reage às mudanças na ficha**: ao abrir o painel, recebe o estado atual e pode comentar/sugerir
- **Sugestões clicáveis**: o Mestre pode sugerir vantagens/desvantagens como cards que, ao clicar, adicionam direto na ficha
- O jogador pode **pedir sugestões**: "quero algo para combate aéreo" → Mestre responde com cards clicáveis
- Mobile: abre como drawer lateral (85vw), overlay escuro no fundo

## Catálogo de Vantagens/Desvantagens (Modal)

- Drawer/modal que abre sobre a ficha
- Header: título + busca inline
- Filtros: chips de tipo (ofensiva, defensiva, mágica, passiva, movimento) + tier
- Lista scrollável de cards:
  - Nome, tipo badge, custo, descrição
  - Botão "Adicionar" por card
  - Cards já selecionados aparecem como "Selecionado" (desabilitado)
- Footer: fechar

## Fluxo de Dados

### State (Zustand ou hook local)
```
{
  nome: string,
  nivelPoder: 'novato' | 'lutador' | 'campeao' | 'lenda',
  caracteristicas: { F: number, H: number, R: number, A: number, PdF: number },
  vantagensIds: number[],
  desvantagensIds: number[],
  focus: { fogo: number, agua: number, terra: number, ar: number, luz: number, trevas: number },
  equipamentos: number[],
  historia: string,
}
```

### Computações derivadas
- `pontosTotal` = lookup do nivelPoder (5/7/10/12)
- `pontosCaracteristicas` = soma dos valores de F/H/R/A/PdF
- `pontosVantagens` = soma dos custos das vantagens selecionadas
- `pontosFocus` = soma dos níveis de focus
- `pontosDesvantagens` = soma dos custos das desvantagens (negativos)
- `pontosUsados` = pontosCaracteristicas + pontosVantagens + pontosFocus
- `pontosRestantes` = pontosTotal + pontosDesvantagens - pontosUsados
- `temMagia` = alguma vantagem selecionada é do tipo mágico
- `pv` = 5 × R
- `pm` = temMagia ? 5 × max(H, PdF) : 0

### API de Criação
O payload final para `POST /personagens` incluirá:
- `sistema: 'tresdet'`
- `nome`, `nivelPoder`
- `caracteristicas` (objeto F/H/R/A/PdF)
- `vantagensIds`, `desvantagensIds`
- `focus` (objeto com 6 elementos)
- `equipamentosIds`
- `historia`

## Integração com Mestre Criador

O Mestre usa o endpoint existente `POST /mestre-criador/interagir` com `sistema: 'tresdet'`. A diferença é que na ficha livre, o Mestre não controla a navegação (não há `etapa_proxima`). Ele funciona como assistente reativo:

- Ao abrir o painel, envia o estado atual da ficha como contexto
- Jogador pode perguntar livremente
- Mestre retorna `sugestoes` como cards clicáveis (tipo vantagem/desvantagem)
- Clicar na sugestão adiciona à ficha e atualiza o pool

## Arquitetura de Componentes

```
PersonagemWizardPage (index.jsx)
├── WizardSystemPicker          (se !sistema → picker)
├── WizardWithSystem            (se sistema=lunaria|dnd5e → wizard linear)
└── TresDetFichaLivre           (se sistema=tresdet → ficha livre)
    ├── TresDetTopBar
    ├── TresDetPointsBar
    ├── TresDetNomeSection
    ├── TresDetCaracteristicasSection
    ├── TresDetVantagensDesvantagensSection
    │   └── CatalogoModal (shared)
    ├── TresDetFocusSection
    ├── TresDetEquipamentosSection
    ├── TresDetHistoriaSection
    ├── TresDetCriarButton
    └── MestrePanelLateral (colapsável)
```

### Arquivos novos
- `src/Pages/Personagem/Wizard/TresDetFichaLivre/index.jsx` — ViewModel
- `src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js` — Model (state, pontos, derivados)
- `src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.view.jsx` — View principal
- `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/` — seções e modal
- `src/Pages/Personagem/Wizard/TresDetFichaLivre/hooks/useTresDetPoints.js` — hook de cálculo de pontos

### Arquivos modificados
- `src/Pages/Personagem/Wizard/index.jsx` — adicionar branch para `tresdet` → `TresDetFichaLivre`

## Fora de Escopo (esta fase)

- Refatorar wizard de Lunaria ou D&D 5e
- Criar novos itens no catálogo (vantagens/desvantagens/focus)
- Persistência de rascunho (draft) para a ficha livre
- Geração de imagem do personagem
- Equipamentos (catálogo ainda não existe para 3D&T)

## Mockup de Referência

Mockup interativo disponível em: `/public/mockup-3det.html`
