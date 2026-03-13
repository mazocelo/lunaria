# Backlog Estruturado

Este backlog foi organizado para ser reutilizado por outras instancias de trabalho.
Cada item tem contexto suficiente para uma outra instancia abrir o arquivo e continuar a execucao sem depender desta conversa.

## Como usar

Cada arquivo foi separado por tipo:

- `features/`: backlog de implementacao direta
- `discussoes/`: backlog de decisao, arquitetura ou maturacao de ideia
- `assets/`: materiais de apoio, templates e scripts

Todos os arquivos seguem a mesma ideia:

- contexto atual do projeto
- problema observado
- estado desejado
- arquivos mais impactados
- plano de execucao
- criterios de aceite
- handoff pronto para outra instancia

## Ordem recomendada

1. [F-01 Fechar contrato publico do websocket](./features/01-contrato-publico-websocket.md)
2. [F-02 Modularizar o motor do jogo](./features/02-modularizacao-motor-do-jogo.md)
3. [D-01 Jobs duraveis para IA](./discussoes/01-jobs-duraveis-ia.md)
4. [F-03 Controles de produto para IA](./features/03-controles-de-produto-para-ia.md)
5. [D-02 Deploy e banco na HostGator](./discussoes/02-deploy-banco-hostgator.md)
6. [D-03 Observabilidade e admin do motor](./discussoes/03-observabilidade-admin-motor.md)

## Observacoes

- O item de websocket esta marcado como alta prioridade porque o runtime real ja mudou, mas a documentacao e parte do contrato publico ainda nao refletem isso.
- O item de deploy/banco e o item de observabilidade estao marcados como "maturar ideia", mas ja possuem direcao recomendada e material inicial para acelerar a decisao.
- O script de deploy inicial para HostGator/VPS esta em [assets/hostgator-release-template.sh](./assets/hostgator-release-template.sh).
