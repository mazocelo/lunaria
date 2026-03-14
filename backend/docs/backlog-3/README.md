# Backlog 3 — Evolução do Mestre IA

Este backlog cobre a próxima camada de evolução do Lunaria após o fechamento do `backlog` original, da `review-1` e do avanço do `backlog-2`.

O foco aqui deixa de ser fechar frentes arquiteturais gerais e passa a ser:

- tornar o Mestre IA mais adaptativo;
- estruturar memória narrativa semântica;
- melhorar reação ao tom do jogador e à tensão da cena;
- reforçar desvantagens narrativas;
- evoluir o uso de vozes e segmentos sem quebrar o pipeline atual.

## Status

`backlog-3` está em andamento.

## Escopo inicial

| Tipo | Tema | Documento |
|------|------|-----------|
| Discussão | Evolução do Mestre IA | [discussoes/01-evolucao-mestre-ia.md](./discussoes/01-evolucao-mestre-ia.md) |

## Princípios

1. O código atual é a fonte de verdade de implementação.
2. O pipeline atual do Mestre não deve ser reescrito do zero sem necessidade.
3. TTS não deve voltar para o hot path síncrono do Mestre.
4. Segmentos narrativos são a base correta para evolução de voz/persona.
5. Memória nova deve complementar `resumos`, `mestreContexto` e contexto persistente, não duplicá-los sem critério.

## Fora de escopo imediato

- reescrever o `MestreAgent` inteiro;
- trocar o schema atual de resposta por um schema incompatível;
- mover geração de áudio para dentro do loop síncrono de narração;
- introduzir sistemas grandes de estado sem antes definir a fonte de verdade no backend.
