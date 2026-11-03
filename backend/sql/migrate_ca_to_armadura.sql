-- =============================================================================
-- Migração: CA → Armadura (TA) + Esquiva (TE)
-- Overrides manuais para itens onde a auto-extração do generate_seed.cjs erra.
-- IMPORTANTE: Rodar DEPOIS do seed_equipamentos.sql
-- Usa "numero" (fixo do JSON) em vez de "id" (autoincrement).
-- =============================================================================

-- =====================
-- ARMADURAS PESADAS — override armadura/penalidade
-- =====================

-- #125: Obsidian Plate Armor (CA 20) → armadura 10, penalidade alta
UPDATE equipamentos SET bonus = '{"armadura":10,"esquiva_penalidade":15}' WHERE numero = 125;

-- =====================
-- ARMADURAS MEDIAS — remover penalidade para itens magicamente leves
-- =====================

-- #121: Half Plate of Speed (magicamente leve!) → armadura 6, SEM penalidade
UPDATE equipamentos SET bonus = '{"armadura":6}' WHERE numero = 121;

-- #124: Elven Chain (elfica, leve) → armadura 5, SEM penalidade
UPDATE equipamentos SET bonus = '{"armadura":5}' WHERE numero = 124;

-- #300: Serpent Scale Armor (flexivel) → armadura 5, SEM penalidade
UPDATE equipamentos SET bonus = '{"armadura":5}' WHERE numero = 300;

-- =====================
-- ARMADURAS LEVES — override para bonus esquiva
-- =====================

-- #119: Leather Armor of Shadow → armadura 3, esquiva alta (sombra)
UPDATE equipamentos SET bonus = '{"armadura":3,"esquiva_bonus":5}' WHERE numero = 119;

-- #118: Robe of the Archmagi → armadura 4, esquiva (magica protetora, nao é armadura media)
UPDATE equipamentos SET bonus = '{"armadura":4,"esquiva_bonus":5}' WHERE numero = 118;

-- =====================
-- FALSOS POSITIVOS — itens que tinham CA mas nao deveriam
-- =====================

-- #53: Keen Falchion (critico 15-20 confundido com CA 15)
UPDATE equipamentos SET bonus = '{"ataque":1,"dano":1}' WHERE numero = 53;

-- #215: Rope of Entanglement (CA 20 é da corda, nao do portador)
UPDATE equipamentos SET bonus = '{}' WHERE numero = 215;

-- #252: Apparatus of Kwalish (CA 20 é do veiculo) → armadura do aparato
UPDATE equipamentos SET bonus = '{"armadura":10}' WHERE numero = 252;

-- #285: Pipes of the Sewers (CA 1 — erro total)
UPDATE equipamentos SET bonus = '{}' WHERE numero = 285;

-- #102: Net of Binding (CA 5 é da rede)
UPDATE equipamentos SET bonus = '{}' WHERE numero = 102;

-- #254: Crown of the Eternal King (+4 era CAR/SAB, nao CA)
UPDATE equipamentos SET bonus = '{}' WHERE numero = 254;

-- =====================
-- ESCUDOS → armadura (absorvem golpes, nao esquiva)
-- =====================

-- #112: Animated Shield → armadura 3 (escudo flutuante)
UPDATE equipamentos SET bonus = '{"armadura":3}' WHERE numero = 112;

-- #113: Shield of Expression → armadura 2
UPDATE equipamentos SET bonus = '{"armadura":2}' WHERE numero = 113;

-- #114: Shield of Missile Attraction → armadura 2
UPDATE equipamentos SET bonus = '{"armadura":2}' WHERE numero = 114;

-- #115: Spellguard Shield → armadura 2 + esquiva magica
UPDATE equipamentos SET bonus = '{"armadura":2,"esquiva_bonus":3}' WHERE numero = 115;

-- #122: Shield of the Veiled Exile → armadura 2
UPDATE equipamentos SET bonus = '{"armadura":2}' WHERE numero = 122;

-- #293: Arrow-Catching Shield → armadura 2 + esquiva vs projeteis
UPDATE equipamentos SET bonus = '{"armadura":2,"esquiva_bonus":3}' WHERE numero = 293;

-- =====================
-- ARMAS COM CA → esquiva ou armadura contextual
-- =====================

-- #12: Nine Lives Stealer → manter ataque/dano + esquiva
UPDATE equipamentos SET bonus = '{"ataque":2,"dano":2,"esquiva_bonus":3}' WHERE numero = 12;

-- #22: Rapier of the Duelist → esquiva alta (duelista!)
UPDATE equipamentos SET bonus = '{"ataque":2,"dano":2,"esquiva_bonus":5}' WHERE numero = 22;

-- #89: Bardiche of the Black Knight → armadura (arma pesada, aura)
UPDATE equipamentos SET bonus = '{"ataque":2,"dano":2,"armadura":2}' WHERE numero = 89;

-- #92: Partisan of the Phalanx → armadura (formacao defensiva)
UPDATE equipamentos SET bonus = '{"ataque":1,"dano":1,"armadura":2}' WHERE numero = 92;

-- =====================
-- ACESSORIOS → esquiva
-- =====================

-- #117: Cloak of Protection → esquiva 3
UPDATE equipamentos SET bonus = '{"esquiva_bonus":3}' WHERE numero = 117;

-- #129: Ring of Protection → esquiva 3
UPDATE equipamentos SET bonus = '{"esquiva_bonus":3}' WHERE numero = 129;

-- #192: Potion of Speed → esquiva 10 (velocidade!)
UPDATE equipamentos SET bonus = '{"esquiva_bonus":10}' WHERE numero = 192;

-- #236: Helm of Brilliance → armadura 1 (elmo)
UPDATE equipamentos SET bonus = '{"armadura":1}' WHERE numero = 236;

-- #273: Bracers of Defense → esquiva 5 (para monges)
UPDATE equipamentos SET bonus = '{"esquiva_bonus":5}' WHERE numero = 273;

-- =====================
-- Atualizar propriedades[] → trocar 'bonus_ca' por 'bonus_armadura' ou 'bonus_esquiva'
-- =====================
UPDATE equipamentos SET propriedades = array_replace(propriedades, 'bonus_ca', 'bonus_armadura')
WHERE 'bonus_ca' = ANY(propriedades)
AND numero IN (106, 107, 108, 109, 120, 121, 123, 124, 125, 252, 300, 89, 92, 112, 113, 114, 115, 122, 236, 293);

UPDATE equipamentos SET propriedades = array_replace(propriedades, 'bonus_ca', 'bonus_esquiva')
WHERE 'bonus_ca' = ANY(propriedades)
AND numero IN (12, 22, 117, 129, 192, 273);

-- Limpar qualquer 'bonus_ca' remanescente
UPDATE equipamentos SET propriedades = array_remove(propriedades, 'bonus_ca')
WHERE 'bonus_ca' = ANY(propriedades);

-- =====================
-- Atualizar descricoes: trocar "CA" por "TA" nos equipamentos relevantes
-- =====================
UPDATE equipamentos SET descricao = REPLACE(descricao, 'CA ', 'TA ')
WHERE descricao LIKE '%CA %'
AND numero IN (106, 107, 108, 109, 112, 113, 114, 115, 117, 118, 119, 120, 121, 122, 123, 124, 125, 129, 192, 236, 273, 293, 300, 22, 89, 92);

UPDATE equipamentos SET descricao = REPLACE(descricao, '+2 TA', '+2 Armadura')
WHERE descricao LIKE '%+2 TA%';

UPDATE equipamentos SET descricao = REPLACE(descricao, '+1 TA', '+1 Armadura')
WHERE descricao LIKE '%+1 TA%';
