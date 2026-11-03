/**
 * Texto de regras mecanicas do sistema D&D 5e (SRD) para injecao no prompt do Mestre.
 */

export function getRegrasMestrePrompt() {
  return `## SISTEMA D&D 5e (SRD)

### AS 6 ABILITIES
Cada personagem tem 6 ability scores (3-20):
- **STR (Strength):** ataque corpo a corpo, atletismo, carregar peso, arrombar
- **DEX (Dexterity):** ataque a distancia, esquiva, acrobacia, furtividade, iniciativa
- **CON (Constitution):** hit points, resistir veneno/doenca, concentracao
- **INT (Intelligence):** arcana, historia, investigacao, natureza, religiao
- **WIS (Wisdom):** percepcao, insight, medicina, sobrevivencia, animal handling
- **CHA (Charisma):** persuasao, enganacao, intimidacao, performance

**Modifier** = floor((score - 10) / 2). Ex: STR 16 -> +3, INT 8 -> -1.

### PROFICIENCY BONUS
Bonus por nivel: Nv1-4 +2, Nv5-8 +3, Nv9-12 +4, Nv13-16 +5, Nv17-20 +6.
Aplica-se a ataques, saving throws e skills em que o personagem e proficiente.

### COMBATE
- **Ataque:** d20 + ability modifier + proficiency bonus vs AC do defensor
- **AC (Armor Class):** 10 + DEX mod (sem armadura), ou valor da armadura + DEX mod (limitado)
- **Dano:** dado da arma + ability modifier. Critico dobra os dados de dano.
- **Nat 20:** acerto automatico (critical hit — dobra dados de dano)
- **Nat 1:** erro automatico
- **Iniciativa:** d20 + DEX modifier

### ADVANTAGE / DISADVANTAGE
- **Advantage:** rola 2d20 e usa o MAIOR resultado
- **Disadvantage:** rola 2d20 e usa o MENOR resultado
- Se tem ambos, se cancelam (rola normalmente)

### SAVING THROWS
d20 + ability modifier + proficiency (se proficiente no saving throw) vs DC.
Cada classe e proficiente em 2 saving throws.

### SKILL CHECKS
d20 + ability modifier + proficiency (se proficiente na skill) vs DC.
18 skills mapeadas para as 6 abilities.

### DIFICULDADES (DC)
Muito Facil (5) | Facil (10) | Media (15) | Dificil (20) | Muito Dificil (25) | Quase Impossivel (30)

### HIT POINTS
- Nivel 1: hit die maximo + CON modifier
- Niveis seguintes: media do hit die + 1 + CON modifier por nivel
- Hit dice por classe: Barbarian d12, Fighter/Paladin/Ranger d10, Bard/Cleric/Druid/Monk/Rogue/Warlock d8, Sorcerer/Wizard d6

### SPELL SLOTS
- D&D usa spell slots (nao mana). Cada magia gasta um slot do nivel correspondente ou superior.
- Full casters (Wizard, Cleric, Druid, Bard, Sorcerer): slots de nivel 1-9
- Half casters (Paladin, Ranger): slots de nivel 1-5
- Warlock: pact magic (slots limitados que recuperam em short rest)
- Slots recuperam em long rest (exceto Warlock: short rest)
- Cantrips: magias de nivel 0, uso ilimitado

### DEATH SAVES (0 HP)
- A 0 HP o personagem fica inconsciente e faz death saving throws
- d20: >= 10 sucesso, < 10 falha
- 3 sucessos: estabiliza. 3 falhas: morre
- Nat 20: volta com 1 HP. Nat 1: conta como 2 falhas
- Qualquer dano a 0 HP = 1 falha (critico = 2 falhas)

### ASI (Ability Score Improvement)
Nos niveis 4, 8, 12, 16 e 19: +2 em uma ability ou +1 em duas abilities (ou um feat).`;
}
