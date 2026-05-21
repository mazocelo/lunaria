# D&D 5th Edition - Core Mechanics Reference

Structured reference for implementing D&D 5e-based mechanics in a digital platform.
Focus: formulas, numbers, progression tables. SRD/OGL licensing constraints at the end.

---

## 1. Core Resolution

### d20 System
All major rolls follow the same pattern:
```
d20 + ability modifier + (proficiency bonus if proficient) >= DC (Difficulty Class)
```

Three core roll types:
- **Ability Check**: d20 + ability modifier (+ proficiency if proficient in related skill)
- **Saving Throw**: d20 + ability modifier (+ proficiency if proficient in that save)
- **Attack Roll**: d20 + ability modifier + proficiency bonus >= target AC

### Difficulty Classes (DC)
| Difficulty  | DC  |
|-------------|-----|
| Very Easy   | 5   |
| Easy        | 10  |
| Medium      | 15  |
| Hard        | 20  |
| Very Hard   | 25  |
| Nearly Impossible | 30 |

### Advantage / Disadvantage
- **Advantage**: Roll 2d20, take the **higher** result.
- **Disadvantage**: Roll 2d20, take the **lower** result.
- Multiple sources of advantage/disadvantage do NOT stack. Any amount = one instance.
- If you have BOTH advantage and disadvantage simultaneously, they cancel out (roll 1d20 normally), regardless of how many sources of each.
- Natural 20 on attack roll = automatic hit + critical hit.
- Natural 1 on attack roll = automatic miss.

---

## 2. Attributes

### Six Ability Scores
| Ability       | Abbr | Governs                          |
|---------------|------|----------------------------------|
| Strength      | STR  | Melee attacks, carrying, athletics |
| Dexterity     | DEX  | Ranged attacks, AC, initiative, stealth |
| Constitution  | CON  | Hit points, concentration, endurance |
| Intelligence  | INT  | Arcana, history, investigation    |
| Wisdom        | WIS  | Perception, insight, healing      |
| Charisma      | CHA  | Persuasion, deception, spellcasting (some) |

### Modifier Formula
```
modifier = floor((score - 10) / 2)
```

### Score-to-Modifier Table
| Score | Modifier | Score | Modifier |
|-------|----------|-------|----------|
| 1     | -5       | 16-17 | +3       |
| 2-3   | -4       | 18-19 | +4       |
| 4-5   | -3       | 20-21 | +5       |
| 6-7   | -2       | 22-23 | +6       |
| 8-9   | -1       | 24-25 | +7       |
| 10-11 | +0       | 26-27 | +8       |
| 12-13 | +1       | 28-29 | +9       |
| 14-15 | +2       | 30    | +10      |

- Normal human average: 10-11
- Adventurer max (without magic): 20
- Absolute max (monsters/divine): 30

---

## 3. Character Creation

### Structure
Character = **Race** + **Class** + **Background**
- **Race** provides: ability score bonuses, traits, languages, speed, special abilities.
- **Class** provides: hit dice, proficiencies, features, subclass, spellcasting (if any).
- **Background** provides: 2 skill proficiencies, tool proficiencies/languages, starting equipment, feature.

### Ability Score Generation Methods

#### Standard Array
Assign these six values: **15, 14, 13, 12, 10, 8** (one to each ability).

#### Point Buy
- Start: all scores at 8.
- Budget: **27 points**.
- Score range: 8-15 (before racial bonuses).

| Score | Cost | Score | Cost |
|-------|------|-------|------|
| 8     | 0    | 12    | 4    |
| 9     | 1    | 13    | 5    |
| 10    | 2    | 14    | 7    |
| 11    | 3    | 15    | 9    |

#### Rolling
Roll **4d6, drop the lowest** die, six times. Assign results to abilities.

---

## 4. Classes

### All 13 Classes (PHB + Tasha's)

| Class      | Hit Die | Type         | Primary Ability    | Subclass Level | Saving Throws |
|------------|---------|-------------|--------------------|----|---------------|
| Artificer  | d8      | Half-caster  | INT                | 3  | CON, INT      |
| Barbarian  | d12     | Martial      | STR, CON           | 3  | STR, CON      |
| Bard       | d8      | Full caster  | CHA                | 3  | DEX, CHA      |
| Cleric     | d8      | Full caster  | WIS                | 1  | WIS, CHA      |
| Druid      | d8      | Full caster  | WIS                | 2  | INT, WIS      |
| Fighter    | d10     | Martial      | STR or DEX         | 3  | STR, CON      |
| Monk       | d8      | Martial      | DEX, WIS           | 3  | STR, DEX      |
| Paladin    | d10     | Half-caster  | STR, CHA           | 3  | WIS, CHA      |
| Ranger     | d10     | Half-caster  | DEX, WIS           | 3  | STR, DEX      |
| Rogue      | d8      | Martial      | DEX                | 3  | DEX, INT      |
| Sorcerer   | d6      | Full caster  | CHA                | 1  | CON, CHA      |
| Warlock    | d8      | Full caster* | CHA                | 1  | WIS, CHA      |
| Wizard     | d6      | Full caster  | INT                | 2  | INT, WIS      |

*Warlock uses Pact Magic (short-rest slots) instead of standard Vancian slots.

### Classification
- **Martial (4)**: Barbarian, Fighter, Monk, Rogue
- **Half-caster (3)**: Artificer, Paladin, Ranger (get spells at level 2)
- **Full caster (6)**: Bard, Cleric, Druid, Sorcerer, Warlock, Wizard

---

## 5. Spell Slots (Vancian System)

### Core Concepts
- Spell levels range from **0 (cantrips)** to **9**.
- Spell level != character level. A 5th-level wizard can cast 3rd-level spells.
- **Cantrips**: cast at will, no slot cost, scale with character level (not class level).
- Slots are consumed on cast and recovered on **long rest** (except Warlock: short rest).
- Spells can be cast at a **higher slot level** than their minimum for increased effect.

### Formulas
```
Spell Save DC     = 8 + proficiency bonus + spellcasting ability modifier
Spell Attack Bonus = proficiency bonus + spellcasting ability modifier
```

### Full Caster Spell Slots (Bard, Cleric, Druid, Sorcerer, Wizard)

| Level | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1     | 2   | -   | -   | -   | -   | -   | -   | -   | -   |
| 2     | 3   | -   | -   | -   | -   | -   | -   | -   | -   |
| 3     | 4   | 2   | -   | -   | -   | -   | -   | -   | -   |
| 4     | 4   | 3   | -   | -   | -   | -   | -   | -   | -   |
| 5     | 4   | 3   | 2   | -   | -   | -   | -   | -   | -   |
| 6     | 4   | 3   | 3   | -   | -   | -   | -   | -   | -   |
| 7     | 4   | 3   | 3   | 1   | -   | -   | -   | -   | -   |
| 8     | 4   | 3   | 3   | 2   | -   | -   | -   | -   | -   |
| 9     | 4   | 3   | 3   | 3   | 1   | -   | -   | -   | -   |
| 10    | 4   | 3   | 3   | 3   | 2   | -   | -   | -   | -   |
| 11    | 4   | 3   | 3   | 3   | 2   | 1   | -   | -   | -   |
| 12    | 4   | 3   | 3   | 3   | 2   | 1   | -   | -   | -   |
| 13    | 4   | 3   | 3   | 3   | 2   | 1   | 1   | -   | -   |
| 14    | 4   | 3   | 3   | 3   | 2   | 1   | 1   | -   | -   |
| 15    | 4   | 3   | 3   | 3   | 2   | 1   | 1   | 1   | -   |
| 16    | 4   | 3   | 3   | 3   | 2   | 1   | 1   | 1   | -   |
| 17    | 4   | 3   | 3   | 3   | 2   | 1   | 1   | 1   | 1   |
| 18    | 4   | 3   | 3   | 3   | 3   | 1   | 1   | 1   | 1   |
| 19    | 4   | 3   | 3   | 3   | 3   | 2   | 1   | 1   | 1   |
| 20    | 4   | 3   | 3   | 3   | 3   | 2   | 2   | 1   | 1   |

### Half-Caster Spell Slots (Paladin, Ranger)
Same pattern but shifted: get 1st-level slots at class level 2, max out at 5th-level spell slots.

| Level | 1st | 2nd | 3rd | 4th | 5th |
|-------|-----|-----|-----|-----|-----|
| 2     | 2   | -   | -   | -   | -   |
| 3     | 3   | -   | -   | -   | -   |
| 4     | 3   | -   | -   | -   | -   |
| 5     | 4   | 2   | -   | -   | -   |
| 6     | 4   | 2   | -   | -   | -   |
| 7     | 4   | 3   | -   | -   | -   |
| 8     | 4   | 3   | -   | -   | -   |
| 9     | 4   | 3   | 2   | -   | -   |
| 10    | 4   | 3   | 2   | -   | -   |
| 11    | 4   | 3   | 3   | -   | -   |
| 12    | 4   | 3   | 3   | -   | -   |
| 13    | 4   | 3   | 3   | 1   | -   |
| 14    | 4   | 3   | 3   | 1   | -   |
| 15    | 4   | 3   | 3   | 2   | -   |
| 16    | 4   | 3   | 3   | 2   | -   |
| 17    | 4   | 3   | 3   | 3   | 1   |
| 18    | 4   | 3   | 3   | 3   | 1   |
| 19    | 4   | 3   | 3   | 3   | 2   |
| 20    | 4   | 3   | 3   | 3   | 2   |

### Warlock Pact Magic (unique system)
All slots are the same level. Recover on **short rest**.

| Level | Slots | Slot Level |
|-------|-------|------------|
| 1     | 1     | 1st        |
| 2     | 2     | 1st        |
| 3     | 2     | 2nd        |
| 4     | 2     | 2nd        |
| 5     | 2     | 3rd        |
| 6     | 2     | 3rd        |
| 7     | 2     | 4th        |
| 8     | 2     | 4th        |
| 9     | 2     | 5th        |
| 10    | 2     | 5th        |
| 11    | 3     | 5th        |
| 12    | 3     | 5th        |
| 13    | 3     | 5th        |
| 14    | 3     | 5th        |
| 15    | 3     | 5th        |
| 16    | 3     | 5th        |
| 17    | 4     | 5th        |
| 18    | 4     | 5th        |
| 19    | 4     | 5th        |
| 20    | 4     | 5th        |

Warlocks also gain Mystic Arcanum at levels 11/13/15/17 (one use each of 6th/7th/8th/9th level spells per long rest).

### Ritual Casting
Spells tagged as rituals can be cast without expending a slot by adding 10 minutes to cast time. Requires class feature to use.

---

## 6. Combat

### Initiative
```
Initiative = d20 + DEX modifier
```
Turns proceed from highest to lowest. Ties resolved by DM or d20 roll-off.

### Round
One round = ~6 seconds of in-game time. Every combatant gets one turn per round.

### Action Economy (per turn)
| Resource        | Count | Notes                                           |
|-----------------|-------|-------------------------------------------------|
| Movement        | 1     | Up to speed (default 30 ft). Can split around actions. |
| Action          | 1     | Attack, Cast Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use Object |
| Bonus Action    | 0-1   | Only if a feature/spell grants one. Cannot substitute for Action. |
| Reaction        | 0-1   | Once per round (resets at start of your turn). Opportunity attacks, some spells. |
| Free Interaction| 1     | Open door, draw weapon, pick up item, etc.       |

### Standard Actions
- **Attack**: One melee/ranged attack (Extra Attack feature grants more).
- **Cast a Spell**: Use a spell with casting time of 1 action.
- **Dash**: Gain additional movement equal to your speed.
- **Disengage**: Movement does not provoke opportunity attacks this turn.
- **Dodge**: Attacks against you have disadvantage; advantage on DEX saves.
- **Help**: Grant advantage on one ally's next ability check or attack roll.
- **Hide**: Make Stealth check to become hidden.
- **Ready**: Prepare an action/movement as a reaction to a specific trigger.
- **Search**: Make Perception or Investigation check.
- **Use an Object**: Interact with an object requiring an action.

### Armor Class (AC)
```
Unarmored:     AC = 10 + DEX modifier
Light Armor:   AC = armor base + DEX modifier
Medium Armor:  AC = armor base + DEX modifier (max +2)
Heavy Armor:   AC = armor base (no DEX)
Shield:        +2 AC (stackable with armor)
```

**Barbarian Unarmored Defense**: AC = 10 + DEX mod + CON mod
**Monk Unarmored Defense**: AC = 10 + DEX mod + WIS mod

### Attack Roll
```
Melee:  d20 + STR modifier + proficiency bonus (if proficient)
Ranged: d20 + DEX modifier + proficiency bonus (if proficient)
Finesse weapons: use STR or DEX (player choice)
```

### Damage Roll
```
Weapon: damage dice + ability modifier (STR for melee, DEX for ranged/finesse)
Spell:  as specified by spell (modifier only if spell says so)
```

### Critical Hit
Roll all damage dice twice, then add modifiers once. Includes bonus dice (e.g., Sneak Attack).

### Hit Points
```
Level 1 HP:   max hit die + CON modifier
Level 2+ HP:  hit die roll (or average) + CON modifier per level
Average:      (hit die / 2) + 1
```

### Hit Dice by Class
| Hit Die | Classes                                          |
|---------|--------------------------------------------------|
| d6      | Sorcerer, Wizard                                 |
| d8      | Bard, Cleric, Druid, Monk, Rogue, Warlock        |
| d10     | Fighter, Paladin, Ranger                         |
| d12     | Barbarian                                        |

Hit dice can be spent during **short rests** to heal: roll hit die + CON modifier per die spent. Recover half of total hit dice (minimum 1) on long rest.

### Two-Weapon Fighting
- Both weapons must have the **Light** property.
- Use bonus action for the offhand attack.
- Do NOT add ability modifier to offhand damage (unless modifier is negative).
- Two-Weapon Fighting style (from class) allows adding ability modifier to offhand damage.

### Opportunity Attacks
Triggered when a hostile creature you can see moves out of your reach. Uses your reaction for one melee attack.

### Damage Types (13 total)
Acid, Bludgeoning, Cold, Fire, Force, Lightning, Necrotic, Piercing, Poison, Psychic, Radiant, Slashing, Thunder

### Resistance & Vulnerability
- **Resistance**: damage of that type is halved.
- **Vulnerability**: damage of that type is doubled.
- Applied after all other modifiers. Multiple instances do not stack.

---

## 7. Level Progression

### XP Thresholds & Proficiency Bonus

| Level | XP Required | Prof. Bonus | Notable Features                    |
|-------|-------------|-------------|-------------------------------------|
| 1     | 0           | +2          | Starting features                   |
| 2     | 300         | +2          |                                     |
| 3     | 900         | +2          | Most subclasses chosen              |
| 4     | 2,700       | +2          | **ASI #1** (or Feat)                |
| 5     | 6,500       | +3          | Extra Attack (martials), 3rd-level spells |
| 6     | 14,000      | +3          |                                     |
| 7     | 23,000      | +3          |                                     |
| 8     | 34,000      | +3          | **ASI #2** (or Feat)                |
| 9     | 48,000      | +4          | 5th-level spells (full casters)     |
| 10    | 64,000      | +4          |                                     |
| 11    | 85,000      | +4          | 6th-level spells, 3rd martial attack (Fighter) |
| 12    | 100,000     | +4          | **ASI #3** (or Feat)                |
| 13    | 120,000     | +5          | 7th-level spells                    |
| 14    | 140,000     | +5          |                                     |
| 15    | 165,000     | +5          | 8th-level spells                    |
| 16    | 195,000     | +5          | **ASI #4** (or Feat)                |
| 17    | 225,000     | +6          | 9th-level spells                    |
| 18    | 265,000     | +6          |                                     |
| 19    | 305,000     | +6          | **ASI #5** (or Feat)                |
| 20    | 355,000     | +6          | Capstone features                   |

### Proficiency Bonus Pattern
```
Levels 1-4:   +2
Levels 5-8:   +3
Levels 9-12:  +4
Levels 13-16: +5
Levels 17-20: +6
```
Formula: `proficiency = floor((level - 1) / 4) + 2`

### ASI (Ability Score Improvement)
At levels **4, 8, 12, 16, 19** for most classes.
- Increase one ability by +2, OR two abilities by +1 each.
- Alternatively, take a **Feat** instead.
- Fighter gets extra ASIs at levels 6 and 14.
- Rogue gets an extra ASI at level 10.
- Ability scores cannot exceed 20 via ASI (without magic/epic boons).

---

## 8. Skills

### 18 Skills by Ability

| Ability  | Skills                                           |
|----------|--------------------------------------------------|
| STR (1)  | Athletics                                        |
| DEX (3)  | Acrobatics, Sleight of Hand, Stealth             |
| CON (0)  | (none)                                           |
| INT (5)  | Arcana, History, Investigation, Nature, Religion |
| WIS (5)  | Animal Handling, Insight, Medicine, Perception, Survival |
| CHA (4)  | Deception, Intimidation, Performance, Persuasion |

### Skill Check Formula
```
Unskilled:  d20 + ability modifier
Proficient: d20 + ability modifier + proficiency bonus
Expertise:  d20 + ability modifier + (proficiency bonus x 2)
```

### Passive Checks
```
Passive = 10 + all modifiers (proficiency, ability, advantage/disadvantage)
Advantage:    +5 to passive
Disadvantage: -5 to passive
```
Primary use: Passive Perception (detecting hidden creatures/traps).

### Proficiency
- Gained from class (typically 2-4 skills at level 1) and background (2 skills).
- Cannot stack. You are either proficient or not.

### Expertise (double proficiency)
- Bard: 2 skills at level 3, 2 more at level 10.
- Rogue: 2 skills at level 1, 2 more at level 6.
- Knowledge Cleric: 2 skills at level 1.
- Feat "Skill Expert": 1 skill expertise.

---

## 9. Equipment

### Armor

#### Light Armor
| Armor           | AC            | Stealth      | Cost    | Weight |
|-----------------|---------------|--------------|---------|--------|
| Padded          | 11 + DEX      | Disadvantage | 5 gp    | 8 lb   |
| Leather         | 11 + DEX      | --           | 10 gp   | 10 lb  |
| Studded Leather | 12 + DEX      | --           | 45 gp   | 13 lb  |

#### Medium Armor
| Armor        | AC              | Stealth      | STR Req | Cost    | Weight |
|--------------|-----------------|--------------|---------|---------|--------|
| Hide         | 12 + DEX (max 2)| --           | --      | 10 gp   | 12 lb  |
| Chain Shirt  | 13 + DEX (max 2)| --           | --      | 50 gp   | 20 lb  |
| Scale Mail   | 14 + DEX (max 2)| Disadvantage | --      | 50 gp   | 45 lb  |
| Breastplate  | 14 + DEX (max 2)| --           | --      | 400 gp  | 20 lb  |
| Half Plate   | 15 + DEX (max 2)| Disadvantage | --      | 750 gp  | 40 lb  |

#### Heavy Armor
| Armor      | AC  | Stealth      | STR Req | Cost     | Weight |
|------------|-----|--------------|---------|----------|--------|
| Ring Mail  | 14  | Disadvantage | --      | 30 gp    | 40 lb  |
| Chain Mail | 16  | Disadvantage | STR 13  | 75 gp    | 55 lb  |
| Splint     | 17  | Disadvantage | STR 15  | 200 gp   | 60 lb  |
| Plate      | 18  | Disadvantage | STR 15  | 1,500 gp | 65 lb  |

#### Shield
+2 AC. Requires one free hand.

### Weapons

#### Simple Melee Weapons
| Weapon      | Damage          | Weight | Properties                     |
|-------------|-----------------|--------|--------------------------------|
| Club        | 1d4 bludgeoning | 2 lb   | Light                          |
| Dagger      | 1d4 piercing    | 1 lb   | Finesse, light, thrown (20/60) |
| Greatclub   | 1d8 bludgeoning | 10 lb  | Two-handed                     |
| Handaxe     | 1d6 slashing    | 2 lb   | Light, thrown (20/60)          |
| Javelin     | 1d6 piercing    | 2 lb   | Thrown (30/120)                |
| Light Hammer| 1d4 bludgeoning | 2 lb   | Light, thrown (20/60)          |
| Mace        | 1d6 bludgeoning | 4 lb   | --                             |
| Quarterstaff| 1d6 bludgeoning | 4 lb   | Versatile (1d8)                |
| Sickle      | 1d4 slashing    | 2 lb   | Light                          |
| Spear       | 1d6 piercing    | 3 lb   | Thrown (20/60), versatile (1d8)|

#### Simple Ranged Weapons
| Weapon          | Damage          | Weight  | Properties                           |
|-----------------|-----------------|---------|--------------------------------------|
| Crossbow, light | 1d8 piercing    | 5 lb    | Ammunition (80/320), loading, two-handed |
| Dart            | 1d4 piercing    | 1/4 lb  | Finesse, thrown (20/60)              |
| Shortbow        | 1d6 piercing    | 2 lb    | Ammunition (80/320), two-handed      |
| Sling           | 1d4 bludgeoning | --      | Ammunition (30/120)                  |

#### Martial Melee Weapons
| Weapon      | Damage           | Weight | Properties                         |
|-------------|------------------|--------|------------------------------------|
| Battleaxe   | 1d8 slashing     | 4 lb   | Versatile (1d10)                   |
| Flail       | 1d8 bludgeoning  | 2 lb   | --                                 |
| Glaive      | 1d10 slashing    | 6 lb   | Heavy, reach, two-handed           |
| Greataxe    | 1d12 slashing    | 7 lb   | Heavy, two-handed                  |
| Greatsword  | 2d6 slashing     | 6 lb   | Heavy, two-handed                  |
| Halberd     | 1d10 slashing    | 6 lb   | Heavy, reach, two-handed           |
| Lance       | 1d12 piercing    | 6 lb   | Reach, special                     |
| Longsword   | 1d8 slashing     | 3 lb   | Versatile (1d10)                   |
| Maul        | 2d6 bludgeoning  | 10 lb  | Heavy, two-handed                  |
| Morningstar | 1d8 piercing     | 4 lb   | --                                 |
| Pike        | 1d10 piercing    | 18 lb  | Heavy, reach, two-handed           |
| Rapier      | 1d8 piercing     | 2 lb   | Finesse                            |
| Scimitar    | 1d6 slashing     | 3 lb   | Finesse, light                     |
| Shortsword  | 1d6 piercing     | 2 lb   | Finesse, light                     |
| Trident     | 1d6 piercing     | 4 lb   | Thrown (20/60), versatile (1d8)    |
| War pick    | 1d8 piercing     | 2 lb   | --                                 |
| Warhammer   | 1d8 bludgeoning  | 2 lb   | Versatile (1d10)                   |
| Whip        | 1d4 slashing     | 3 lb   | Finesse, reach                     |

#### Martial Ranged Weapons
| Weapon          | Damage          | Weight | Properties                                    |
|-----------------|-----------------|--------|-----------------------------------------------|
| Blowgun         | 1 piercing      | 1 lb   | Ammunition (25/100), loading                  |
| Crossbow, hand  | 1d6 piercing    | 3 lb   | Ammunition (30/120), light, loading           |
| Crossbow, heavy | 1d10 piercing   | 18 lb  | Ammunition (100/400), heavy, loading, two-handed |
| Longbow         | 1d8 piercing    | 2 lb   | Ammunition (150/600), heavy, two-handed       |
| Net             | --              | 3 lb   | Special, thrown (5/15)                        |

### Weapon Properties
| Property    | Effect                                                          |
|-------------|-----------------------------------------------------------------|
| Ammunition  | Requires ammo; range in parentheses (normal/max)                |
| Finesse     | Use STR or DEX for attack and damage (same for both)            |
| Heavy       | Small creatures have disadvantage on attack rolls               |
| Light       | Can be used for two-weapon fighting                             |
| Loading     | Only one attack per action regardless of Extra Attack           |
| Reach       | Adds 5 ft to melee reach (10 ft total)                         |
| Special     | See individual weapon description                               |
| Thrown      | Can make ranged attack with melee weapon; range (normal/max)    |
| Two-Handed  | Requires two hands to attack                                    |
| Versatile   | Can use one or two hands; two-handed damage in parentheses      |

### Range
- **Normal range**: attack rolls are normal.
- **Long range** (beyond normal, up to max): attack rolls have disadvantage.
- **Beyond max range**: cannot attack.

### Magic Items
| Rarity     | Approx. Level | Attunement  |
|------------|---------------|-------------|
| Common     | 1+            | Sometimes   |
| Uncommon   | 1+            | Sometimes   |
| Rare       | 5+            | Usually     |
| Very Rare  | 11+           | Usually     |
| Legendary  | 17+           | Usually     |
| Artifact   | 17+           | Always      |

- Max **3 attuned items** per character.
- Attunement requires a **short rest** (1 hour) focused on the item.
- Some items have class/race/alignment restrictions for attunement.

---

## 10. Death Saving Throws

### Rules
When you drop to **0 HP** and are not killed outright:
1. You fall **unconscious** and are **prone**.
2. At the **start of each of your turns**, roll a d20 (no modifiers).
3. **DC 10**: success on 10+, failure on 9 or less.

### Resolution
| Result     | Effect                                              |
|------------|-----------------------------------------------------|
| 3 successes| **Stabilized** (unconscious, no more death saves). Regain 1 HP after 1d4 hours. |
| 3 failures | **Dead.**                                           |
| Roll nat 1 | Counts as **2 failures**.                           |
| Roll nat 20| Regain **1 HP** immediately (conscious, resets saves). |

### Additional Rules
- Taking damage at 0 HP = 1 automatic death save failure.
- Critical hit at 0 HP = 2 automatic death save failures.
- **Instant death**: if remaining damage after hitting 0 HP >= your HP maximum, you die instantly.
- Healing at 0 HP: regain consciousness immediately, reset all death saves.
- **Stabilizing**: another creature can use an action for a DC 10 Wisdom (Medicine) check.
- **Knocking out**: melee attack reducing to 0 HP can choose KO instead of kill (creature is stable and unconscious).

---

## 11. Conditions / Status Effects

### 15 Standard Conditions

| Condition      | Key Mechanical Effects                                         |
|----------------|----------------------------------------------------------------|
| Blinded        | Auto-fail sight checks. Attacks have disadvantage. Attacks against have advantage. |
| Charmed        | Cannot attack charmer. Charmer has advantage on social checks. |
| Deafened       | Auto-fail hearing checks.                                      |
| Frightened     | Disadvantage on checks/attacks while source visible. Cannot approach source. |
| Grappled       | Speed = 0. Ends if grappler incapacitated or forced out of reach. |
| Incapacitated  | Cannot take actions or reactions.                              |
| Invisible      | Impossible to see (without magic/special sense). Attacks have advantage. Attacks against have disadvantage. |
| Paralyzed      | Incapacitated + cannot move/speak. Auto-fail STR/DEX saves. Attacks have advantage. Hits within 5 ft = critical. |
| Petrified      | Turned to stone. Incapacitated. Auto-fail STR/DEX saves. Resistance to all damage. Immune to poison/disease. |
| Poisoned       | Disadvantage on attack rolls and ability checks.               |
| Prone          | Can only crawl. Disadvantage on attacks. Melee attacks against have advantage. Ranged attacks against have disadvantage. |
| Restrained     | Speed = 0. Attacks against have advantage. Own attacks have disadvantage. Disadvantage on DEX saves. |
| Stunned        | Incapacitated + cannot move + faltering speech. Auto-fail STR/DEX saves. Attacks against have advantage. |
| Unconscious    | Incapacitated + cannot move/speak + unaware. Drop items, fall prone. Auto-fail STR/DEX saves. Attacks have advantage. Hits within 5 ft = critical. |
| Exhaustion     | 6-level cumulative condition (see below).                      |

### Exhaustion Levels (cumulative)

| Level | Effect                                  |
|-------|-----------------------------------------|
| 1     | Disadvantage on ability checks          |
| 2     | Speed halved                            |
| 3     | Disadvantage on attack rolls and saves  |
| 4     | Hit point maximum halved                |
| 5     | Speed reduced to 0                      |
| 6     | **Death**                               |

- Effects are cumulative (level 3 = all effects of 1+2+3).
- Recovery: long rest reduces by 1 level (requires food and drink).
- Being raised from the dead reduces by 1 level.

---

## 12. Multiclassing

### Prerequisites
Must meet ability score minimums for BOTH current class AND new class.

| Class     | Ability Score Minimum         |
|-----------|-------------------------------|
| Barbarian | STR 13                        |
| Bard      | CHA 13                        |
| Cleric    | WIS 13                        |
| Druid     | WIS 13                        |
| Fighter   | STR 13 **or** DEX 13          |
| Monk      | DEX 13 **and** WIS 13         |
| Paladin   | STR 13 **and** CHA 13         |
| Ranger    | DEX 13 **and** WIS 13         |
| Rogue     | DEX 13                        |
| Sorcerer  | CHA 13                        |
| Warlock   | CHA 13                        |
| Wizard    | INT 13                        |

### Proficiencies Gained (when multiclassing INTO a class)

| Class     | Proficiencies Gained                                    |
|-----------|---------------------------------------------------------|
| Barbarian | Shields, simple weapons, martial weapons                |
| Bard      | Light armor, 1 skill, 1 musical instrument              |
| Cleric    | Light armor, medium armor, shields                      |
| Druid     | Light armor, medium armor, shields (no metal)           |
| Fighter   | Light armor, medium armor, shields, simple & martial weapons |
| Monk      | Simple weapons, shortswords                             |
| Paladin   | Light armor, medium armor, shields, simple & martial weapons |
| Ranger    | Light armor, medium armor, shields, simple & martial weapons, 1 skill |
| Rogue     | Light armor, 1 skill, thieves' tools                    |
| Sorcerer  | (nothing)                                               |
| Warlock   | Light armor, simple weapons                             |
| Wizard    | (nothing)                                               |

### Multiclass Spellcasting
For determining total spell slots when multiclassing spellcasters:
```
Effective Caster Level = (full caster levels x 1) + (half caster levels x 0.5, rounded down) + (1/3 caster levels x 0.33, rounded down)
```
- **Full casters** (Bard, Cleric, Druid, Sorcerer, Wizard): count full class level.
- **Half-casters** (Paladin, Ranger): count half class level, rounded down.
- **Third-casters** (Eldritch Knight Fighter, Arcane Trickster Rogue): count 1/3 class level, rounded down.
- **Warlock**: Pact Magic slots are separate and do NOT combine into the multiclass table.

Use the effective caster level to look up the full caster spell slot table.

### Key Multiclassing Rules
- HP: use new class hit die for HP gained at new levels.
- Features: gain all features of the new class at level 1 (except starting equipment, some proficiencies).
- Extra Attack: does NOT stack between classes (taking Fighter 5/Ranger 5 still gives only 1 extra attack, not 2).
- Channel Divinity: multiple classes with this share the same number of uses.
- Spells known: determined by individual class level, not total character level.

---

## 13. SRD / OGL / Licensing (Digital Platform Implications)

### License Options for 5e Content

#### SRD 5.1 (Creative Commons CC-BY-4.0)
Released January 2023. The entire SRD 5.1 (400-page document) is available under CC-BY-4.0.
- **Only requirement**: attribution.
- Can be used commercially.
- Cannot be revoked.
- This is the recommended license for new projects.

#### OGL 1.0a
The SRD 5.1 is also still available under OGL 1.0a.
- More restrictive than CC-BY-4.0.
- Requires Section 15 credits.
- Cannot use Product Identity.

### What IS in the SRD 5.1 (free to use)

**Core Rules:**
- All core mechanics (d20 system, advantage/disadvantage, ability scores, combat, spellcasting)
- All 12 base classes (NOT Artificer) with one subclass each
- Character creation rules (point buy, standard array, rolling)
- Level progression, multiclassing rules
- All conditions, exhaustion, death saves
- All weapon/armor tables
- Resting rules, adventuring rules

**Races included:** Human, Dwarf (Hill), Elf (High), Halfling (Lightfoot), Dragonborn, Gnome (Rock), Half-Elf, Half-Orc, Tiefling

**One subclass per class:**
| Class     | SRD Subclass           |
|-----------|------------------------|
| Barbarian | Path of the Berserker  |
| Bard      | College of Lore        |
| Cleric    | Life Domain            |
| Druid     | Circle of the Land     |
| Fighter   | Champion               |
| Monk      | Way of the Open Hand   |
| Paladin   | Oath of Devotion       |
| Ranger    | Hunter                 |
| Rogue     | Thief                  |
| Sorcerer  | Draconic Bloodline     |
| Warlock   | The Fiend              |
| Wizard    | School of Evocation    |

**Spells:** ~400 spells from the PHB are included.

**Monsters:** ~300 monsters included (standard fantasy creatures).

**Magic Items:** Most DMG magic items are included.

### What is NOT in the SRD (proprietary - cannot use)

**Classes:** Artificer (from Tasha's Cauldron)

**Most subclasses:** Only one per class is in the SRD. All others (Totem Barbarian, Battlemaster Fighter, Assassin Rogue, etc.) are proprietary.

**Most races/subraces:** Aasimar, Firbolg, Goliath, Tabaxi, Kenku, Tortle, Genasi, Changeling, Warforged, etc.

**Product Identity Monsters (explicitly excluded):**
- Beholder (and Gauth)
- Mind Flayer (Illithid)
- Displacer Beast
- Githyanki / Githzerai
- Carrion Crawler
- Umber Hulk
- Yuan-ti (name, not the snake-people concept)
- Tanar'ri / Baatezu (demon/devil specific names)

**Named settings/characters:** Forgotten Realms lore, named NPCs, adventure modules, specific campaign settings.

### Practical Impact for Digital Platform
1. **Safe to implement**: All core mechanics, the d20 system, ability scores, spell slot system, combat rules, conditions, level progression, proficiency system. These are all in the SRD under CC-BY-4.0.
2. **Safe to include**: The listed SRD races, one subclass per class, ~400 spells, ~300 monsters, most magic items.
3. **Must avoid or rename**: Product Identity monsters, non-SRD subclasses, non-SRD races, specific setting lore.
4. **Workaround**: Create original races, subclasses, and monsters inspired by (but not copying) proprietary content. Many third-party publishers do this successfully.
5. **Attribution**: Under CC-BY-4.0, you must provide attribution to Wizards of the Coast for SRD content used.

---

## Quick Reference Formulas

```
Ability Modifier      = floor((ability_score - 10) / 2)
Proficiency Bonus     = floor((level - 1) / 4) + 2
AC (unarmored)        = 10 + DEX_mod
Attack Roll           = d20 + ability_mod + proficiency_bonus
Damage Roll           = weapon_dice + ability_mod
Spell Save DC         = 8 + proficiency_bonus + spellcasting_mod
Spell Attack          = d20 + proficiency_bonus + spellcasting_mod
Initiative            = d20 + DEX_mod
HP at Level 1         = max(hit_die) + CON_mod
HP per Level (avg)    = (hit_die / 2 + 1) + CON_mod
Passive Perception    = 10 + WIS_mod + (proficiency if proficient)
Carry Capacity        = STR_score * 15 (lbs)
```
