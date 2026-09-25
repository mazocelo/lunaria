# LUNARIA — Sistema de Atributos

> Guia completo de referência para o sistema de 6 atributos do Lunaria.
> Versão 1.0 — Março 2026

---

## Visão Geral

O sistema de atributos do Lunaria é construído sobre **6 características fundamentais** que definem tudo o que um personagem pode fazer. Cada atributo governa um conjunto específico de ações, testes e capacidades, e influencia diretamente como o Mestre IA narra e resolve situações durante as sessões.

A filosofia do sistema é a **clareza de propósito**: cada atributo tem um domínio bem definido, sem zonas cinzentas. Quando um jogador descreve uma ação, tanto o Mestre IA quanto o jogador devem saber intuitivamente qual atributo será testado.

Os 6 atributos formam **3 pares de opostos temáticos**. Investir fortemente num atributo define naturalmente a fraqueza do personagem no atributo oposto, criando builds com personalidade e tradeoffs interessantes.

| Sigla | Atributo | Domínio | Palavra-Chave | Oposto |
|-------|----------|---------|---------------|--------|
| **FOR** | Força | Corpo | Dano corpo a corpo | Inteligência |
| **INT** | Inteligência | Mente | Poder mágico arcano | Força |
| **AGI** | Agilidade | Reflexo | Esquiva, iniciativa | Constituição |
| **CON** | Constituição | Vitalidade | HP, resistência | Agilidade |
| **DEX** | Destreza | Precisão | Ataque à distância | Carisma |
| **CAR** | Carisma | Presença | Persuasão, liderança | Destreza |

---

## Os 3 Pares Opostos

Os atributos são organizados em 3 pares que representam tensões fundamentais na construção de personagem. Essa estrutura não é apenas temática: ela guia o balanceamento do sistema e ajuda o Mestre IA a entender rapidamente o perfil de cada personagem.

### Par 1: FORÇA ↔ INTELIGÊNCIA
**Corpo versus Mente**

O clássico corpo versus mente. Um personagem investido em Força resolve problemas na base da força bruta — arrombando portas, esmagando inimigos, carregando aliados. Investido em Inteligência, resolve com raciocínio — decifrando enigmas, identificando fraquezas, lançando magias devastadoras. O Bárbaro e o Mago são os dois extremos desse espectro.

### Par 2: AGILIDADE ↔ CONSTITUIÇÃO
**Evasão versus Resistência**

A escolha fundamental de defesa: você desvia ou você aguenta? O Monge é ágil mas frágil — se o golpe acertar, dói. O Guerreiro pesado é lento mas tanque — leva o golpe de frente e mal sente. O sistema de combate reflete isso diretamente: esquiva é baseada em Agilidade, e absorção de dano é baseada em Constituição + armadura.

### Par 3: DESTREZA ↔ CARISMA
**Sutileza versus Presença**

O sutil versus o presencial. O Ladino age nas sombras com precisão cirúrgica — ninguém o vê, ninguém o ouve. O Paladino comanda com presença imponente — todos olham pra ele quando entra na sala. O Assassino é invisível; o Bardo é o centro das atenções. São abordagens opostas para resolver os mesmos problemas.

```
          FOR ↔ INT
         (poder vs saber)
        /               \
  AGI ↔ CON          DEX ↔ CAR
 (evasão vs tanque)  (sutil vs presença)
```

---

## Detalhamento dos Atributos

### FOR — Força

Representa o poder bruto, a capacidade muscular e a presença física do personagem. Força determina quanto dano ele causa em combate corpo a corpo, quanto peso consegue carregar, e sua capacidade de realizar feitos físicos como arrombar portas, empurrar obstáculos ou segurar alguém.

**O que governa:**
- Dano corpo a corpo (armas de contato)
- Capacidade de carga e arrombamento
- Testes de escalar, nadar contra correnteza, agarrar
- Manobras de combate (derrubar, empurrar, prender)

**Classes primárias:** Bárbaro, Gladiador, Guerreiro Mágico, Paladino

**Exemplos de testes:**
- Arrombar uma porta trancada
- Segurar uma ponte que está cedendo
- Esmagar a armadura de um inimigo
- Empurrar um bloco de pedra pesado

**Par oposto — Inteligência:** O clássico corpo versus mente. Um personagem investido em Força resolve problemas com músculos; investido em Inteligência, com raciocínio.

---

### INT — Inteligência

Representa a capacidade intelectual, memória, raciocínio lógico e conhecimento arcano do personagem. Inteligência é o atributo primário de conjuradores que estudam magia, e determina a capacidade de aprender, deduzir, e resolver enigmas.

**O que governa:**
- Poder mágico arcano (dano e DC de magias)
- Testes de conhecimento (história, arcano, natureza, religião)
- Investigação e dedução lógica
- Número de magias conhecidas
- Identificação de itens mágicos e efeitos

**Classes primárias:** Mago, Elementalista, Necromante, Alquimista, Inventor

**Exemplos de testes:**
- Decifrar runas antigas numa parede
- Identificar o tipo de veneno usado
- Lembrar a história de uma ruína
- Deduzir a solução de um puzzle mecânico

**Par oposto — Força:** O estudioso não carrega espadas pesadas; o guerreiro não lê grimórios. A tensão entre poder físico e mental define os dois grandes arquétipos do RPG.

---

### AGI — Agilidade

Representa a velocidade de reação, equilíbrio corporal, coordenação motora ampla e capacidade de se mover rapidamente. Agilidade governa a esquiva em combate, a ordem de iniciativa, e qualquer ação que envolva o corpo inteiro em movimento.

**O que governa:**
- Esquiva (chance de desviar completamente de um ataque)
- Iniciativa (ordem dos turnos em combate)
- Velocidade de movimento
- Acrobacia, equilíbrio, saltar, correr
- Reflexos para evitar armadilhas e efeitos de área

**Classes primárias:** Monge, Ninja, Assassino, Amazona, Swashbuckler

**Exemplos de testes:**
- Desviar de uma bola de fogo rolando pro lado
- Correr pelo telhado sem cair
- Reagir antes do inimigo no combate
- Saltar sobre um fosso de 3 metros

**Par oposto — Constituição:** A escolha fundamental de defesa: você desvia ou aguenta? O ágil evita o golpe; o resistente absorve. Monge versus Guerreiro pesado.

---

### CON — Constituição

Representa a resistência física, a saúde e a capacidade do corpo de suportar castigo. Constituição determina os pontos de vida máximos, a resistência a venenos e doenças, e a capacidade de aguentar esforço prolongado sem ceder.

**O que governa:**
- Pontos de Vida máximos (HP = base + CON × nível)
- Resistência a veneno, doença e efeitos físicos
- Testes de resistência contra dano contínuo
- Capacidade de manter concentração após tomar dano
- Resistência a exaustão e esforço prolongado

**Classes primárias:** Bárbaro, Guerreiro, Paladino, Druida, Caçador de Monstros

**Exemplos de testes:**
- Resistir a um veneno de cobra
- Aguentar uma marcha forçada de 12 horas
- Manter concentração numa magia após levar um golpe
- Sobreviver num deserto sem água

**Par oposto — Agilidade:** O tanque pesado não desvia; o acrobata não aguenta. Armadura pesada favorece CON; armadura leve favorece AGI. Dois estilos de combate opostos.

---

### DEX — Destreza

Representa a habilidade manual, precisão fina, coordenação motora delicada e controle dos dedos e mãos. Destreza governa ataques à distância, trabalhos manuais que exigem sutileza, e qualquer ação que dependa de mãos hábeis.

**O que governa:**
- Ataques à distância (arcos, bestas, arremesso)
- Abrir fechaduras e desarmar armadilhas
- Prestidigitação e furto de bolso
- Trabalho manual delicado (alquimia, forja, cirurgia)
- Furtividade e sigilo

**Classes primárias:** Ladino, Ranger, Assassino, Ninja, Pirata, Bardo

**Exemplos de testes:**
- Abrir a fechadura de um cofre
- Acertar um alvo com arco a 50 metros
- Aplicar veneno numa lâmina sem se cortar
- Desarmar uma armadilha de agulhas

**Par oposto — Carisma:** O sutil versus o presencial. O Ladino opera nas sombras com precisão cirúrgica; o Paladino comanda com presença e voz. O invisível contra o inesquecível.

---

### CAR — Carisma

Representa a força de personalidade, presença social, capacidade de liderança e influência sobre outros. Carisma determina a eficácia em interações sociais, a capacidade de inspirar aliados, e o poder de magias baseadas em força de vontade.

**O que governa:**
- Persuasão, enganação e diplomacia
- Intimidação e liderança em combate
- Performance e entretenimento
- Magias divinas e de encantamento
- Resistência a efeitos mentais (medo, charme, controle)

**Classes primárias:** Bardo, Paladino, Feiticeiro, Clérigo, Swashbuckler

**Exemplos de testes:**
- Convencer o guarda a abrir o portão
- Intimidar um bando de bandidos a recuar
- Inspirar aliados antes de uma batalha
- Resistir ao encantamento de uma feiticeira

**Par oposto — Destreza:** O Bardo encanta uma sala inteira com sua presença; o Assassino nunca é notado. Um resolve com palavras o que o outro resolve com uma lâmina silenciosa.

---

## Atributos no Combate

Durante o combate, cada atributo tem um papel específico que o Mestre IA e o backend processam automaticamente:

| Atributo | Função Ofensiva | Função Defensiva | Função Especial |
|----------|----------------|------------------|-----------------|
| **FOR** | Dano corpo a corpo, manobras | Resistir empurrão/agarrar | Arrombar, carregar |
| **INT** | Dano mágico, DC de magias | Resistir ilusões | Identificar fraquezas |
| **AGI** | — | Esquiva (desviar ataques) | Iniciativa, fugir |
| **CON** | — | HP, resistir veneno/dano | Manter concentração |
| **DEX** | Ataque à distância, furtivo | — | Desarmar armadilhas |
| **CAR** | Intimidar, provocar | Resistir medo/charme | Inspirar aliados |

---

## Como o Mestre IA Usa os Atributos

O Mestre IA segue regras claras para decidir qual atributo testar em cada situação. A pergunta-chave que a IA faz internamente é:

> *"O que o personagem está fazendo exatamente?"*

- **Usa o corpo todo pra se mover?** → Agilidade (esquivar, saltar, correr, equilibrar)
- **Usa as mãos com precisão?** → Destreza (abrir fechadura, atirar flecha, aplicar veneno)
- **Usa força bruta?** → Força (arrombar, empurrar, levantar, atacar corpo a corpo)
- **Usa a mente pra pensar?** → Inteligência (decifrar, lembrar, deduzir, conjurar arcano)
- **Aguenta castigo físico?** → Constituição (resistir veneno, manter concentração, sobreviver)
- **Influencia outra pessoa?** → Carisma (persuadir, intimidar, inspirar, resistir controle mental)

### Regra de Diferenciação AGI vs DEX

Esta é a distinção mais importante que o Mestre IA precisa fazer corretamente, pois são os dois atributos mais próximos:

| AGILIDADE (corpo todo) | DESTREZA (mãos/precisão) |
|------------------------|--------------------------|
| Desviar de uma bola de fogo | Desarmar uma armadilha de agulhas |
| Saltar sobre um fosso | Abrir uma fechadura complexa |
| Correr pelo telhado | Atirar uma flecha num alvo pequeno |
| Manter equilíbrio numa corda | Fazer um truque de cartas |
| Reagir primeiro (iniciativa) | Aplicar veneno sem derramar |
| Rolar pro lado pra esquivar | Furtar a chave do bolso do guarda |

---

## Distribuição de Pontos

Na criação de personagem, o jogador distribui pontos livremente entre os 6 atributos. O sistema é de liberdade total (inspiração 3D&T), com limites mínimos e máximos para evitar builds completamente quebrados.

### Regras de Criação (Nível 1)

| Regra | Valor |
|-------|-------|
| Pontos para distribuir | **60** |
| Mínimo por atributo | **5** |
| Máximo por atributo (criação) | **16** |
| Máximo nível 1 (com raça + classe) | **20** |
| Máximo absoluto (com progressão) | **30** |

O mínimo de 5 garante que nenhum atributo seja zerado — um personagem com 0 de Inteligência não faria sentido narrativamente, e o Mestre IA não saberia como narrar alguém assim. O máximo de 16 na criação representa o teto de um mortal excepcional antes de qualquer fator externo (raça, classe, treino).

### Como os Bônus se Acumulam

| Etapa | Exemplo (Meio-Orc Bárbaro, FOR) | Teto |
|-------|----------------------------------|------|
| Criação base | 16 (investimento pesado) | 16 |
| + Bônus de raça | 16 + 2 (Meio-Orc) = 18 | — |
| + Bônus de classe | 18 + 2 (Bárbaro) = 20 | 20 (nv.1) |
| + Progressão (nv. 2-20) | 20 + pontos por nível | 30 |

Chegar em 20 no nível 1 exige investir o máximo (16) num atributo que tanto a raça quanto a classe bonificam. É raro e intencional — um Meio-Orc Bárbaro com FOR 20 faz sentido, mas foi uma escolha que custou pontos que faltaram em outros atributos.

### Escala de Valores

| Valor | Nível | Descrição | Modificador |
|-------|-------|-----------|-------------|
| 1-5 | Deficiente | Severamente limitado nessa área | -3 a -1 |
| 6-8 | Abaixo da média | Notavelmente fraco | -1 |
| 9-11 | Médio | Humano comum | +0 |
| 12-14 | Acima da média | Treinado ou talentoso | +1 a +2 |
| 15-16 | Excepcional | Elite entre mortais (teto de criação) | +2 a +3 |
| 17-20 | Lendário | Limite mortal (com bônus de raça/classe) | +3 a +5 |
| 21-25 | Sobrenatural | Além do humano (progressão alta) | +5 a +7 |
| 26-30 | Divino | Poder divino (bosses épicos, nível 20) | +8 a +10 |

### Progressão por Nível

A cada nível ganho, o jogador recebe pontos de atributo para distribuir. A progressão é mais generosa nos primeiros níveis e desacelera nos últimos para evitar power creep extremo.

- **Nível 1:** 60 pontos de criação + bônus de raça + bônus de classe.
- **Níveis 2-10:** +2 pontos por nível para distribuir livremente.
- **Níveis 11-15:** +1 ponto por nível.
- **Níveis 16-20:** +1 ponto a cada 2 níveis.

**Total de pontos de progressão (nível 2 ao 20):** 18 + 5 + 3 = 26 pontos adicionais ao longo de toda a carreira.

### Exemplos de Builds (60 pontos, max 16)

| Build | FOR | INT | AGI | CON | DEX | CAR | Perfil |
|-------|-----|-----|-----|-----|-----|-----|--------|
| Bárbaro clássico | 16 | 5 | 10 | 16 | 6 | 7 | Força bruta, tanque, burro |
| Mago de vidro | 5 | 16 | 12 | 7 | 13 | 7 | Devastador, frágil, sutil |
| Assassino letal | 8 | 7 | 16 | 5 | 16 | 8 | Rápido e preciso, mas morre fácil |
| Paladino líder | 14 | 8 | 8 | 12 | 6 | 12 | Equilibrado, presença forte |
| Bardo versátil | 8 | 12 | 10 | 8 | 10 | 12 | Jack of all trades, nada excepcional |
| Min-max extremo | 16 | 16 | 8 | 5 | 10 | 5 | Forte E inteligente, mas frágil e sem presença |

O min-max extremo (último exemplo) é possível mas se pune sozinho: CON 5 significa HP miserável, CAR 5 não convence ninguém. Os pares opostos fazem o trabalho de balanceamento naturalmente.

### Pontos de Criação para Vantagens

Separado da distribuição de atributos, o jogador recebe **Pontos de Criação** para comprar vantagens:

| Fonte | Pontos |
|-------|--------|
| Base (todo personagem) | 5 |
| Devolvidos por desvantagens | +1 a +4 (max 3 desvantagens, max -4 pontos) |
| **Total possível** | **5 a 9** |

Cada vantagem tem custo de 1 a 4 pontos. Vantagens de custo 0 são raciais ou de classe (concedidas automaticamente, não compradas).

---

## Arquétipos de Build

Os 3 pares opostos criam naturalmente 8 arquétipos de personagem que cobrem todos os estilos de jogo:

| Arquétipo | Atributos Altos | Classes Típicas | Estilo de Jogo |
|-----------|----------------|-----------------|----------------|
| Tanque | FOR + CON | Bárbaro, Guerreiro | Absorve dano na linha de frente |
| Mago de Vidro | INT + DEX | Mago, Necromante | Poder devastador mas frágil |
| Assassino | AGI + DEX | Assassino, Ninja | Mata rápido ou morre tentando |
| Paladino | FOR + CAR | Paladino, Clérigo | Líder protetor com poder divino |
| Bardo | INT + CAR | Bardo, Feiticeiro | Controla o campo com palavras e magia |
| Monge | AGI + FOR | Monge, Amazona | Rápido E forte, mas sem defesa passiva |
| Ranger | AGI + DEX | Ranger, Caçador | Versátil em combate e exploração |
| Alquimista | INT + CON | Alquimista, Inventor | Crafta soluções, resiste a tudo |

---

*LUNARIA — THE FABLE FORGE*
*Onde cada atributo conta uma história.*
