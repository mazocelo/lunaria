# Plano Parte 2 - Detector de Alegacoes Concretas

## Objetivo

Adicionar um detector enxuto para validar alegacoes concretas do jogador antes que elas virem fato narrativo ou efeito mecanico.

Este detector nao e um "agente debatendo toda fala". Ele e uma checagem curta de coerencia factual.

## O que ele valida

- item citado existe no inventario atual
- habilidade ou magia existe na ficha real
- recurso declarado existe e esta disponivel
- mana, cooldown e consumiveis sao compativeis
- equipamento forte ou raro foi realmente obtido
- conhecimento alegado ja foi descoberto em jogo
- fato previo citado bate com historico e contexto

## Saidas esperadas

- `ok`
- `suspeito`
- `inexistente`
- `incerto`

## Regra de precedencia

Quando houver conflito:

1. mecanica
2. detector
3. narrativa

Regra pratica:

- se a mecanica ja validou explicitamente a habilidade ou recurso, o detector nao bloqueia depois
- se o detector encontra inconsistencia concreta antes da resolucao, a narrativa nao deve transformar isso em fato verdadeiro

## Fontes de verdade

Consultar, em ordem:

1. `turnState` do jogador
2. `sessao.personagensCompletos`
3. `estadoJogo.personagemSessao[userId]`
4. historico canonico da sessao
5. contexto persistente do Mestre

## Janela de consistencia

O detector nao deve olhar apenas para estado consolidado. Tambem precisa considerar:

- item ganho no mesmo turno
- cooldown encerrado agora
- efeito aplicado agora
- recurso gasto ou restaurado agora
- acoes mecanicas ja processadas no proprio ciclo

Objetivo:

- evitar falso positivo por atraso de sincronizacao

## Gatilhos minimos

Disparar quando o jogador fizer alegacao concreta como:

- "eu saco"
- "eu puxo"
- "eu uso"
- "eu ativo"
- "eu conjuro"
- "eu ja tinha"
- "eu trouxe comigo"
- "eu ja sabia"
- "eu ja combinei"

## Acoes simples que devem ativar checagem leve

- usar habilidade
- usar magia
- sacar item especifico
- trocar para arma ou equipamento especifico
- beber pocao
- usar consumivel ou ferramenta
- alegar que possui item-chave

## Acoes suspeitas que devem ativar com prioridade alta

- sacar item forte que nunca apareceu antes
- declarar arma lendaria ou artefato inexistente
- usar habilidade ou magia fora da ficha
- alegar recurso extra nao ganho
- dizer que "ja tinha preparado isso" sem historico que suporte
- afirmar senha, fraqueza, local secreto ou combinacao previa com NPC sem pista anterior

## Quando nao acionar

- roleplay simples
- fala emocional
- postura ou humor
- flavor sem consequencia mecanica
- continuacao comum de conversa

## Normalizacao e aliases

Normalizacao minima obrigatoria:

- lowercase
- trim
- remocao de acentos
- remocao de pontuacao irrelevante
- singular/plural simples quando seguro

Aliases permitidos:

- com e sem acento
- forma resumida claramente equivalente
- nome composto vs versao curta conhecida

Regra:

- matching parcial so quando for seguro e sem ambiguidade
- se houver mais de um candidato plausivel, retornar `suspeito` ou `incerto`

## Hard block vs soft block

### Hard block

Usar quando houver:

- habilidade inexistente
- magia inexistente
- item ou equipamento inexistente
- mana insuficiente
- cooldown impossivel
- consumivel inexistente
- artefato forte nao obtido

Resposta:

- bloquear mecanicamente
- impedir narrativa de tratar a alegacao como verdade
- responder com rejeicao controlada ou falha coerente

### Soft block

Usar quando houver:

- fato previo nao sustentado
- preparo anterior nao comprovado
- conhecimento incerto
- combinacao com NPC nao registrada
- improviso plausivel, mas nao confirmavel

Resposta:

- pedir clarificacao
- converter em teste
- converter em investigacao
- narrar com incerteza

## Bypass controlado do Mestre

`inexistente` nao significa sempre veto seco.

Em alguns casos, o Mestre pode converter uma alegacao invalida em saida controlada:

- item inexistente vira improviso pobre
- tecnica inexistente vira tentativa arriscada com teste
- "eu ja tinha preparado isso" vira flashback curto com custo

Regras:

- nunca conceder beneficio cheio de algo inexistente
- se houver improviso, adicionar custo, risco, limitacao ou teste
- se a alegacao for absurda ou quebrar o jogo, manter hard block

## Retcon e preparo previo

### Retcon leve permitido

Aceitavel quando:

- plausivel para a classe ou ficha
- nao contradiz fato ja estabelecido
- nao gera vantagem desproporcional
- parece preparacao razoavel

Exemplos:

- "eu trouxe corda"
- "eu tinha separado uma tocha extra"
- "eu ja deixei minhas ferramentas faceis de alcancar"

### Retcon bloqueado

Bloquear ou endurecer quando:

- contradiz algo ja narrado
- cria recurso raro sem obtencao previa
- concede conhecimento critico sem pista
- tenta resolver cena importante por conveniencia retroativa

## Onde encaixar no pipeline

O detector deve rodar:

1. depois da sanitizacao da entrada
2. antes da narrativa final
3. antes da aplicacao mecanica quando a alegacao puder alterar regra

Separacao recomendada:

- combate e testes: antes da resolucao da acao
- roleplay e exploracao: antes da narracao final

## Plano minimo em 3 fases

### Fase 1 - Itens, habilidades e recursos

Cobrir:

- item citado existe no inventario
- habilidade ou magia existe na ficha
- mana, cooldown e recurso disponivel

Saida:

- alerta curto injetado no contexto do Mestre
- bloqueio mecanico quando aplicavel

### Fase 2 - Fatos e preparo previo

Cobrir:

- "eu ja sabia"
- "eu ja tinha"
- "eu ja combinei"
- "eu trouxe isso antes"

Saida:

- checagem contra historico e contexto persistente
- `incerto` ou `inexistente` quando nao houver suporte

### Fase 3 - Ajuste fino

Cobrir:

- reduzir falso positivo
- melhorar parser de alegacoes
- melhorar mensagens de clarificacao

## Shape interno sugerido

```js
{
  status: 'ok' | 'suspeito' | 'inexistente' | 'incerto',
  tipo: 'item' | 'habilidade' | 'recurso' | 'fato_previo' | 'conhecimento',
  claim: 'texto resumido da alegacao',
  motivo: 'nao encontrado no inventario',
  fonte: 'turnState.inventario',
  acaoRecomendada: 'bloquear' | 'pedir_clarificacao' | 'converter_em_teste' | 'seguir',
  blockLevel: 'hard' | 'soft',
  confidence: 0.0,
  candidatos: [],
  estadoTransitorioConsiderado: true
}
```

## Tom da resposta

O Mestre nao deve soar acusatorio.

Evitar:

- "isso e mentira"
- "voce esta tentando enganar o sistema"

Preferir:

- "voce procura esse item entre seus pertences, mas ele nao esta la"
- "voce nao encontra lastro para essa tecnica no que domina hoje"
- "isso nao bate com o que voce carrega agora"

## Observabilidade

Logar apenas quando disparar:

- `roomId`
- `userId`
- `tipo`
- `status`
- `claim`
- `fonte`
- `acaoRecomendada`

## QA do detector

### Casos obrigatorios

- habilidade inexistente
- magia inexistente
- item existente com alias
- item inexistente
- fato previo inventado
- conhecimento nao sustentado
- acao simples que nao deve disparar
- item ganho no mesmo turno
- cooldown e mana recem-alterados
- reconexao com teste pendente

### Resultado esperado

- bloqueia o que precisa bloquear
- nao trava acoes simples
- nao acusa mentira por atraso de sincronizacao
- usa tom nao acusatorio
- nao contradiz a mecanica ja validada

## Criterio de pronto

Esta parte esta pronta quando:

- habilidade inexistente nunca vira efeito narrativo forte
- item inexistente nao vira equipamento valido em cena
- recurso extra nao passa sem validacao
- fato previo inventado nao e aceito automaticamente
- falso positivo fica baixo o suficiente para nao irritar o jogador
