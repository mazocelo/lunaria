/**
 * Texto de regras mecânicas do sistema Lunaria para injeção no prompt do Mestre.
 * Extraído de agents/Mestre/prompts/sistema.js (montarSistemaMecanico).
 */

export function getRegrasMestrePrompt() {
  return `## SISTEMA DE ATRIBUTOS (Lunaria)

Cada personagem tem 6 atributos (60 pontos base na criação, mín 5, máx 16 base, máx 20 com bônus).
**Modificador** = floor((atributo - 10) / 2). Ex: FOR 14 → +2, INT 8 → -1.
**Fórmula de teste**: d20 + modificador_atributo + min(2, floor(nível/6)) vs DC.

## OS 6 ATRIBUTOS (3 pares opostos)
- **FOR** (Força): dano corpo a corpo, arrombar, carregar, manobras físicas
- **INT** (Inteligência): poder mágico arcano, conhecimento, dedução, identificar
- **AGI** (Agilidade): esquiva, iniciativa, acrobacia, equilíbrio — CORPO TODO em movimento
- **CON** (Constituição): HP, resistir veneno/dano, manter concentração, fortitude
- **DEX** (Destreza): ataque à distância, abrir fechaduras, furtividade — MÃOS e precisão fina
- **CAR** (Carisma): persuasão, intimidação, liderança, resistir medo/charme

AGI vs DEX: AGI = corpo todo em movimento. DEX = mãos e precisão fina.

## FÓRMULAS DE COMBATE
- **HP** = mult_raca × (nível + max(1, modCON))
- **Mana** = max(5, 10 + nível + max(modINT, modCHA) × 2)
- **Ataque** = d20 + modDEX + floor(nível/2) vs DC esquiva
- **DC Esquiva** = 10 + modAGI do defensor
- **Iniciativa** = d20 + modAGI
- **Dano** = dado_arma + modFOR (×2 em crítico)

## TESTES
Fórmula: d20 + mod_atributo + bonus_nivel vs DC
- Bônus nível: Nv1-5 +0, Nv6-11 +1, Nv12-20 +2
- Nat 20 = sempre sucesso (crítico), Nat 1 = sempre falha (falha crítica)

## DIFICULDADES
Muito Fácil (5) | Fácil (8) | Média (12) | Difícil (15) | Muito Difícil (18) | Quase Impossível (20)

## PROGRESSÃO
XP por nível: Nv2=100, Nv3=300, Nv4=600, Nv5=1000, Nv6=1500, Nv7=2100, Nv8=2800, Nv9=3600, Nv10=4500
Pontos de vantagem: Nv1=10, +1 por nível.
Tier desbloqueado: Nv1=T1, Nv5=T2, Nv9=T3, Nv13=T4, Nv17=T5.`;
}
