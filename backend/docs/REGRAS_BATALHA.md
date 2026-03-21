# Regras de Batalha — Lunaria RPG

Lunaria e um RPG multi-sistema que mistura elementos de D&D, 3D&T, Daemon e Tormenta. O sistema de combate e baseado em turnos com dados virtuais, onde o jogador rola pela UI e o servidor resolve a mecanica.

---

## 1. Atributos

Cada personagem e monstro possui 6 atributos base, com valores entre 1 e 30. O modificador de cada atributo e calculado assim:

```
modificador = floor((atributo - 10) / 2)
```

Exemplos: atributo 10 = mod 0, atributo 14 = mod +2, atributo 8 = mod -1.

### Papel de cada atributo no combate

| Atributo | Sigla | O que faz |
|----------|-------|-----------|
| **Forca** | FOR | Determina o dano extra em ataques corpo-a-corpo. Um guerreiro com FOR 16 (+3) causa 3 pontos de dano adicional em cada golpe melee. |
| **Destreza** | DEX | Determina a precisao de TODOS os ataques (melee e distancia). Tambem e o bonus de dano para ataques a distancia (arcos, bestas). Um ladino com DEX 18 (+4) tem +4 pra acertar qualquer ataque. |
| **Constituicao** | CON | Determina a resistencia fisica: quanto dano o corpo absorve antes de machucar (Taxa de Absorcao) e quantos pontos de vida o personagem tem. Um anao com CON 16 (+3) absorve parte de cada golpe. |
| **Agilidade** | AGI | Determina a capacidade de esquivar de ataques (DC de esquiva) e a velocidade de reacao (iniciativa). Um elfo com AGI 16 (+3) e muito dificil de acertar. |
| **Inteligencia** | INT | Determina o poder magico: quanto mana o personagem tem e a dificuldade de resistir as suas magias. |
| **Carisma** | CHA | Alternativa a Inteligencia para mana e DC de magia. O sistema usa o MAIOR entre INT e CHA, permitindo que bardos e paladinos usem carisma como atributo magico. |

---

## 2. Estatisticas Derivadas

### HP (Pontos de Vida)

```
HP = multiplicador_raca × (nivel + max(1, modCON))
```

O multiplicador de raca varia pelo tamanho da criatura:

| Tamanho | Multiplicador | Exemplo |
|---------|--------------|---------|
| Pequeno | 4 | Halfling, Gnomo |
| Medio | 5-7 | Humano, Elfo, Minotauro |
| Grande | 6-9 | Ogro, Centauro |
| Enorme | 8-12 | Gigante, Dragao jovem |
| Colossal | 15-18 | Vhazrael, Aurelion |

Exemplo: Moruxis (Minotauro nivel 2, CON 10, mult 7) = 7 × (2 + max(1, 0)) = 7 × 3 = 21 HP.

### Mana (Pontos de Magia)

```
MP = 10 + nivel + max(modINT, modCHA) × 2
```

Mana e usada para habilidades e magias. Usar max(INT, CHA) permite que classes como Paladino e Bardo usem Carisma em vez de Inteligencia.

### DC de Esquiva (Dificuldade para ser atingido)

```
DC Esquiva = 10 + modAGI
```

Quanto maior a agilidade, mais dificil e acertar o personagem. Um personagem com AGI 14 (mod +2) tem DC 12 — o atacante precisa rolar 12 ou mais pra acertar.

### Taxa de Absorcao (TA)

A TA representa a resistencia fisica do corpo + armadura. Reduz o dano recebido.

```
TA = max(0, modCON - 1)d4 + bonus de armadura
```

- CON 10 (mod 0) → 0d4 = nenhuma absorcao natural
- CON 14 (mod +2) → 1d4 absorcao natural
- CON 18 (mod +4) → 3d4 absorcao natural
- Armadura de couro (+2) soma ao total

Exemplo: personagem com CON 16 (mod +3) e armadura de malha (+4) → 2d4 + 4 de absorcao.

**Importante:** Criticos ignoram absorcao completamente (ver secao 4.1).

### Bonus de Ataque

```
Bonus de Ataque = modDEX + floor(nivel / 2)
```

Destreza e o atributo de precisao para TODOS os ataques. O bonus de nivel cresce a cada 2 niveis, representando experiencia de combate.

---

## 3. Iniciativa

Quando a narrativa do Mestre introduz um monstro, o combate inicia automaticamente.

### Sequencia

1. **Jogador**: a UI solicita uma rolagem de dado. O jogador clica no d20.
   - Resultado: `d20 + modAGI`
2. **Monstros**: o servidor rola automaticamente para cada monstro.
   - Resultado: `d20 + modAGI do monstro`
3. **Ordem**: do maior resultado para o menor.
   - Empate: jogador tem prioridade sobre monstros.
4. **Combate comeca**: o primeiro da ordem age.

### Exemplo

Moruxis (AGI 14, mod +2) rola 15 no d20 → 15 + 2 = 17.
Dretch (AGI 8, mod -1) rola no servidor 12 → 12 - 1 = 11.
Ordem: Moruxis (17) → Dretch (11). Moruxis age primeiro.

---

## 4. Turno do Jogador

No seu turno, o jogador escolhe uma acao:

| Acao | O que faz | Custo |
|------|-----------|-------|
| **Atacar** | Ataque basico com arma equipada ou maos nuas | Nenhum |
| **Defender** | Postura defensiva (ver secao 6) | Nenhum |
| **Habilidade** | Usa uma habilidade especial (Investida, Golpe Poderoso, etc) | MP variavel |
| **Magia** | Lanca uma magia do repertorio | MP variavel |
| **Fugir** | Tenta escapar do combate (teste AGI vs DC) | Nenhum |
| **Texto livre** | Descreve uma acao criativa; o sistema tenta inferir a mecanica | Nenhum |

### 4.1 Resolvendo um Ataque

**Passo 1 — Teste de Acerto**

O Mestre narra a acao e solicita um teste de ataque. O jogador rola d20 pela UI.

```
Total = d20 + modDEX + bonusNivel
DC = 10 + modAGI do alvo
```

- Total >= DC → **Acerto**
- Total < DC → **Erro** (o ataque nao causa dano)
- d20 = 20 → **Critico** (dano dobrado, ignora absorcao)
- d20 = 1 → **Falha critica** (narrativa negativa, sem dano)

Se o atacante esta **cego**, sofre penalidade de -5 no total de ataque.

**Passo 2 — Rolagem de Dano (se acertou)**

O servidor determina o dado correto e solicita a rolagem:

```
Dano base:
  - Sem arma: 1d6
  - Com arma: dado da arma (ex: espada longa = 1d8, adaga = 1d4)
  - Habilidade: dado da habilidade (ex: Investida = 1d6+2)

Modificador:
  - Melee: + modFOR
  - Distancia: + modDEX

Critico: rola o dado de dano 2 vezes e soma
```

**Passo 3 — Absorcao do Alvo**

```
Se critico:
  Dano final = dano bruto (absorcao ignorada)

Se normal:
  TA = max(0, modCON - 1)d4 + armadura_natural
  Dano final = max(0, dano bruto - TA)

Se alvo esta Defendendo (defesa temporaria ativa):
  Dano final = floor(dano final × 0.5) (minimo 1)

HP do alvo -= dano final
```

### 4.2 Exemplo completo de ataque

Moruxis (nivel 2, DEX 14, FOR 10) ataca um Dretch (AGI 8, CON 12).

1. Rola d20: **7** + modDEX(+2) + bonusNivel(+1) = **10**
2. DC do Dretch: 10 + modAGI(-1) = **9**
3. 10 >= 9 → **Acerto!**
4. Dano: 1d6 (sem arma) + modFOR(0) = rola **4** → dano bruto = **4**
5. Absorcao Dretch: max(0, modCON(+1) - 1)d4 = 0d4 + armadura(0) = **0**
6. Dano final: 4 - 0 = **4**
7. Dretch HP: 12 → **8**

### 4.3 Exemplo de critico

Mesmo cenario, mas d20 = 20 (nat 20):

1. d20: **20** + 2 + 1 = **23** vs DC 9 → **Critico!**
2. Dano: 1d6 rolado 2x → **4** + **3** = **7** + modFOR(0) = **7**
3. Absorcao: **ignorada** (critico)
4. Dano final: **7**
5. Dretch HP: 12 → **5**

---

## 5. Turno do Monstro

O monstro age automaticamente no servidor. O jogador nao rola dado — tudo e resolvido server-side.

### Sequencia

1. Servidor seleciona habilidade (com cooldown) ou ataque basico
2. Rola `d20 + modDEX + floor(nivel/2)` vs `DC esquiva do jogador (10 + modAGI + dcBonus)`
3. Se acertou, calcula dano com mesmas regras (dado + modFOR)
4. Aplica absorcao do jogador (CON + armadura equipada)
5. Se jogador esta Defendendo, reduz dano em 50% (minimo 1)
6. Se critico, ignora absorcao
7. Frontend exibe: "👹 Dretch → Moruxis: d20:8+1=9 vs DEF 12 → ERROU"

### Exemplo: monstro acerta

Dretch (DEX 10, FOR 12) ataca Moruxis (AGI 14, CON 10, sem armadura).

1. Rola d20: **15** + modDEX(0) + bonusNivel(0) = **15**
2. DC de Moruxis: 10 + modAGI(+2) = **12**
3. 15 >= 12 → **Acerto!**
4. Dano: 1d4 (garras) + modFOR(+1) = rola **3** + 1 = **4**
5. Absorcao Moruxis: max(0, modCON(0) - 1)d4 = 0d4 + armadura(0) = **0**
6. Dano final: 4 - 0 = **4**
7. Moruxis HP: 21 → **17**

### Teste de Concentracao

Se o jogador esta mantendo concentracao em uma magia e recebe dano, o servidor faz um teste automatico:

```
DC = max(10, dano_recebido / 2)
Teste = d20 + modCON
Se teste < DC → concentracao quebrada, magia encerra
```

---

## 6. Acao Defender

Quando o jogador escolhe "Defender", ele recebe dois beneficios ate o inicio do seu proximo turno:

```
1. DC esquiva temporario = 10 + modAGI + 2 (bonus de +2)
2. Reducao de dano = 50% (caso o ataque passe pelo DC, dano e cortado pela metade, minimo 1)
```

A defesa temporaria expira no inicio da proxima rodada do jogador. E limpa automaticamente por `_controlarRodada`.

Moruxis normalmente tem DC 12. Defendendo, fica DC 14 e qualquer dano que passe e reduzido pela metade.

---

## 7. Efeitos de Status

Efeitos podem ser aplicados por habilidades, magias ou condicoes de combate. Sao processados automaticamente no fim de cada rodada.

### Status que impedem acao

O jogador/monstro nao pode agir no seu turno:

| Status | Efeito |
|--------|--------|
| **Atordoado** | Perde o turno completamente |
| **Paralisado** | Perde o turno completamente |
| **Congelado** | Perde o turno completamente |

### Status com dano por turno (DOT)

Causam dano automatico no fim de cada rodada:

| Status | Dano/turno |
|--------|-----------|
| **Envenenado** | 1d4 |
| **Queimando** | 1d6 |

### Penalidades de combate

| Status | Efeito |
|--------|--------|
| **Cego** | -5 no total de ataque |

### Duracao e expiracao

- Efeitos de **jogadores** sao decrementados pelo `effectManager` no `masterNarrationEngine` (uma vez por turno do jogador)
- Efeitos de **monstros** sao decrementados pelo `_controlarRodada` (uma vez por rodada)
- Essa separacao evita o bug de decremento duplo

---

## 8. Concentracao

Algumas magias requerem concentracao continua. Enquanto mantida:

- O jogador nao pode lancar outra magia de concentracao
- Receber dano pode quebrar a concentracao

### Teste de Concentracao (ao receber dano)

```
DC = max(10, dano_recebido / 2)
Teste = d20 + modCON

Se teste < DC:
  Concentracao quebrada
  Magia encerra imediatamente
  Log registra: personagem, magia, dano, DC, rolagem
```

O teste e feito automaticamente pelo servidor quando um monstro acerta o jogador.

---

## 9. Fim de Combate

### Vitoria

Quando todos os monstros chegam a HP <= 0:

1. Monstro marcado como "derrotado"
2. Frontend mostra visual de derrota no card do monstro
3. Combate encerra
4. XP distribuido *(parcialmente implementado)*
5. Mestre narra a conclusao da batalha

### Derrota

Quando o jogador chega a HP <= 0:

1. Jogador marcado como "inconsciente"
2. Nao pode mais agir no combate
3. Se todos os jogadores estao inconscientes, combate encerra
4. Mestre narra a derrota

---

## 10. Multiplos Monstros

O sistema suporta combate com mais de um monstro:

- Cada monstro tem sua propria posicao na ordem de iniciativa
- Monstros agem individualmente no seu turno
- Cada monstro seleciona um alvo aleatorio entre jogadores vivos
- Monstros podem usar habilidades especiais com cooldown por rodada
- Monstros derrotados sao removidos da ordem

---

## 11. Controle de Rodada

A rodada avanca quando todos os jogadores vivos agiram:

1. Cada jogador e marcado em `jogadoresQueAgiram` ao agir
2. Quando `jogadoresQueAgiram.length >= totalJogadoresVivos`:
   - Rodada avanca
   - Defesas temporarias expiradas sao limpas
   - Efeitos de status nos monstros sao processados (DOT + decremento)
   - Monstros derrotados por DOT sao marcados
   - Lista de jogadores que agiram e resetada

---

## 12. Pendente de Implementacao

### DC de Magia ❌

Quando um jogador lanca uma magia ofensiva, o alvo precisa resistir:

```
DC resistencia = 8 + custo_mana_da_magia + floor(max(modINT, modCHA) / 2)
```

Magias mais caras sao mais dificeis de resistir. Unica mecanica de combate que ainda nao esta no codigo.

---

## 13. Resumo de Formulas

```
ATAQUE:       d20 + modDEX + floor(nivel/2) vs 10 + modAGI do alvo
DANO MELEE:   dado + modFOR
DANO DIST:    dado + modDEX
CRITICO:      dado rolado 2x, ignora absorcao
ABSORCAO:     max(0, modCON-1)d4 + armadura
HP:           mult_raca × (nivel + max(1, modCON))
MANA:         10 + nivel + max(modINT, modCHA) × 2
ESQUIVA:      10 + modAGI (+ 2 se defendendo)
DEFESA:       +2 DC esquiva + 50% reducao de dano
INICIATIVA:   d20 + modAGI
FUGA:         d20 + modAGI vs 10 + (monstros_vivos × 2)
CONCENTRACAO: d20 + modCON vs max(10, dano/2)
DOT:          envenenado 1d4/turno, queimando 1d6/turno
CEGO:         -5 no ataque
DC MAGIA:     8 + custo_mana + floor(max(modINT, modCHA)/2) [pendente]
```
