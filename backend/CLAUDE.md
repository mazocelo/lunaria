# Lunaria RPG — Backend

Backend do Lunaria - The Fable Forge. Herda todas as regras do `CLAUDE.md` raiz
(`../CLAUDE.md`) — este arquivo cobre apenas o que e especifico
do backend.

## Tech Stack

- Node.js 22 (ESM) + Express 4. Entrada: `bin/www`; worker de jobs: `bin/worker`.
- Prisma 6 sobre PostgreSQL (~50 models: RPG, social e infra).
- Redis + BullMQ + ioredis (filas/jobs); Socket.IO (realtime das salas de jogo).
- IA via LangChain (`@langchain/anthropic`, `google-genai`, `groq`, `openai`) +
  `@anthropic-ai/sdk` + `@google/genai` — Gemini Flash/Lite, Claude Sonnet,
  Groq Llama.
- Cloudflare R2 via `@aws-sdk/client-s3`; `nodemailer`, `swagger`, `pino`,
  `helmet`, `express-rate-limit`, `express-validator`, `zod 4`.
- Testes: Vitest. Processo: PM2 (`ecosystem.config.cjs`).

## Arquitetura

- Camadas: **`Controller -> Service -> Model/Prisma`**. Cada camada com
  responsabilidade unica (buscar, transformar e persistir sao separados).
- Retornos de API no formato previsivel `{ data, meta }`.

### Politica de envelope de resposta

- **Endpoints novos** usam `helpers/responseHelper.js` (`sendSuccess`/`sendCreated`/
  `sendPaginated`/`sendError`), que devolvem o envelope canonico `{ data, meta }`.
- **Endpoints legados** devolvem o envelope antigo `{ success, data, message?,
  pagination? }` (~233 call-sites em ~20 controllers de catalogo). **Nao migrar em
  big-bang** — custo alto, valor baixo. Migre de forma **oportunista**: ao tocar um
  controller por outro motivo, converta os handlers daquele arquivo para o
  `responseHelper`. O frontend cobre os dois formatos via `assertLegacyEnvelope`
  (legado) e `parseEnvelope` (canonico) em `src/types/api/parse.ts`.
- **Campos Json de catalogo** sempre saem como objeto/array (nunca string JSON):
  normalize a entrada com `helpers/catalogJsonHelper.js` (`normalizarJsonCatalogo`
  para colunas `Json?` cruas; serializers dedicados p/ vantagem/desvantagem,
  habilidade, classe/raca). Colunas `String` que guardam JSON (ex.: `racas.bonus`)
  recebem `JSON.stringify` apenas no boundary de persistencia do controller.
- Pastas: `controllers/`, `services/`, `Model/`, `game-systems/`, `jobs/`,
  `websocket/`, `routes/`, `middleware/`, `prisma/`, `redis/`, `config/`,
  `helpers/`, `bin/`, `scripts/`, `tests/`.
- **`backend/agents/` sao agentes de IA do jogo (mestre/NPC)** — nao confundir com
  subagentes do Claude Code.
- Suporte multi-sistema (D&D 5e, 3D&T, HM): ao alterar racas/classes/magias/
  monstros, garanta que nenhum sistema quebra.

## Convencoes do backend

- **Prisma:** no desenvolvimento use `db push`; nunca `migrate reset`. Deploy usa
  `prisma migrate deploy`.
- **Build:** `NODE_OPTIONS="--max-old-space-size=4096"` quando necessario.
- **Imports:** prefira `@utils` em vez de `@/lib/utils`.
- **Git:** publique tanto no monorepo quanto nos repositorios individuais.
- **Imagens:** provider oficial Nano Banana 2 (Google Gemini); Leonardo AI como
  fallback. Buckets R2: `lunaria-images` (imagens), `lunaria-tts` (audio).

## Comandos

`npm run dev` (nodemon `bin/www`) · `npm run worker` · `npm test` ·
`npm run check-db` · `npm run pm2:start|reload|logs|monit`
