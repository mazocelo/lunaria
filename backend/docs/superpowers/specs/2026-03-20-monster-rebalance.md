# Spec: Rebalance de Monstros — Stats Derivados + HP por Multiplicador

**Data:** 2026-03-20
**Status:** Aprovado
**Versão:** 1.0

---

## 1. Fórmula de HP Universal

```
HP = multiplicador_raça × (nivel + max(1, modCON))
modCON = floor((constituicao - 10) / 2)
```

**Mínimo de HP = multiplicador_raça** (quando modCON ≤ 0, usa 1)

### Multiplicadores por tamanho (monstros)

| Tamanho | Mult | Exemplos |
|---------|------|----------|
| Minúsculo | 2-3 | Homunculus, Imp |
| Pequeno | 3-5 | Goblin, Dretch, Kobold |
| Médio | 5-6 | Bandido, Esqueleto, Drow |
| Grande | 6-8 | Ogro, Troll, Minotauro |
| Enorme | 8-10 | Gigante, Hidra |
| Colossal | 10-15 | Dragão, Jörmungandr |

### Multiplicadores por raça (jogadores)

| Raça | Mult |
|------|------|
| Humano | 5 |
| Elfo | 4 |
| Anão | 6 |
| Minotauro | 7 |
| Halfling | 4 |
| Orc | 7 |
| Goblin | 3 |

## 2. Defesa Universal

```
Defesa = 10 + modCON + armadura
```

Mesma fórmula para jogadores e monstros. Armadura só para quem faz sentido (equipamento ou armadura natural).

## 3. Ataque

```
Ataque jogador = modFOR (melee) ou modDEX (ranged) + bonusEquip
Ataque monstro = modFOR + floor(nivel / 3)
```

## 4. Esquiva

```
Esquiva = (modAGI + floor(modDEX/2)) × 5 + floor(nivel × 0.5)
Cap: 0-50%
```

Mesma fórmula para jogadores e monstros.

## 5. Dano

```
Dano = rolarDado(dano_base) + modFOR
Dano mínimo = 0 (golpe fraco, não penetrou)
```

Dados variados por monstro: d4, d6, d8, d10, d12, 2d6, 2d8 etc.

## 6. Perfil de Atributos por Tier

| Tier | Mod | Atributo base nível 1 |
|------|-----|----------------------|
| `-` | -2 a -1 | 6-8 |
| `N` | 0 | 10 |
| `+` | +1 | 12-13 |
| `++` | +2 | 14-15 |
| `+++` | +3-4 | 16-18 |

Escala com nível: `atributo = base_tier + floor(nivel × 0.5)`

## 7. Script de Migração

### Fase 1: Gemini 3.1 Pro redesenha cada monstro

Para cada um dos 330 monstros, envia ao Gemini:
- Nome, descrição, tipo, tamanho, nível min/max
- Contexto: "Sistema Lunaria RPG mistura D&D 5e, 3D&T Alpha, Daemon e Tormenta RPG"

Gemini retorna:
```json
{
  "forca": N, "constituicao": N, "agilidade": N, "destreza": N, "inteligencia": N, "carisma": N,
  "dano_base": "XdY",
  "mult_raca": N,
  "armadura_natural": N,
  "tamanho": "...",
  "perfil": { "for_tier": "...", "con_tier": "...", "agi_tier": "...", "dex_tier": "..." },
  "habilidades": [{ "nome", "tipo", "dano", "efeito", "chance", "cooldown" }],
  "resistencias": {},
  "imunidades": [],
  "xp_sugerido": N,
  "justificativa": "..."
}
```

### Fase 2: Script calcula stats derivados

```
modCON = floor((constituicao - 10) / 2)
modFOR = floor((forca - 10) / 2)
modAGI = floor((agilidade - 10) / 2)
modDEX = floor((destreza - 10) / 2)

hp_base = mult_raca × (nivel_min + max(1, modCON))
defesa_base = 10 + modCON + armadura_natural
ataque_base = modFOR + floor(nivel_min / 3)
esquiva = (modAGI + floor(modDEX/2)) × 5 + floor(nivel_min × 0.5)   cap 0-50%
```

### Fase 3: Validação (cron job)

Verifica cada monstro:
- HP dentro do range esperado para nível + tamanho?
- Dano não é absurdo para o nível?
- Atributos coerentes com o perfil de tier?
- Habilidades fazem sentido para o tipo?

Se fora do range → re-submete ao Gemini com contexto do erro.

### Fase 4: Gravação no banco

UPDATE em cada monstro:
- forca, constituicao, agilidade, destreza, inteligencia, carisma
- hp_base (recalculado)
- ataque_base (recalculado)
- defesa_base (recalculado)
- dano_base (revisado)
- habilidades (revisadas)
- resistencias, imunidades (revisadas)
- xp_base (revisado)

## 8. Runtime: calcularStatsEfetivos

Reescrever para usar as fórmulas:

```js
export function calcularStatsEfetivos(monstro, nivelEfetivo) {
  const n = Math.max(1, nivelEfetivo);
  const modCON = Math.floor(((monstro.constituicao || 10) - 10) / 2);
  const modFOR = Math.floor(((monstro.forca || 10) - 10) / 2);
  const modAGI = Math.floor(((monstro.agilidade || 10) - 10) / 2);
  const modDEX = Math.floor(((monstro.destreza || 10) - 10) / 2);
  const mult = monstro.mult_raca || 5;

  return {
    hp_max: mult * (n + Math.max(1, modCON)),
    defesa: 10 + modCON + (monstro.armadura_natural || 0),
    ataque: modFOR + Math.floor(n / 3),
    armadura: monstro.armadura_natural || 0,
    esquiva: Math.min(50, Math.max(0, (modAGI + Math.floor(modDEX / 2)) * 5 + Math.floor(n * 0.5))),
    dano_base: monstro.dano_base || '1d6',
    xp: (monstro.xp_base || 50) * n
  };
}
```

## 9. Jogador Inicial (referência de balanceamento)

**Humano Guerreiro Nível 1**
- FOR 14 (+2), CON 12 (+1), AGI 10 (0), DEX 10 (0)
- Mult raça: 5 (humano)
- HP = 5 × (1 + 1) = **10**
- Defesa = 10 + 1 + 0 = **11**
- Ataque = +2
- Dano = 1d6 + 2
- Esquiva = 0%

**vs Dretch Nível 1**
- FOR 12 (N), CON 14 (+), AGI 8 (-), DEX 10 (N)
- Mult raça: 4 (pequeno demônio)
- HP = 4 × (1 + 2) = **12**
- Defesa = 10 + 2 + 0 = **12**
- Ataque = +1
- Dano = 1d4 + 1
- Esquiva = 0%

Resultado: combate equilibrado, jogador tem vantagem leve em dano.
