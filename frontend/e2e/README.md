# Suite E2E — Lunaria (frontend)

Testes end-to-end com [Playwright](https://playwright.dev/) que servem de rede
de regressao para os deploys do frontend. Sobem o app de verdade no browser,
navegam pelos fluxos criticos e falham se algo quebrar.

## Pre-requisitos

A suite assume um ambiente Lunaria completo no ar:

1. **PostgreSQL** e **Redis** rodando.
2. **Backend** (`/opt/role-chat-game/backend`): `npm run dev`.
3. **Frontend** (`/opt/role-chat-game/frontend`): `npm run dev` — confirme a
   porta no terminal do Vite.
4. Uma **conta de teste** valida no banco usado pelo backend.

Os browsers do Playwright precisam estar instalados uma vez:

```bash
npx playwright install chromium
```

## Como rodar

A partir de `/opt/role-chat-game/frontend`:

```bash
npm run test:e2e            # roda toda a suite
npx playwright test login   # roda so um arquivo
npx playwright test --ui    # modo interativo
npx playwright show-report  # abre o ultimo relatorio HTML
```

## Configuracao (variaveis de ambiente)

Tudo e configuravel por env var — nada de credencial hardcoded.

| Variavel       | Default                         | Descricao                          |
| -------------- | ------------------------------- | ---------------------------------- |
| `E2E_BASE_URL` | `http://localhost:5173`         | URL do frontend sob teste          |
| `E2E_EMAIL`    | *(obrigatória)*                 | E-mail da conta de teste           |
| `E2E_SENHA`    | *(obrigatória)*             | Senha da conta de teste            |
| `CI`           | —                               | Quando setado, ativa retries/HTML  |

Exemplo apontando para outra porta/ambiente:

```bash
E2E_BASE_URL=http://localhost:5199 \
E2E_EMAIL=meu-qa@exemplo.com \
E2E_SENHA='minha-senha' \
npm run test:e2e
```

## Fluxos cobertos

| Arquivo                            | Fluxo                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| `tests/login.spec.js`              | Login: sucesso, senha invalida, validacao de campos    |
| `tests/criar-personagem-3det.spec.js` | Criacao de personagem 3D&T (ficha-livre, deterministico) |
| `tests/criar-personagem-lunaria.spec.js` | Seletor de sistema + montagem do wizard Lunaria  |
| `tests/catalogos.spec.js`          | Catalogos: Habilidades, Classes, Racas, Monstros       |
| `tests/crawler.spec.js`            | Crawler das rotas autenticadas (sem 5xx / erro / branco) |

## Notas de escopo

- **Wizard Lunaria:** a criacao completa e conduzida por chat com o Mestre IA
  (LLM real). E lenta, nao-deterministica e consome cota, entao a suite cobre
  apenas a parte deterministica (seletor, montagem, catalogos, render da 1a
  etapa). O teste de criacao completa via chat existe como `test.skip`.
- **Combate:** fora da suite — dispara LLM real e custa cota.
- **Sem sleeps fixos:** todos os testes esperam por elementos/respostas de rede.
  Se algum teste ficar flaky, prefira corrigir o `waitFor` em vez de adicionar
  `waitForTimeout`.

## Artefatos

`playwright-report/`, `test-results/` e screenshots de run sao ignorados pelo
git (ver `.gitignore`). O codigo da suite (`e2e/`) e versionado.
