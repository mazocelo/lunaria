# Lunaria Frontend

React 19 + Vite + Zustand 5 + Tailwind CSS 4, **100% TypeScript** (migrado em 2026-05; só testes legados continuam `.js`). Herda regras do CLAUDE.md raiz (`../CLAUDE.md`).

## TypeScript e contratos de API (Zod)

- **Proibido `any`** — ESLint com `@typescript-eslint/no-explicit-any: error`. Use `unknown` + narrowing ou tipe de verdade.
- Schemas Zod dos payloads da API vivem em `src/types/api/` (um arquivo por entidade; discriminated union por `sistema` quando multi-sistema).
- **Boundary fail-loud:** todo service valida a resposta com `parseRaw(schema, dado, 'NomeService.metodo')` ou `parseEnvelope(...)` de `src/types/api/parse.ts`. Falha de contrato lança `[contract:NomeService.metodo]` — é sinal de drift schema↔backend, nunca silencie com `any`.
- **Envelopes:** o canônico é `{ data, meta }`, mas a maioria dos controllers reais devolve o legado `{ success, data, message?, pagination? }` — use `assertLegacyEnvelope` (ver `src/services/EquipamentoService.ts`) conforme o endpoint.
- **Schema modela o que o backend REALMENTE devolve**, não o ideal: campos JSON serializados de formas variadas → `z.unknown()`; nomes de campo do backend são PT-BR (`senha`, não `password`). Confirme no controller antes de tipar.
- Hooks de contexto (`useTheme`/`useAuth`/`useLayout`/`useGameLoading`) são fail-loud: lançam fora do provider.
- Aliases de path resolvem via `vite-tsconfig-paths` (fonte única: `tsconfig.json`).
- Antes de entregar: `npm run typecheck` e `npm run lint` limpos.

## Arquitetura MVVM

Cada pagina segue `index.tsx (ViewModel) -> .model.ts (Model) -> .view.tsx (View)`.

### Model (.model.ts)
- Estado + fetch + normalizacao da entidade
- snake_case da API → camelCase, arrays safe, formatJson, relacoes resolvidas
- Metodos da entidade (recarregar, salvar, deletar)
- **Proibido:** useTheme, useNavigate, JSX, CSS

### ViewModel (index.tsx)
- Orquestracao pura: useNavigate, handlers de navegacao, logica de negocio
- Deve ser curto (< 30 linhas)
- **Proibido:** useTheme, JSX com className, montagem visual

### View (.view.tsx)
- Apresentacao completa: useTheme interno, badges, sections, stats
- Props tipadas (interface explicita), dados normalizados do Model + handlers do ViewModel
- **Proibido:** useNavigate, normalizacao de dados, acesso a campos snake_case da API

### Referencia
- `src/Pages/Monstro/Ver/` — implementacao de referencia
- `docs/architecture/MVVM-GUIDELINES.md` — guidelines completas

## Componentes Compartilhados

- `CatalogCard` — card de listagem com imagem, rarity glow, gallery lightbox
- `CatalogDetailLayout` — layout de detalhe com tema Vitral Arcano
- `catalogDetailHelpers` — StatRow, ChipGroup, AtributoBar, formatJson, RARIDADE_CONFIG
- `ImageLightbox` — lightbox com navegacao prev/next e teclado

## Padroes

- **Tema:** View resolve `isLight` via `useTheme()`, nunca recebe como prop
- **Navegacao:** ViewModel resolve handlers, View recebe `onVerX`, `onBack`, `onEdit`
- **Tipografia:** `font-fantasy` (EB Garamond) para titulos, `font-modern` (DM Sans) para corpo
- **Deploy:** `sudo rm -rf dist && npx vite build && sudo cp -r dist/* /var/www/lunaria-front/`
