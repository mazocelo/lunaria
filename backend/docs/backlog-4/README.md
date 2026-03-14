# Backlog 4 - Integracao avancada do Mestre IA

Este backlog organiza a proxima camada de integracao do Mestre IA apos o inicio do `backlog-3` e a auditoria formal registrada na `review-3`.

O foco aqui nao e "reescrever completamente o MestreAgent". O foco e:

- consolidar o uso dos 4 pilares no fluxo real;
- enriquecer o state block do turno;
- expandir o schema JSON sem quebrar o contrato atual;
- evoluir o processador mecanico com acoes de cenario;
- aprofundar o uso do Story Blueprint e do resumo estruturado;
- fechar lacunas de runtime para combate, terreno, boss e batalha grande.

## Status

`backlog-4` em execucao. F01–F04 entregues, D01 documentado. Proxima frente: F05.

## Dependencias

Este backlog depende das seguintes premissas:

1. `review-3` continua sendo a auditoria-base desta frente.
2. `backlog-3` continua sendo a fonte de verdade para a evolucao narrativa do Mestre.
3. `F-01` de memoria semantica do `backlog-3` tem prioridade antes de partes do `backlog-4` que queiram injetar memoria extra no prompt.

## Escopo inicial

| Tipo | Tema | Documento |
|------|------|-----------|
| Discussao | Integracao avancada do Mestre IA | [discussoes/01-integracao-avancada-mestre-ia.md](./discussoes/01-integracao-avancada-mestre-ia.md) |
| Discussao | Arquitetura de estado tatico | [discussoes/02-estado-tatico.md](./discussoes/02-estado-tatico.md) |

## Principios

1. Nao reescrever o `MestreAgent` do zero sem necessidade.
2. Preservar compatibilidade com `segmentos`, `acoes`, `metadados` e `solicitaDados`.
3. Manter a sessao como fonte primaria de verdade para estado runtime.
4. Evitar criar estruturas Redis paralelas sem decisao arquitetural formal.
5. Nao recolocar TTS no hot path sincrono do Mestre.
6. Fazer extensoes incrementais, validaveis e revertiveis.

## Frentes

| Frente | Tema | Status |
|--------|------|--------|
| `B4-F01` | State block do turno v2 | concluido (`be9531f`) |
| `B4-F02` | Prompt 4 pilares e regras de cenario v2 | concluido (`500646f`) |
| `B4-F03` | Schema JSON compativel v2 | concluido (`3006b7f`) |
| `B4-F04` | Acoes mecanicas de cenario e combate expandido | concluido (`c7ccc22`) |
| `B4-D01` | Arquitetura de estado tatico (spec) | documentado |
| `B4-F05` | Runtime unificado de estado tatico | pendente |
| `B4-F06` | Blueprint contextual v2 | pendente |
| `B4-F07` | Resumo estruturado v2 | pendente |
| `B4-D02` | Validacao E2E, compatibilidade e fallbacks | pendente |

## Fora de escopo imediato

- substituir o schema atual por um schema incompatvel;
- mover audio/TTS para dentro do loop sincrono do Mestre;
- trocar a fonte de verdade de estado da sessao por varias chaves soltas em Redis;
- criar queries completas ao Prisma a cada turno sem prova de necessidade;
- executar a carta original literalmente como "big bang rewrite".

