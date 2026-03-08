-- =============================================================================
-- Migração: CA → Armadura (TA) + Esquiva (TE)
-- Converte bonus JSON dos equipamentos de { ca, ca_base } para { armadura, esquiva_bonus, esquiva_penalidade }
-- =============================================================================

-- =====================
-- ARMADURAS (ca_base) — tipo pesado: alta armadura, penalidade esquiva
-- =====================

-- ID 106: Armor of Invulnerability (placas, ca_base:18) → armadura 8, penalidade esquiva pesada
UPDATE equipamentos SET bonus = '{"armadura":8,"esquiva_penalidade":10}' WHERE id = 106;

-- ID 107: Demon Armor (placas completas, ca_base:18) → armadura 8, penalidade esquiva
UPDATE equipamentos SET bonus = '{"armadura":8,"esquiva_penalidade":10}' WHERE id = 107;

-- ID 109: Plate Armor of Etherealness (placas completas, ca_base:18) → armadura 8, penalidade esquiva
UPDATE equipamentos SET bonus = '{"armadura":8,"esquiva_penalidade":10}' WHERE id = 109;

-- ID 123: Armor of the Fallen (placas, ca_base:18) → armadura 8, penalidade esquiva
UPDATE equipamentos SET bonus = '{"armadura":8,"esquiva_penalidade":10}' WHERE id = 123;

-- ID 125: Obsidian Plate Armor (placas completas, ca_base:20) → armadura 10 (a melhor!), penalidade esquiva grande
UPDATE equipamentos SET bonus = '{"armadura":10,"esquiva_penalidade":15}' WHERE id = 125;

-- =====================
-- ARMADURAS MEDIAS — armadura moderada, penalidade menor
-- =====================

-- ID 108: Dragon Scale Mail (cota escamas, ca_base:14) → armadura 5, penalidade leve
UPDATE equipamentos SET bonus = '{"armadura":5,"esquiva_penalidade":3}' WHERE id = 108;

-- ID 120: Breastplate of Command (peitoral, ca_base:14) → armadura 5, penalidade leve
UPDATE equipamentos SET bonus = '{"armadura":5,"esquiva_penalidade":3}' WHERE id = 120;

-- ID 121: Half Plate of Speed (meia-placa, ca_base:15) → armadura 6, SEM penalidade (magicamente leve!)
UPDATE equipamentos SET bonus = '{"armadura":6}' WHERE id = 121;

-- ID 124: Elven Chain (cota de malhas elfica, ca_base:14) → armadura 5, SEM penalidade (elfica, leve)
UPDATE equipamentos SET bonus = '{"armadura":5}' WHERE id = 124;

-- ID 300: Serpent Scale Armor (escamas cobra, ca_base:14) → armadura 5, sem penalidade (flexivel)
UPDATE equipamentos SET bonus = '{"armadura":5}' WHERE id = 300;

-- =====================
-- ARMADURAS LEVES — pouca armadura, bonus de esquiva
-- =====================

-- ID 119: Leather Armor of Shadow (couro, ca_base:12) → armadura 3, bonus esquiva (sombra ajuda a esquivar)
UPDATE equipamentos SET bonus = '{"armadura":3,"esquiva_bonus":5}' WHERE id = 119;

-- ID 118: Robe of the Archmagi (robe magica, ca_base:15) → armadura 4, bonus esquiva (magica protetora)
UPDATE equipamentos SET bonus = '{"armadura":4,"esquiva_bonus":5}' WHERE id = 118;

-- =====================
-- ARMA com ca_base errado (nao faz sentido)
-- =====================

-- ID 53: Keen Falchion of Wounding (alfanje, ca_base:15 era erro — critico 15-20 nao é CA)
UPDATE equipamentos SET bonus = '{"ataque":1,"dano":1}' WHERE id = 53;

-- =====================
-- ITENS NAO-ARMADURA com ca_base (CA era do proprio item, nao do portador)
-- =====================

-- ID 215: Rope of Entanglement (ca_base:20 é CA da corda, nao do portador) → remover
UPDATE equipamentos SET bonus = '{}' WHERE id = 215;

-- ID 252: Apparatus of Kwalish (ca_base:20 é CA do veiculo, nao do portador) → remover
UPDATE equipamentos SET bonus = '{"armadura":10}' WHERE id = 252;

-- ID 285: Pipes of the Sewers (ca_base:1 — erro total) → remover
UPDATE equipamentos SET bonus = '{}' WHERE id = 285;

-- =====================
-- ESCUDOS (ca:2) → armadura moderada (absorvem golpes)
-- =====================

-- ID 112: Animated Shield (ca:2) → armadura 3 (escudo flutuante, protege bem)
UPDATE equipamentos SET bonus = '{"armadura":3}' WHERE id = 112;

-- ID 113: Shield of Expression (ca:2) → armadura 2
UPDATE equipamentos SET bonus = '{"armadura":2}' WHERE id = 113;

-- ID 114: Shield of Missile Attraction (ca:2, amaldiçoado) → armadura 2
UPDATE equipamentos SET bonus = '{"armadura":2}' WHERE id = 114;

-- ID 115: Spellguard Shield (ca:2) → armadura 2, bonus esquiva (protecao magica)
UPDATE equipamentos SET bonus = '{"armadura":2,"esquiva_bonus":3}' WHERE id = 115;

-- ID 122: Shield of the Veiled Exile (ca:2) → armadura 2
UPDATE equipamentos SET bonus = '{"armadura":2}' WHERE id = 122;

-- ID 293: Arrow-Catching Shield (ca:2) → armadura 2, bonus esquiva contra projeteis
UPDATE equipamentos SET bonus = '{"armadura":2,"esquiva_bonus":3}' WHERE id = 293;

-- =====================
-- ARMAS COM CA (bonus defensivo da arma) → armadura leve ou esquiva
-- =====================

-- ID 12: Nine Lives Stealer (ataque:2, dano:2, ca:1) → manter ataque/dano, dar esquiva (agilidade da lamina)
UPDATE equipamentos SET bonus = '{"ataque":2,"dano":2,"esquiva_bonus":3}' WHERE id = 12;

-- ID 22: Rapier of the Duelist (ataque:2, dano:2, ca:2) → esquiva alta (duelista!)
UPDATE equipamentos SET bonus = '{"ataque":2,"dano":2,"esquiva_bonus":5}' WHERE id = 22;

-- ID 89: Bardiche of the Black Knight (ataque:2, dano:2, ca:2) → armadura (aura pesada)
UPDATE equipamentos SET bonus = '{"ataque":2,"dano":2,"armadura":2}' WHERE id = 89;

-- ID 92: Partisan of the Phalanx (ataque:1, dano:1, ca:2) → armadura (formacao defensiva)
UPDATE equipamentos SET bonus = '{"ataque":1,"dano":1,"armadura":2}' WHERE id = 92;

-- =====================
-- ACESSORIOS COM CA → esquiva (itens leves/magicos dao esquiva)
-- =====================

-- ID 102: Net of Binding (ca:5) — CA da rede, nao do portador → remover
UPDATE equipamentos SET bonus = '{}' WHERE id = 102;

-- ID 117: Cloak of Protection (ca:1) → esquiva (manto magico ajuda a esquivar)
UPDATE equipamentos SET bonus = '{"esquiva_bonus":3}' WHERE id = 117;

-- ID 129: Ring of Protection (ca:1) → esquiva (anel magico de protecao)
UPDATE equipamentos SET bonus = '{"esquiva_bonus":3}' WHERE id = 129;

-- ID 192: Potion of Speed (ca:2) → esquiva alta (velocidade!)
UPDATE equipamentos SET bonus = '{"esquiva_bonus":10}' WHERE id = 192;

-- ID 236: Helm of Brilliance (ca:1) → armadura leve (elmo)
UPDATE equipamentos SET bonus = '{"armadura":1}' WHERE id = 236;

-- ID 254: Crown of the Eternal King (ca:4) — descricao diz +4 CAR/SAB, nao era CA → remover CA
UPDATE equipamentos SET bonus = '{}' WHERE id = 254;

-- ID 273: Bracers of Defense (ca:2) → esquiva (bracadeiras, leves, para monges)
UPDATE equipamentos SET bonus = '{"esquiva_bonus":5}' WHERE id = 273;

-- =====================
-- Atualizar propriedades[] → trocar 'bonus_ca' por 'bonus_armadura' ou 'bonus_esquiva'
-- =====================
UPDATE equipamentos SET propriedades = array_replace(propriedades, 'bonus_ca', 'bonus_armadura')
WHERE 'bonus_ca' = ANY(propriedades)
AND id IN (106, 107, 108, 109, 120, 121, 123, 124, 125, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 146, 147, 148, 149, 150, 151, 152, 153, 252, 300, 89, 92, 112, 113, 114, 115, 122, 236, 293);

UPDATE equipamentos SET propriedades = array_replace(propriedades, 'bonus_ca', 'bonus_esquiva')
WHERE 'bonus_ca' = ANY(propriedades)
AND id IN (22, 117, 129, 192, 273, 12, 50);

-- Limpar qualquer 'bonus_ca' remanescente
UPDATE equipamentos SET propriedades = array_remove(propriedades, 'bonus_ca')
WHERE 'bonus_ca' = ANY(propriedades);

-- =====================
-- Atualizar descricoes: trocar "CA" por "TA" (Taxa de Armadura) ou "TE" (Taxa de Esquiva)
-- nas descricoes dos equipamentos que tinham CA
-- =====================
UPDATE equipamentos SET descricao = REPLACE(descricao, 'CA ', 'TA ')
WHERE descricao LIKE '%CA %' AND id IN (106, 107, 108, 109, 112, 113, 114, 115, 117, 118, 119, 120, 121, 122, 123, 124, 125, 129, 134, 136, 137, 140, 141, 142, 143, 145, 146, 147, 148, 149, 150, 151, 152, 153, 192, 236, 265, 273, 293, 300, 302, 22, 50, 89, 92);

UPDATE equipamentos SET descricao = REPLACE(descricao, '+2 TA', '+2 Armadura')
WHERE descricao LIKE '%+2 TA%';

UPDATE equipamentos SET descricao = REPLACE(descricao, '+1 TA', '+1 Armadura')
WHERE descricao LIKE '%+1 TA%';
