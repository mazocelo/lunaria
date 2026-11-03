# Game Documentation — Design Spec

**Data:** 2026-03-21
**Objetivo:** Documentação do jogo em Markdown que reflete como HTML no frontend.

## Duas audiências, duas rotas

### Jogador (`/docs`)
Linguagem acessível, sem fórmulas. Qualquer usuário logado acessa.

### Admin/Interno (`/admin/docs`)
Mecânicas completas, fórmulas, decisões de design, como a IA funciona. Só role admin. Protegido pelo mesmo guard de rota que `/admin/*` já usa no React Router.

Sem duplicação — jogador explica conceitos, interno explica implementação. Não se sobrepõem.

## Estrutura de arquivos

```
frontend/docs/
  jogador/
    index.md            — sumário com links
    como-jogar.md       — fluxo: criar conta → escolher história → jogar
    atributos.md        — o que cada atributo faz (sem fórmulas)
    combate.md          — como funciona combate (linguagem acessível)
    progressao.md       — níveis, XP, evolução

  interno/
    index.md            — sumário técnico
    formulas.md         — HP, MP, DC, TA, dano, XP — todas as fórmulas
    engine.md           — game engine, 3 camadas de intent, fluxo de turno
    mestre-ia.md        — tiers, prompts, fallback chain, revisores
    combate-engine.md   — ciclo server-side, initiative, avancarTurno, auto-resolve
```

## Build e renderização

- Plugin Vite processa `docs/**/*.md` no build time via `vite-plugin-md` ou custom plugin com `markdown-it`
- Output vira assets estáticos — zero runtime parsing
- Sidebar gerada a partir dos `index.md` — formato é lista de links markdown:
  ```markdown
  - [Como Jogar](como-jogar.md)
  - [Atributos](atributos.md)
  ```
  O plugin parseia esses links para gerar a navegação. Ordem dos links = ordem na sidebar.
- Navegação SPA sem reload (lazy load dos HTMLs)
- Estilo segue o tema escuro/roxo do app

## Rotas

- `/docs` → nova rota top-level no React Router, layout próprio (sidebar + conteúdo)
- `/admin/docs` → aninhada no layout admin existente, reutiliza guard de role
- Sidebar esquerda + conteúdo à direita
- Admin vê seção "Interno" + seção "Jogador" na sidebar

## Conteúdo — Jogador

### como-jogar.md
- Criar conta, escolher história, selecionar personagem
- Como funciona o turno (você age, Mestre narra)
- Botões de ação (Atacar, Defender, Fugir, Habilidades, Magias)
- Como rolar dados
- O chat e interação com o Mestre

### atributos.md
- Força (dano corpo a corpo), Destreza (precisão), Constituição (resistência)
- Agilidade (esquiva), Inteligência (magias), Carisma (influência social e mana)
- O que cada um afeta sem expor fórmulas

### combate.md
- Iniciativa (quem age primeiro)
- Seu turno: escolher ação, rolar ataque, rolar dano
- Turno do monstro: automático
- Defesa: se proteger pra reduzir dano
- Fuga: tentativa de escapar do combate
- Habilidades e magias: poderes especiais
- Efeitos de status: veneno, atordoamento, queimadura, etc.
- Vitória e derrota

### progressao.md
- XP por combate e ações narrativas
- Subir de nível, o que melhora
- Equipamentos, vantagens

## Conteúdo — Interno

### formulas.md
- Modificador: `floor((atributo - 10) / 2)`
- HP: `mult_raca × (nivel + max(1, modCON))`
- MP: `max(5, 10 + nivel + (max(modINT, modCHA) × 2))`
- DC Esquiva: `10 + modAGI`
- Absorção (TA): `max(0, modCON-1)d4 + armadura`
- Ataque: `d20 + modDEX + bonusNivel`
- Dano: `dado + modFOR` (melee) / `dado + modDEX` (ranged)
- bonusNivel: `floor(nivel / 2)`
- DC Fuga: `d20 + modAGI vs 10 + (monstros_vivos × 2)`
- DC Resistência Mágica: `8 + custo_mana + floor(max(modINT, modCHA) / 2)`
- XP por combate, mult_raca por raça
- Efeitos de status: Stunned, Paralyzed, Frozen, Poisoned, Burning, Blinded — DCs e duração
- Concentração: quando quebra, DC, consequências
- Defesa: DC +2, 50% redução de dano

### engine.md
- gameEngine facade: prepararTurno → resolverTurno → formatarContexto
- 3 camadas de intent: Regex → Flash Lite → Mestre intentSugerido
- Unified reviewer: quando roda, o que valida
- Fluxo: mensagem → intent → teste → resolução → narração

### mestre-ia.md
- 5 tiers com modelos:
  - Pescador: Gemini 2.5 Flash Lite
  - Poeta: Gemini 2.5 Flash
  - Bardo: Gemini 3 Flash Preview
  - Profeta: Gemini 3.1 Pro
  - Profetisa: Claude Sonnet 4.6
- Fallback chain do roteiro: Gemini 3.1 Pro → Claude Sonnet → Gemini 2.5 Pro
- Montagem do prompt do Mestre (contexto, regras, personalidade)
- Revisores: o que validam, quando rodam

### combate-engine.md
- iniciarCombate → initiative rolls → fase combate
- avancarTurno: skip dead, track rounds, passedZero
- executarTurnoMonstro: auto-resolve com fórmulas
- Fluxo: attack_roll → damage_roll → absorção → HP update → próximo turno
- Condições de fim (vitória, derrota, fuga)
- Status effects: aplicação, checagem por rodada, remoção
- Concentração: checagem ao tomar dano

## Implementação

Duas tarefas separadas:
1. **Infra** — Plugin Vite, rotas, layout, sidebar, renderização
2. **Conteúdo** — Escrita dos MDs (pode ser paralela após infra pronta)

## Migração

- `backend/docs/REGRAS_BATALHA.md` é deletado após conteúdo absorvido em `jogador/combate.md` + `interno/formulas.md` + `interno/combate-engine.md`
