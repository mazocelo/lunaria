-- =============================================================================
-- Migração: Adicionar campos novos aos monstros
-- tamanho, habitat, resistencias, imunidades, velocidade
-- =============================================================================

ALTER TABLE monstros ADD COLUMN IF NOT EXISTS tamanho VARCHAR(30) DEFAULT 'medio';
ALTER TABLE monstros ADD COLUMN IF NOT EXISTS habitat VARCHAR(100)[] DEFAULT '{}';
ALTER TABLE monstros ADD COLUMN IF NOT EXISTS resistencias JSON DEFAULT '{}';
ALTER TABLE monstros ADD COLUMN IF NOT EXISTS imunidades VARCHAR(50)[] DEFAULT '{}';
ALTER TABLE monstros ADD COLUMN IF NOT EXISTS velocidade JSON DEFAULT '{"terrestre": 30}';
