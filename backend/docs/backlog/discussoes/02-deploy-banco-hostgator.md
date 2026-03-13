# D-02 - Deploy e banco na HostGator

## Tipo

Discussao

## Prioridade

Maturar ideia

## Contexto

O projeto ja esta em um ponto em que deploy inseguro custa caro. Hoje existe um ponto de risco explicito: o `heroku-postbuild` do backend ainda usa `prisma db push --accept-data-loss`.

Arquivo de referencia:

- `Backend/package.json`

Isso e aceitavel como fase inicial de experimentacao, mas nao como base de um ambiente estavel de hospedagem propria.

## Problema atual

- `db push` em producao aumenta risco de drift e mudancas perigosas
- faltam passos claros de release
- faltam garantias sobre ordem correta:
  - backup
  - migrate
  - build
  - restart

## Como deve ser

O deploy para HostGator/VPS precisa ficar previsivel e repetivel, com:

- build deterministico
- migracoes aplicadas de forma explicita
- restart controlado
- rollback operacional simples

## Recomendacao inicial

Para a primeira fase, eu nao criaria um sistema separado. Eu faria um fluxo de release shell-based, com:

- `git pull --ff-only`
- `npm ci`
- `prisma generate`
- `prisma migrate deploy`
- build do frontend
- restart por PM2

Sem `db push --accept-data-loss`.

## Script inicial

Template criado em:

- `Backend/scripts/hostgator-release.sh`

Esse script assume:

- Linux
- Node instalado
- PM2 disponivel
- repo ja clonado
- `.env` ja configurado

## Decisoes a maturar

- HostGator sera VPS ou compartilhado?
- backend e frontend rodam na mesma maquina?
- o banco fica remoto ou local?
- havera backup automatico antes de migracao?

## Proxima versao desejada

Fase 2:

- preflight de saude
- backup antes de migracao
- lock de release
- rollback operacional
- healthcheck pos deploy

## Criterios de aceite

- o fluxo de deploy nao usa mais `db push --accept-data-loss`
- o deploy e reproduzivel por script
- migracoes passam a ser controladas por `prisma migrate deploy`
- backend e frontend reiniciam de forma previsivel

## Handoff para outra instancia

Objetivo: endurecer o processo de deploy e banco para a futura hospedagem na HostGator/VPS.

Contexto atual:

- hoje o projeto ainda carrega um fluxo de build/deploy permissivo demais
- existe um template inicial de release shell em `Backend/scripts/hostgator-release.sh`
- a decisao de infra final ainda nao esta fechada

O que fazer:

- adaptar o script ao ambiente real de hospedagem
- remover dependencia de `db push --accept-data-loss`
- formalizar passo de migrate + restart

Entregaveis:

- processo de release seguro
- script adaptado ao ambiente real
- checklist operacional

## Nota sobre o script

O script criado agora e um template de partida. Ele nao substitui a validacao do ambiente final da HostGator.
