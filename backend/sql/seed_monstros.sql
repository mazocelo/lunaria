-- ============================================================================
-- SEED: Monstros do RPG
-- 35 monstros diversos distribuidos entre niveis 1-10
-- Compativel com PostgreSQL
-- ============================================================================

-- ============================================================================
-- NIVEL 1-2 (8 monstros) - Encontros iniciais
-- ============================================================================

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Goblin',
    'Criatura pequena e ardilosa que vive em bandos nas periferias de aldeias e ruinas. Apesar de fraco individualmente, sua astucia e numeros compensam sua fragilidade. Carrega armas improvisadas e possui um faro aguçado para ouro.',
    ARRAY['humanoide'],
    'comum',
    1, 2,
    18,
    8, 10, 12, 8, 12, 6,
    6, 4,
    '1d4+1',
    '[{"nome": "Emboscada", "descricao": "O goblin ataca de surpresa saindo das sombras, causando dano extra ao alvo desprevenido.", "tipo": "ofensiva", "dano": "1d6+2", "efeito": null, "cooldown": 3, "chance": 50}, {"nome": "Grito de Alarme", "descricao": "Emite um grito agudo que alerta aliados proximos e desorienta o inimigo momentaneamente.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 60}]',
    ARRAY['sombrio'],
    ARRAY['medieval', 'fantasia', 'sombrio'],
    25
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Rato Gigante',
    'Roedor mutante do tamanho de um cao, encontrado em esgotos, laboratorios abandonados e depositos de lixo toxico. Seus dentes afiados carregam doencas terriveis e sua agilidade o torna dificil de acertar.',
    ARRAY['besta'],
    'comum',
    1, 2,
    14,
    6, 3, 14, 8, 14, 2,
    5, 3,
    '1d4',
    '[{"nome": "Mordida Infecta", "descricao": "Uma mordida profunda que injeta bacterias nocivas na corrente sanguinea do alvo.", "tipo": "ofensiva", "dano": "1d4+1", "efeito": {"tipo": "veneno", "duracao": 3, "dano_por_turno": "1d2"}, "cooldown": 2, "chance": 45}, {"nome": "Evasao Rapida", "descricao": "O rato se esquiva com velocidade sobrenatural, dificultando ataques direcionados a ele.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 55}]',
    ARRAY['natureza'],
    ARRAY['medieval', 'cyberpunk', 'pos-apocalipse', 'terror'],
    20
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Esqueleto',
    'Restos osseos reanimados por magia necromante. Desprovido de carne ou vontade propria, obedece cegamente ao seu mestre. Empunha armas enferrujadas e avança sem medo, pois ja nao tem nada a perder.',
    ARRAY['morto-vivo'],
    'comum',
    1, 2,
    20,
    10, 4, 10, 12, 8, 2,
    6, 6,
    '1d6',
    '[{"nome": "Golpe Osseo", "descricao": "Desfere um golpe brutal com seu punho ossificado, produzindo um estalo sinistro ao impacto.", "tipo": "ofensiva", "dano": "1d6+1", "efeito": null, "cooldown": 1, "chance": 60}, {"nome": "Reconstituicao", "descricao": "Reagrupa seus ossos fragmentados, recuperando parte de sua estrutura.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "cura", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 35}]',
    ARRAY['sombrio'],
    ARRAY['medieval', 'fantasia', 'terror', 'sombrio'],
    22
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Slime Acido',
    'Massa gelatinosa translucida de coloracao verde-amarelada que se arrasta por masmorras umidas. Dissolve materia organica ao contato e pode se dividir quando ameaçada. Sua aparencia inofensiva engana aventureiros incautos.',
    ARRAY['aberracao'],
    'comum',
    1, 2,
    22,
    4, 2, 6, 14, 4, 1,
    4, 7,
    '1d4',
    '[{"nome": "Toque Corrosivo", "descricao": "Projeta uma porcao de acido que corroi armaduras e carne, reduzindo a defesa do alvo.", "tipo": "ofensiva", "dano": "1d6", "efeito": {"tipo": "veneno", "duracao": 2, "dano_por_turno": "1d2"}, "cooldown": 2, "chance": 50}, {"nome": "Divisao", "descricao": "Ao receber dano fisico, o slime se divide em uma copia menor de si mesmo.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 3, "dano_por_turno": null}, "cooldown": 5, "chance": 30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'cyberpunk', 'pos-apocalipse'],
    24
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Kobold',
    'Reptiliano humanoide de baixa estatura que vive em tuneis subterraneos elaborados. Mestre em armadilhas e emboscadas, compensa sua fraqueza fisica com engenhosidade e trabalho em equipe. Venera dragoes como divindades.',
    ARRAY['humanoide'],
    'comum',
    1, 2,
    16,
    7, 12, 13, 7, 12, 5,
    5, 3,
    '1d4',
    '[{"nome": "Armadilha Improvisada", "descricao": "Lança uma armadilha rudimentar que prende os pes do inimigo, reduzindo sua mobilidade.", "tipo": "ofensiva", "dano": "1d4", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 45}, {"nome": "Tatica de Bando", "descricao": "Coordena um ataque sincronizado com aliados proximos, aumentando a precisao do grupo.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 50}, {"nome": "Fuga Covarde", "descricao": "Escava rapidamente no chao e desaparece, evitando um ataque iminente.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 1, "dano_por_turno": null}, "cooldown": 5, "chance": 40}]',
    ARRAY['terra'],
    ARRAY['medieval', 'fantasia', 'steampunk'],
    22
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Lobo Sombrio',
    'Lobo de pelagem negra como a noite, cujos olhos brilham com um vermelho sobrenatural. Caça em matilhas silenciosas nas bordas de florestas amaldiçoadas. Sua mordida drena a vitalidade da presa.',
    ARRAY['besta'],
    'incomum',
    1, 2,
    20,
    10, 6, 12, 10, 14, 4,
    7, 5,
    '1d6',
    '[{"nome": "Mordida Sombria", "descricao": "Crava os dentes imbuidos de energia sombria no alvo, drenando parte de sua essencia vital.", "tipo": "ofensiva", "dano": "1d6+2", "efeito": {"tipo": "veneno", "duracao": 2, "dano_por_turno": "1d2"}, "cooldown": 2, "chance": 55}, {"nome": "Uivo Aterrorizante", "descricao": "Um uivo sobrenatural que ecoa pelas sombras, paralisando de medo os mais fracos.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 40}]',
    ARRAY['sombrio'],
    ARRAY['medieval', 'fantasia', 'terror', 'sombrio'],
    30
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Bandido',
    'Fora-da-lei desesperado que sobrevive assaltando viajantes em estradas desertas. Alguns sao ex-soldados, outros apenas camponeses famintos. Usa taticas sujas e nao tem escrúpulos quando sua vida esta em jogo.',
    ARRAY['humanoide'],
    'comum',
    1, 2,
    18,
    10, 8, 11, 10, 10, 7,
    6, 5,
    '1d6',
    '[{"nome": "Golpe Traicoeiro", "descricao": "Ataca pelas costas ou de um angulo inesperado, visando pontos vulneraveis da armadura.", "tipo": "ofensiva", "dano": "1d6+2", "efeito": null, "cooldown": 2, "chance": 50}, {"nome": "Provocacao", "descricao": "Insulta e provoca o oponente, tentando quebrar sua concentracao e faze-lo cometer erros.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 3, "chance": 45}]',
    ARRAY['natureza'],
    ARRAY['medieval', 'fantasia', 'pirataria', 'steampunk'],
    22
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Morcego Vampiro',
    'Morcego de proporçoes anormais com presas alongadas que brilham na escuridao. Habita cavernas profundas e ruinas goticas, emergindo ao anoitecer para se alimentar. Seu guincho agudo desorienta as vitimas antes do ataque.',
    ARRAY['besta', 'morto-vivo'],
    'comum',
    1, 2,
    12,
    5, 4, 14, 6, 16, 3,
    5, 2,
    '1d4',
    '[{"nome": "Mordida Vampirica", "descricao": "Crava as presas no pescoço do alvo, drenando sangue e recuperando parte de sua propria vitalidade.", "tipo": "ofensiva", "dano": "1d4+1", "efeito": {"tipo": "cura", "duracao": 1, "dano_por_turno": null}, "cooldown": 2, "chance": 55}, {"nome": "Guincho Sonico", "descricao": "Emite ondas sonoras de alta frequencia que desorientam e atordoam criaturas proximas.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 40}]',
    ARRAY['sombrio'],
    ARRAY['medieval', 'terror', 'sombrio'],
    18
);

-- ============================================================================
-- NIVEL 3-4 (8 monstros) - Desafios intermediarios iniciais
-- ============================================================================

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Orc Guerreiro',
    'Humanoide massivo de pele esverdeada, coberto de cicatrizes de batalha e tatuagens tribais. Treinado desde o nascimento para a guerra, empunha machados brutais e veste armaduras feitas de ossos e metal. Sua furia em combate e lendaria.',
    ARRAY['humanoide'],
    'comum',
    3, 4,
    38,
    14, 6, 9, 14, 8, 5,
    10, 8,
    '1d8+2',
    '[{"nome": "Furia Berserker", "descricao": "Entra em um estado de furia incontrolavel, aumentando drasticamente sua forca e ignorando a dor.", "tipo": "ofensiva", "dano": "2d6+3", "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 45}, {"nome": "Grito de Guerra", "descricao": "Um rugido ensurdecedor que intimida os inimigos e inspira aliados orcs proximos.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 3, "chance": 50}]',
    ARRAY['terra'],
    ARRAY['medieval', 'fantasia', 'sombrio'],
    55
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Zumbi Putrefato',
    'Cadaver em avançado estado de decomposiçao, reanimado por uma praga necrotica de origem desconhecida. Pedaços de carne apodrecida pendem de seus ossos expostos, e um gas toxico emana de suas entranhas. Lento, mas implacavel.',
    ARRAY['morto-vivo'],
    'comum',
    3, 4,
    44,
    12, 2, 6, 16, 4, 1,
    9, 10,
    '1d6+2',
    '[{"nome": "Abraço Putrefato", "descricao": "Agarra o alvo com seus braços em decomposicao, expondo-o a toxinas necroticas letais.", "tipo": "ofensiva", "dano": "1d8+1", "efeito": {"tipo": "veneno", "duracao": 3, "dano_por_turno": "1d4"}, "cooldown": 3, "chance": 40}, {"nome": "Nuvem Toxica", "descricao": "Libera uma nuvem de gas venenoso de seu corpo em decomposicao que envenena todos ao redor.", "tipo": "ofensiva", "dano": "1d4", "efeito": {"tipo": "veneno", "duracao": 2, "dano_por_turno": "1d3"}, "cooldown": 4, "chance": 35}, {"nome": "Persistencia Morta", "descricao": "Mesmo apos receber um golpe fatal, levanta-se uma ultima vez com vitalidade residual.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "cura", "duracao": 1, "dano_por_turno": null}, "cooldown": 6, "chance": 25}]',
    ARRAY['sombrio'],
    ARRAY['medieval', 'terror', 'pos-apocalipse', 'sombrio'],
    50
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Harpia',
    'Criatura alada com corpo de ave de rapina e rosto de mulher distorcido pela malicia. Habita penhascos e torres abandonadas, de onde mergulha sobre suas vitimas com garras afiadas como navalhas. Seu canto hipnotico atrai os desavisados.',
    ARRAY['besta', 'fada'],
    'incomum',
    3, 4,
    30,
    10, 9, 14, 9, 15, 10,
    9, 5,
    '1d6+1',
    '[{"nome": "Mergulho Rasante", "descricao": "Desce em alta velocidade do ceu, atacando com garras estendidas antes de retornar a altura.", "tipo": "ofensiva", "dano": "1d8+2", "efeito": null, "cooldown": 2, "chance": 55}, {"nome": "Canto Hipnotico", "descricao": "Entoa uma melodia sobrenatural que encanta e paralisa criaturas que a ouvem.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 35}]',
    ARRAY['vento'],
    ARRAY['fantasia', 'mitologia', 'medieval'],
    60
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Lobo Alfa',
    'O lider de uma matilha de lobos colossais, com pelagem prateada e cicatrizes de incontaveis batalhas territoriais. Maior e mais forte que qualquer lobo comum, comanda sua matilha com autoridade absoluta e instinto predatorio afiado.',
    ARRAY['besta'],
    'incomum',
    3, 4,
    36,
    13, 7, 13, 12, 14, 6,
    10, 7,
    '1d8+1',
    '[{"nome": "Investida Brutal", "descricao": "Avança em linha reta com forca total, derrubando o alvo ao chao com o impacto.", "tipo": "ofensiva", "dano": "1d8+3", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 45}, {"nome": "Comando da Matilha", "descricao": "Emite um uivo grave que ordena a matilha a atacar em conjunto de forma coordenada.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 3, "dano_por_turno": null}, "cooldown": 5, "chance": 50}, {"nome": "Instinto Predatorio", "descricao": "Sente fraquezas no oponente, aumentando a chance de acerto critico no proximo ataque.", "tipo": "ofensiva", "dano": "2d6", "efeito": null, "cooldown": 4, "chance": 35}]',
    ARRAY['natureza'],
    ARRAY['medieval', 'fantasia', 'terror'],
    65
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Aranha Gigante',
    'Aracnideo monstruoso do tamanho de um cavalo, com mandibulas venenosas e a capacidade de tecer teias incrivelmente resistentes. Habita cavernas e florestas densas, onde constroi armadilhas elaboradas para capturar presas.',
    ARRAY['besta'],
    'comum',
    3, 4,
    32,
    11, 5, 13, 12, 13, 2,
    9, 7,
    '1d6+2',
    '[{"nome": "Picada Venenosa", "descricao": "Injeta um veneno neurotóxico atraves de suas queliceras, paralisando lentamente a vitima.", "tipo": "ofensiva", "dano": "1d6+1", "efeito": {"tipo": "veneno", "duracao": 3, "dano_por_turno": "1d4"}, "cooldown": 3, "chance": 50}, {"nome": "Teia Aprisionante", "descricao": "Lança uma teia pegajosa e resistente que imobiliza completamente o alvo.", "tipo": "ofensiva", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    52
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Gnoll',
    'Humanoide hibrido entre homem e hiena, movido por uma fome insaciavel e crueldade instintiva. Vive em tribos nomades que devastam tudo em seu caminho. Sua risada maniaca ecoa pelos campos de batalha enquanto devora os caidos.',
    ARRAY['humanoide'],
    'comum',
    3, 4,
    34,
    13, 6, 11, 12, 11, 4,
    9, 7,
    '1d8+1',
    '[{"nome": "Frenesi Sanguinario", "descricao": "O cheiro de sangue desencadeia um frenesi violento, aumentando a velocidade e brutalidade dos ataques.", "tipo": "ofensiva", "dano": "2d6+1", "efeito": null, "cooldown": 3, "chance": 45}, {"nome": "Risada Enlouquecedora", "descricao": "Uma gargalhada maniaca que desestabiliza psicologicamente os oponentes, reduzindo sua moral.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 40}]',
    ARRAY['sombrio'],
    ARRAY['medieval', 'fantasia', 'sombrio'],
    55
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Fantasma',
    'Espirito atormentado de alguem que morreu com assuntos inacabados. Sua forma translucida flutua atraves de paredes e objetos solidos, e seu toque gelido drena o calor vital dos vivos. Busca eternamente resolver o que o prende ao mundo mortal.',
    ARRAY['morto-vivo'],
    'incomum',
    3, 4,
    26,
    4, 12, 14, 8, 14, 8,
    8, 3,
    '1d6',
    '[{"nome": "Toque Glacial", "descricao": "Atravessa o corpo do alvo com sua mao eterea, causando um frio sobrenatural que congela a alma.", "tipo": "ofensiva", "dano": "1d8+1", "efeito": {"tipo": "gelo", "duracao": 2, "dano_por_turno": "1d2"}, "cooldown": 2, "chance": 50}, {"nome": "Lamento dos Mortos", "descricao": "Emite um gemido de agonia do alem que aterroriza e paralisa os vivos de medo.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 35}, {"nome": "Forma Eterea", "descricao": "Torna-se completamente incorporeo, fazendo ataques fisicos passarem atraves de si.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 45}]',
    ARRAY['gelo', 'sombrio'],
    ARRAY['medieval', 'terror', 'sombrio', 'cyberpunk'],
    62
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Esqueleto Guerreiro',
    'Diferente de esqueletos comuns, este foi um soldado veterano em vida e reteve fragmentos de sua habilidade marcial mesmo apos a morte. Empunha espada e escudo com precisao sobrenatural, e seus ossos foram reforçados por magia necromante.',
    ARRAY['morto-vivo'],
    'incomum',
    3, 4,
    36,
    12, 6, 11, 14, 10, 3,
    10, 9,
    '1d8+1',
    '[{"nome": "Estocada Mortal", "descricao": "Desfere um golpe de espada preciso e calculado, visando brechas na armadura do oponente.", "tipo": "ofensiva", "dano": "1d10+2", "efeito": null, "cooldown": 2, "chance": 50}, {"nome": "Defesa Ossea", "descricao": "Ergue seu escudo de ossos amalgamados, bloqueando uma parcela significativa do proximo ataque.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 3, "chance": 55}]',
    ARRAY['sombrio'],
    ARRAY['medieval', 'fantasia', 'terror'],
    58
);

-- ============================================================================
-- NIVEL 5-6 (7 monstros) - Desafios intermediarios
-- ============================================================================

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Troll das Cavernas',
    'Gigante grotesco de pele verde-acinzentada e regeneracao sobrenatural. Habita as profundezas de cavernas umidas, onde devora qualquer criatura que cruze seu caminho. Apenas fogo ou acido podem impedir sua regeneracao.',
    ARRAY['humanoide'],
    'incomum',
    5, 6,
    65,
    16, 4, 8, 18, 7, 3,
    14, 10,
    '2d6+2',
    '[{"nome": "Dilacerar", "descricao": "Rasga o alvo com ambas as garras simultaneamente, causando ferimentos profundos e sangramento.", "tipo": "ofensiva", "dano": "2d8+3", "efeito": {"tipo": "veneno", "duracao": 2, "dano_por_turno": "1d4"}, "cooldown": 3, "chance": 50}, {"nome": "Regeneracao", "descricao": "Seu corpo se reconstitui rapidamente, fechando feridas e restaurando tecidos danificados.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "cura", "duracao": 3, "dano_por_turno": null}, "cooldown": 4, "chance": 60}, {"nome": "Arremesso de Rocha", "descricao": "Arranca um pedaço do chao da caverna e arremessa contra o alvo com forca devastadora.", "tipo": "ofensiva", "dano": "2d6+4", "efeito": null, "cooldown": 3, "chance": 40}]',
    ARRAY['terra', 'natureza'],
    ARRAY['medieval', 'fantasia', 'sombrio'],
    120
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Quimera',
    'Aberracao magica com cabeça de leao, corpo de cabra e cauda de serpente. Criada por feiticeiros loucos como arma biologica, combina a ferocidade de tres bestas em uma unica criatura caótica. Cada cabeça ataca de forma independente.',
    ARRAY['besta', 'aberracao'],
    'raro',
    5, 6,
    58,
    15, 6, 11, 14, 10, 4,
    13, 9,
    '2d6+1',
    '[{"nome": "Baforada de Fogo", "descricao": "A cabeça de leao expele uma rajada de chamas ardentes que incinera tudo em seu caminho.", "tipo": "ofensiva", "dano": "2d8+2", "efeito": {"tipo": "fogo", "duracao": 2, "dano_por_turno": "1d4"}, "cooldown": 3, "chance": 45}, {"nome": "Bote da Serpente", "descricao": "A cauda serpentina desfere um bote rapido, injetando veneno potente no alvo.", "tipo": "ofensiva", "dano": "1d8+2", "efeito": {"tipo": "veneno", "duracao": 3, "dano_por_turno": "1d4"}, "cooldown": 3, "chance": 40}, {"nome": "Investida Tripla", "descricao": "Todas as tres cabeças atacam simultaneamente em um assalto coordenado devastador.", "tipo": "ofensiva", "dano": "3d6+3", "efeito": null, "cooldown": 5, "chance": 30}]',
    ARRAY['fogo', 'natureza'],
    ARRAY['fantasia', 'mitologia', 'medieval'],
    140
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Espectro',
    'Entidade incorporea nascida do odio puro de um espirito que se recusou a seguir para o alem. Diferente de fantasmas comuns, espectros sao malevolentes por natureza e drenam a propria essencia vital de suas vitimas permanentemente.',
    ARRAY['morto-vivo'],
    'raro',
    5, 6,
    42,
    6, 14, 16, 10, 16, 6,
    12, 4,
    '1d8+2',
    '[{"nome": "Drenar Vida", "descricao": "Absorve a forca vital do alvo atraves de contato direto, enfraquecendo-o permanentemente.", "tipo": "ofensiva", "dano": "2d6+2", "efeito": {"tipo": "veneno", "duracao": 3, "dano_por_turno": "1d6"}, "cooldown": 3, "chance": 45}, {"nome": "Intangibilidade", "descricao": "Dissipa completamente sua forma material, tornando-se imune a dano fisico por um breve periodo.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 50}]',
    ARRAY['sombrio', 'magico'],
    ARRAY['medieval', 'terror', 'sombrio', 'cyberpunk'],
    130
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Golem de Pedra',
    'Constructo massivo esculpido em granito e animado por runas arcanas gravadas em seu nucleo. Sem mente propria, segue as ordens de seu criador com obediencia absoluta. Sua resistencia fisica e praticamente imbativel.',
    ARRAY['constructo'],
    'raro',
    5, 6,
    80,
    18, 2, 4, 20, 2, 1,
    12, 16,
    '2d6+3',
    '[{"nome": "Punho de Granito", "descricao": "Desfere um soco devastador que esmaga armaduras e ossos com igual facilidade.", "tipo": "ofensiva", "dano": "2d10+4", "efeito": null, "cooldown": 2, "chance": 55}, {"nome": "Pele de Pedra", "descricao": "Endurece ainda mais sua superficie rochosa, absorvendo a maior parte do dano recebido.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 3, "dano_por_turno": null}, "cooldown": 5, "chance": 60}, {"nome": "Tremor", "descricao": "Golpeia o chao com ambos os punhos, gerando uma onda sismica que desequilibra todos os inimigos.", "tipo": "ofensiva", "dano": "1d8+3", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 40}]',
    ARRAY['terra'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    135
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Ogro',
    'Humanoide brutal de tres metros de altura com inteligencia limitada mas forca descomunal. Usa clavas improvisadas feitas de troncos de arvore e veste peles de animais. Apesar de estupido, sua resistencia e poder bruto o tornam um oponente temivel.',
    ARRAY['humanoide'],
    'incomum',
    5, 6,
    70,
    17, 4, 7, 16, 6, 3,
    13, 11,
    '2d6+2',
    '[{"nome": "Pancada Esmagadora", "descricao": "Ergue sua clava massiva acima da cabeça e a desce com toda a forca, esmagando o que estiver abaixo.", "tipo": "ofensiva", "dano": "2d8+4", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 45}, {"nome": "Pele Grossa", "descricao": "Sua pele espessa e camadas de gordura absorvem parte significativa dos impactos recebidos.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 55}]',
    ARRAY['terra'],
    ARRAY['medieval', 'fantasia', 'mitologia'],
    115
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Medusa',
    'Criatura amaldiçoada com serpentes vivas no lugar de cabelos e olhos que transformam em pedra qualquer um que encontre seu olhar. Outrora uma mulher de beleza incomparavel, sua vaidade atraiu a ira dos deuses que a transformaram nesta aberracao.',
    ARRAY['aberracao'],
    'raro',
    5, 6,
    48,
    10, 14, 14, 10, 12, 14,
    12, 8,
    '1d8+2',
    '[{"nome": "Olhar Petrificante", "descricao": "Fixa seus olhos sobrenaturais no alvo, iniciando o processo de petrificacao que endurece a carne.", "tipo": "ofensiva", "dano": "1d6", "efeito": {"tipo": "paralisia", "duracao": 3, "dano_por_turno": null}, "cooldown": 4, "chance": 35}, {"nome": "Mordida Serpentina", "descricao": "As serpentes de seus cabelos atacam em conjunto, desferindo multiplas mordidas venenosas.", "tipo": "ofensiva", "dano": "2d6+2", "efeito": {"tipo": "veneno", "duracao": 2, "dano_por_turno": "1d4"}, "cooldown": 3, "chance": 50}, {"nome": "Seducao Arcaica", "descricao": "Usa resquicios de sua antiga beleza para hipnotizar o alvo, deixando-o vulneravel.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 5, "chance": 30}]',
    ARRAY['magico', 'natureza'],
    ARRAY['fantasia', 'mitologia', 'terror'],
    145
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Mimic',
    'Criatura metamorfica que assume a forma de objetos comuns como baus, portas ou mobilia para atrair vitimas desavisadas. Quando tocada, revela sua verdadeira forma: uma massa de dentes, tentaculos e uma lingua adesiva de alcance assustador.',
    ARRAY['aberracao'],
    'incomum',
    5, 6,
    50,
    14, 8, 10, 14, 8, 6,
    11, 10,
    '2d6',
    '[{"nome": "Emboscada Perfeita", "descricao": "Ataca de surpresa ao ser tocado, desferindo um golpe devastador contra o alvo completamente desprevenido.", "tipo": "ofensiva", "dano": "2d8+3", "efeito": null, "cooldown": 5, "chance": 65}, {"nome": "Lingua Adesiva", "descricao": "Lança sua lingua pegajosa para agarrar e puxar o alvo para dentro de suas mandibulas.", "tipo": "ofensiva", "dano": "1d8+2", "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 3, "chance": 45}, {"nome": "Camuflagem", "descricao": "Retorna a sua forma de objeto, tornando-se indistinguivel do ambiente ao redor.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 50}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'medieval', 'steampunk', 'cyberpunk'],
    125
);

-- ============================================================================
-- NIVEL 7-8 (7 monstros) - Desafios avançados
-- ============================================================================

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Wyvern',
    'Primo menor dos dragoes verdadeiros, a wyvern compensa sua falta de inteligencia com ferocidade bruta e agilidade aerea incomparavel. Sua cauda terminada em ferrão venenoso e suas asas poderosas a tornam rainha dos ceus. Ninha em picos montanhosos inacessiveis.',
    ARRAY['besta', 'dragao'],
    'raro',
    7, 8,
    85,
    17, 6, 14, 16, 14, 4,
    16, 12,
    '2d8+3',
    '[{"nome": "Mergulho Devastador", "descricao": "Desce do ceu em velocidade vertiginosa, impactando o alvo com garras e corpo num ataque arrasador.", "tipo": "ofensiva", "dano": "3d8+4", "efeito": null, "cooldown": 4, "chance": 45}, {"nome": "Ferrao Venenoso", "descricao": "Golpeia com a cauda terminada em ferrão, injetando um veneno paralisante de acao rapida.", "tipo": "ofensiva", "dano": "2d6+2", "efeito": {"tipo": "veneno", "duracao": 3, "dano_por_turno": "1d6"}, "cooldown": 3, "chance": 40}, {"nome": "Rajada de Vento", "descricao": "Bate suas asas massivas gerando uma tempestade localizada que derruba e empurra inimigos.", "tipo": "ofensiva", "dano": "1d8+3", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 50}]',
    ARRAY['vento', 'natureza'],
    ARRAY['medieval', 'fantasia', 'mitologia'],
    220
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Lich',
    'Feiticeiro que transcendeu a morte atraves de rituais proibidos, armazenando sua alma em um filacterio. Seu corpo descarnado emana poder arcano puro e seus olhos brilham com chamas azuis de conhecimento milenar. Comanda exercitos de mortos-vivos.',
    ARRAY['morto-vivo'],
    'raro',
    7, 8,
    65,
    8, 20, 12, 12, 10, 12,
    15, 8,
    '2d6+3',
    '[{"nome": "Raio Necrotico", "descricao": "Dispara um feixe concentrado de energia necrotica que apodrece a carne e corroi a alma do alvo.", "tipo": "ofensiva", "dano": "3d8+4", "efeito": {"tipo": "veneno", "duracao": 2, "dano_por_turno": "1d6"}, "cooldown": 3, "chance": 50}, {"nome": "Invocar Mortos-Vivos", "descricao": "Ergue esqueletos e zumbis do solo para lutar sob seu comando, criando lacaios temporarios.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 4, "dano_por_turno": null}, "cooldown": 5, "chance": 40}, {"nome": "Escudo Arcano", "descricao": "Conjura uma barreira de energia magica que absorve dano e reflete feitiços de nivel inferior.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 3, "dano_por_turno": null}, "cooldown": 4, "chance": 55}]',
    ARRAY['sombrio', 'magico'],
    ARRAY['medieval', 'fantasia', 'terror', 'sombrio'],
    250
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Demonio Menor',
    'Entidade infernal invocada dos planos inferiores, com pele escarlate, chifres retorcidos e asas membranosas. Alimenta-se de sofrimento e corrupcao, e busca constantemente ampliar a influencia do abismo no mundo mortal.',
    ARRAY['demonio'],
    'raro',
    7, 8,
    72,
    15, 14, 13, 14, 12, 10,
    15, 10,
    '2d8+2',
    '[{"nome": "Chamas Infernais", "descricao": "Conjura fogo demoníaco que queima nao apenas a carne, mas tambem a essencia espiritual do alvo.", "tipo": "ofensiva", "dano": "3d6+3", "efeito": {"tipo": "fogo", "duracao": 3, "dano_por_turno": "1d6"}, "cooldown": 3, "chance": 50}, {"nome": "Pacto Sombrio", "descricao": "Oferece poder temporario em troca de uma parcela da forca vital do alvo, debilitando-o.", "tipo": "ofensiva", "dano": "2d6+2", "efeito": {"tipo": "veneno", "duracao": 2, "dano_por_turno": "1d4"}, "cooldown": 4, "chance": 40}, {"nome": "Aura de Terror", "descricao": "Emana uma aura de medo sobrenatural que faz os mais fracos fugirem e os fortes hesitarem.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 5, "chance": 35}]',
    ARRAY['fogo', 'sombrio'],
    ARRAY['medieval', 'fantasia', 'terror', 'sombrio'],
    240
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Hidra',
    'Reptil colossal com multiplas cabeças serpentinas, cada uma possuindo vontade semi-independente. Quando uma cabeça e decepada, duas novas crescem em seu lugar. Habita pantanos profundos e lagos subterraneos, guardando tesouros acumulados ao longo de seculos.',
    ARRAY['besta', 'dragao'],
    'raro',
    7, 8,
    95,
    16, 5, 10, 18, 8, 3,
    16, 13,
    '2d8+3',
    '[{"nome": "Mordida Multipla", "descricao": "Todas as cabeças atacam simultaneamente, cada uma visando um ponto diferente do corpo do alvo.", "tipo": "ofensiva", "dano": "3d8+5", "efeito": null, "cooldown": 3, "chance": 50}, {"nome": "Regeneracao de Cabeças", "descricao": "Uma cabeça decepada se divide em duas novas, restaurando vitalidade e aumentando poder de ataque.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "cura", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 45}, {"nome": "Bafo Venenoso", "descricao": "Todas as cabeças exalam simultaneamente uma nuvem massiva de vapores toxicos.", "tipo": "ofensiva", "dano": "2d6+2", "efeito": {"tipo": "veneno", "duracao": 3, "dano_por_turno": "1d6"}, "cooldown": 4, "chance": 40}]',
    ARRAY['natureza', 'agua'],
    ARRAY['fantasia', 'mitologia', 'medieval'],
    260
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Vampiro Nobre',
    'Aristocrata das trevas que mantem sua aparencia elegante mesmo apos seculos de nao-vida. Possui poderes psiquicos formidaveis, superforça e a capacidade de se transformar em morcego ou nevoa. Governa castelos goticos e manipula mortais como peoes em seu jogo eterno.',
    ARRAY['morto-vivo'],
    'raro',
    7, 8,
    70,
    16, 16, 16, 12, 16, 18,
    15, 10,
    '2d6+3',
    '[{"nome": "Mordida Vampirica Superior", "descricao": "Crava presas ancestrais no pescoço do alvo, drenando grandes quantidades de sangue e restaurando sua propria vitalidade.", "tipo": "ofensiva", "dano": "2d8+4", "efeito": {"tipo": "cura", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 50}, {"nome": "Dominar Mente", "descricao": "Fixa seus olhos hipnoticos no alvo, subjugando sua vontade e forçando-o a obedecer comandos.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 5, "chance": 35}, {"nome": "Forma de Nevoa", "descricao": "Dissolve seu corpo em uma nevoa escura e impenetravel, tornando-se imune a dano fisico.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 45}]',
    ARRAY['sombrio', 'magico'],
    ARRAY['medieval', 'terror', 'sombrio', 'cyberpunk'],
    255
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Ciclope',
    'Gigante de um unico olho colossal, descendente de uma raça antiga que construiu as primeiras fortalezas do mundo. Apesar de sua visão limitada em profundidade, sua forca bruta e incomparavel. Forja armas e armaduras em suas fornalhas vulcanicas.',
    ARRAY['humanoide'],
    'raro',
    7, 8,
    100,
    20, 6, 6, 20, 4, 4,
    17, 14,
    '2d10+3',
    '[{"nome": "Arremesso de Penedo", "descricao": "Ergue uma rocha de varias toneladas e a arremessa a grande distancia com precisao surpreendente.", "tipo": "ofensiva", "dano": "3d10+5", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 4, "chance": 40}, {"nome": "Pisotear", "descricao": "Ergue seu pe massivo e o desce com forca sísmica, esmagando tudo em uma area ao redor.", "tipo": "ofensiva", "dano": "2d8+4", "efeito": null, "cooldown": 3, "chance": 50}]',
    ARRAY['terra', 'fogo'],
    ARRAY['fantasia', 'mitologia', 'medieval'],
    245
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Elemental de Fogo',
    'Manifestacao viva do elemento fogo, invocada do Plano Elemental. Uma coluna de chamas consciente que derrete pedra ao seu redor e transforma o ar em ondas de calor insuportavel. Segue a vontade de quem o invocou, mas anseia por liberdade.',
    ARRAY['elemental'],
    'raro',
    7, 8,
    60,
    14, 8, 14, 10, 16, 2,
    14, 6,
    '2d8+2',
    '[{"nome": "Explosao de Chamas", "descricao": "Libera uma onda expansiva de fogo concentrado que carboniza tudo em um raio ao redor.", "tipo": "ofensiva", "dano": "3d8+4", "efeito": {"tipo": "fogo", "duracao": 2, "dano_por_turno": "1d8"}, "cooldown": 4, "chance": 50}, {"nome": "Corpo Incandescente", "descricao": "Intensifica as chamas de seu corpo, causando dano a qualquer criatura que o toque ou se aproxime demais.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "fogo", "duracao": 3, "dano_por_turno": "1d6"}, "cooldown": 4, "chance": 55}, {"nome": "Pilar de Fogo", "descricao": "Canaliza toda sua energia em uma coluna vertical de fogo que erupta sob os pes do alvo.", "tipo": "ofensiva", "dano": "2d10+3", "efeito": {"tipo": "fogo", "duracao": 1, "dano_por_turno": "1d6"}, "cooldown": 5, "chance": 40}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'steampunk', 'espacial'],
    235
);

-- ============================================================================
-- NIVEL 9-10 (5 monstros) - Encontros epicos e lendarios
-- ============================================================================

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Dragao Vermelho',
    'O apex predador absoluto do mundo fantastico. Uma montanha de escamas carmesim, asas que bloqueiam o sol e um bafo capaz de derreter castelos inteiros. Possui inteligencia sobrehumana, ganancia insaciavel por tesouros e um orgulho que rivaliza com deuses. Vive por milenios.',
    ARRAY['dragao'],
    'lendario',
    9, 10,
    150,
    22, 18, 14, 22, 12, 16,
    22, 18,
    '3d10+5',
    '[{"nome": "Baforada Infernal", "descricao": "Expele um cone massivo de fogo magico que incinera tudo em seu caminho, derretendo pedra e metal.", "tipo": "ofensiva", "dano": "4d10+8", "efeito": {"tipo": "fogo", "duracao": 3, "dano_por_turno": "2d6"}, "cooldown": 4, "chance": 55}, {"nome": "Presença Aterrorizante", "descricao": "Sua mera presença emana uma aura de terror divino que paralisa os fracos e faz os fortes recuarem.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 5, "chance": 45}, {"nome": "Golpe de Cauda", "descricao": "Varre a area com sua cauda colossal, arremessando criaturas a dezenas de metros de distancia.", "tipo": "ofensiva", "dano": "3d8+6", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 3, "chance": 50}]',
    ARRAY['fogo', 'magico'],
    ARRAY['medieval', 'fantasia', 'mitologia'],
    500
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Demonio Maior',
    'Senhor da guerra do Abismo, entidade de puro caos e destruição que comanda legioes infernais. Seu corpo massivo e composto de carne demoníaca, chifres retorcidos e asas de couro queimado. Cada passo deixa marcas de fogo no chão e sua voz faz a realidade tremer.',
    ARRAY['demonio'],
    'lendario',
    9, 10,
    130,
    20, 16, 12, 20, 10, 14,
    20, 16,
    '3d8+6',
    '[{"nome": "Lâmina do Abismo", "descricao": "Materializa uma espada forjada no fogo eterno dos planos inferiores e desfere um corte dimensional devastador.", "tipo": "ofensiva", "dano": "4d8+8", "efeito": {"tipo": "fogo", "duracao": 2, "dano_por_turno": "2d6"}, "cooldown": 3, "chance": 50}, {"nome": "Invocar Legiao", "descricao": "Abre um portal temporario para o Abismo, convocando demonios menores para lutar ao seu lado.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 4, "dano_por_turno": null}, "cooldown": 6, "chance": 35}, {"nome": "Corrupcao Absoluta", "descricao": "Canaliza energia demoníaca pura que corrompe corpo e espirito, causando dano continuo e enfraquecimento.", "tipo": "ofensiva", "dano": "3d6+4", "efeito": {"tipo": "veneno", "duracao": 4, "dano_por_turno": "2d4"}, "cooldown": 5, "chance": 40}]',
    ARRAY['fogo', 'sombrio'],
    ARRAY['medieval', 'fantasia', 'terror', 'sombrio'],
    480
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Titan Anciao',
    'Remanescente de uma era primordial quando gigantes divinos moldavam continentes. Este titan sobreviveu milenios em hibernacao nas profundezas da terra, e seu despertar causa terremotos sentidos a centenas de quilometros. Seu corpo e parcialmente feito de rocha e cristal.',
    ARRAY['elemental', 'celestial'],
    'lendario',
    9, 10,
    180,
    24, 14, 6, 24, 4, 8,
    22, 20,
    '3d10+6',
    '[{"nome": "Punho Tectonico", "descricao": "Golpeia o chao com forca capaz de alterar a topografia, gerando fissuras e erupcoes de rocha.", "tipo": "ofensiva", "dano": "4d10+10", "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 4, "chance": 50}, {"nome": "Escudo Cristalino", "descricao": "Cristais brotam de sua pele rochosa formando uma barreira quase impenetravel que absorve dano.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "buff", "duracao": 3, "dano_por_turno": null}, "cooldown": 5, "chance": 55}, {"nome": "Cataclismo", "descricao": "Canaliza a energia primordial da terra em um ataque catastrofico que devasta toda a area de combate.", "tipo": "ofensiva", "dano": "5d8+8", "efeito": {"tipo": "paralisia", "duracao": 1, "dano_por_turno": null}, "cooldown": 6, "chance": 35}]',
    ARRAY['terra', 'magico', 'divino'],
    ARRAY['fantasia', 'mitologia', 'espacial'],
    520
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Fera Primordial',
    'Criatura ancestral que existia antes dos deuses moldarem o mundo. Uma massa de furia animal pura, com formas que se alteram constantemente entre lobo, urso, serpente e coisas sem nome. Seu rugido desfaz encantamentos e sua presença faz a natureza enlouquecer.',
    ARRAY['besta', 'aberracao'],
    'lendario',
    9, 10,
    140,
    22, 8, 16, 20, 16, 4,
    20, 14,
    '3d8+5',
    '[{"nome": "Furia Primordial", "descricao": "Entra em um frenesi ancestral impossivel de conter, atacando com todas as suas formas simultaneamente.", "tipo": "ofensiva", "dano": "4d8+8", "efeito": null, "cooldown": 4, "chance": 55}, {"nome": "Rugido do Caos", "descricao": "Um som primordial que antecede a linguagem e a magia, desestabilizando a realidade ao redor.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "paralisia", "duracao": 2, "dano_por_turno": null}, "cooldown": 5, "chance": 40}, {"nome": "Regeneracao Primeva", "descricao": "Canaliza a energia vital da natureza primitiva, regenerando ferimentos a uma velocidade impossivel.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "cura", "duracao": 3, "dano_por_turno": null}, "cooldown": 5, "chance": 50}]',
    ARRAY['natureza', 'sombrio'],
    ARRAY['fantasia', 'terror', 'pos-apocalipse', 'mitologia'],
    490
);

INSERT INTO monstros (nome, descricao, tipo, raridade, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base)
VALUES (
    'Lich Supremo',
    'A forma mais elevada de nao-morte alcancavel por um mortal. Este arcanista acumulou poder por milenios, transcendendo as limitacoes de liches comuns. Seu filacterio esta protegido por camadas de realidade dobrada, e seu dominio sobre a necromancia e a magia arcana e absoluto. Civilizacoes inteiras cairam sob seu comando.',
    ARRAY['morto-vivo'],
    'lendario',
    9, 10,
    110,
    10, 24, 14, 16, 12, 16,
    20, 12,
    '3d6+6',
    '[{"nome": "Desintegrar", "descricao": "Lanca um raio de energia arcana pura que decomp a materia em nivel atomico, aniquilando o alvo.", "tipo": "ofensiva", "dano": "4d10+8", "efeito": null, "cooldown": 4, "chance": 40}, {"nome": "Exercito dos Mortos", "descricao": "Levanta dezenas de mortos-vivos poderosos simultaneamente, criando um exercito instantaneo sob seu comando.", "tipo": "suporte", "dano": null, "efeito": {"tipo": "buff", "duracao": 5, "dano_por_turno": null}, "cooldown": 7, "chance": 35}, {"nome": "Manto da Morte", "descricao": "Envolve-se em uma aura de energia necrotica que drena a vida de todos ao redor e o protege.", "tipo": "defensiva", "dano": null, "efeito": {"tipo": "veneno", "duracao": 4, "dano_por_turno": "2d6"}, "cooldown": 5, "chance": 50}]',
    ARRAY['sombrio', 'magico'],
    ARRAY['medieval', 'fantasia', 'terror', 'sombrio'],
    550
);
