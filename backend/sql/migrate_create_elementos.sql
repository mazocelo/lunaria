-- =============================================================================
-- Migracao: Criar tabela de elementos (referencia canonica)
-- 19 elementos padronizados para uso em equipamentos, monstros,
-- vantagens e desvantagens
-- =============================================================================

CREATE TABLE IF NOT EXISTS elementos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(30) UNIQUE NOT NULL,
  descricao TEXT,
  cor VARCHAR(30),
  icone VARCHAR(10),
  ordem INT DEFAULT 0
);

INSERT INTO elementos (id, nome, descricao, cor, icone, ordem) VALUES
  (1,  'fogo',        'Dano termico por chamas e calor intenso',             'orange',  '🔥', 1),
  (2,  'gelo',        'Dano por frio extremo, congelamento',                 'cyan',    '❄️', 2),
  (3,  'eletrico',    'Dano por corrente eletrica e descargas',              'yellow',  '⚡', 3),
  (4,  'acido',       'Dano corrosivo por substancias quimicas',             'lime',    '🧪', 4),
  (5,  'veneno',      'Dano toxico biologico, envenenamento',                'green',   '☠️', 5),
  (6,  'sonico',      'Dano por ondas sonoras, vibracoes e trovoes',         'indigo',  '🔊', 6),
  (7,  'radiante',    'Dano por energia luminosa pura, poder sagrado',       'amber',   '✨', 7),
  (8,  'necrotico',   'Dano vital thanatico, drena forca vital',             'purple',  '💀', 8),
  (9,  'sombrio',     'Dano de origem das sombras e trevas',                 'slate',   '🌑', 9),
  (10, 'psiquico',    'Dano mental, ataques a mente e vontade',              'pink',    '🧠', 10),
  (11, 'arcano',      'Energia magica pura, forca mistica bruta',            'violet',  '🔮', 11),
  (12, 'divino',      'Poder celestial ou infernal, energia dos planos',     'gold',    '⛪', 12),
  (13, 'natureza',    'Forca primal, energia da terra e dos seres vivos',    'emerald', '🌿', 13),
  (14, 'agua',        'Dano por pressao hidrica, afogamento, erosao',        'blue',    '🌊', 14),
  (15, 'terra',       'Dano por impacto tellurico, petrificacao',            'amber',   '🪨', 15),
  (16, 'vento',       'Dano por rajadas, pressao de ar, ciclones',           'sky',     '🌪️', 16),
  (17, 'contundente', 'Dano fisico por impacto, esmagamento',                'stone',   '🔨', 17),
  (18, 'cortante',    'Dano fisico por corte, laceracao',                    'red',     '⚔️', 18),
  (19, 'perfurante',  'Dano fisico por perfuracao, penetracao',              'gray',    '🏹', 19)
ON CONFLICT (nome) DO NOTHING;
