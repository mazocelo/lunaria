-- =============================================================================
-- Migracao: Normalizar valores de elemento nas 4 tabelas
-- Traduz nomes antigos para os canonicos da tabela elementos
-- =============================================================================

-- ===================== EQUIPAMENTOS =====================
-- relampago -> eletrico
UPDATE equipamentos SET elemento = array_replace(elemento, 'relampago', 'eletrico')
  WHERE 'relampago' = ANY(elemento);

-- trovao -> sonico
UPDATE equipamentos SET elemento = array_replace(elemento, 'trovao', 'sonico')
  WHERE 'trovao' = ANY(elemento);

-- forca -> contundente
UPDATE equipamentos SET elemento = array_replace(elemento, 'forca', 'contundente')
  WHERE 'forca' = ANY(elemento);

-- ===================== MONSTROS (campo elemento) =====================
-- eletricidade -> eletrico
UPDATE monstros SET elemento = array_replace(elemento, 'eletricidade', 'eletrico')
  WHERE 'eletricidade' = ANY(elemento);

-- magico -> arcano
UPDATE monstros SET elemento = array_replace(elemento, 'magico', 'arcano')
  WHERE 'magico' = ANY(elemento);

-- ===================== MONSTROS (campo imunidades) =====================
-- eletricidade -> eletrico
UPDATE monstros SET imunidades = array_replace(imunidades, 'eletricidade', 'eletrico')
  WHERE 'eletricidade' = ANY(imunidades);

-- frio -> gelo
UPDATE monstros SET imunidades = array_replace(imunidades, 'frio', 'gelo')
  WHERE 'frio' = ANY(imunidades);

-- ===================== MONSTROS (campo resistencias — JSON) =====================
-- frio -> gelo nas chaves do JSON
UPDATE monstros
  SET resistencias = (resistencias::jsonb - 'frio') || jsonb_build_object('gelo', (resistencias::jsonb -> 'frio'))
  WHERE resistencias::jsonb ? 'frio';

-- nao-magico permanece (nao eh elemento, eh condicao de dano)
-- charme permanece (nao eh elemento, eh condicao)

-- ===================== VANTAGENS =====================
-- luz -> radiante
UPDATE vantagens SET elemento = array_replace(elemento, 'luz', 'radiante')
  WHERE 'luz' = ANY(elemento);

-- magico -> arcano
UPDATE vantagens SET elemento = array_replace(elemento, 'magico', 'arcano')
  WHERE 'magico' = ANY(elemento);

-- eletrico ja esta correto
-- sonico ja esta correto

-- ===================== DESVANTAGENS =====================
-- luz -> radiante
UPDATE desvantagens SET elemento = array_replace(elemento, 'luz', 'radiante')
  WHERE 'luz' = ANY(elemento);

-- magico -> arcano
UPDATE desvantagens SET elemento = array_replace(elemento, 'magico', 'arcano')
  WHERE 'magico' = ANY(elemento);

-- Nota: kriptonita, prata, maldicao, radiacao, tecnologico sao fraquezas
-- especificas, NAO elementos de dano. Permanecem como estao.
