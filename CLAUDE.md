# Lunaria - The Fable Forge

RPG de mesa digital com IA. Stack: Node.js 22 + Express + Prisma (PostgreSQL) + Redis + BullMQ + Socket.io | React 19 + Vite + Zustand + Tailwind.

## Regras de Código

### 1. Clean Code
- Use nomes descritivos e consistentes com o padrão já existente no projeto.
- Evite abreviações ambíguas, nomes genéricos e funções com múltiplas responsabilidades.
- Cada função deve fazer uma coisa só, de forma clara e previsível.

### 2. DRY
- Antes de criar algo novo, verifique se já existe implementação igual ou semelhante no projeto.
- Reutilize código existente sempre que fizer sentido.
- Extraia lógica repetida apenas quando a repetição for real e recorrente, sem criar abstrações prematuras.

### 3. Segurança
- Nunca coloque credenciais, tokens, segredos ou chaves no código.
- Use variáveis de ambiente para qualquer dado sensível.
- Valide entradas externas e sinalize vulnerabilidades óbvias quando encontrá-las.

### 4. Respostas Diretas
- Entregue código funcional, nunca pseudocódigo.
- Responda exatamente ao que foi pedido, sem expandir escopo.
- Evite comentários desnecessários; comente apenas o que não for óbvio.

### 5. KISS
- Prefira sempre a solução mais simples que resolva o problema corretamente.
- Evite over-engineering, abstrações desnecessárias e dependências sem necessidade real.
- Só otimize quando houver impacto concreto em performance, legibilidade ou manutenção.

### 6. SOLID
- Respeite a estrutura e os padrões já adotados no projeto.
- Mantenha separação clara de responsabilidades.
- Só proponha mudanças estruturais quando o desenho atual realmente dificultar a manutenção.

### 7. Robustez
- Corrija bugs evidentes no código que estiver tocando.
- Considere edge cases prováveis.
- Falhe cedo, com erro claro e útil para diagnóstico.

### 8. Comportamento
- Faça apenas o que foi solicitado.
- Não invente requisitos, não antecipe features e não ofereça sugestões não pedidas.
- Se houver incerteza relevante, admita claramente.

### 9. Documentação
- Não gere documentação, README ou explicações longas sem solicitação explícita.
- Quando documentação for pedida, seja breve, objetiva e focada no que realmente importa.

## Regras Técnicas

### Self-Documenting Code
- O código deve comunicar intenção por meio de nomes claros.
- Comentários devem explicar o motivo, nunca descrever o óbvio.

### Fail Early, Fail Loud
- Use guard clauses no início.
- Retorne erros específicos e contextuais.
- Nunca falhe de forma silenciosa nem retorne `null` sem intenção explícita.

### Single Responsibility
- Se uma função ou módulo faz mais de uma coisa, divida.
- Buscar, transformar e persistir são responsabilidades separadas.

### Deletability > Reusability
- Prefira baixo acoplamento e dependências explícitas.
- Reutilização excessiva cedo demais costuma piorar o design.
- Duplique até surgir um padrão claro; abstraia depois.

### Absolute Consistency
- Mantenha um único padrão de naming, erros, estrutura de pastas e fluxo de dados.
- Se o projeto usa `Controller -> Service -> Repository`, siga isso.
- Retornos devem manter formato previsível, como `{ data, meta }`.

## Padrões do Projeto

- **Prisma:** no desenvolvimento use `db push`; nunca use `migrate reset`. Deploy usa `prisma migrate deploy`.
- **Frontend:** 100% TypeScript; padrão MVVM `index.tsx (ViewModel) -> nome.model.ts (Model) -> nome.view.tsx (View)`; contratos de API validados com Zod (`src/types/api/`, fail-loud); regras completas em `frontend/CLAUDE.md`.
- **Build:** use `NODE_OPTIONS="--max-old-space-size=4096"` quando necessário.
- **Git:** publique tanto no monorepo quanto nos repositórios individuais.
- **Imports:** prefira `@utils` em vez de `@/lib/utils`.
- **Backend:** padrão `Controller -> Service -> Model/Prisma`.
- **Image provider:** Nano Banana 2 (Google Gemini) é o provider oficial. Leonardo AI como fallback.
- **R2 bucket:** `lunaria-images` para imagens, `lunaria-tts` para áudio.

## Repositório

- **Monorepo:** `backend/` (API Node.js + Socket.IO, agentes, Prisma) e `frontend/` (SPA React + TypeScript). Cada pasta mantém o histórico de commits do repositório de origem.
- **Docs:** `docs/superpowers/` (specs e plans), `docs/referencia-design/` (4 pilares, sistema de atributos, catálogos JSON), `docs/analises/`.
