-- =============================================================================
-- SEED: Monstros do RPG (gerado automaticamente de compendio_monstros.json)
-- Total: 311 monstros em 18 categorias
-- Compativel com PostgreSQL
-- =============================================================================

-- =============================================================================
-- Mortos-Vivos (28 monstros)
-- =============================================================================

-- Esqueleto (Tier 2, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Esqueleto',
    'Restos ossudos de criaturas outrora vivas, reanimados por necromancia sombria. Os olhos vazios brilham com uma chama azulada fria que não emite calor, apenas a vontade do conjurador que os criou. Movem-se com cliques metálicos de osso contra osso, sem sentir dor, cansaço ou medo, avançando mesmo com flechas cravadas entre as costelas.

São os soldados mais básicos de qualquer exército morto-vivo: baratos de conjurar, fáceis de comandar e absolutamente obedientes. Sozinhos representam pouco mais que uma distração, mas em grupos de dezenas tornam-se ameaça real, avançando em formação sem jamais hesitar ou recuar.',
    ARRAY['morto-vivo'],
    1, 1,
    1, 3,
    22,
    10, 4, 10, 10, 10, 3,
    5, 6,
    '1d6',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['veneno', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    50,
    'medio',
    ARRAY['masmorras', 'cripta', 'cemitério'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Zumbi (Tier 2, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Zumbi',
    'Cadáveres putrefatos que caminham com passos pesados e arrastados, braços estendidos à frente e boca aberta num grunhido constante. A carne em decomposição pende dos ossos e o odor de morte os precede em vários metros. Os olhos turvos e brancos enxergam pouco, mas farejam calor e movimento com eficiência de predador primitivo.

O que torna o zumbi genuinamente temível não é a força, mas a tenacidade sobrenatural: mesmo na beira da destruição, resistem ao colapso por pura inércia necrômantica. Flechas, espadas e golpes que matariam qualquer ser vivo apenas os fazem cambalear. Somente dano contundente pesado e fogo os despacham com consistência.',
    ARRAY['morto-vivo'],
    1, 1,
    1, 3,
    22,
    10, 4, 10, 10, 10, 3,
    5, 6,
    '1d6',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['acido', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    50,
    'medio',
    ARRAY['cemitério', 'cripta', 'terras amaldiçoadas'],
    '{}',
    '{}',
    '{"terrestre":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ghoul (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ghoul',
    'Figuras encurvadas com dedos terminados em garras afiadas como facas e bocas cheias de dentes irregulares enegrecidos de carne antiga. A pele é cinzenta e esticada sobre os ossos como pergaminho molhado, e os olhos brilham com uma fome insana que nunca é completamente saciada. Movem-se em silêncio surpreendente para criaturas tão compulsivamente famintas.

O perigo real do ghoul está na paralisia: um arranhão profundo injeta uma substância sobrenatural que imobiliza a vítima em segundos, deixando-a completamente consciente mas incapaz de se mover enquanto o ghoul devora sua carne viva. Vivem em matilhas nas catacumbas, cooperando de forma primitiva para emboscar grupos que se separam.',
    ARRAY['morto-vivo'],
    2, 1,
    2, 5,
    30,
    12, 5, 10, 12, 10, 3,
    7, 8,
    '1d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6"},"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    200,
    'medio',
    ARRAY['cemitério', 'catacumba', 'subterrâneo'],
    '{}',
    ARRAY['charme'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ghast (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ghast',
    'Semelhante ao ghoul mas maior, mais musculoso e com inteligência predatória que destoa da besta que seu parente menor representa. A pele exsuda um fedor sobrenatural tão intenso que guerreiros endurecidos viram o estômago a poucos metros, penetrando armaduras e nublando concentração mesmo dos mais disciplinados. Os olhos amarelados faiscam com malícia consciente e calculada.

O ghast coordena outros ghouls ao redor, usando-os como distração enquanto ataca pelos flancos com brutalidade de comandante de campo. O fedor enfraquece sistematicamente a resistência dos combatentes, e suas garras paralisam com a mesma eficiência do ghoul comum, mas com velocidade e força muito superiores.',
    ARRAY['morto-vivo'],
    2, 1,
    2, 5,
    30,
    12, 5, 10, 12, 10, 3,
    7, 8,
    '1d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    450,
    'medio',
    ARRAY['catacumba', 'cripta antiga'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Wight (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Wight',
    'Outrora um guerreiro ou nobre poderoso, o wight morreu com ódio tão intenso que recusou o descanso eterno e foi moldado pela escuridão em algo pior que um simples cadáver. Habita uma forma que mistura restos do corpo com fragmentos da armadura que usava em vida, com olhos que brilham em fria luz vermelha dentro de um rosto cadavérico. Conserva memória e inteligência que possuía, usando ambas exclusivamente para fins destrutivos.

O toque drena a força vital da vítima permanentemente, reduzindo seu máximo de pontos de vida. Mais aterrorizante: aqueles mortos por um wight ressurgem como zumbis sob seu comando dentro de 24 horas. Um wight solitário pode construir um exército crescente simplesmente caçando viajantes ao longo de semanas.',
    ARRAY['morto-vivo'],
    3, 1,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    700,
    'medio',
    ARRAY['fortaleza em ruínas', 'cemitério de guerreiros'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Wraith (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Wraith',
    'Uma sombra humanóide suspensa no ar, sem pés tocando o chão, o rosto um buraco escuro onde traços humanos deveriam existir. O wraith emana um frio sobrenatural que não é temperatura, é ausência de vida, a sensação de morte roçando a pele de quem está próximo. Atravessa paredes, chãos e obstáculos físicos como névoa passando por grades, completamente imparável por barreiras mundanas.

Criaturas completamente drenadas pelo wraith tornam-se espectros menores vinculados a ele, multiplicando o horror progressivamente. Armas comuns passam pela forma incorporal sem causar dano algum; apenas prata, itens mágicos e luz sagrada podem alcançá-lo. É frequentemente o resultado de uma alma que sofreu injustiça tão profunda que se tornou veneno puro para o mundo.',
    ARRAY['morto-vivo'],
    3, 1,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1800,
    'medio',
    ARRAY['locais amaldiçoados', 'plano etéreo'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Specter (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Specter',
    'O espectro é uma forma menor de wraith: a imagem fantasmagórica de um humanóide morto, apenas contornos de neblina escura que mantêm vagamente a silhueta original. Plana em silêncio absoluto e surge de sombras, paredes e do chão sem aviso. Sua presença rebaixa visivelmente a temperatura do ambiente e apaga chamas próximas.

Apesar de menos poderoso que um wraith, é igualmente imune a armas não mágicas e drena vida com o toque gelado. Grupos de espectros são particularmente mortais: cada um atacando um membro diferente do grupo simultâneamente pode derrubar aventureiros experientes antes que percebam a extensão total da ameaça.',
    ARRAY['morto-vivo'],
    2, 1,
    2, 5,
    30,
    12, 5, 10, 12, 10, 3,
    7, 8,
    '1d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    200,
    'medio',
    ARRAY['mansão assombrada', 'cripta'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Shadow (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Shadow',
    'Uma sombra que se move sozinha, literalmente. Desliza pelo chão e paredes como a projeção de algo que não está lá, mas com propósito e fome próprios que denunciam sua natureza sobrenatural. Na escuridão é quase impossível de distinguir de sombras comuns; apenas o fato de mover-se contra a fonte de luz a trai para olhos atentos.

Cada acerto drena a Força da vítima magicamente. Se a Força cair a zero, o alvo morre e uma nova sombra emerge imediatamente de seu cadáver. Grupos de sombras podem se multiplicar com aterrorizante rapidez numa masmorra escura, transformando um único encontro numa cascata de destruição se não forem contidas com luz.',
    ARRAY['morto-vivo'],
    2, 1,
    1, 3,
    22,
    10, 4, 10, 10, 10, 3,
    5, 6,
    '1d6',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"1d4","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['sombrio', 'radiante'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    100,
    'medio',
    ARRAY['escuridão', 'masmorras sem luz'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vampire (Tier 7, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vampire',
    'Belo demais para ser natural: o vampiro mantém elegância aristocrática mesmo séculos após a morte. Pele branca como mármore frio, olhos que captam luz onde não deveria existir, presas discretas mas inconfundíveis para quem sabe o que procurar. Move-se com a graça de quem passou séculos aperfeiçoando cada gesto e carrega a postura de quem está sempre em controle total de qualquer situação.

Predador supremo em todos os sentidos: encanta com o olhar, drena com a mordida e regenera ferimentos com velocidade sobrenatural. Luz solar, água corrente, prata e convite negado são suas raras vulnerabilidades, e ele sabe exatamente como contornar cada uma delas ao longo de séculos de prática. Raramente ataca de frente; prefere jogar sempre nos próprios termos.',
    ARRAY['morto-vivo'],
    4, 1,
    7, 10,
    110,
    20, 6, 10, 20, 10, 3,
    15, 16,
    '2d8+4',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Drenar Vida","descricao":"O monstro executa drenar vida contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['radiante', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    10000,
    'medio',
    ARRAY['castelo', 'cidade grande', 'cripta luxuosa'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vampire Spawn (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vampire Spawn',
    'Criados pela mordida letal de um vampiro mestre, os spawns conservam parte da aparência da vida mas com traços distorcidos: olhos fundos e fixos, pele que não reflete luz natural, movimentos ligeiramente fora do ritmo humano normal. Obedecem ao mestre com devoção absoluta e cega, incapazes de desobedecer uma ordem direta.

Menos poderosas que um vampiro verdadeiro, as crias ainda escalam paredes com facilidade, regeneram ferimentos rapidamente e drenam vida com a mordida. Em grupo, atuam como caçadores coordenados: o mestre frequentemente as usa para exaurir aventureiros antes de aparecer pessoalmente.',
    ARRAY['morto-vivo'],
    3, 1,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1800,
    'medio',
    ARRAY['sob controle do mestre vampiro'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Lich (Tier 9, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Lich',
    'Um mago que recusou a morte através de ritual proibido, transferindo sua alma para um receptáculo físico chamado phylactery. O corpo restante é uma casca cadavérica de poder arcano concentrado: ossos enegrecidos por séculos de magia sombria, vestes gastas mas imponentes, e dois pontos de luz fria onde olhos humanos existiram. Irradia inteligência calculista e frio absoluto.

Conjurador de altíssimo nível com séculos de prática, imune a dano não mágico, paralisia, veneno e encantamento. E se destruído, renasce em dias a partir do phylactery intacto. Para matá-lo permanentemente é preciso encontrar e destruir o receptáculo da alma, tarefa que ele passou décadas tornando praticamente impossível.',
    ARRAY['morto-vivo'],
    6, 1,
    9, 14,
    200,
    24, 7, 10, 24, 10, 3,
    20, 20,
    '3d8+6',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"3d6+5","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+3"},"cooldown":5,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Explosão Necrótica","descricao":"O monstro executa explosão necrótica contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno', 'psiquico', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    33000,
    'medio',
    ARRAY['torre arcana', 'dungeon profunda'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Lich Ancestral (Tier 8, minusculo, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Lich Ancestral',
    'O que resta de um lich que ascendeu além do interesse pelo plano material: um crânio flutuante em câmara isolada, ornamentado com gemas que são na verdade almas aprisionadas de aventureiros anteriores. A maior parte da consciência migrou para planos além da compreensão mortal, deixando apenas um fragmento reativo e devastador como guardião dos tesouros mais profundos.

Pode sugar a alma de uma criatura viva em instantes, prendendo-a numa das gemas; sem proteção adequada, a morte é certa e ressurreição impossível enquanto a gema existir. Resistente à esmagadora maioria das magias, é uma das criaturas mais difíceis de destruir no multiverso apesar do tamanho minúsculo.',
    ARRAY['morto-vivo'],
    6, 1,
    8, 12,
    140,
    16, 6, 14, 18, 14, 3,
    16, 20,
    '2d10+5',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Grito dos Mortos","descricao":"O monstro executa grito dos mortos contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    20000,
    'minusculo',
    ARRAY['câmara interna de dungeon do lich'],
    '{}',
    '{}',
    '{"terrestre":15,"natacao":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Revenant (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Revenant',
    'Uma alma que se recusou a partir até que sua vingança seja consumada, voltando ao próprio cadáver com determinação sobrenatural inabalável. Mantém a aparência do corpo com ferimentos da morte ainda visíveis, mas move-se com propósito frio e absoluto. Os olhos queimam com luz branca intensa fixados permanentemente no alvo designado para a vingança.

Não pode ser morto permanentemente enquanto o alvo de vingança ainda viver: ressurge em 24 horas independentemente de como for destruído. A aura aterroriza criaturas a grande distância e os golpes derrubam com força sobrenatural. Não é maligno por natureza, apenas implacável, sem espaço algum para negociação ou piedade.',
    ARRAY['morto-vivo'],
    3, 1,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d6+2","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1800,
    'medio',
    ARRAY['qualquer lugar buscando vingança'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Banshee (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Banshee',
    'O espírito atormentado de uma elfa de rara beleza que morreu de desgosto profundo, traição brutal ou vaidade que se voltou contra ela. Paira como forma neblinosa feminina de traços angulares e expressão de agonia irreparável, cabelo flutuando sem vento e vestes translúcidas ondulando como água perturbada. É simultaneamente a coisa mais bela e mais aterrorizante que um aventureiro pode encontrar numa floresta à meia-noite.

O lamento é sua arma mais devastadora: um grito sobrenatural que penetra paredes de pedra e pode instantâneamente derrubar todos que o ouvirem a zero pontos de vida, uma potencial morte súbita de área que pode limpar um grupo inteiro num único turno catastrófico.',
    ARRAY['morto-vivo'],
    3, 1,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6+1"},"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['gelo', 'eletricidade', 'veneno', 'sombrio', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1100,
    'medio',
    ARRAY['floresta assombrada', 'ruínas élficas'],
    '{}',
    ARRAY['frio'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Crânio Flamejante (Tier 4, minusculo, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Crânio Flamejante',
    'Um crânio humano envolto em chamas verdes ou laranjas que o mantêm flutuando permanentemente à altura dos olhos. A mandíbula se move ao conjurar feitiços com voz sibilante e ressonante, e os dois pontos de chama nos olhos seguem cada movimento ao redor com atenção de guardião obsessivo. Foi criado por um mago paranóico para proteger seus tesouros mais valiosos mesmo após a própria morte.

Capaz de lançar Bola de Fogo múltiplas vezes por dia, é perigoso de forma absurdamente desproporcional ao tamanho minúsculo. Pior: se destruído, renasce em apenas uma hora a partir das próprias cinzas, a menos que água benta seja derramada sobre os restos imediatamente.',
    ARRAY['morto-vivo'],
    3, 1,
    3, 7,
    35,
    8, 5, 14, 10, 14, 3,
    7, 12,
    '1d8+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"10d6","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6+1"},"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'eletricidade', 'veneno', 'psiquico', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1100,
    'minusculo',
    ARRAY['dungeon', 'torre mágica', 'cripta de mago'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Death Knight (Tier 8, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Death Knight',
    'Um paladino que quebrou seu juramento sagrado de forma tão abjeta — traição de companheiros, assassinato de inocentes, covardia no momento crucial — que foi condenado a servir as forças do mal em forma não-morta pela eternidade. Veste armadura enegrecida que emite fumaça fria como nevoeiro e empunha uma espada de chamas negras que não iluminam. A voz é um trovão rouco cheio da autoridade corrompida que ainda carrega de sua vida anterior.

Combina a brutalidade de um guerreiro de elite com poder de conjurador avançado, mais uma aura de ódio puro que amplifica os ataques de qualquer aliado próximo. Lança Bola de Fogo, Muro de Gelo e Imobilizar Pessoa com igual facilidade que balança a espada, e comanda exércitos de mortos-vivos com a mesma disciplina marcial de sua vida anterior.',
    ARRAY['morto-vivo'],
    6, 1,
    8, 12,
    150,
    22, 6, 10, 22, 10, 3,
    18, 18,
    '2d10+5',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão Necrótica","descricao":"O monstro executa explosão necrótica contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo', 'gelo', 'veneno', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    18000,
    'medio',
    ARRAY['campo de batalha amaldiçoado', 'fortaleza sombria'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mummy (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mummy',
    'Envolta em bandagens enegrecidas e ressequidas impregnadas de resina e ervas de embalsamento que duraram milênios, a múmia é o guardião eterno de uma tumba sagrada. Move-se com a rigidez absoluta de quem está literalmente seco por dentro, mas mantém força sobrenatural preservada pela magia de proteção da tumba. O cheiro de especiarias antigas misturado com putrefação sutil precede sua chegada pelos corredores.

O perigo maior não é a força física, mas a maldição insidiosa: o toque das bandagens infecta a vítima com Podridão de Múmia, doença mágica que progressivamente reduz os pontos de vida máximos. Magia de cura é completamente ineficaz contra a doença até que a maldição seja removida por ritual específico.',
    ARRAY['morto-vivo'],
    3, 1,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    700,
    'medio',
    ARRAY['tumba do deserto', 'pirâmide'],
    '{"fogo":1.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mummy Lord (Tier 8, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mummy Lord',
    'O faraó, sumo sacerdote ou nobre que ordenou a construção da tumba agora a guarda em morte com o mesmo poder que exerceu em vida, multiplicado pela eternidade de serviço ao deus da morte. Usa vestes reais preservadas milênios e joias de ouro carregadas de encantamentos antigos. Os olhos dentro das bandagens queimam com luz amarela intensa e a voz é o farfalhar de milhares de papiros secos ao mesmo tempo.

É conjurador divino de alto nível além de guerreiro formidável. Comanda legiões de múmias, lança magias devastadoras e é protegido por um coração guardado em jarro canópico escondido separadamente: enquanto o jarro existir, ressurge em dias. Destruí-lo permanentemente exige expedição paralela só para localizar o receptáculo.',
    ARRAY['morto-vivo'],
    6, 1,
    8, 12,
    150,
    22, 6, 10, 22, 10, 3,
    18, 18,
    '2d10+5',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Drenar Vida","descricao":"O monstro executa drenar vida contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['sombrio', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    13000,
    'medio',
    ARRAY['tumba monumental', 'pirâmide secreta'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Poltergeist (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Poltergeist',
    'Espírito invisível e raivoso que se manifesta exclusivamente através da manipulação violenta de objetos físicos ao redor. Móveis voam em trajetórias impossíveis, portas batem com força de queda de árvore, objetos cortantes levitam e apontam para intrusos. Não tem forma visível, apenas a evidência crescentemente caótica de sua presença no ambiente destruído ao redor.

Usa telecinesia sobrenatural para arremessar absolutamente tudo ao alcance contra os intrusos: mesas, cadeiras, facas, peças de armadura e tochas acesas. Cada rajada pode machucar seriamente grupos despreparados, e como é completamente invisível, ataques físicos são inúteis sem magias de revelação específicas.',
    ARRAY['morto-vivo'],
    2, 1,
    2, 5,
    30,
    12, 5, 10, 12, 10, 3,
    7, 8,
    '1d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"4d4","efeito":null,"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    450,
    'medio',
    ARRAY['mansão', 'casa assombrada'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Will-o'-Wisp (Tier 3, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Will-o''-Wisp',
    'Luzes coloridas, azul-gelo, verde-pântano ou branco-leitoso, que flutuam sobre pântanos e florestas neblinosas à noite, dançando com graça hipnótica para atrair viajantes perdidos. Parecem lanternas distantes que indicam civilização próxima. Para quem não conhece a lenda, é um sinal de esperança que leva diretamente à morte.

Se alimenta da agonia de criaturas moribundas: quanto mais lento e sofrido o fim, mais energia absorve. Conduz vítimas até pântanos profundos, precipícios ou tocas de monstros e as abandona pacientemente. Resistente a quase toda forma de dano, pode apagar sua luz para tornar-se praticamente indetectável no escuro.',
    ARRAY['morto-vivo'],
    2, 1,
    2, 5,
    20,
    6, 5, 14, 8, 14, 3,
    5, 10,
    '1d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['eletricidade', 'radiante', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    450,
    'minusculo',
    ARRAY['pântano', 'floresta neblinosa'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Murmurante (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Murmurante',
    'O fantasma de alguém que enlouqueceu completamente antes de morrer, geralmente por exposição a magia proibida, obsessão com conhecimento impossível ou tortura mental prolongada. Sua forma incorporal reflete o colapso da mente: contornos que mudam sem seguir anatomia humana e sussurros incessantes de fragmentos de pensamentos quebrados sobrepostos continuamente.

Os sussurros são uma arma psíquica real: criaturas que os ouvirem podem ser varridas pela mesma loucura que criou o espírito. O toque destrói a sanidade progressivamente, drenando a Sabedoria até que a vítima perca contato com a realidade. Um allip forte pode quebrar a mente de um aventureiro em questão de poucos minutos.',
    ARRAY['morto-vivo'],
    3, 1,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    700,
    'medio',
    ARRAY['local de suicídio ou loucura'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Carniceiro Errante (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Carniceiro Errante',
    'Um assassino serial que morreu antes de ser capturado e punido: a culpa não expiada e o sangue de inúmeras vítimas inocentes transformam o cadáver num mohrg, um esqueleto musculoso com vísceras parcialmente expostas entre as costelas e uma língua tentacular longa e pálida que serpenteia para fora da mandíbula mesmo quando a boca está fechada. Os olhos brilham com malícia totalmente consciente.

A língua é a arma assinatura: estende-se metros à frente e paralisa completamente a vítima com um único contato, deixando-a consciente e apavorada mas completamente imóvel. As vítimas mortas ressurgem como zumbis sob controle direto do mohrg, criando um exército crescente a cada kill.',
    ARRAY['morto-vivo'],
    4, 1,
    6, 9,
    85,
    18, 6, 10, 18, 10, 3,
    13, 14,
    '2d6+4',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão Necrótica","descricao":"O monstro executa explosão necrótica contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    4800,
    'medio',
    ARRAY['dungeon', 'tumba de assassino'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Olhar da Morte (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Olhar da Morte',
    'Nascido quando um humanóide morre no Abismo Infinito e sua alma é corrompida além de qualquer reconhecimento, o bodak é horror puro condensado em forma humanóide. A pele cinza-esverdeada não tem pelos nem poros visíveis, os olhos são completamente brancos sem pupila ou íris, e a expressão é uma máscara de agonia permanente que nenhum ser vivo poderia sustentar. Onde caminha, plantas murcham instantâneamente.

Seu olhar é literalmente mortal: uma criatura que fitar os olhos brancos do bodak pode morrer instantâneamente se não resistir. Mesmo sem o contato visual, a aura de aniquilação que emana do corpo causa dano necrótico contínuo a qualquer ser vivo próximo.',
    ARRAY['morto-vivo'],
    3, 1,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['radiante', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    2300,
    'medio',
    ARRAY['plano hades', 'local de ritual demoníaco'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dullahan (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dullahan',
    'O cavaleiro decapitado do folclore irlandês em toda sua crueldade mítica: cavalga num corcel negro completamente silencioso mesmo em galope pleno, segurando a própria cabeça luminosa no braço estendido como lanterna de carne. A cabeça gargalha enquanto o cavaleiro caça sua presa e os dentes perfilados sorriem com satisfação genuína. O chicote feito de espinha dorsal humana arranca carne de armaduras.

Aponta para uma vítima e pronuncia seu nome: dentro de 24 horas, a vítima morre independentemente de onde esteja ou o que faça. Não há fuga, apenas adiamento. A única proteção conhecida é ouro; o dullahan não pode cruzar uma linha de ouro nem tocar objeto de ouro puro.',
    ARRAY['morto-vivo'],
    3, 1,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    2900,
    'medio',
    ARRAY['estrada rural à meia-noite'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Crypt Thing (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Crypt Thing',
    'Um guardião esquelético de aparência bastante comum envolto em vestes puídas de sacerdote morto, que se mistura perfeitamente ao ambiente sombrio das criptas que protege há séculos de dedicação silenciosa. Não ataca diretamente nem causa dano físico: em vez disso, teletransporta intrusos para cantos completamente aleatórios da masmorra, separando o grupo e semeando caos devastador sem sujar uma única falange.

A habilidade de separação é sua verdadeira arma: aventureiros teleportados para locais isolados enfrentam os outros perigos da dungeon sem apoio algum, frequentemente sozinhos contra monstros que o grupo inteiro mal conseguiria vencer junto.',
    ARRAY['morto-vivo'],
    3, 1,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1800,
    'medio',
    ARRAY['cripta', 'tumba'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Nightwalker (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Nightwalker',
    'Uma silhueta humanoide de escuridão absoluta, não sombra mas ausência total de luz comprimida e condensada em forma coerente, de seis metros de altura que se move em silêncio completo. Onde passa, lanternas apagam instantâneamente, magias de luz falham ao ser lançadas e até a luz solar parece recuar. Os únicos traços visíveis são dois pontos de luz vermelha fria dentro do vazio que constituem seus olhos.

Sua aura de destruição de luz cobre centenas de metros, tornando-o praticamente indetectável no próprio ambiente que cria ao redor. O raio de aniquilação pode reduzir criaturas a pó absoluto sem deixar nada para ressurreição. Uma das entidades mais temidas que podem ser convocadas do Umbrália.',
    ARRAY['morto-vivo'],
    6, 1,
    8, 12,
    180,
    28, 6, 6, 28, 6, 3,
    21, 16,
    '2d10+5',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Grito dos Mortos","descricao":"O monstro executa grito dos mortos contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['eletricidade', 'radiante', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    25000,
    'enorme',
    ARRAY['negation zone', 'plane of shadow'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Spawn of Vermath (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Spawn of Vermath',
    'Zumbi apodrecido cujas órbitas, boca e feridas abertas estão completamente preenchidas de vermes brancos gordos e pulsantes que se movem incessantemente, saindo e reentrando na carne podre com propósito perturbador. A aparência é de horror corporal absoluto, mas são os vermes que constituem a ameaça real e não o zumbi em si.

Ao acertar uma vítima com qualquer ataque, os vermes migram para o corpo dela, iniciando infecção que a transforma em nova Cria de Vermath em poucos dias se não tratada com Remove Curse imediatamente. Uma dungeon com múltiplos spawns pode infectar um grupo inteiro numa única batalha.',
    ARRAY['morto-vivo'],
    3, 1,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1800,
    'medio',
    ARRAY['dungeon de kyuss', 'área infectada por vermes'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cavaleiro Sepulcral (Tier 8, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cavaleiro Sepulcral',
    'Um guerreiro que morreu com poder e orgulho tão intensos que sua armadura foi amaldiçoada junto com a alma, fundidas em algo impossível de separar. A armadura não pode ser removida nem destruída independentemente do ser que a habita; ela é a prisão e a fortaleza ao mesmo tempo. Dentro, ossos enegrecidos de energia destrutiva; fora, metal que irradia frio e corrói a vitalidade de quem se aproxima.

É um guerreiro de elite morto-vivo com poderes destrutivos amplificados pela amaldiçoação. Ao ser destruído, renasce automaticamente dentro da armadura em dias: a única forma de matá-lo permanentemente é destruir a armadura sagrada por meios específicos e difíceis de descobrir.',
    ARRAY['morto-vivo'],
    6, 1,
    8, 12,
    150,
    22, 6, 10, 22, 10, 3,
    18, 18,
    '2d10+5',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"2d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Drenar Vida","descricao":"O monstro executa drenar vida contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['gelo', 'psiquico', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    12800,
    'medio',
    ARRAY['campo de batalha', 'fortaleza em ruínas'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Demonios e Diabos (29 monstros)
-- =============================================================================

-- Imp (Tier 3, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Imp',
    'Pequeno demônio do tamanho de um gato gordo, com pele avermelhada ou acinzentada, asas de morcego que mal sustentam o peso, cauda terminada em ferrão e uma expressão permanentemente sarcástica de superioridade intelectual que resulta irritante mesmo num ser insignificante. É o familiar favorito de magos corruptos e bruxos malignos, inteligente o suficiente para agir de forma independente e pequeno o suficiente para passar despercebido em qualquer ambiente.

O imp é mais espião que combatente: usa invisibilidade e transformação em animais comuns para se infiltrar e reportar. Quando forçado a lutar, o ferrão venenoso pode incapacitar um oponente, e sua resistência a dano físico o torna mais durável que o tamanho sugere. Nunca subestime um demônio que prefere sussurrar ao ouvido do mestre a atacar de frente.',
    ARRAY['fiend'],
    2, 2,
    2, 5,
    20,
    6, 15, 14, 8, 14, 12,
    5, 10,
    '1d6+2',
    '[{"nome":"Chama Infernal","descricao":"Chamas do abismo envolvem o alvo em fogo demoníaco.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6"},"cooldown":3,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'veneno'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    200,
    'minusculo',
    ARRAY['plano das nove hells', 'familiar de conjurador'],
    '{"fogo":0.5}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Quasit (Tier 3, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Quasit',
    'Contraparte caótica do imp: um demoniozinho de pele verde-escura escamosa, olhos amarelos com pupilas de réptil e uma personalidade explosiva e completamente imprevisível que muda de adulação rastejante para violência frenética em segundos. Serve conjuradores caóticos como familiar ou age por conta própria em regiões corrompidas. As garras injetam veneno que causa medo paralisante ou dor aguda intensa.

O quasit é tremedeiro e impulsivo por natureza demoníaca: pode atacar o próprio mestre num acesso súbito de fúria ou fugir abandonando aliados sem qualquer aviso. O que o torna paradoxalmente perigoso é que não planeja, simplesmente reage com violência e caos puro, tornando-o completamente imprevisível em qualquer combate.',
    ARRAY['fiend'],
    2, 2,
    2, 5,
    20,
    6, 15, 14, 8, 14, 12,
    5, 10,
    '1d6+2',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6"},"cooldown":3,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'gelo', 'eletricidade', 'veneno'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    200,
    'minusculo',
    ARRAY['abismo', 'familiar caótico'],
    '{"fogo":0.5}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Succubus / Incubus (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Succubus / Incubus',
    'Aparência de humano extraordinariamente atraente em todos os sentidos mensuráveis, com proporções calculadas para o apelo máximo, voz de mel que ressoa no peito, e maneiras sedutoras que parecem completamente naturais porque são sobrenaturais e milimetricamente calibradas. Os olhos têm profundidade hipnótica incomum e o toque libera ondas sutis de prazer que nublam gradualmente o julgamento crítico.

Não mata com força bruta mas com manipulação de longo prazo: encanta a vítima para amá-la devotamente através de visitas noturnas no plano dos sonhos, depois drena sua alma através de beijo ao longo de noites consecutivas. A vítima definha sem compreender o que acontece, sonhando com seu belo torturador e acordando cada vez mais fraca.',
    ARRAY['fiend'],
    3, 2,
    3, 7,
    45,
    14, 15, 10, 14, 10, 12,
    9, 10,
    '1d8+2',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1100,
    'medio',
    ARRAY['qualquer plano', 'sonhos mortais'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Bearded Devil (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Bearded Devil',
    'Humanóide robusto de pele vermelha escura coberto de pelos grossos que crescem por todo o corpo, dando impressão de barba que não se limita ao rosto. Empunha um glaive infernal com movimentos militares completamente disciplinados: é acima de tudo um soldado de infantaria infernal, não um predador individual. Os olhos amarelos carregam inteligência tática sem nenhuma faísca de misericórdia.

A glaive cria feridas que se recusam a cicatrizar naturalmente até um descanso longo, cada golpe é um débito de saúde que se acumula ao longo da batalha. A barba pode enredar inimigos que se aproximam demais, e o diabo usa isso para manter alvos presos enquanto camaradas os circundam metódicamente.',
    ARRAY['fiend'],
    3, 2,
    3, 7,
    45,
    14, 15, 10, 14, 10, 12,
    9, 10,
    '1d8+2',
    '[{"nome":"Chama Infernal","descricao":"Chamas do abismo envolvem o alvo em fogo demoníaco.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6+1"},"cooldown":3,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'veneno'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    700,
    'medio',
    ARRAY['nove hells', 'exército infernal'],
    '{"fogo":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Chain Devil (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Chain Devil',
    'Humanóide coberto inteiramente de correntes que se movem de forma completamente independente com inteligência própria, enrolando-se e estendendo-se como serpentes metálicas autônomas. Onde as correntes não cobrem, a pele é um mosaico denso de cicatrizes autoinfligidas em padrões rituais. O rosto é ocultado por uma máscara de ferro enferrujado que esconde traços perturbadores demais para contemplar diretamente.

As correntes animadas permitem até quatro ataques simultâneos em direções completamente diferentes por turno. A máscara pode reformar-se para assumir o rosto de alguém amado pela vítima, criando paralisia psicológica que desconcentra nos momentos mais decisivos do combate.',
    ARRAY['fiend'],
    4, 2,
    6, 9,
    85,
    18, 16, 10, 18, 10, 12,
    13, 14,
    '2d6+4',
    '[{"nome":"Chama Infernal","descricao":"Chamas do abismo envolvem o alvo em fogo demoníaco.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura de Medo","descricao":"O monstro executa aura de medo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição Profana","descricao":"O monstro executa destruição profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'gelo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    3900,
    'medio',
    ARRAY['nove hells (maladomini)'],
    '{"frio":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Bone Devil (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Bone Devil',
    'Alto, ossudo e de aparência instável: parece um esqueleto humanoide ampliado com articulações duplicadas que permitem movimentos impossíveis, cauda de escorpião gotejeando veneno paralisante, e rosto de crânio sem carne mas com expressão de inteligência fria calculada. Move-se com agilidade sobrenatural para algo que parece estruturalmente frágil.

O detetive e interrogador das Nove Hells, inteligente, paciente e especializado em obter confissões de almas torturadas. Em batalha, mantém distância e usa o ferrão paralisante estrategicamente enquanto usa telepatia para desmoralizar adversários antes de qualquer confronto físico direto.',
    ARRAY['fiend'],
    4, 2,
    6, 9,
    100,
    22, 16, 8, 22, 8, 12,
    15, 13,
    '2d6+4',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+2"},"cooldown":4,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fogo Infernal","descricao":"O monstro executa fogo infernal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['veneno', 'psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    5000,
    'grande',
    ARRAY['nona camada das hells'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ice Devil (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ice Devil',
    'Inseto bípede gigantesco de pele azul-gelo revestida de armadura quitinosa que reflete a luz como cristal congelado polido. Segura uma lança de gelo que condensa vapor continuamente ao redor de si, e a simples presença reduz a temperatura do ambiente a níveis que causam dano real a seres não adaptados ao frio extremo.

A lança congela membros de vítimas atingidas, reduzindo drasticamente sua velocidade de movimento. Comanda batalhões de diabos menores com eficiência militar completamente desapegada, otimizando formações e estratégias como um general que trata baixas como variáveis numéricas puras.',
    ARRAY['fiend'],
    6, 2,
    8, 12,
    165,
    26, 16, 8, 26, 8, 12,
    20, 17,
    '2d10+5',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Invocação Abissal","descricao":"O monstro executa invocação abissal contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['gelo', 'psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    11500,
    'grande',
    ARRAY['caina', '8ª camada das hells'],
    '{}',
    '{}',
    '{"terrestre":25,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Pit Fiend (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Pit Fiend',
    'O ápice da hierarquia infernal entre os diabos: um colosso de três metros e meio de músculos vermelhos, asas imensas de morcego negro, cauda com espinhos que parte paredes de pedra, e um rosto que combina dragão e demônio fundidos em algo que transmite poder absoluto. Cada expiração solta vapor de enxofre e o ar ao redor cheira permanentemente a metal aquecido ao rubro.

Generalíssimo da guerra infernal com séculos de estratégia acumulados: conjura barreiras de fogo, paralisa exércitos inteiros com magia, regenera ferimentos a velocidade absurda e comanda todo tipo de diabo com uma única palavra. Enfrentar um pit fiend sem preparação extraordinária é simplesmente não sobreviver ao encontro.',
    ARRAY['fiend'],
    6, 2,
    8, 12,
    165,
    26, 16, 8, 26, 8, 12,
    20, 17,
    '2d10+5',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição Profana","descricao":"O monstro executa destruição profana contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    25000,
    'grande',
    ARRAY['camadas mais baixas das nove hells'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Balor (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Balor',
    'Titã demoníaca de cinco metros envolta em chamas negras que não iluminam e relâmpagos roxos saltando entre os chifres. Empunha simultaneamente um açoite de fogo que se estende por dez metros e uma espada de relâmpago que deixa rastros de luz queimada com cada balançar. O corpo parece esculpido em músculo puro coberto de escamas negras que absorvem e refletem as chamas simultaneamente.

O marechal supremo dos exércitos abissais: não segue ordens, somente as dá. Cada ataque é catastrófico em escala, e ao ser finalmente destruído, explode numa detonação de energia pura que mata tudo em grande raio ao redor. Invocar um balor sem controle absoluto é garantia de destruição imediata do próprio conjurador.',
    ARRAY['besta'],
    6, 2,
    8, 12,
    180,
    28, 5, 6, 28, 6, 4,
    21, 16,
    '2d10+5',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"3d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque em Salto","descricao":"O monstro executa ataque em salto contra seu alvo.","tipo":"ofensiva","dano":"8d10","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo', 'eletricidade', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    22000,
    'enorme',
    ARRAY['abismo — camadas inferiores'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Marilith (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Marilith',
    'Mulher da cintura para cima de beleza feroz e marcial, serpente descomunal da cintura para baixo com seis metros de músculo puro, com seis braços cada qual empunhando com maestria uma espada diferente em estilos complementares. A pele verde-jade brilha como escamas sob qualquer iluminação, e os olhos dourados observam o campo de batalha inteiro com inteligência tática sobrenatural.

A encarnação da estratégia demoníaca: seis espadas permitem seis ataques em múltiplos inimigos por turno, a cauda pode agarrar e imobilizar um alvo enquanto ela engaja três ou quatro outros simultânamente, e teletransporta-se para melhor posição tática sempre que encurralada. Comanda legiões demoníacas com brilhantismo assustador para uma criatura caótica.',
    ARRAY['besta'],
    6, 2,
    8, 12,
    165,
    26, 5, 8, 26, 8, 4,
    20, 17,
    '2d10+5',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Frenesi","descricao":"O monstro executa frenesi contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    15000,
    'grande',
    ARRAY['abismo'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Glabrezu (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Glabrezu',
    'Quatro metros de músculo demoníaco com pernas caninas, dois braços menores de aparência humana e dois braços enormes terminados em pinças de lagosta gigantesca capazes de partir armaduras de aço. O rosto canino exibe um sorriso permanente de quem sabe exatamente mais que você. Fala com voz sedosa e surpreendentemente educada que destoa completamente da aparência bruta e ameaçadora.

O demônio da tentação e corrupção de longo prazo: aproxima-se de mortais poderosos com promessas de realização de desejos pessoais profundos, corrompendo-os progressivamente. Em combate, usa magia de confusão e controle mental para fragmentar o grupo antes de avançar pessoalmente com as pinças colossais.',
    ARRAY['besta'],
    4, 2,
    6, 9,
    115,
    24, 5, 6, 24, 6, 4,
    16, 12,
    '2d6+4',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    5000,
    'enorme',
    ARRAY['abismo'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Hezrou (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Hezrou',
    'Um sapo demoníaco do tamanho de um urso-pardo que anda de dois pés numa postura ereta mas encurvada como alguém prestes a saltar. A pele verrugosa exsuda uma substância oleosa malcheirosa tão intensamente que pode fazer guerreiros robustos enjoarem a poucos metros. Braços curtos mas de força monstruosa e mandíbulas capazes de morder ao meio uma pessoa em armadura completam o conjunto.

Força bruta demoníaca sem nuances estratégicas: avança, morde, constringe e conta com o fedor nauseante para progressivamente enfraquecer a resistência física e mental dos oponentes ao longo do combate. Frequentemente convocado para trabalho que requer violência pura sem necessidade de inteligência.',
    ARRAY['besta'],
    4, 2,
    6, 9,
    100,
    22, 5, 8, 22, 8, 4,
    15, 13,
    '2d6+4',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+2"},"cooldown":4,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque em Salto","descricao":"O monstro executa ataque em salto contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['veneno', 'psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    3900,
    'grande',
    ARRAY['abismo', 'zonas pantanosas'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vrock (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vrock',
    'Demônio-abutre de três metros: cabeça de urubu com bico curvo afiado, pescoço encurvado coberto de carne avermelhada exposta, asas imensas de plumagem enegrecida que se abrem com um estralo ensurdecedor, e garras nos pés e mãos como foices de ceifador. O bico se abre numa gargalhada áspera e estridente antes de cada mergulho de ataque.

Libera esporos tóxicos da pele que crescem como fungos na carne viva de vítimas atingidas, causando dano crescente por rodadas se não tratados. O grito estridente pode atordoar múltiplos alvos simultânamente. Frequentemente encontrado em grupos que atacam em formação de mergulho do alto.',
    ARRAY['besta'],
    3, 2,
    5, 8,
    80,
    20, 4, 8, 20, 8, 4,
    13, 11,
    '2d6+2',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    2300,
    'grande',
    ARRAY['abismo', 'batalha demoníaca'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Nalfeshnee (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Nalfeshnee',
    'Porco demoníaco de quatro metros erguido em postura bípede, com asas de morcego ridiculamente pequenas para o corpo massivo, rosto de javali com três pares de olhos escarlates e presas amareladas. Apesar da aparência grotesca, é um dos demônios intelectualmente mais desenvolvidos do Abismo, servindo como juiz e torturador de almas condenadas.

Sua arma principal é o Horror Ilusório: projeta imagens de pesadelo personalizado diretamente na mente das vítimas, paralisando-as de medo enquanto ataca à vontade. Em adição, lança raios de energia abissal multicolorida que causam tipos aleatórios de dano, imprevisível mesmo para quem conhece a habilidade.',
    ARRAY['besta'],
    4, 2,
    7, 10,
    125,
    24, 5, 8, 24, 8, 4,
    17, 15,
    '2d8+4',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d8","efeito":null,"cooldown":4,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Frenesi","descricao":"O monstro executa frenesi contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'gelo', 'eletricidade'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    10000,
    'grande',
    ARRAY['abismo — tribunal infernal'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Símio Abissal (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Símio Abissal',
    'Primata demoníaco de porte avantajado com pernas traseiras descomunalmente poderosas capazes de saltos de doze metros, braços longos para locomoção com os nós dos dedos no chão, e uma face de macaco-ogro com olhos vermelhos e dentes à mostra em expressão de fúria permanente. Pele laranja-avermelhada com manchas que se assemelham a queimaduras antigas.

Usa invisibilidade para preparar emboscadas perfeitas, surgindo sobre a vítima de saltos impossíveis antes que ela possa reagir de qualquer forma útil. Em combate, lança magias de enredamento para imobilizar oponentes e depois os despedaça com força primata avassaladora.',
    ARRAY['besta'],
    3, 2,
    5, 8,
    80,
    20, 4, 8, 20, 8, 4,
    13, 11,
    '2d6+2',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1800,
    'grande',
    ARRAY['abismo', 'selva sombria'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mosca Abissal (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mosca Abissal',
    'Mosca demoníaca de dois metros de comprimento com pernas articuladas e hirsutas que se dobram em ângulos perturbadores, olhos compostos que refletem o vermelho do Abismo em centenas de facetas, e uma probóscide que se estende como lança para perfurar armadura e sugar sangue. O zumbido das asas é sobrenatural, ressoando dentro da cabeça como mantra indutor de sono que não pode ser ignorado.

Caçador de desertores e fugitivos do Abismo: seu zumbido adormecedor pode derrubar humanos inconscientes a sessenta metros de distância. Uma vez adormecida a vítima, a probóscide drena sangue e pontos de vida máximos de forma permanente até a morte.',
    ARRAY['besta'],
    3, 2,
    5, 8,
    80,
    20, 4, 8, 20, 8, 4,
    13, 11,
    '2d6+2',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"2d10+4","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    2300,
    'grande',
    ARRAY['abismo — caçador de desertores'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dretch (Tier 2, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dretch',
    'O mais humilde e abundante dos demônios verdadeiros: um gordinho com pernas curtas e rechonchudas, braços desproporcionalmente longos que arrastam quase no chão, e um rosto de sapo-bulldog num corpo de bebê gordo com malformações múltiplas. Fedorento, covarde e praticamente inútil num confronto individual, mas o Abismo os produz em quantidades industriais como material descartável de guerra.

A única arma real é uma nuvem de gás nauseante que expele quando acuado, tornando difícil para inimigos próximos lutar com eficiência por náusea intensa. Em grupos de dezenas, porém, a quantidade pura pode suplantar completamente a qualidade.',
    ARRAY['besta'],
    1, 2,
    1, 3,
    17,
    8, 3, 12, 8, 12, 4,
    4, 7,
    '1d6',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    50,
    'pequeno',
    ARRAY['abismo — carne de canhão'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Manes (Tier 1, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Manes',
    'O destino de almas humanas suficientemente pecaminosas: transformação no menor e mais miserável dos demônios, uma pilha de carne cinzenta irregular com rosto vagamente humano distorcido em expressão de desespero eterno. Não pensa, não planeja e não se comunica, apenas avança em direção ao calor dos vivos com fome que não pode articular nem compreender.

Existem para demonstrar o que a condenação abissal faz com almas humanas, servindo de alerta permanente e de massa de manobra descartável nos exércitos do Abismo. A única saída é ascender para dretch com tempo suficiente ou ser consumido por demônios mais fortes.',
    ARRAY['besta'],
    1, 2,
    1, 2,
    10,
    6, 3, 12, 6, 12, 4,
    3, 5,
    '1d4+1',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    25,
    'pequeno',
    ARRAY['abismo'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cambion (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cambion',
    'Filho de succubus ou incubus com um mortal: aparência humana quase perfeita que passa qualquer inspeção casual, mas com pequenos chifres ocultáveis por cabelo, asas vestigiais dobradas sob roupas largas, e olhos com íris que brilham tenuemente em situações de emoção forte. Frequentemente esconde a natureza por décadas enquanto sobe socialmente com charme e inteligência infernal.

Ao contrário dos pais, o cambion pode sentir emoções genuínas e desenvolver afeições reais, mas a maldade infernal é parte genuína de quem é, não imposição externa. Usa poderes de charme e magia de fogo com facilidade, e a resistência física infernal o torna muito mais durável que um humano de aparência comparável.',
    ARRAY['fiend'],
    3, 2,
    5, 8,
    65,
    16, 15, 10, 16, 10, 12,
    11, 12,
    '2d6+2',
    '[{"nome":"Garra Demoníaca","descricao":"Garras afiadas como obsidiana rasgam armaduras.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'gelo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1800,
    'medio',
    ARRAY['qualquer plano'],
    '{}',
    '{}',
    '{"terrestre":30,"voo":50}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Erinyes (Tier 7, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Erinyes',
    'Anjo caído de beleza aterrorizante: armadura de couro negro polido sobre forma feminina completamente aerodinâmica para combate aéreo, asas negras com penas afiadas como lâminas de faca, e uma expressão de julgamento implacável que não muda independentemente do que aconteça ao redor. Empunha espada e laço com a virtuosidade de dez mil anos de prática em execução de sentenças infernais.

Combina velocidade de voo com magia de contenção e combate marcial de elite numa combinação letal refinada ao longo de milênios. O laço infernal prende vítimas à distância enquanto ela as fulmina com magia ou avança com a espada envenenada. Cada movimento é calculado com precisão cirúrgica absoluta.',
    ARRAY['fiend'],
    4, 2,
    7, 10,
    110,
    20, 16, 10, 20, 10, 12,
    15, 16,
    '2d8+4',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+2"},"cooldown":4,"chance":50},{"nome":"Aura de Medo","descricao":"O monstro executa aura de medo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fogo Infernal","descricao":"O monstro executa fogo infernal contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'gelo', 'veneno'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    8400,
    'medio',
    ARRAY['nove hells', 'caça a fugitivos'],
    '{}',
    '{}',
    '{"terrestre":30,"voo":50}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Horned Devil (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Horned Devil',
    'Quatro metros de músculo diabólico coberto de espinhos ósseos apontados em todas as direções, com chifres retorcidos imponentes e asas de morcego que criam sombra dramática ao se abrir completamente. A cauda espinhada move-se de forma completamente independente como uma quinta extremidade armada que ataca por conta própria.

A elite militar média das Nove Hells: poderoso demais para ser usado como infantaria simples, não suficientemente poderoso para comandar exércitos como um pit fiend. Preenche o papel de oficial de campo e executor de operações críticas, combinando força bruta com magia suficiente para situações complicadas.',
    ARRAY['fiend'],
    4, 2,
    7, 10,
    125,
    24, 16, 8, 24, 8, 12,
    17, 15,
    '2d8+4',
    '[{"nome":"Garra Demoníaca","descricao":"Garras afiadas como obsidiana rasgam armaduras.","tipo":"ofensiva","dano":"2d8+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+2"},"cooldown":4,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição Profana","descricao":"O monstro executa destruição profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'eletricidade', 'veneno', 'radiante'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    7200,
    'grande',
    ARRAY['nove hells — elite militar'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Barbed Devil (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Barbed Devil',
    'Humanóide delgado inteiramente coberto de espinhos rígidos apontados para fora em todas as direções externas, tornando qualquer contato físico próximo uma proposição de múltiplas lacerações simultâneas para quem tocar ou for tocado. Os olhos são chamas que não piscam, e a voz é o crepitar permanente de madeira ardendo em lareira. Serve como guarda de portais e controlador de informação nas hierarquias das Nove Hells.

Preferindo distância de segurança, usa bolas de fogo repetidas para manter pressão enquanto sua presença aterrorizante progressivamente destrói a moral de inimigos. Os olhos em chamas enxergam em todas as direções sem ponto cego, tornando-o impossível de surpreender.',
    ARRAY['fiend'],
    3, 2,
    5, 8,
    65,
    16, 15, 10, 16, 10, 12,
    11, 12,
    '2d6+2',
    '[{"nome":"Chama Infernal","descricao":"Chamas do abismo envolvem o alvo em fogo demoníaco.","tipo":"ofensiva","dano":"2d6+2","efeito":{"tipo":"medo","duracao":2,"dano_por_turno":null},"cooldown":3,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1800,
    'medio',
    ARRAY['nove hells — guarda e espionagem'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Lemure (Tier 1, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Lemure',
    'A forma mais primitiva e miserável de diabo: um blob de carne branca-rósea gelatinosa sem feições claramente definidas além de um rosto vagamente implícito na massa, que se arrasta pelo chão de Cinéria emitindo gemidos suaves de algo que perdeu tudo que já foi. É literalmente uma alma humana condensada e humilhada em sua forma mais reduzida possível.

Sem inteligência real, sem estratégia, sem medo da destruição. Avança porque avançar é tudo que lhe resta. A única razão para um aventureiro se preocupar com lemures é o que eles representam: almas humanas pecaminosas transformadas, e o aviso implícito sobre destinos possíveis.',
    ARRAY['fiend'],
    1, 2,
    1, 2,
    15,
    8, 14, 10, 8, 10, 12,
    4, 4,
    '1d4+1',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    10,
    'medio',
    ARRAY['nove hells'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Carcereiro Infernal (Tier 8, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Carcereiro Infernal',
    'Diabo de estatura baixa e proporções rechonchudas com um sorriso de burocrata satisfeito que não combina nem um pouco com o poder absoluto que exerce sobre as margens do Rio Styx. Carrega um cajado ornamentado e usa vestes formais como se fosse administrador de alguma repartição infernal, o que tecnicamente é. Parece completamente inofensivo até o momento em que apaga a memória de alguém com um simples toque casual.

Não precisa de combate físico para ser devastador: apaga memórias selecionadas ou completas de vítimas com toque, deixando-as sem saber quem são, onde estão ou por que chegaram ali. Uma aventura pode ser destruída completamente sem que nenhum participante receba sequer um ponto de dano.',
    ARRAY['fiend'],
    6, 2,
    8, 12,
    150,
    22, 16, 10, 22, 10, 12,
    18, 18,
    '2d10+5',
    '[{"nome":"Chama Infernal","descricao":"Chamas do abismo envolvem o alvo em fogo demoníaco.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Invocação Abissal","descricao":"O monstro executa invocação abissal contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    20000,
    'medio',
    ARRAY['rio styx — guardião das almas'],
    '{}',
    '{}',
    '{"terrestre":30,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Arch-Devil Kaelzira (Tier 10, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Arch-Devil Kaelzira',
    'Um anjo de beleza arrasadora antes da queda: metade do rosto queimado em batalha infernal, a pele carbonizada e olho fundido nessa metade, enquanto o outro lado permanece esculturalmente perfeito, tornando o contraste mais perturbador que a destruição sozinha. Asas de anjo com penas que foram brancas e agora são negras e chamuscadas nas pontas. Governa Cinéria com disciplina militar absoluta e ódio refinado em arte.

Talvez o ser mais guerreiro das Nove Hells: diferente dos outros arquidiabos que preferem manipulação e política, ela combate pessoalmente e com ferocidade total. Sua espada flamejante apaga exércitos e sua magia divina corrompida pode curar aliados ou destruir inimigos com igual facilidade.',
    ARRAY['fiend'],
    6, 2,
    10, 16,
    295,
    30, 17, 8, 30, 8, 12,
    26, 21,
    '3d10+8',
    '[{"nome":"Garra Demoníaca","descricao":"Garras afiadas como obsidiana rasgam armaduras.","tipo":"ofensiva","dano":"3d6+5","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+4"},"cooldown":5,"chance":50},{"nome":"Aura de Medo","descricao":"O monstro executa aura de medo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Destruição Profana","descricao":"O monstro executa destruição profana contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['fogo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    90000,
    'grande',
    ARRAY['avernus', '1ª camada das hells'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Demon Prince Morgrath (Tier 10, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Demon Prince Morgrath',
    'O Príncipe da Morte Morta-Viva em forma de macho-cabrío de seis metros com chifres retorcidos que tocam o teto de qualquer sala, corpo branco-cadavérico de gordura sobrenatural que absorve luz como buraco, e um cajado feito do crânio de um deus que ele matou pessoalmente. Cada morte no multiverso, em qualquer lugar, o alimenta microscopicamente.

O cajado de Morgrath é talvez o artefato mais perigoso do multiverso: pode matar instantâneamente qualquer criatura com um toque se não resistir à salvaguarda extremamente difícil. Pode ainda criar mortos-vivos em escala de exércitos sem limite de material disponível. Derrotá-lo requer poder divino genuíno.',
    ARRAY['besta'],
    6, 2,
    10, 16,
    310,
    32, 6, 6, 32, 6, 4,
    27, 20,
    '3d10+8',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":5,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    90000,
    'enorme',
    ARRAY['thanatos (abismo)'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Demon Prince Dualgorath (Tier 10, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Demon Prince Dualgorath',
    'O Príncipe dos Demônios propriamente dito: duas cabeças de mandril num corpo de serpente massiva com tentáculos no lugar de braços, mais de seis metros de altura de músculo e escama. As duas cabeças são personalidades completamente separadas que se odeiam visceralmente e discordam sobre tudo, exceto a destruição de tudo ao redor.

Este conflito interno permanente o torna paradoxalmente mais perigoso: o caos de duas mentes brigando dentro de um único ser de poder divino resulta em comportamento completamente imprevisível que frustra qualquer estratégia preparada. A hipnose de uma das cabeças pode paralisar exércitos enquanto a outra os devora.',
    ARRAY['besta'],
    6, 2,
    10, 16,
    310,
    32, 6, 6, 32, 6, 4,
    27, 20,
    '3d10+8',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d6","efeito":null,"cooldown":5,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['psiquico', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    90000,
    'enorme',
    ARRAY['gaping maw (abismo)'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Demon Lord Gosmaroth (Tier 9, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Demon Lord Gosmaroth',
    'Não tem forma discernível: é uma massa consciente de limo ácido verde-negro que preenche câmaras inteiras, escorre pelas paredes e cria tentáculos de gosma que surgem do chão sob os pés dos intrusos sem aviso. Não fala nem pensa em termos de estratégia; Gosmaroth apenas consome. É a manifestação pura da destruição sem propósito, finalidade ou misericórdia.

Combater Gosmaroth é combater o ambiente inteiro: o ácido corrói armaduras apenas por contato com o chão ao redor, os tentáculos surgem de qualquer superfície molhada, e a massa pode engolir criaturas inteiras dissolvendo-as por dentro. Não pode ser negociado, enganado ou distraído.',
    ARRAY['besta'],
    6, 2,
    9, 14,
    230,
    30, 6, 6, 30, 6, 4,
    23, 18,
    '3d8+6',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+3"},"cooldown":5,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Frenesi","descricao":"O monstro executa frenesi contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo', 'acido', 'veneno'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    50000,
    'enorme',
    ARRAY['slime pits (abismo)'],
    '{}',
    ARRAY['acido'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Khrovash (Tier 10, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Khrovash',
    'Um gnoll de quatro metros com a postura de um predador no pico absoluto da cadeia alimentar: olhos de hiena com pupila vertical brilhando em âmbar com fome sagrada, pelagem manchada de sangue que nunca seca completamente, e um mangual de três cabeças que parece possuído de vida própria, cada cabeça girando independentemente. A gargalhada de hiena que solta antes de atacar ecoa por quilômetros.

Khrovash criou os gnolls de forma completamente literal: quando uma matilha de hienas consume cadáveres deixados por ele, as hienas se transformam em gnolls. Cada gnoll no mundo é fragmento de sua vontade, e ao matar um humanóide na presença de Khrovash, um novo gnoll surge do cadáver imediatamente.',
    ARRAY['besta'],
    6, 2,
    10, 16,
    310,
    32, 6, 6, 32, 6, 4,
    27, 20,
    '3d10+8',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d6+5","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+4"},"cooldown":5,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['eletricidade', 'veneno', 'fogo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    62000,
    'enorme',
    ARRAY['yeenoghu''s realm (abismo)'],
    '{}',
    ARRAY['eletricidade'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Dragoes (26 monstros)
-- =============================================================================

-- Dragão Branco Wyrmling (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Branco Wyrmling',
    'Filhote de dragão branco do tamanho de um cachorro grande, coberto de escamas brancas com reflexo azulado e olhos de íris incolor como gelo antigo. Já neste estágio jovem, o sopro de frio pode cobrir uma pessoa de gelo e incapacitá-la. É impulsivo, faminto e sem a paciência calculista que terá quando adulto.

Não subestime um wyrmling: mesmo pequeno, sua resistência ao frio, garras afiadas e sopro gelado criam um combate perigoso para grupos de nível 1-3. E onde há um wyrmling, a mãe adulta provavelmente não está longe.',
    ARRAY['dragao'],
    2, 3,
    2, 5,
    30,
    12, 17, 10, 12, 10, 14,
    7, 8,
    '1d6+2',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"5d8","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    450,
    'medio',
    ARRAY['montanhas geladas', 'planície ártica'],
    '{}',
    ARRAY['frio'],
    '{"terrestre":30,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Vermelho Jovem (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Vermelho Jovem',
    'Já impressionante em tamanho com o comprimento de quatro cavalos enfileirados, escamas cor de brasa viva, chifres que apontam para trás como lanças e olhos de laranja ardente profundo. O calor que emana do corpo é palpável a metros de distância, e o chão ao redor do ninho está sempre levemente fumegando e enegrecido.

Um dragão vermelho jovem já tem ego suficiente para exigir tributos de cidades próximas e poder suficiente para destruí-las se recusarem. O sopro de fogo em cone de dez metros pode incinerar múltiplos aventureiros de uma vez, e ele usa inteligência crescente para posicionar-se acima do combate, impossível de flanquear no ar.',
    ARRAY['dragao'],
    4, 3,
    7, 10,
    125,
    24, 18, 8, 24, 8, 14,
    17, 15,
    '2d8+4',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"12d6","efeito":{"tipo":"medo","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    5900,
    'grande',
    ARRAY['montanhas vulcânicas', 'fortaleza de lava'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":35,"voo":60,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Vermelho Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Vermelho Adulto',
    'Descomunal e majestoso de forma aterrorizante: quinze metros de comprimento, asas que projetam sombra de uma casa inteira, escamas que parecem forjadas em metal vivo e chifres como lanças encurvadas. O rugido fisicamente faz tremer o chão, e a presença do dragão adulto ativa medo instintivo mesmo em guerreiros endurecidos que nunca o viram antes.

O sopro de fogo de um dragão adulto é uma calamidade de área: trinta metros de comprimento de chama concentrada que pode reduzir armaduras a escória e pedra a pó. Possui magia inata, ataca com garras, garras e mordida simultâneas, e usa o terreno com maestria tática desenvolvida em décadas de caça e batalha.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"18d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    18000,
    'enorme',
    ARRAY['vulcão', 'montanha ardente'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Vermelho Ancião (Tier 10, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Vermelho Ancião',
    'Uma montanha viva. O dragão vermelho ancião tem mais de trinta metros de comprimento, escamas que levaram séculos para atingir essa densidade de metal-vivo, e olhos que viram impérios nascerem e morrerem. Cada expiração libera vapor e fumaça mesmo sem usar o sopro. Sua inteligência é de gênio, sua crueldade é artística e sua memória é enciclopédica.

O sopro do ancião cobre uma área de noventa metros, grande o suficiente para alcançar cavalaria inteira. Sua presença aterrorizante alcança cento e vinte metros. Combina magia de alto nível, combate físico devastador e posicionamento aéreo com a maestria de um estrategista milenário. Aventureiros que chegam ao seu covil frequentemente não saem.',
    ARRAY['dragao'],
    6, 3,
    10, 16,
    320,
    33, 19, 5, 33, 5, 14,
    28, 19,
    '3d10+8',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"26d6","efeito":null,"cooldown":5,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Fúria Draconiana","descricao":"O monstro executa fúria draconiana contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    62000,
    'gargantuesco',
    ARRAY['grande vulcão', 'montanha lendária'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Azul Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Azul Adulto',
    'Relâmpagos dançam constantemente entre as esporas e a crista de chifres quando o dragão azul adulto fica agitado. Escamas índigo-cobalto reflexivas que parecem céu tempestuoso solidificado, e olhos que brilham como raios contidos em câmara de cristal. A voz é um trovão controlado que pode ser ouvido a quilômetros ao redor.

O sopro é uma linha de relâmpago de noventa metros que perfura múltiplos alvos em fila, sem desviar. Prefere campos abertos onde pode manobrar livremente e usar o terreno plano para maximizar o alcance. Curiosamente mais disciplinado que outros dragões cromáticos: frequentemente lidera exércitos com competência militar real.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Mordida Draconiana","descricao":"Mandíbulas enormes trituram com força descomunal.","tipo":"ofensiva","dano":"13d10","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Draconiana","descricao":"O monstro executa fúria draconiana contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['eletricidade'],
    ARRAY['fantasia', 'medieval', 'epico'],
    15000,
    'enorme',
    ARRAY['deserto', 'planície tempestuosa'],
    '{}',
    ARRAY['eletricidade'],
    '{"terrestre":40,"voo":60,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Verde Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Verde Adulto',
    'Cor de floresta profunda com escamas que parecem folhas sobrepostas em diferentes tons de verde, o dragão verde adulto é o mais calculista e politicamente astuto dos cromáticos. Prefere manipular a destruir, colecionando informações e segredos como outros dragões colecionam ouro. Os olhos verdes brilham com inteligência predatória fria e paciente.

O sopro de gás venenoso é uma nuvem de sessenta metros que persiste além do sopro inicial, lingering na área. Mas o maior perigo do dragão verde é a conversa: usa Charme e Sugestão para manipular aventureiros a traírem uns aos outros, eliminando a ameaça sem arriscar uma escama sequer.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"16d6","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Draconiana","descricao":"O monstro executa fúria draconiana contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval', 'epico'],
    13000,
    'enorme',
    ARRAY['floresta profunda', 'pântano arborizado'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Preto Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Preto Adulto',
    'Escamas negras como piche que absorvem a luz completamente, com ácido gotejando constantemente das mandíbulas e corroendo o chão ao redor do ninho em padrões que registram séculos de hábito. O dragão preto adulto escolhe pântanos e ruínas alagadas deliberadamente, onde suas táticas aquáticas e o ácido são maximamente eficazes. Cruel com especial satisfação em humilhar antes de matar.

O sopro de ácido corrói armaduras e carne igualmente, e o dragão mergulha em água turva para reposicionar entre ataques, emergindo em pontos inesperados. O ambiente pantanoso do covil é uma armadilha natural extensa que ele moldou ao longo de décadas.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Mordida Draconiana","descricao":"Mandíbulas enormes trituram com força descomunal.","tipo":"ofensiva","dano":"13d8","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['acido'],
    ARRAY['fantasia', 'medieval', 'epico'],
    11500,
    'enorme',
    ARRAY['pântano', 'zona alagada', 'ruínas afogadas'],
    '{}',
    ARRAY['acido'],
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Branco Adulto (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Branco Adulto',
    'O menos inteligente dos dragões cromáticos, o branco adulto compensa com força bruta e territorialismo feroz. Escamas brancas com tonalidades azuis na barriga adaptadas a camuflar-se em neve, e os olhos são rosa-claro como gelo muito antigo comprimido. Sopra frio como o Polo Norte concentrado num cone mortal.

Apesar da inteligência limitada, o dragão branco adulto tem instintos de caçador excepcionais e usa o terreno ártico com maestria: ataca de blizzards, camufla o ninho em nevascas e congela presas vivas para comer depois com calma. Menos previsível que dragões mais inteligentes exatamente por sua impulsividade.',
    ARRAY['dragao'],
    4, 3,
    7, 10,
    140,
    26, 18, 6, 26, 6, 14,
    18, 14,
    '2d8+4',
    '[{"nome":"Mordida Draconiana","descricao":"Mandíbulas enormes trituram com força descomunal.","tipo":"ofensiva","dano":"12d8","efeito":null,"cooldown":4,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    10000,
    'enorme',
    ARRAY['ártico', 'montanha gelada'],
    '{}',
    ARRAY['frio'],
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão de Cobre Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão de Cobre Adulto',
    'Escamas de cobre polido que oxida em verde nas bordas dando aspecto de antiguidade elegante. O dragão de cobre adulto é extraordinariamente divertido de conversar: ama piadas elaboradas e charadas sem resposta óbvia. Mas não deixe a personalidade jovial enganar: é inteligente, poderoso e defende seu território com determinação total quando provocado.

Usa dois sopros alternados: ácido ou uma névoa de lentidão que paralisa grupos inteiros. Frequentemente usa o humor para prender atenção de visitantes enquanto avalia se são ameaça ou curiosidade. Aliado improvável mas genuinamente valioso se a amizade for cultivada com paciência e bom humor.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Mordida Draconiana","descricao":"Mandíbulas enormes trituram com força descomunal.","tipo":"ofensiva","dano":"12d8","efeito":null,"cooldown":4,"chance":50},{"nome":"Escamas Reforçadas","descricao":"O monstro executa escamas reforçadas contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['acido'],
    ARRAY['fantasia', 'medieval', 'epico'],
    11500,
    'enorme',
    ARRAY['montanhas secas', 'colinas rochosas'],
    '{}',
    ARRAY['acido'],
    '{"terrestre":30,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Dourado Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Dourado Adulto',
    'O mais poderoso e nobre dos dragões metálicos em idade adulta: escamas douradas que brilham com luz própria tênue, olhos âmbar profundos cheios de sabedoria acumulada e uma expressão que transmite tanto poder quanto compaixão genuína. Frequentemente assume forma humana para viver entre mortais, acumulando perspectiva e amizades que duram gerações.

Combina sopro de fogo devastador com sopro de enfraquecimento que pode deixar exércitos indefesos, mais magia de encantamento e charme de alto nível. Como inimigo é uma catástrofe, pois usa décadas de estratégia, diplomacia e conhecimento profundo dos mortais contra eles com precisão cirúrgica.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"13d10","efeito":null,"cooldown":4,"chance":50},{"nome":"Escamas Reforçadas","descricao":"O monstro executa escamas reforçadas contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo', 'psiquico'],
    ARRAY['fantasia', 'medieval', 'epico'],
    18000,
    'enorme',
    ARRAY['montanhas', 'planície dourada'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Dourado Ancião (Tier 10, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Dourado Ancião',
    'Um ser que transcende a ideia de monstro: uma divindade em forma dragônica, com mais de sessenta metros de escamas que emitem calor dourado suave, olhos que enxergam o passado e o futuro com igual clareza, e uma presença que simplesmente transforma o ambiente ao redor. Sua mera existência próxima é uma bênção: plantas florescem, animais se acalmam, doentes se sentem melhor.

Sua destruição seria uma tragédia cósmica reconhecida pelo próprio universo. O sopro de fogo pode apagar exércitos, mas usa-o raramente, preferindo negociar, ensinar e guiar. Quando finalmente decide que força é necessária, é com precisão cirúrgica e pesar genuíno por cada vida perdida.',
    ARRAY['dragao'],
    6, 3,
    10, 16,
    320,
    33, 19, 5, 33, 5, 14,
    28, 19,
    '3d10+8',
    '[{"nome":"Mordida Draconiana","descricao":"Mandíbulas enormes trituram com força descomunal.","tipo":"ofensiva","dano":"26d10","efeito":null,"cooldown":5,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    62000,
    'gargantuesco',
    ARRAY['montanha sagrada', 'palácio elevado'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão de Prata Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão de Prata Adulto',
    'Escamas de prata polida que refletem o ambiente ao redor como espelhos vivos, tornando o dragão quase invisível contra céus nublados em voo. Frequentemente assume forma humana por décadas, vivendo entre mortais por curiosidade genuína e compaixão profunda pelas vidas breves que observa. Os olhos são cinza-prateados com profundidade calma.

Dois sopros alternados: frio intenso e paralisação temporária completa que permite neutralizar sem matar. O dragão de prata adulto prefere incapacitar a destruir, dando inimigos chance de recuar. Mas se a situação exigir força total, o combate é avassalador: velocidade aérea, sopros alternáveis, garras e magia num package que poucos sobrevivem.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"13d8","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    15000,
    'enorme',
    ARRAY['montanhas', 'nuvens altas'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Bronze Adulto (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Bronze Adulto',
    'Escamas de bronze oxidado verde-acobreado que relampejam com estática quando o dragão fica agitado. Ama a água e o mar com paixão genuína, sendo frequentemente encontrado em ilhas ou costas rochosas. Mantém relações de longa data com comunidades de marinhos que protege em troca de histórias e notícias do mundo que não consegue alcançar em forma dracônica.

Sopro de relâmpago em linha e sopro repulsivo que empurra inimigos para longe são complementados por habilidades anfíbias completas. Pode assumir forma humana à vontade e muitas vezes serve como protetor oculto de portos inteiros por décadas sem revelar sua verdadeira natureza.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"12d10","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['eletricidade'],
    ARRAY['fantasia', 'medieval', 'epico'],
    13000,
    'enorme',
    ARRAY['costa', 'ilha', 'mar'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão de Latão Adulto (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão de Latão Adulto',
    'Escamas de latão polido que brilham com calor próprio em climas quentes, o dragão de latão adulto é conversador compulsivo que prefere uma boa troca de histórias a qualquer combate. Vive em desertos e savanas quentes, frequentemente se tornando figura lendária local por aparecer repentinamente em conversas ao lado de caravanas perdidas.

O sopro de fogo em linha pode carbonizar alvos múltiplos, e o sopro adormecedor derruba grupos inteiros sem causar dano permanente, revelando a preferência por não matar quando pode evitar. A maior ameaça numa interação com um dragão de latão é perder dias inteiros contando histórias enquanto ele mantém você cativo pela conversa.',
    ARRAY['dragao'],
    4, 3,
    7, 10,
    140,
    26, 18, 6, 26, 6, 14,
    18, 14,
    '2d8+4',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"12d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Draconiana","descricao":"O monstro executa fúria draconiana contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    10000,
    'enorme',
    ARRAY['deserto quente', 'savana'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Prateado Jovem (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Prateado Jovem',
    'Jovem mas já impressionante em tamanho, com escamas de prata que ainda não alcançaram o polimento perfeito da maturidade mas brilham com promessa de beleza futura. Curioso sobre o mundo dos mortais de forma genuína e às vezes ingênua, frequentemente assume forma humana para explorar cidades sem revelar sua natureza dracônica.

O sopro de frio já é suficientemente poderoso para cobrir grupos de frio intenso, e o sopro paralisante permite neutralizar grupos inteiros sem matá-los, refletindo a natureza bondosa que os dragões de prata mantêm mesmo na juventude impetuosa.',
    ARRAY['dragao'],
    4, 3,
    6, 9,
    100,
    22, 18, 8, 22, 8, 14,
    15, 13,
    '2d6+4',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"8d8","efeito":null,"cooldown":4,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    5000,
    'grande',
    ARRAY['montanhas', 'nuvens'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragão Lich (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragão Lich',
    'Um dragão que seguiu o mesmo caminho proibido de um lich: transferiu a própria alma para um phylactery e transformou o corpo dracônico num veículo de poder morto-vivo. A carcaça preservada do dragão mantém todas as capacidades físicas originais — garras, mordida, sopro — agora combinadas com as imunidades e poderes de um não-morto de alto nível.

O sopro de um dragão lich causa dano necrótico em vez do tipo elemental original, e o toque paralisante se estende a qualquer contato físico. Como o lich, ressurge a partir do phylactery se destruído. A combinação de poder dracônico com a imortalidade do lich torna-o uma das ameaças mais difíceis de erradicar permanentemente.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    180,
    28, 18, 6, 28, 6, 14,
    21, 16,
    '2d10+5',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval', 'epico'],
    18000,
    'enorme',
    ARRAY['dungeon profunda'],
    '{}',
    ARRAY['charme'],
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Shadow Dragon (Tier 2, gargantuesco, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Shadow Dragon',
    'Um dragão que passou tempo suficiente no Umbrália foi gradualmente corrompido pela escuridão do plano e transformado em algo entre dragão e sombra. As escamas perderam o brilho original para uma tonalidade que absorve a luz ao redor, e os olhos agora brilham com a mesma luz fria dos espectros que habitam o plano das sombras.

Mantém todos os poderes do dragão base mas adiciona sopro de escuridão que extingue qualquer luz em área grande, capacidade de passar pelas sombras como um espectro, e resistências adicionais de morto-vivo. Mais imprevisível que o original por causa do toque de insanidade que o Umbrália imprimiu na psique.',
    ARRAY['dragao'],
    1, 3,
    1, 3,
    62,
    17, 16, 5, 17, 5, 14,
    9, 3,
    '1d6',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'medieval', 'epico'],
    50,
    'gargantuesco',
    ARRAY['shadowfell', 'covil nas sombras'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Wyvern (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Wyvern',
    'Um parente menor dos dragões: corpo de lagarto voador com asas imensas e pernas poderosas mas sem braços dianteiros, um ferrão na ponta da cauda que goteja veneno paralisante de cor esverdeada, e uma cabeça de dragão com dentes serrilhados. É grande o suficiente para levantar um cavalo com cavaleiro e carregá-lo ao ninho.

Menos inteligente que dragões verdadeiros, o wyvern compensa com agressividade e o ferrão venenoso na cauda que pode matar um guerreiro robusto em minutos se não tratado. Frequentemente nidifica em penhascos inacessíveis, mergulhando sobre presas nas planícies abaixo com precisão de projétil.',
    ARRAY['dragao'],
    3, 3,
    5, 8,
    80,
    20, 17, 8, 20, 8, 14,
    13, 11,
    '2d6+2',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"7d6","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval', 'epico'],
    2300,
    'grande',
    ARRAY['montanhas', 'penhascos'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Pseudodragon (Tier 2, minusculo, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Pseudodragon',
    'Criatura do tamanho de um gato grande com escamas de vermelho-acastanhado, asas de morcego pequenas, cauda com ferrão e uma face de dragão em miniatura que transmite inteligência surpreendente e personalidade marcante. É frequentemente confundido com filhotes de dragão por quem nunca viu um, mas é uma espécie completamente distinta.

O ferrão na cauda injeta veneno que causa sono profundo por horas, e a telepatia permite comunicação com o mago que adota como familiar sem palavras. Extremamente seletivo sobre quem aceita como companheiro: um pseudodragon não pode ser domado, apenas conquistado por meses de paciência e respeito mútuo.',
    ARRAY['dragao'],
    1, 3,
    1, 3,
    12,
    4, 16, 14, 6, 14, 14,
    3, 8,
    '1d6',
    '[{"nome":"Mordida Draconiana","descricao":"Mandíbulas enormes trituram com força descomunal.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'medieval', 'epico'],
    50,
    'minusculo',
    ARRAY['floresta', 'masmorras', 'familiar mágico'],
    '{}',
    '{}',
    '{"terrestre":10,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Faerie Dragon (Tier 3, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Faerie Dragon',
    'Uma criatura do tamanho de um gato com asas de borboleta iridescentes e escamas que mudam de cor com a idade, começando em vermelho e progredindo pelo espectro ao longo de séculos. Possui personalidade irresistível e alegre, olhos grandes e expressivos, e uma tendência a pregar peças que vai de inofensiva a genuinamente perturbadora dependendo do humor.

O sopro cria uma névoa eufórica que provoca risada incontrolável em vítimas nas redondezas. A invisibilidade permanece mesmo ao atacar, e a magia ilusória pode criar distrações elaboradas. Uma das poucas criaturas genuinamente divertidas de encontrar, desde que não esteja de mau humor.',
    ARRAY['dragao'],
    2, 3,
    2, 5,
    20,
    6, 17, 14, 8, 14, 14,
    5, 10,
    '1d6+2',
    '[{"nome":"Cauda Esmagadora","descricao":"O monstro executa cauda esmagadora contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    200,
    'minusculo',
    ARRAY['floresta encantada', 'sylvaris'],
    '{}',
    '{}',
    '{"terrestre":15,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dragon Turtle (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dragon Turtle',
    'Colosso marinho com carapaça de tartaruga que poderia servir de ilha para grupos pequenos, pescoço serpentino com cabeça de dragão completa com chifres e mandíbulas que poderiam partir um navio ao meio. Vive em oceanos profundos e a maioria dos marinheiros que os avistou não sobreviveu para contar detalhes precisos sobre o tamanho real.

O sopro de vapor superaquecido é uma calamidade em espaço confinado como porão de navio. A carapaça é tão resistente que mesmo artilharia pesada de navios de guerra deixa marcas superficiais. Pode afundar navios com um único movimento de cauda e frequentemente cobra pedágio a frotas que cruzam seu território.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    190,
    29, 18, 5, 29, 5, 14,
    22, 15,
    '2d10+5',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"15d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Presença Aterrorizante","descricao":"O monstro executa presença aterrorizante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    18000,
    'gargantuesco',
    ARRAY['oceano profundo', 'mar aberto'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Hydra (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Hydra',
    'Serpente aquática colossal com cinco cabeças independentes no final de pescoços flexíveis que permitem atacar em todas as direções simultaneamente. Cada cabeça tem sua própria mordida com dentes voltados para dentro que tornam impossível soltar algo preso nela sem rasgar. As escamas são de um verde-cinza lodoso que se mistura perfeitamente ao fundo de pântanos.

O terror da hidra é a regeneração: cada cabeça cortada é substituída por duas novas a menos que o ferimento seja cauterizado imediatamente com fogo ou ácido. Grupos sem fonte de fogo podem se ver rapidamente superados numericamente enquanto tentam destruí-la.',
    ARRAY['monstrosity'],
    4, 3,
    6, 9,
    115,
    24, 7, 6, 24, 6, 6,
    16, 12,
    '2d6+4',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque Múltiplo","descricao":"O monstro executa ataque múltiplo contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    3900,
    'enorme',
    ARRAY['pântano', 'lago', 'área aquática'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Lindworm (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Lindworm',
    'Serpente colosssal sem asas e sem pernas dianteiras do folclore escandinavo, com escamas de verde-escuro quase negro, olhos dourados de serpente e mandíbulas que se abrem em ângulo impossível para engolir presas do tamanho de um touro. Habita florestas densas e pântanos do norte europeu de fantasia, deixando rastros de vegetação esmagada onde passa.

A força constritora do lindworm pode estraçalhar armaduras de aço com pressão suficiente, e o veneno paralisante imobiliza vítimas para ser engolidas vivas. O lore sugere que pode ser quebrado por ritual de amor verdadeiro, mas poucos aventureiros chegam perto o suficiente para tentar.',
    ARRAY['dragao'],
    4, 3,
    6, 9,
    115,
    24, 18, 6, 24, 6, 14,
    16, 12,
    '2d6+4',
    '[{"nome":"Garras Devastadoras","descricao":"O monstro executa garras devastadoras contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+2"},"cooldown":4,"chance":50},{"nome":"Aura Elemental","descricao":"O monstro executa aura elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Draconiana","descricao":"O monstro executa fúria draconiana contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval', 'epico'],
    5000,
    'enorme',
    ARRAY['floresta densa', 'pântano'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sovereign Dragon (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sovereign Dragon',
    'O dragão celestial da tradição oriental: serpente sinuosa sem asas mas que voa pela manipulação do vento e da nuvem, com escamas de ouro-e-jade que mudam de tom com o humor, e uma presença que transmite autoridade cósmica inigualável. Serve de conselheiro a imperadores e de guardião de portais entre o céu e a terra.

Não combate de forma convencional: comanda o próprio clima ao redor como extensão da vontade, pode assumir forma humana perfeita sem limitação, e seu sopro de energia imperial pode simultaneamente fortalecer aliados e devastar inimigos. A imortalidade é garantida: não envelhece e retorna de qualquer destruição através do ciclo celestial.',
    ARRAY['dragao'],
    6, 3,
    8, 12,
    190,
    29, 18, 5, 29, 5, 14,
    22, 15,
    '2d10+5',
    '[{"nome":"Mordida Draconiana","descricao":"Mandíbulas enormes trituram com força descomunal.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Escamas Reforçadas","descricao":"O monstro executa escamas reforçadas contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sopro Elemental","descricao":"Um cone devastador de energia elemental pura.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    25000,
    'gargantuesco',
    ARRAY['palácio celestial', 'nuvens imperiais'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vhazrael (Tier 10, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vhazrael',
    'Cinco cabeças, cada uma de um dragão cromático diferente, num corpo descomunal de escamas multicores que brilham com a energia de cada elemento representado. Vhazrael não é apenas um dragão poderoso: é uma divindade aprisionada no primeiro círculo do inferno, raivosa, estratégica e absolutamente implacável em relação a tudo que não seja sua libertação completa.

As cinco cabeças lançam seus sopros simultâneos ou em sequência coordenada: fogo, ácido, veneno, frio e relâmpago cobrindo todas as possíveis resistências de qualquer oponente. Cada cabeça tem personalidade e objetivo próprios, tornando-a impossível de enganar em qualquer dimensão. Apenas aventureiros verdadeiramente lendários podem sobreviver a um confronto direto.',
    ARRAY['besta'],
    6, 3,
    10, 16,
    320,
    33, 6, 5, 33, 5, 4,
    28, 19,
    '3d10+8',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d6+5","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+4"},"cooldown":5,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['fogo', 'gelo', 'eletricidade', 'acido', 'veneno'],
    ARRAY['fantasia', 'medieval', 'epico'],
    155000,
    'gargantuesco',
    ARRAY['avernus (exilada)'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Aurelion (Tier 10, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Aurelion',
    'Em sua forma verdadeira, Aurelion é o dragão mais majestoso que o multiverso conhece: escamas que parecem feitas de céu noturno com estrelas presas dentro, olhos de um azul que transmite bondade perfeita combinada com poder absoluto, e uma presença que faz dragões dourados se curvarem em reverência. Frequentemente caminha entre mortais disfarçado de velhinho humilde com sete pássaros dourados ao redor.

Seus poderes superam qualquer dragão mortal: sopro que desfaz até maldições e ressurecta mortos, imunidade a praticamente qualquer forma de dano, e o julgamento perfeito de quem é digno de sua proteção. Os sete pássaros dourados são de fato dragões dourados de altitude avançada mantidos em forma diminuta por sua magia.',
    ARRAY['besta'],
    6, 3,
    10, 16,
    320,
    33, 6, 5, 33, 5, 4,
    28, 19,
    '3d10+8',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":5,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    155000,
    'gargantuesco',
    ARRAY['monte celestia (covil)'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Constructos e Golems (15 monstros)
-- =============================================================================

-- Golem de Argila (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Golem de Argila',
    'Figura humanoide de argila de dois metros esculpida com traços apenas vagamente humanos, como se o artesão conhecesse a forma mas não o espírito. Se move com a pesadeza de algo sólido, deixando marcas fundas no chão com cada passo, e os olhos não são olhos mas buracos onde luz roja ocasionalmente brilha quando a criatura é ativada.

A imunidade do golem de argila à maioria das magias o torna resistente a estratégias arcanas comuns, e o estado de frenesi que pode entrar ao ser danificado o torna imprevisível e extremamente perigoso em espaços confinados. Maldições lançadas por seu toque impedem cura mágica nas vítimas, tornando cada golpe sofrido mais grave que parece.',
    ARRAY['constructo'],
    4, 4,
    6, 9,
    100,
    22, 5, 8, 22, 8, 1,
    15, 13,
    '2d6+4',
    '[{"nome":"Punho de Ferro","descricao":"Um golpe mecânico preciso com força implacável.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Autocorreção","descricao":"O monstro executa autocorreção contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sobrecarga","descricao":"O monstro executa sobrecarga contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'acido', 'psiquico'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    5000,
    'grande',
    ARRAY['templo', 'oficina de golem'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Golem de Pedra (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Golem de Pedra',
    'Colossus de pedra talhada de dois metros e meio com características humanas apenas sugeridas: ombros quadrados, cabeça arredondada sem rosto definido, mãos do tamanho de rodas de carroça. Se move mais rápido que a aparência sugere e é completamente silencioso para algo de sua massa. Foi esculpido para guardar, e guardará até se desfazer em poeira.

O feitiço de desaceleração pode paralisar grupos inteiros instantâneamente, dando ao golem vantagem absoluta em combate de área fechada. Quase completamente imune à magia comum, apenas feitiços específicos de transmutação de pedra podem afetá-lo diretamente. Um guardião para o qual não existe rendição ou negociação.',
    ARRAY['constructo'],
    4, 4,
    7, 10,
    125,
    24, 5, 8, 24, 8, 1,
    17, 15,
    '2d8+4',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Blindagem Mágica","descricao":"O monstro executa blindagem mágica contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sobrecarga","descricao":"O monstro executa sobrecarga contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    5900,
    'grande',
    ARRAY['dungeon', 'templo', 'câmara de guardia'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Golem de Ferro (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Golem de Ferro',
    'Três metros de aço e ferro fundido com articulações que parecem impossíveis para metal sólido mas funcionam com suavidade perturbadora. O rosto é uma máscara de ferro com aberturas para olhos que emitem vapor quente. Cada passo cria um impacto que ressoa por metros, anunciando a chegada como um tambor de guerra antes da batalha.

Quase completamente imune a qualquer forma de ataque: armas se quebram ao tentar penetrar o aço, a maioria das magias simplesmente falha, e o sopro de gás venenoso pode encher uma sala inteira em instantes. Com mais de duzentos pontos de vida e armadura natural de aço, é talvez o mais difícil dos golems padrão para destruir.',
    ARRAY['constructo'],
    6, 4,
    8, 12,
    165,
    26, 5, 8, 26, 8, 1,
    20, 17,
    '2d10+5',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Autocorreção","descricao":"O monstro executa autocorreção contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Investida Implacável","descricao":"O monstro executa investida implacável contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    15000,
    'grande',
    ARRAY['fortaleza', 'câmara de guarda'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Golem de Carne (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Golem de Carne',
    'Uma abominação de cirurgia necrômantica: pedaços de diferentes corpos costurados juntos em forma humana de dois metros com costuras grossas de linha escura visíveis por toda a pele. Os movimentos são irregulares, como se diferentes partes ainda lembrassem os donos originais. Os olhos são de cores diferentes, um detalhe perturbador que os aventureiros raramente esquecem.

A relação do golem de carne com relâmpago é paradoxal: ser atingido por relâmpago o cura em vez de machucar, enquanto fogo o enfraquece e pode acionar um frenesi perigoso. A imunidade a magia comum combinada com a força colossal torna-o perigoso mesmo sem táticas elaboradas.',
    ARRAY['constructo'],
    3, 4,
    5, 8,
    65,
    16, 4, 10, 16, 10, 1,
    11, 12,
    '2d6+2',
    '[{"nome":"Punho de Ferro","descricao":"Um golpe mecânico preciso com força implacável.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Deflexão","descricao":"O monstro executa deflexão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'eletricidade'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    1800,
    'medio',
    ARRAY['laboratório de necromante'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Animated Armor (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Animated Armor',
    'Uma armadura de placas completa que se move sem ninguém dentro, de forma convincentemente humana até uma distância de alguns metros. De perto, a ausência de qualquer som de respiração ou movimento humano dentro do metal cria um desconforto crescente. Guarda mansões assombradas e armerias mágicas com a mesma dedicação de um soldado há décadas morto.

Mais resistente que parece por sua CA naturalmente alta, e sua imunidade a magia de encantamento e veneno torna inúteis as táticas mais comuns para lidar com guardas humanos. Uma armadura animada encontrada andando num corredor escuro é o tipo de coisa que aventureiros novatos nunca esquecem.',
    ARRAY['constructo'],
    2, 4,
    2, 5,
    30,
    12, 4, 10, 12, 10, 1,
    7, 8,
    '1d6+2',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6"},"cooldown":3,"chance":50},{"nome":"Deflexão","descricao":"O monstro executa deflexão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'radiante', 'psiquico'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    200,
    'medio',
    ARRAY['mansão assombrada', 'armaria mágica'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Flying Sword (Tier 2, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Flying Sword',
    'Uma espada que paira no ar sem mão, flutuando lentamente até detectar um intruso e então acelerando para velocidade de ataque surpreendente. Silenciosa, sem pontos fracos óbvios, sem rosto para intimidar nem corpo para imobilizar. É um objeto com um único propósito e nenhuma distração.

Embora fraca individualmente, uma sala cheia de espadas voadoras é uma armadilha devastadora para grupos despreparados. Imune a veneno e ataques psíquicos por não ter mente, e a ausência de corpo físico completo torna algumas estratégias de grappling completamente inúteis contra ela.',
    ARRAY['constructo'],
    1, 4,
    1, 3,
    17,
    8, 3, 12, 8, 12, 1,
    4, 7,
    '1d6',
    '[{"nome":"Esmagamento","descricao":"O monstro executa esmagamento contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    50,
    'pequeno',
    ARRAY['armaria', 'dungeon'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Shield Guardian (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Shield Guardian',
    'Um constructo humanoide de dois metros criado especificamente para proteger o portador de um amuleto vinculado. A forma é robusta e sem ornamentos, claramente utilitária: ombros largos, mãos grandes, e o amuleto em uma peça de seu peito brilha quando o portador está em perigo. Segue o mestre como uma sombra silenciosa.

A capacidade de absorver até vinte pontos de dano destinados ao mestre por turno torna o shield guardian um salva-vidas literal em combate. A habilidade de armazenar uma magia e lançá-la quando comandado adiciona versatilidade surpreendente a algo que parece apenas um guarda-costas de metal.',
    ARRAY['constructo'],
    3, 4,
    5, 8,
    80,
    20, 4, 8, 20, 8, 1,
    13, 11,
    '2d6+2',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Deflexão","descricao":"O monstro executa deflexão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    2900,
    'grande',
    ARRAY['acompanhando o mestre do amuleto'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Armadura Sentinela (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Armadura Sentinela',
    'Um constructo humanoide com armadura completa e viseira fechada que não revela nenhum interior visível. Se move com precisão mecânica mas velocidade vivamente orgânica, usando a espada de três lâminas com a fluência de um guerreiro veterano. Não respira, não faz barulho ao caminhar no modo de patrulha, e nunca para.

O poder mais frustrante do helmed horror é a imunidade selecionada a magias: quando criado, três feitiços são escolhidos que simplesmente não funcionam contra ele. Grupos que confiam em Magic Missile, Fireball ou outra magia específica descobrirão com amargura que prepararam exatamente a estratégia errada.',
    ARRAY['constructo'],
    3, 4,
    3, 7,
    45,
    14, 4, 10, 14, 10, 1,
    9, 10,
    '1d8+2',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Autocorreção","descricao":"O monstro executa autocorreção contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    1100,
    'medio',
    ARRAY['dungeon', 'mansão', 'guarda de tesouro'],
    '{}',
    '{}',
    '{"terrestre":30,"voo":50}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Homunculus (Tier 1, minusculo, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Homunculus',
    'Uma criatura minúscula do tamanho de uma ratazana grande, criada a partir do próprio sangue do mago criador e imbuída de um fragmento de sua alma. A aparência varia: alguns parecem humanos em miniatura com asas de morcego, outros se assemelham a lagartos alados, outros a aberrações sem categoria. Os olhos sempre têm a mesma cor dos olhos do criador.

Fragílimo em combate com apenas cinco pontos de vida, o homunculus existe para a telepatia bidirecional com seu criador: tudo o que vê e ouve é transmitido ao mago, tornando-o um sensor de espionagem perfeito. Se o criador morrer, o homunculus morre também — e vice-versa.',
    ARRAY['constructo'],
    1, 4,
    1, 2,
    5,
    2, 3, 14, 4, 14, 1,
    2, 6,
    '1d4+1',
    '[{"nome":"Punho de Ferro","descricao":"Um golpe mecânico preciso com força implacável.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    10,
    'minusculo',
    ARRAY['familiar do mago criador'],
    '{}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Clockwork Soldier (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Clockwork Soldier',
    'Autômato mecânico de precisão gnômica: engrenagens visíveis através de painéis de vidro no torso, articulações de bronze que encaixam perfeitamente, e um rosto que é uma máscara de metal com olhos de cristal que emitem luz tênue. Pode ser reparado com ferramentas e peças de reposição, funcionando por décadas sem interrupção.

Imune ao cansaço, ao medo e à maioria das condições que afetam seres vivos, o clockwork soldier é o guarda perfeito para instalações que não precisam de descanso ou moral. A desvantagem é a rigidez: não improvisa, não reconhece ameaças fora do protocolo, e pode ser enganado por quem entende os padrões de resposta programados.',
    ARRAY['constructo'],
    2, 4,
    2, 5,
    30,
    12, 4, 10, 12, 10, 1,
    7, 8,
    '1d6+2',
    '[{"nome":"Punho de Ferro","descricao":"Um golpe mecânico preciso com força implacável.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Autocorreção","descricao":"O monstro executa autocorreção contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    200,
    'medio',
    ARRAY['cidade de gnomos', 'laboratório'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Forjado-Bélico Titan (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Forjado-Bélico Titan',
    'Um golem de guerra de vinte metros criado para batalhas em escala de exércitos inteiros: pernas que criam crateras no chão a cada passo, punhos que derribam muralhas e um rugido mecânico que imita o trovão dos gigantes. Construído para uma guerra antiga que terminou, agora vagueia em busca da missão que nunca foi concluída.

A escala do forjado-bélico titan torna-o uma ameaça ambiental: não apenas ataca aventureiros mas colapsa estruturas ao redor, cria terreno instável com cada movimento, e pode pisotear grupos inteiros como se fossem insetos. Destruí-lo requer estratégia de cerco, não combate convencional.',
    ARRAY['constructo'],
    6, 4,
    8, 12,
    190,
    29, 5, 5, 29, 5, 1,
    22, 15,
    '2d10+5',
    '[{"nome":"Punho de Ferro","descricao":"Um golpe mecânico preciso com força implacável.","tipo":"ofensiva","dano":"9d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Blindagem Mágica","descricao":"O monstro executa blindagem mágica contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão de Energia","descricao":"O monstro executa explosão de energia contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    13000,
    'gargantuesco',
    ARRAY['campo de batalha', 'fortaleza'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Inevitable (Tier 10, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Inevitable',
    'Constructo dourado e negro de quatro metros criado pelo plano de Mechanus para caçar aqueles que usaram o feitiço Wish de forma ilegítima: prolongando a própria vida artificialmente, enganando a morte ou quebrando leis naturais fundamentais. Aparece sem aviso prévio no plano material, implacável, incorruptível e com uma missão singular.

O marut não pode ser negociado, subornado ou intimidado: é a encarnação da lei cósmica em forma física. Seus punhos carregam força suficiente para apagar exércitos, e se for destruído no plano material, retorna de Mechanus em dias para continuar a missão. A única saída é fazer o marut acreditar que a lei cósmica foi satisfeita.',
    ARRAY['constructo'],
    6, 4,
    10, 16,
    295,
    30, 6, 8, 30, 8, 1,
    26, 21,
    '3d10+8',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"6d10","efeito":null,"cooldown":5,"chance":50},{"nome":"Autocorreção","descricao":"O monstro executa autocorreção contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Investida Implacável","descricao":"O monstro executa investida implacável contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    75000,
    'grande',
    ARRAY['plano mechanus', 'caçador de quem usou wish'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Engrenado (Tier 1, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Engrenado',
    'A forma mais básica de engrenado, criatura matemática do plano de Mechanus: um cubo ou esfera perfeita com um único olho, um par de braços e pernas, tudo perfeitamente simétrico e geometricamente correto. Comunica-se apenas com outros modrons diretamente superiores na hierarquia e segue ordens com precisão computacional.

Individualmente inofensivo, o monodrone é perigoso apenas como parte de um exército engrenado perfeitamente coordenado. Se destruído no plano material, teletransporta-se de volta a Mechanus instantâneamente, tornando captura impossível. Representa a antítese perfeita do caos: ordem pura em forma física.',
    ARRAY['constructo'],
    1, 4,
    1, 2,
    10,
    6, 3, 12, 6, 12, 1,
    3, 5,
    '1d4+1',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    25,
    'pequeno',
    ARRAY['mechanus'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Inevitável Juiz Mecânico (Tier 7, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Inevitável Juiz Mecânico',
    'Constructo humanoide de aparência quase humana com pele de metal polido e olhos de rubi que brilham com luz interior. Veste-se com trajes formais antiquados e porta uma espada que drena energia vital. Foi criado especificamente para caçar aqueles que quebraram juramentos, contratos ou promessas solenes.

O kolyarut primeiro tenta interrogar e descobrir se o contrato foi quebrado de boa-fé antes de executar a sentença, refletindo a nuance da lei contratual mesmo entre criaturas de ordem absoluta. A espada enervante drena níveis de energia de vítimas atingidas, e a telepatia de interrogatório é impossível de bloquear sem magia de alto nível.',
    ARRAY['constructo'],
    4, 4,
    7, 10,
    110,
    20, 5, 10, 20, 10, 1,
    15, 16,
    '2d8+4',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Blindagem Mágica","descricao":"O monstro executa blindagem mágica contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Sobrecarga","descricao":"O monstro executa sobrecarga contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    10000,
    'medio',
    ARRAY['plano mechanus', 'caçador de traidores de contrato'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Talos (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Talos',
    'O guardião mítico de bronze de Creta da mitologia grega: um gigante de metal de trinta metros de altura, com um único ponto vulnerável, o tornozelo por onde flui o ichor que o mantém vivo. Move-se com a implacabilidade de uma tempestade de metal, e o impacto de seus pés no solo cria ondas de choque que derrubam estruturas próximas.

Imune a praticamente qualquer arma convencional por toda a extensão do corpo exceto o tornozelo amaldiçoado, Talos é uma missão de encontrar a vulnerabilidade em vez de combate direto. Arremessa pedregulhos de toneladas, pode esmagar navios com as mãos e aquece o próprio corpo a temperaturas que derretem metal próximo.',
    ARRAY['constructo'],
    6, 4,
    8, 12,
    190,
    29, 5, 5, 29, 5, 1,
    22, 15,
    '2d10+5',
    '[{"nome":"Golpe Mecânico","descricao":"O monstro executa golpe mecânico contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Autocorreção","descricao":"O monstro executa autocorreção contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Investida Implacável","descricao":"O monstro executa investida implacável contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'steampunk', 'medieval'],
    20000,
    'gargantuesco',
    ARRAY['ilha de creta (mitologia)'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Gigantes e Titas (13 monstros)
-- =============================================================================

-- Giant Hill (Tier 5, enorme, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Giant Hill',
    'O menor e mais estúpido dos gigantes verdadeiros: oito metros de músculo coberto de gordura com uma cara de porco semi-inteligente, cabelos sujos e roupas que são pedaços de animais grandes costurados sem habilidade. A clava é um tronco de árvore escolhido pela pesadeza, não pela qualidade, e usa tudo que encontra como projétil.

Seu perigo é puramente físico: clava que pode esmagar cavalos, pedras arremessadas que atingem cidades inteiras, e uma tendência de simplesmente comer qualquer coisa que não fuja rápido o suficiente. Grupos que não coordenarem ataques para derrubar o gigante rapidamente descobrirão que a força bruta pode ser suficiente mesmo sem inteligência.',
    ARRAY['gigante'],
    3, 5,
    5, 8,
    95,
    22, 9, 6, 22, 6, 8,
    14, 10,
    '2d6+2',
    '[{"nome":"Arremesso de Rocha","descricao":"Uma rocha enorme é arremessada com precisão devastadora.","tipo":"ofensiva","dano":"3d8+8","efeito":null,"cooldown":3,"chance":50},{"nome":"Grito de Guerra","descricao":"O monstro executa grito de guerra contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    1800,
    'enorme',
    ARRAY['colinas', 'pastagem'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Giant Stone (Tier 5, enorme, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Giant Stone',
    'Oito metros de musculatura coberta de pele que tem a textura e coloração de granito polido, adaptada por gerações de vida nas profundezas das cavernas. Os olhos são pequenos e adaptados à escuridão. Usa uma clava de pedra esculpida com mais cuidado que a maioria dos gigantes dedicaria a qualquer artefato, revelando a sensibilidade artística incomum da espécie.

Os gigantes de pedra são os mais artisticamente talentosos dos gigantes: esculpem murais nas paredes das cavernas, compõem música percussiva com pedras afinadas, e sonham com mundos subterrâneos que nunca viram a luz. Isso não os torna menos perigosos: a reflexão de pedra que usam como reação pode desviar projéteis de volta aos atacantes.',
    ARRAY['gigante'],
    3, 5,
    5, 8,
    95,
    22, 9, 6, 22, 6, 8,
    14, 10,
    '2d6+2',
    '[{"nome":"Pancada Brutal","descricao":"Um golpe com força descomunal que estremece o chão.","tipo":"ofensiva","dano":"3d8+6","efeito":null,"cooldown":3,"chance":50},{"nome":"Postura Defensiva","descricao":"O monstro executa postura defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    2900,
    'enorme',
    ARRAY['caverna', 'montanha'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Giant Frost (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Giant Frost',
    'Três metros mais alto que um gigante de colina, com pele azul-acinzentada coberta de uma camada de gelo que forma padrões de escarchas no rosto e ombros. O cabelo e barba são brancos como neve antiga, e os olhos são azuis como gelo profundo. Veste peles de animais árticos costuradas com tendões de baleia, e o frio que emana do corpo é palpável a metros de distância.

Os gigantes do gelo organizam seus clãs com estrutura social de guerreiros Vikings: os mais fortes lideram, os fracos servem ou são abandonados. Em batalha, combinam o arremesso preciso de pedras enormes com combate corpo-a-corpo de machado que pode derrubar cavalaria pesada em formação.',
    ARRAY['gigante'],
    4, 5,
    6, 9,
    115,
    24, 10, 6, 24, 6, 8,
    16, 12,
    '2d6+4',
    '[{"nome":"Pisoteamento","descricao":"O monstro executa pisoteamento contra seu alvo.","tipo":"ofensiva","dano":"3d12+9","efeito":null,"cooldown":4,"chance":50},{"nome":"Grito de Guerra","descricao":"O monstro executa grito de guerra contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Terremoto","descricao":"O monstro executa terremoto contra seu alvo.","tipo":"ofensiva","dano":"4d10","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    3900,
    'enorme',
    ARRAY['ártico', 'montanhas geladas'],
    '{}',
    ARRAY['frio'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Giant Fire (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Giant Fire',
    'O mais disciplinado militarmente de todos os gigantes: dez metros de músculo coberto de pele que tem a tonalidade de obsidiana polida, com cabelo e barba de cor de chama que literalmente arde suavemente. Usa armadura forjada em seu próprio calor corporal e uma espada larga que pode ser aquecida até o rubro com apenas um pensamento.

Os gigantes do fogo são ferreiros e militaristas que constroem fortalezas vulcânicas e exércitos disciplinados. A hierarquia é estritamente meritocrática: o mais habilidoso em combate e metalurgia lidera. Uma fortaleza de gigantes do fogo é uma operação militar sofisticada, não uma caverna de brutos.',
    ARRAY['gigante'],
    4, 5,
    6, 9,
    115,
    24, 10, 6, 24, 6, 8,
    16, 12,
    '2d6+4',
    '[{"nome":"Pisoteamento","descricao":"O monstro executa pisoteamento contra seu alvo.","tipo":"ofensiva","dano":"6d6+10","efeito":null,"cooldown":4,"chance":50},{"nome":"Postura Defensiva","descricao":"O monstro executa postura defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Terremoto","descricao":"O monstro executa terremoto contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'epico'],
    5000,
    'enorme',
    ARRAY['vulcão', 'fortaleza de magma'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Giant Cloud (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Giant Cloud',
    'Os mais misteriosos dos gigantes: dez metros de altura mas com proporções elegantes incomuns para a espécie, pele que tem a qualidade suave e branca das nuvens, e um olhar distante que sugere contemplação de horizontes que os outros não enxergam. Vivem em castelos flutuantes construídos nas nuvens mais altas e raramente descem ao mundo mortal.

Possuem o faro mais desenvolvido de todos os gigantes, capaz de detectar sangue e outros odores a quilômetros de distância. Alguns são bons, outros malignos, mas todos compartilham uma fascinação por artefatos mágicos e uma tendência a colecioná-los obsessivamente. A magia que possuem é real e variada.',
    ARRAY['gigante'],
    4, 5,
    6, 9,
    115,
    24, 10, 6, 24, 6, 8,
    16, 12,
    '2d6+4',
    '[{"nome":"Arremesso de Rocha","descricao":"Uma rocha enorme é arremessada com precisão devastadora.","tipo":"ofensiva","dano":"3d8+12","efeito":null,"cooldown":4,"chance":50},{"nome":"Grito de Guerra","descricao":"O monstro executa grito de guerra contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Colossal","descricao":"O monstro executa fúria colossal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    5000,
    'enorme',
    ARRAY['nuvem', 'castelo flutuante', 'montanha alta'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Giant Storm (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Giant Storm',
    'Os maiores e mais poderosos dos gigantes mortais: oito metros de pura grandeza com pele azul-prateada que crackla com eletricidade estática, cabelo branco que flutua levemente como em câmara lenta, e olhos que parecem conter tempestades em miniatura girando dentro das íris. Vivem nos picos mais altos e nas costas mais expostas às tempestades oceânicas.

Comanda relâmpagos e tempestades como extensões naturais da própria vontade, não como magia aprendida mas como instinto. Em batalha, invoca trovões que ensurdecem, chuvas que alagam o campo e raios que perseguem metais. A hierarquia dos gigantes coloca-os no topo: mesmo os outros gigantes os respeitam com reverência.',
    ARRAY['gigante'],
    4, 5,
    7, 10,
    140,
    26, 10, 6, 26, 6, 8,
    18, 14,
    '2d8+4',
    '[{"nome":"Arremesso de Rocha","descricao":"Uma rocha enorme é arremessada com precisão devastadora.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Pele Rochosa","descricao":"O monstro executa pele rochosa contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Terremoto","descricao":"O monstro executa terremoto contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['eletricidade', 'radiante', 'trovao'],
    ARRAY['fantasia', 'medieval', 'epico'],
    10000,
    'enorme',
    ARRAY['pico de montanha', 'topo de tempestade'],
    '{}',
    ARRAY['eletricidade'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Titan (Tier 9, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Titan',
    'Os ancestrais míticos dos gigantes: enormes além de qualquer gigante mortal, com pele que parece pedra viva e uma presença que faz o ar ao redor vibrar com poder primordial. Os titãs são o que os gigantes foram antes de serem domesticados pela civilização: selvagens, poderosos e completamente além de qualquer estrutura social mortal.

A magia que um titã possui rivaliza com a de sacerdotes de nível máximo: pode conjurar tempestades, mover montanhas, criar ou destruir florestas inteiras com a concentração adequada. Encontrar um titã acordado é um evento que muda o mundo ao redor dele, não apenas o dia de quem o encontrou.',
    ARRAY['gigante'],
    6, 5,
    9, 14,
    230,
    30, 11, 6, 30, 6, 8,
    23, 18,
    '3d8+6',
    '[{"nome":"Arremesso de Rocha","descricao":"Uma rocha enorme é arremessada com precisão devastadora.","tipo":"ofensiva","dano":"14d6+9","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+3"},"cooldown":5,"chance":50},{"nome":"Pele Rochosa","descricao":"O monstro executa pele rochosa contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Avalanche","descricao":"O monstro executa avalanche contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno', 'trovao'],
    ARRAY['fantasia', 'medieval', 'epico'],
    50000,
    'enorme',
    ARRAY['plano astral', 'montanha primordial'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ogro (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ogro',
    'Seis metros de músculo e gordura numa postura de primata ampliado, com uma cara que combina traços humanos e bestiais de forma que parece errada em qualquer ângulo. Inteligência suficiente para usar armas e construir abrigos simples, mas insuficiente para qualquer estratégia além de bater mais forte. O bafo é perceptível de uma distância que o alcance da clava não justificaria.

Os ogros são frequentemente domesticados por humanoides mais inteligentes como arma de cerco ou muscle para trabalho sujo: são fortes o suficiente para seguir ordens simples mas não suficientemente inteligentes para questionar. Sozinhos, são uma ameaça direta mas previsível; em grupos com liderança, são ferramentas de destruição em escala.',
    ARRAY['gigante'],
    2, 5,
    2, 5,
    45,
    16, 9, 8, 16, 8, 8,
    9, 7,
    '1d6+2',
    '[{"nome":"Pancada Brutal","descricao":"Um golpe com força descomunal que estremece o chão.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Pele Rochosa","descricao":"O monstro executa pele rochosa contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    450,
    'grande',
    ARRAY['caverna', 'montanha', 'pântano'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ettin (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ettin',
    'Um gigante de dois metros e meio com duas cabeças completamente independentes em cima de um único corpo musculoso. As duas cabeças discordam sobre praticamente tudo e frequentemente brigam verbalmente no meio do combate, o que não os torna menos perigosos mas certamente os torna mais barulhentos e difíceis de prever. Cada cabeça controla um braço diferente.

A vantagem prática das duas cabeças é impossível de negar em combate: enquanto uma está engajada com um inimigo, a outra observa diferentes direções simultaneamente, tornando impossível surpreender um ettin que não esteja dormindo. Quando finalmente concordam sobre um alvo, a força combinada dos dois braços coordenados é devastadora.',
    ARRAY['gigante'],
    3, 5,
    3, 7,
    60,
    18, 9, 8, 18, 8, 8,
    11, 9,
    '1d8+2',
    '[{"nome":"Pancada Brutal","descricao":"Um golpe com força descomunal que estremece o chão.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Pele Rochosa","descricao":"O monstro executa pele rochosa contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval', 'epico'],
    1100,
    'grande',
    ARRAY['colina', 'caverna'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Fomorian (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Fomorian',
    'Gigantes corrompidos pelo Sylvaris e banidos de lá por sua malícia e deformidade: corpos de gigante com proporções impossíveis, membros de tamanhos diferentes, espinhas curvas, rostos assimétricos com características espalhadas de forma perturbadora. Carregam o ressentimento de quem foi expulso do paraíso e passaram eternidades em prisão subterrânea.

O Olho Maligno do fomorian pode transformar qualquer criatura em forma bestial com uma única mirada. A crueldade dos fomorians não é bruta e simples como a dos ogros: é pessoal, inventiva e com uma memória de elefante para ofensas que podem ter ocorrido séculos atrás.',
    ARRAY['gigante'],
    4, 5,
    6, 9,
    115,
    24, 10, 6, 24, 6, 8,
    16, 12,
    '2d6+4',
    '[{"nome":"Arremesso de Rocha","descricao":"Uma rocha enorme é arremessada com precisão devastadora.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Postura Defensiva","descricao":"O monstro executa postura defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Colossal","descricao":"O monstro executa fúria colossal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    3900,
    'enorme',
    ARRAY['underdark', 'feydark'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gigante Tosco (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gigante Tosco',
    'Gigante relativamente pequeno, apenas três metros de altura, com proporções mais próximas de humanos ampliados que das aberrações físicas de outros gigantes. Habitam as regiões frias do norte, constroem cabanas de madeira grosseira, caçam com arcos longos e preferem estratégia a força bruta. São inteligentes o suficiente para negociar antes de atacar.

O verbeeg é o gigante que mais frequentemente interage com comunidades humanas, seja como ameaça que negocia tributo, seja como aliado improvávelmente útil para alguém que pague bem ou trate-o com respeito. O arco que usam pode atravessar armaduras de placas e atingir alvos a distâncias que a maioria dos humanos considera impossíveis para um arqueiro.',
    ARRAY['gigante'],
    3, 5,
    3, 7,
    60,
    18, 9, 8, 18, 8, 8,
    11, 9,
    '1d8+2',
    '[{"nome":"Pancada Brutal","descricao":"Um golpe com força descomunal que estremece o chão.","tipo":"ofensiva","dano":"2d6+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Pele Rochosa","descricao":"O monstro executa pele rochosa contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval', 'epico'],
    1100,
    'grande',
    ARRAY['frio', 'montanhas do norte'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cyclops (Tier 5, enorme, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cyclops',
    'Gigante de quatro metros com um único olho enorme no centro da testa que domina completamente o rosto de proporções exageradas. O corpo é musculoso e funcional mas os movimentos têm uma qualidade estranha causada pela perspectiva monocular: o ciclope frequentemente subestima distâncias e profundidades, o que torna seus ataques previsíveis para inimigos ágeis.

Apesar da desvantagem visual, os ciclopes são guerreiros formidáveis por força bruta pura, e alguns possuem visão profética intermitente que compensa parcialmente a limitação monocular. Nas ilhas mediterrâneas da mitologia, constroem cabanas de pastores e guardam rebanhos de ovelhas enormes, mostrando inteligência suficiente para civilização rudimentar.',
    ARRAY['gigante'],
    3, 5,
    5, 8,
    95,
    22, 9, 6, 22, 6, 8,
    14, 10,
    '2d6+2',
    '[{"nome":"Pisoteamento","descricao":"O monstro executa pisoteamento contra seu alvo.","tipo":"ofensiva","dano":"3d8+7","efeito":null,"cooldown":3,"chance":50},{"nome":"Postura Defensiva","descricao":"O monstro executa postura defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'epico'],
    2300,
    'enorme',
    ARRAY['ilha', 'caverna costeira'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Death Giant (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Death Giant',
    'Gigante de dez metros coberto de armadura de ossos de criaturas imensas costurados com tendões necróticos, olhos que brilham com a mesma luz de morto-vivo dos wraiths, e uma corrente que usa como arma que aprisionando as almas dos mortos recentes na área. Habita o Umbrália e ocasionalmente invade o plano material em busca de almas para sua corrente.

A habilidade de ceifar e aprisionar almas é sua característica mais aterrorizante: personagens mortos na presença de um death giant não podem ser ressuscitados diretamente enquanto a alma estiver aprisionada. Libertar a alma requer destruir o death giant ou encontrar e quebrar o receptor específico onde ela está guardada.',
    ARRAY['morto-vivo'],
    4, 5,
    7, 10,
    140,
    26, 6, 6, 26, 6, 3,
    18, 14,
    '2d8+4',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Drenar Vida","descricao":"O monstro executa drenar vida contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['radiante'],
    ARRAY['fantasia', 'medieval', 'epico'],
    8400,
    'enorme',
    ARRAY['shadowfell', 'cemitério gigante'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Aberracoes (19 monstros)
-- =============================================================================

-- Sorvedor de Mentes (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sorvedor de Mentes',
    'Humanóide de pele lilás com quatro tentáculos onde deveria haver boca, todos em constante movimento lento como algas numa corrente. A cabeça é grande demais para o corpo, os olhos são dois pontos brancos sem pupila, e a postura ereta carrega a arrogância de um ser que genuinamente acredita ser a espécie superior do multiverso. O cheiro é de maresia e algo mais profundo, mais antigo.

A explosão mental do sorvedor de mentes atinge todos à frente em cone, podendo atordoar grupos inteiros em instantes. Mas a ameaça real é a extração cerebral: um humanóide derrubado fica vulnerável ao ritual de devorar o cérebro vivo, processo que mata a vítima e alimenta o sorvedor. A telepatia torna qualquer estratégia sussurrada inútil se estiver no alcance.',
    ARRAY['besta'],
    3, 6,
    5, 8,
    65,
    16, 4, 10, 16, 10, 4,
    11, 12,
    '2d6+2',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    2900,
    'medio',
    ARRAY['underdark', 'nave-cogumelo'],
    '{}',
    '{}',
    '{"terrestre":30,"voo":50}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sorvedor de Mentes Arcanista (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sorvedor de Mentes Arcanista',
    'Um sorvedor de mentes que além dos poderes psiônicos naturais da espécie desenvolveu magia arcana ao longo de séculos de estudo, combinando as duas formas de poder num ser de capacidade destrutiva aterrorizante. O corpo é ligeiramente mais frágil que o guerreiro common sorvedor por causa de décadas de estudo em vez de combate, mas o alcance da destruição que pode causar é proporcionalmente maior.

Domina Person e Dominate Monster permitem assumir o controle de aliados do grupo em batalha, transformando cada membro em potencial ameaça para os outros. A explosão mental combinada com Plane Shift para escapada torna-o um adversário que pode destruir um grupo e desaparecer antes que a retaliação seja possível.',
    ARRAY['besta'],
    4, 6,
    6, 9,
    85,
    18, 5, 10, 18, 10, 4,
    13, 14,
    '2d6+4',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque em Salto","descricao":"O monstro executa ataque em salto contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    3900,
    'medio',
    ARRAY['underdark'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vigia Abissal (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vigia Abissal',
    'Uma grande esfera de carne com um único olho gigantesco no centro e uma boca de dentes irregulares na parte inferior. Dez pedículos menores se estendem do corpo com olhos adicionais na ponta de cada um, e a expressão permanente é de superioridade absoluta combinada com paranoia igualmente absoluta — o vigia abissal desconfia de tudo, inclusive de outros vigias abissais.

O olho central projeta um cone antimagico que suprime qualquer magia dentro de sua visão. Os dez olhos menores lançam raios de charme, paralisia, petrifação, desintegração e sete outras formas de destruição, três por turno em direções independentes. Combater um vigia abissal é resolver um quebra-cabeça letal de múltiplas ameaças simultâneas enquanto se evita o olho central.',
    ARRAY['besta'],
    4, 6,
    7, 10,
    125,
    24, 5, 8, 24, 8, 4,
    17, 15,
    '2d8+4',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['eletricidade', 'sombrio', 'psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    10000,
    'grande',
    ARRAY['dungeon profunda', 'covil escavado'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vigia Cadavérico (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vigia Cadavérico',
    'A versão não-morta do vigia abissal: a mesma esfera de carne mas com pele enrugada de cadáver de cor cinza-esverdeada, olhos que não pisam nunca e brilham com a mesma luz fria de qualquer morto-vivo de poder. Menos paranóico que o vigia abissal vivo porque a morte eliminou a ansiedade, mas mais metódico e absolutamente implacável em sua malícia.

O olho central de um death tyrant não cria antimagia mas ressuscita mortos nas proximidades como servos instantâneos, criando um exército crescente a cada baixa do lado oposto. Os raios dos tentáculos incluem opções de morte direta e paralisação permanente que o vigia abissal vivo não possui.',
    ARRAY['morto-vivo', 'besta'],
    6, 6,
    8, 12,
    165,
    26, 6, 8, 26, 8, 3,
    20, 17,
    '2d10+5',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Grito dos Mortos","descricao":"O monstro executa grito dos mortos contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    11500,
    'grande',
    ARRAY['dungeon profunda'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vigia Abissal Zumbi (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vigia Abissal Zumbi',
    'Um vigia abissal que foi reanimado após a morte, seja por um lich, seja pelo próprio death tyrant que o controlava. A carne começou a decompor mas a massa muscular que move os tentáculos e o corpo principal ainda funciona, impulsionada por energia necrômantica em vez de vida. Apenas um raio ainda funciona dos dez originais, mas o corpo principal é surpreendentemente resistente.

Mais lento e menos versátil que um vigia abissal vivo, o zombie ainda é ameaça considerável pelo tamanho, a mordida potente e o único raio funcional que mantém. Frequentemente encontrado como guarda no covil de um lich que o controlava, cumprindo em morte a função que cumpria em vida.',
    ARRAY['morto-vivo', 'besta'],
    3, 6,
    5, 8,
    80,
    20, 5, 8, 20, 8, 3,
    13, 11,
    '2d6+2',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['eletricidade'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    1800,
    'grande',
    ARRAY['dungeon'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Aboleth (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Aboleth',
    'Uma das criaturas mais antigas do multiverso: um peixe de dez metros com quatro tentáculos, três olhos vermelhos dispostos verticalmente e muco transparente que escorre de toda a pele criando rastros nos corpos d''água. Existia antes dos deuses e lembra disso com rancor ativo. A memória do aboleth é literalmente ancestral: lembra tudo que qualquer aboleth anterior viu, criando uma biblioteca viva de bilhões de anos de observação.

O muco que exsuda transforma vítimas tocadas em dependentes da água: precisam permanecer molhadas ou sofrem dano. A telepatia submarina alcança quilômetros e reescreve memórias com toque. O aboleth não precisa matar aventureiros, só precisa capturá-los e reformatá-los em servos devotos que não lembram de ter sido outra coisa.',
    ARRAY['besta'],
    4, 6,
    7, 10,
    125,
    24, 5, 8, 24, 8, 4,
    17, 15,
    '2d8+4',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    5900,
    'grande',
    ARRAY['lago subterrâneo', 'oceano profundo'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Chuul (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Chuul',
    'Crustáceo humanóide de dois metros e meio, combinando o corpo de uma lagosta gigante com pernas traseiras que permitem postura bípede. As pinças dianteiras são do tamanho de um adulto humano e a boca é cercada de tentáculos tentaculares que se movem independentemente. A pele é de um verde-escuro que se mistura com a vegetação aquática de pântanos profundos.

As pinças agarram e mantêm vítimas presas enquanto os tentáculos da boca injetam um paralisante poderoso. Uma vítima paralisada presa nas pinças é uma vítima morta com mais passos intermediários. A detecção de magia que possuem naturalmente os torna atraídos por usuários de magia como alvos prioritários.',
    ARRAY['besta'],
    3, 6,
    3, 7,
    60,
    18, 4, 8, 18, 8, 4,
    11, 9,
    '1d8+2',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":3,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    1100,
    'grande',
    ARRAY['pântano', 'lago', 'rio'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Parasita Cerebral (Tier 3, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Parasita Cerebral',
    'Uma massa de cérebro do tamanho de um gato caminhando sobre quatro pernas que são mais espinhos que membros, com uma superfície pulsante de veias e uma textura que parece simultaneamente orgânica e errada de formas que o olhar humano resiste a processar completamente. Não tem olhos visíveis mas enxerga tudo através de sentidos psiônicos.

A criatura devora literalmente a inteligência da vítima, reduzindo a Inteligência progressivamente até zero, ponto em que a vítima morre e o intellect devourer pode habitar o corpo morto como fantoche, caminhando entre os vivos sem ser detectado. Irmão de armas do sorvedor de mentes: frequentemente implantado em alvos-alvo para facilitar captura posterior.',
    ARRAY['besta'],
    2, 6,
    2, 5,
    20,
    6, 4, 14, 8, 14, 4,
    5, 10,
    '1d6+2',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    450,
    'minusculo',
    ARRAY['underdark — larva do sorvedor de mentes'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Tentaculador Aéreo (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Tentaculador Aéreo',
    'Uma medusa sem pernas nem corpo inferior: uma esfera grande de carne com um bico de papagaio enorme no centro inferior, dez tentáculos paralisantes se estendendo de todo o perímetro, e nenhum olho visível. Flutua silenciosamente, os tentáculos rastejando pelo teto de túneis escuros onde caça. O bico tritura qualquer coisa que os tentáculos capturem.

O grell é um predador de emboscada perfeito: invisível no teto de cavernas escuras até o momento em que os tentáculos envolvem a vítima. A paralisia é quase instantânea e o bico começa a triturar antes que a vítima possa gritar. A imunidade a relâmpago é uma adaptação ao ambiente subterrâneo onde raios ocasionalmente atravessam fissuras.',
    ARRAY['besta'],
    3, 6,
    3, 7,
    45,
    14, 4, 10, 14, 10, 4,
    9, 10,
    '1d8+2',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['eletricidade', 'acido'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    700,
    'medio',
    ARRAY['underdark', 'cave network'],
    '{}',
    ARRAY['eletricidade'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Olho-Caído (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Olho-Caído',
    'Um humanóide de um único olho enorme que domina o rosto distorcido, membros dianteiros longos que arrastam no chão, postura encurvada de algo que passou décadas se escondendo em espaços estreitos. Foi uma vez um mago buscando conhecimento proibido; agora é o resultado de ter encontrado esse conhecimento. O único olho pulsa com energia necrótica verde.

O olhar putrefante do nothic pode apodrecer carne diretamente através de contato visual. A percepção sobrenatural permite que leia os segredos superficiais da mente de quem observa, o que torna o nothic paradoxalmente valioso como fonte de informação para quem consegue lidar com o fato de que ele sabe coisas que você preferia que não soubesse.',
    ARRAY['besta'],
    2, 6,
    2, 5,
    30,
    12, 4, 10, 12, 10, 4,
    7, 8,
    '1d6+2',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"2d6","efeito":null,"cooldown":3,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio', 'psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    450,
    'medio',
    ARRAY['dungeon', 'torre de mago'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Otyugh (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Otyugh',
    'Uma massa de carne imóvel com três pernas para locomoção lenta, dois tentáculos longos cobertos de espinhos, e uma mandíbula enorme no topo do corpo. Habita exclusivamente esgotos, depósitos de lixo e masmorras alagadas, alimentando-se de qualquer detritos orgânicos que encontrar. Curiosamente, pode se comunicar telepaticamente a nível básico, o que frequentemente surpreende aventureiros.

A mordida do otyugh causa uma infecção bacteriana potente — não magia, apenas biologia de uma criatura que passou gerações comendo dejetos de todo tipo. A infecção pode matar dias depois do combate se não tratada com cuidados médicos ou magia de cura. Em esgotos de cidades grandes, pode atingir tamanhos verdadeiramente colosseais.',
    ARRAY['besta'],
    3, 6,
    5, 8,
    80,
    20, 4, 8, 20, 8, 4,
    13, 11,
    '2d6+2',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d6+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    1800,
    'grande',
    ARRAY['esgotos', 'lixão', 'dungeon alagada'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Roper (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Roper',
    'Uma estalactite de pedra cinza de dois metros que na verdade é uma criatura viva esperando: quando presas se aproximam, seis filamentos finos e quase invisíveis se estendem até cinquenta metros, agarrando e puxando alvos para a boca aberta na base da pseudoestalactite. A camuflagem é tão perfeita que aventureiros experientes ainda são capturados regularmente.

Cada filamento tem força suficiente para puxar um adulto com força, e vítimas puxadas para a boca descobrem dentes que apontam para dentro impossibilitando a saída. A imobilidade do roper é sua maior fraqueza e maior força ao mesmo tempo: ele não persegue, mas sua paciência é infinita.',
    ARRAY['besta'],
    3, 6,
    5, 8,
    80,
    20, 4, 8, 20, 8, 4,
    13, 11,
    '2d6+2',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"7d8+6","efeito":null,"cooldown":3,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    1800,
    'grande',
    ARRAY['dungeon de pedra', 'caverna'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gibbering Mouther (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gibbering Mouther',
    'Uma bolha de carne cor de carne com dezenas de olhos e bocas de tamanhos diferentes distribuídos aleatoriamente pela superfície, todos se movendo e falando independentemente. O balbucio constante das bocas cria um som que não é linguagem mas que o cérebro humano tenta interpretar como linguagem, criando desorientação crescente em quem o ouve.

O chão ao redor do gibbering mouther torna-se lama instável que dificulta o movimento. O balbucio psíquico força criaturas afetadas a mover-se em direções aleatórias, e as múltiplas bocas mordem alvos que ficam próximos. Uma das criaturas mais desorientadoras de combater por tornar impossível manter qualquer formação tática.',
    ARRAY['besta'],
    2, 6,
    2, 5,
    30,
    12, 4, 10, 12, 10, 4,
    7, 8,
    '1d6+2',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['radiante'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    450,
    'medio',
    ARRAY['dungeon caótica', 'pântano aberrante'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Batráquio do Caos (Tier 2, grande, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Batráquio do Caos',
    'Sapos humanóides do plano Limbo, cada coloração representando uma forma de maturidade diferente em um ciclo de vida horror cósmico: girinos se tornam vermelhos, vermelhos implantam ovos em vítimas que eclodem como azuis, azuis geram vermelhos ao comer. Os verdes são conjuradores, os cinzas podem assumir forma humana convincente, os da morte são a forma suprema.

O ciclo de vida parasítico é o terror central dos batráquio do caos: ser arranhado por um vermelho ou por um azul pode implantar um girino que crescerá dentro da vítima por dias, matando-a ao eclodir. Remove Curse pode eliminar a infecção, mas aventureiros que não sabem que foram infectados raramente procuram tratamento a tempo.',
    ARRAY['besta'],
    1, 6,
    1, 3,
    37,
    14, 3, 8, 14, 8, 4,
    7, 5,
    '1d6',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    50,
    'grande',
    ARRAY['limbo (plano do caos)'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Retalhador do Vazio (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Retalhador do Vazio',
    'Uma aberração em forma de humanoide de braços demasiadamente longos e joelhos dobrados para trás, pele que tem a textura de céu noturno visto através de névoa, e movimentos que parecem acontecer em múltiplos momentos simultâneos como se o tempo ao redor dela fosse ligeiramente inconsistente. Serve a divindades do Vazio Exterior como mensageiro e assassino.

Os seis braços podem se mover de forma totalmente independente, atacando três ou quatro alvos diferentes por turno com velocidade que parece impossível para a massa do corpo. A resistência a dano não mágico torna-o frustrante para grupos sem armas mágicas, e o caos de movimento torna difícil determinar de onde virá o próximo ataque.',
    ARRAY['besta'],
    3, 6,
    5, 8,
    65,
    16, 4, 10, 16, 10, 4,
    11, 12,
    '2d6+2',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    1800,
    'medio',
    ARRAY['qualquer local de culto ao grande antigo'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Nekrai (Tier 4, pequeno, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Nekrai',
    'Uma aranha do tamanho de um cachorro médio com o pescoço de uma serpente e a cabeça de uma enguia, com olhos múltiplos vermelhos e dentes em espiral na boca alongada. A aparência já é perturbadora; o fato de que são escravistas espaciais que viajam entre planos em naves spelljammer escravizando toda espécie que encontram torna o encontro com eles categoricamente pior.

A mordida venenosa do neogi escraviza mentalmente humanóides que não resistirem, criando servos completamente devotos que lutam e morrem para proteger o mestre pequeno e estranho. Frequentemente acompanhados por um ou mais servos escravizados, que são as verdadeiras ameaças de combate enquanto o neogi dirige do fundo.',
    ARRAY['besta'],
    3, 6,
    3, 7,
    40,
    12, 4, 12, 12, 12, 4,
    8, 11,
    '1d8+2',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6+1"},"cooldown":3,"chance":50},{"nome":"Camuflagem Natural","descricao":"O monstro executa camuflagem natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    700,
    'pequeno',
    ARRAY['espaço', 'nave spelljammer'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Glupo (Tier 1, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Glupo',
    'A única aberração de alinhamento bom do multiverso: uma medusa invertida do tamanho de um chapéu de mago, com tentáculos na borda inferior e um par de olhos gentis na parte superior. Flutua suavemente, emite luz bioluminescente em cores que mudam com o humor, e genuinamente tenta ajudar aventureiros que encontra nas profundezas do Umbraterra.

Se detecta mentes malignas nas proximidades, tentará avisar os aventureiros através de comunicação telepática limitada. Se atacado por engano, expele um fluido de cheiro terrivelmente fétido que causa desvantagem social por horas — o equivalente de uma criatura gentil de dizer ''isso não foi necessário''. Um encontro com flumph é uma das poucas coisas genuinamente positivas que podem acontecer no Umbraterra.',
    ARRAY['besta'],
    1, 6,
    1, 2,
    10,
    6, 3, 12, 6, 12, 4,
    3, 5,
    '1d4+1',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    25,
    'pequeno',
    ARRAY['underdark'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vigia Menor (Tier 2, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vigia Menor',
    'Uma versão em miniatura do vigia abissal: esfera de carne de aproximadamente trinta centímetros com um olho grande central e quatro tentáculos oculares menores. A expressão é de vigia abissal em tudo: a arrogância, a paranoia, a tendência a atacar qualquer coisa que interprete como potencial ameaça, que no caso do gazer é praticamente tudo.

Os quatro tentáculos oculares lançam versões menores dos raios do vigia abissal: charme, paralisia, sono e escuridão. Pode ser adotado como familiar por magos com gostos peculiares e tendência a dificuldades sociais. Individualmente é uma ameaça gerenciável; em grupos de dezenas criados por um vigia abissal, é uma onda de paralisia e escuridão.',
    ARRAY['besta'],
    2, 6,
    1, 3,
    12,
    4, 3, 14, 6, 14, 4,
    3, 8,
    '1d6',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":2,"chance":50}]',
    ARRAY['eletricidade'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    100,
    'minusculo',
    ARRAY['dungeon', 'familiar de mago'],
    '{}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mente-Colmeia Ancestral (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mente-Colmeia Ancestral',
    'Uma massa de tecido cerebral do tamanho de um boi flutuando num tanque de fluido nutritivo, com centenas de tentáculos finos se estendendo por todo o sistema de túneis da colônia sorvedor que comanda. Cada sorvedor de mentes da colônia está conectado telepáticamente ao elder brain continuamente, tornando-o literalmente o cérebro coletivo de uma civilização inteira.

A explosão mental do elder brain afeta um raio de sessenta metros com poder suficiente para atordoar exércitos. Os tentáculos físicos podem aprisionar e drenar vitalidade de múltiplos alvos simultâneos. Destruir o elder brain destrói a coesão da colônia inteira: os sorvedores de mentes sem o guia coletivo se tornam progressivamente irracionais e perigosos de formas imprevisíveis.',
    ARRAY['besta'],
    6, 6,
    8, 12,
    165,
    26, 5, 8, 26, 8, 4,
    20, 17,
    '2d10+5',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"6d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque em Salto","descricao":"O monstro executa ataque em salto contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'terror', 'sombrio'],
    11500,
    'grande',
    ARRAY['underdark — colônia sorvedor'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Fadas e Criaturas do Sylvaris (17 monstros)
-- =============================================================================

-- Pixie (Tier 2, minusculo, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Pixie',
    'Criatura humanoide minúscula de quinze centímetros com asas de libélula iridescentes que batem rápido o suficiente para criar um zumbido musical. O rosto é de proporções exageradas de criança — olhos grandes, nariz pequeno, sorriso permanente — e a expressão transmite curiosidade genuína sobre tudo. A roupa é feita de pétalas e musgo tecidos com habilidade impossível para mãos tão pequenas.

A magia da pixie é variada e potente para o tamanho: Sleep pode derrubar um grupo inteiro, Dispel Magic pode apagar feitiços de alto nível, e a invisibilidade permanente torna-a quase impossível de localizar quando decide que a conversa terminou. Uma pixie ofendida é uma inimiga que você nunca verá vir.',
    ARRAY['fada'],
    1, 7,
    1, 3,
    12,
    4, 12, 14, 6, 14, 16,
    3, 8,
    '1d6',
    '[{"nome":"Espinhos Feéricos","descricao":"O monstro executa espinhos feéricos contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    50,
    'minusculo',
    ARRAY['floresta encantada', 'sylvaris'],
    '{}',
    '{}',
    '{"terrestre":15,"voo":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sprite (Tier 2, minusculo, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sprite',
    'Menor que uma pixie mas com postura mais marcial: veste armadura de folha de carvalho com viseira levantada, carrega uma espada do tamanho de um alfinete e um arco proporcional, e observa estranhos na floresta com a seriedade de um guarda de fronteira. A expressão não é da jovialidade da pixie mas da suspeita cautelosa de alguém responsável pela segurança de algo que importa.

A espada da sprite injeta veneno soporífico que pode derrubar um humano adulto inconsciente por uma hora — poder desproporcional a algo do tamanho de um pássaro. A capacidade de perceber o alinhamento de qualquer criatura através do brilho do coração torna os sprites guardas ideais para locais sagrados que só podem ser entrados por aqueles de coração puro.',
    ARRAY['fada'],
    1, 7,
    1, 3,
    12,
    4, 12, 14, 6, 14, 16,
    3, 8,
    '1d6',
    '[{"nome":"Espinhos Feéricos","descricao":"O monstro executa espinhos feéricos contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    50,
    'minusculo',
    ARRAY['floresta encantada'],
    '{}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Satyr (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Satyr',
    'Metade humano da cintura para cima, com chifres enrolados e uma expressão permanente de contentamento hedonista, metade bode da cintura para baixo com pernas que terminam em cascos reluzentes. A pele tem um tom levemente cobreado, e os olhos têm uma qualidade de âmbar que sugere sabedoria antiga combinada com falta completa de responsabilidade.

A flauta mágica do sátiro é sua verdadeira arma: pode encantar, aterrorizar ou adormecer com melodias diferentes. A imunidade às magias de encantamento e medo quando em território florestal torna-o imensamente frustrante para conjuradores que dependem dessas escolas. Raramente maligno, mas capaz de causar problemas enormes por pura irresponsabilidade exuberante.',
    ARRAY['fada'],
    2, 7,
    1, 3,
    22,
    10, 12, 10, 10, 10, 16,
    5, 6,
    '1d6',
    '[{"nome":"Espinhos Feéricos","descricao":"O monstro executa espinhos feéricos contra seu alvo.","tipo":"ofensiva","dano":"2d4+2","efeito":{"tipo":"medo","duracao":2,"dano_por_turno":null},"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    100,
    'medio',
    ARRAY['floresta', 'sylvaris'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dryad (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dryad',
    'O espírito de uma árvore específica encarnado em forma feminina de madeira viva, com pele de textura de casca lisa, cabelo de folhas de estação que muda com o clima, e olhos da cor do interior de uma árvore recém-cortada. Não pode se afastar mais de algumas centenas de metros da árvore vinculada sem sofrer dano crescente — e se a árvore for destruída, a dryad morre junto.

O charme da dryad funciona apenas dentro do raio da sua floresta, mas dentro desse raio é quase irresistível e dura semanas. A capacidade de se teletransportar entre árvores faz persegui-la ou flanqueá-la praticamente impossível em sua floresta natal. Uma dryad que decide ser aliada é um recurso extraordinário; uma que considera o grupo uma ameaça às suas árvores é um inimigo de terreno perfeito.',
    ARRAY['fada'],
    2, 7,
    2, 5,
    30,
    12, 13, 10, 12, 10, 16,
    7, 8,
    '1d6+2',
    '[{"nome":"Encantamento Hostil","descricao":"O monstro executa encantamento hostil contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Dança Encantada","descricao":"O monstro executa dança encantada contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    200,
    'medio',
    ARRAY['floresta', 'sylvaris'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Green Hag (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Green Hag',
    'Uma figura encurvada de metro e meio com pele verde-acinzentada coberta de verrugas que secretam muco fétido, dedos terminados em garras negras de comprimento perturbador, e olhos amarelos com pupila de lagarto. O cabelo é como musgo de pântano, os dentes são negros e irregulares, e o sorriso quando aparece é ainda pior que a ausência dele.

A garra da bruxa verde drena a Força da vítima progressivamente: guerreiros que recebem múltiplos arranhões se descobrem progressivamente fracos demais para levantar suas próprias armas. A imersão em ilusão e imitação de voz permite que se passe por aldeões, guardas e até parentes de aventureiros. O maior perigo é o covil de três bruxas: juntas os poderes triplicam.',
    ARRAY['fada'],
    3, 7,
    3, 7,
    45,
    14, 13, 10, 14, 10, 16,
    9, 10,
    '1d8+2',
    '[{"nome":"Encantamento Hostil","descricao":"O monstro executa encantamento hostil contra seu alvo.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":3,"chance":50},{"nome":"Véu de Ilusão","descricao":"O monstro executa véu de ilusão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    700,
    'medio',
    ARRAY['pântano', 'floresta sombria'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Night Hag (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Night Hag',
    'Mais alta e mais musculosa que a bruxa verde, com pele cinza-azulada como cadáver recente, olhos de um âmbar escuro que emitem tênue luz própria, e uma postura que transmite poder contido em vez da encolhida servilidade das brutas menores. Usa roupa de viagem escura e carrega um cristal da alma ornamentado onde aprisiona suas vítimas.

A bruxa da noite não ataca diretamente se puder evitar: prefere visitar vítimas nos sonhos, drenando a vitalidade noite após noite enquanto a vítima acorda progressivamente mais exausta sem saber por quê. Se capturar a alma de alguém no cristal, pode vendê-la aos planos malignos como mercadoria. Combatê-la fisicamente é o último recurso que ela prefere a você ter.',
    ARRAY['fiend', 'fada'],
    3, 7,
    5, 8,
    65,
    16, 15, 10, 16, 10, 12,
    11, 12,
    '2d6+2',
    '[{"nome":"Chama Infernal","descricao":"Chamas do abismo envolvem o alvo em fogo demoníaco.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    1800,
    'medio',
    ARRAY['plano hades', 'plano material à noite'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Annis Hag (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Annis Hag',
    'A maior e mais brutal das bruxas: dois metros e meio de músculo coberto de pele azul-acinzentada de textura de pedra, mãos de ferro literalmente, e uma força que rivaliza com gigantes de pequeno porte. O rosto tem traços grosseiros que transmitem brutalidade inteligente em vez da astucia sutil das outras bruxas. Cheira a pinho com uma nota de sangue velho.

As mãos de ferro da annis podem estraçalhar armaduras como papel e a constrição dos braços pode quebrar costelas de guerreiros robustos. Ao contrário das outras bruxas que preferem manipulação, a annis gosta de combate físico direto e tem poder suficiente para ganhar a maioria deles. Mesmo assim, usa ilusões para criar vantagem inicial antes de revelar a força real.',
    ARRAY['fada'],
    3, 7,
    5, 8,
    80,
    20, 13, 8, 20, 8, 16,
    13, 11,
    '2d6+2',
    '[{"nome":"Espinhos Feéricos","descricao":"O monstro executa espinhos feéricos contra seu alvo.","tipo":"ofensiva","dano":"2d8+6","efeito":null,"cooldown":3,"chance":50},{"nome":"Dança Encantada","descricao":"O monstro executa dança encantada contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    2300,
    'grande',
    ARRAY['montanha', 'floresta densa'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sea Hag (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sea Hag',
    'De longe parece uma velha pescadora encurvada num barco de pesca simples. De perto, a aparência desmorona: pele de cor de água podre, cabelo de algas marinhas, olhos sem pupila de cor de óleo, e dentes que são fragmentos de conchas afiadas plantados nas gengivas. O cheiro é de peixe morto e sal de mar velho. Habita costas rochosas e recifes.

O rosto horripilante da bruxa do mar pode paralisar de medo ou literalmente parar o coração de alguém que olhe diretamente para ele sem resistir. O olho maligno enfraquece progressivamente a vontade de oponentes, tornando-os progressivamente menos capazes de resistir aos feitiços subsequentes. Uma das criaturas mais perigosas para pescadores e marinheiros sem escolta mágica.',
    ARRAY['fada'],
    2, 7,
    2, 5,
    30,
    12, 13, 10, 12, 10, 16,
    7, 8,
    '1d6+2',
    '[{"nome":"Encantamento Hostil","descricao":"O monstro executa encantamento hostil contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Véu de Ilusão","descricao":"O monstro executa véu de ilusão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    450,
    'medio',
    ARRAY['mar', 'costa', 'ilha'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Bheur Hag (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Bheur Hag',
    'Uma figura esquelética de pele azul-gelo com cabelo branco como neve e olhos de um branco gelado que emitem vapor a cada olhar intenso. Anda levitando levemente acima do chão nevado, carregando um cajado de gelo que parece um fragmento de glaciar impossível de carregar. Cavalga em tempestades de neve como montaria, desaparecendo na nevasca quando conveniente.

Comanda o frio e as tempestades de inverno com poder que vai além de magia aprendida, podendo criar nevascas de semanas, congelar lagos inteiros e chamar blizzards localizados. Causa fome forçando o gado a morrer de frio e os campos a não produzir, destruindo comunidades através da miséria sem nunca aparecer pessoalmente.',
    ARRAY['fada'],
    3, 7,
    5, 8,
    65,
    16, 13, 10, 16, 10, 16,
    11, 12,
    '2d6+2',
    '[{"nome":"Ilusão Cortante","descricao":"O monstro executa ilusão cortante contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Bruma Protetora","descricao":"O monstro executa bruma protetora contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['gelo', 'eletricidade'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    2900,
    'medio',
    ARRAY['tundra', 'montanhas geladas'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Korred (Tier 5, pequeno, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Korred',
    'Um humanoide minúsculo de apenas um metro com músculos improváveis para o tamanho, pele de textura de granito polido, e cabelo e barba que são literalmente cordas de pedra que se movem quando o korred fica animado ou irritado. Usa o cabelo e a barba como ferramentas e armas, e dança em rituais que afetam a própria estrutura da pedra ao redor.

A dança ritual do korred pode animar pedras da área, criar muros de pedra instantâneos e causar terremotos localizados, tudo através da mágica da dança, não de feitiços convencionais. A Força excepcional de dois metros de músculo comprimido em um metro de altura torna-o perigosamente forte para o tamanho aparente.',
    ARRAY['fada'],
    3, 7,
    5, 8,
    60,
    14, 13, 12, 14, 12, 16,
    10, 13,
    '2d6+2',
    '[{"nome":"Ilusão Cortante","descricao":"O monstro executa ilusão cortante contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Véu de Ilusão","descricao":"O monstro executa véu de ilusão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    2900,
    'pequeno',
    ARRAY['floresta de pedra', 'sylvaris'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Bandersnatch (Tier 5, enorme, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Bandersnatch',
    'Uma criatura que desafia categorização: grande como um urso, coberta de pelagem listrada branca e preta, com garras que se estendem a dois metros de comprimento além dos braços, olhos que olham em direções diferentes simultaneamente, e movimentos que mudam de direção com frequência e padrão que sugere que ignora as leis do momento linear.

Originário do nonsense do Sylvaris profundo, o bandersnatch é imprevisível não como estratégia mas como natureza fundamental: os ataques chegam de ângulos impossíveis, a velocidade de mudança de direção desafia o eye-tracking, e as garras longas alcançam alvos que acreditavam estar em distância segura.',
    ARRAY['fada'],
    3, 7,
    5, 8,
    95,
    22, 13, 6, 22, 6, 16,
    14, 10,
    '2d6+2',
    '[{"nome":"Encantamento Hostil","descricao":"O monstro executa encantamento hostil contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Véu de Ilusão","descricao":"O monstro executa véu de ilusão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    2900,
    'enorme',
    ARRAY['sylvaris profundo'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Redcap (Tier 4, pequeno, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Redcap',
    'Um gnomo de aparência humana de setenta centímetros com um chapéu vermelho escuro que está sempre molhado: molhado de sangue. Precisa matar regularmente para molhar o chapéu com sangue fresco, pois se o chapéu secar completamente o redcap morre. Isso cria uma urgência de violência constante que não é malícia mas necessidade existencial, o que não o torna menos perigoso.

A força de um redcap é completamente desproporcional ao tamanho: força de gigante em corpo de gnomo, com uma foice que seria grande para um humano adulto normal. A velocidade de ataque é brutal e sem hesitação, e o chapéu molhado dripping sangue cria um rastro que torna-o identificável mas também constantemente em modo de caça.',
    ARRAY['fada'],
    3, 7,
    3, 7,
    40,
    12, 13, 12, 12, 12, 16,
    8, 11,
    '1d8+2',
    '[{"nome":"Encantamento Hostil","descricao":"O monstro executa encantamento hostil contra seu alvo.","tipo":"ofensiva","dano":"2d6+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Bruma Protetora","descricao":"O monstro executa bruma protetora contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['gelo', 'psiquico'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    700,
    'pequeno',
    ARRAY['sylvaris', 'ruínas de fronteira'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Rastejante do Medo (Tier 3, pequeno, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Rastejante do Medo',
    'Uma criatura de trinta centímetros de altura de aparência vagamente inseto-humana: membros finos demais para o tronco, olhos compostos e luminosos, e superfície corporal que parece absorver a luz ao redor criando uma área de escuridão ligeiramente maior que o corpo. Move-se em silêncio absoluto e aparece de sombras de formas que sugerem teletransporte mas pode ser apenas velocidade.

Os meenlocks se alimentam de medo: a telepatia de terror que projetam cria terror irracional crescente em vítimas nas proximidades. Uma pessoa aterrorizada o suficiente é teleportada para o covil do meenlock onde, ao longo de 24 horas, é transformada em outro meenlock. A transformação é irreversível após completa.',
    ARRAY['fada'],
    2, 7,
    2, 5,
    25,
    10, 13, 12, 10, 12, 16,
    6, 9,
    '1d6+2',
    '[{"nome":"Ilusão Cortante","descricao":"O monstro executa ilusão cortante contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"medo","duracao":2,"dano_por_turno":null},"cooldown":3,"chance":50},{"nome":"Bruma Protetora","descricao":"O monstro executa bruma protetora contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio', 'radiante', 'psiquico'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    450,
    'pequeno',
    ARRAY['sylvaris sombrio', 'floresta sombria'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Fada-Relâmpago (Tier 3, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Fada-Relâmpago',
    'Um fada de aparência humana de trinta centímetros que se move a velocidade impossível: literalmente uma borrão na visão periférica, presente e ausente antes que o olho possa focar completamente. A voz é aguda e fala rápido demais para ser compreendida sem concentração especial. O rosto carrega a expressão de quem sabe que é mais rápido que tudo ao redor e não esconde o desprezo que isso cria.

A velocidade do quickling permite cinco ataques de faca por turno e a esquiva perfeita de qualquer coisa que possa ver chegando. Individualmente é uma irritação mortal; em grupos é uma enxurrada de golpes que ultrapassa qualquer defesa por pura saturação de velocidade. A única estratégia efetiva é criar situações onde a velocidade não ajuda.',
    ARRAY['fada'],
    2, 7,
    2, 5,
    20,
    6, 13, 14, 8, 14, 16,
    5, 10,
    '1d6+2',
    '[{"nome":"Encantamento Hostil","descricao":"O monstro executa encantamento hostil contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Bruma Protetora","descricao":"O monstro executa bruma protetora contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    200,
    'minusculo',
    ARRAY['floresta', 'sylvaris'],
    '{}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Oberon (Tier 10, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Oberon',
    'O Rei do Sylvaris de Verão aparece como humano de proporções perfeitas com cabelo de folha de outono e olhos que contêm a profundidade de florestas antigas. A beleza é de tipo que não existe no plano material: não é apenas estética mas a presença de alguém que é literalmente a personificação de um aspecto do mundo natural. As roupas são de plantas vivas que continuam crescendo lentamente.

Oberon pode criar e destruir partes do Sylvaris com um pensamento, e sua magia de ilusão e encantamento funciona sem os limites de um mago mortal. A maior ameaça de Oberon não é violência mas poder de Patrono: aqueles que fazem pactos com ele descobrem que a lealdade do Rei das Fadas tem condições que só aparecem quando já é tarde para negociar.',
    ARRAY['fada'],
    6, 7,
    10, 16,
    280,
    26, 15, 10, 26, 10, 16,
    24, 22,
    '3d10+8',
    '[{"nome":"Ilusão Cortante","descricao":"O monstro executa ilusão cortante contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":5,"chance":50},{"nome":"Véu de Ilusão","descricao":"O monstro executa véu de ilusão contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Maldição Feérica","descricao":"O monstro executa maldição feérica contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    90000,
    'medio',
    ARRAY['corte de verão — sylvaris'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Titania (Tier 10, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Titania',
    'A Rainha do Sylvaris de Verão é o oposto complementar de Oberon: onde ele é força e caça, ela é crescimento e magia. Aparece como figura feminina de altura humana com pele que parece levemente translúcida, olhos de cor de céu às três da tarde, e cabelo que é simultaneamente cabelo e flores florescendo. A presença dela é como entrar num jardim de verão perfeito.

Seu charme é literalmente sobrenatural e opera como uma força fundamental: criaturas na presença dela ficam dispostas a concordar com coisas que nunca considerariam normalmente. O poder de controle da natureza no Sylvaris torna-a praticamente invencível em seu domínio, pois as próprias árvores e animais são extensões de sua vontade.',
    ARRAY['fada'],
    6, 7,
    10, 16,
    280,
    26, 15, 10, 26, 10, 16,
    24, 22,
    '3d10+8',
    '[{"nome":"Ilusão Cortante","descricao":"O monstro executa ilusão cortante contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":5,"chance":50},{"nome":"Dança Encantada","descricao":"O monstro executa dança encantada contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Caos Encantado","descricao":"O monstro executa caos encantado contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    90000,
    'medio',
    ARRAY['corte de verão — sylvaris'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- The Archfey (Tier 9, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'The Archfey',
    'A Rainha do Sylvaris de Inverno nunca é vista diretamente: existe na memória de quem a encontrou como uma presença de frio e escuridão com uma voz que parece vir de dentro da própria cabeça. Alguns descrevem uma figura feminina de pele de neve e olhos de estrelas mortas; outros descrevem apenas ausência da forma de uma pessoa.

Sua magia de ilusão cria realidades alternativas que persistem por anos sem ser identificadas como falsas. As criaturas que se tornam seus servos frequentemente não sabem que servem a ela, acreditando estar seguindo seus próprios objetivos. A Corte de Inverno que lidera é um espelho sombrio da Corte de Verão de Titania e Oberon.',
    ARRAY['fada'],
    6, 7,
    9, 14,
    200,
    24, 15, 10, 24, 10, 16,
    20, 20,
    '3d8+6',
    '[{"nome":"Ilusão Cortante","descricao":"O monstro executa ilusão cortante contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":5,"chance":50},{"nome":"Bruma Protetora","descricao":"O monstro executa bruma protetora contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Caos Encantado","descricao":"O monstro executa caos encantado contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'floresta', 'medieval'],
    41000,
    'medio',
    ARRAY['corte de gelo — sylvaris'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Humanoides Monstruosos (24 monstros)
-- =============================================================================

-- Goblin (Tier 2, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Goblin',
    'Humanóide de sessenta centímetros com pele de verde-amarelo, orejas pontiagudas, olhos grandes de um laranja que brilha no escuro, e uma expressão que combina astúcia com covardia em proporções variáveis dependendo de quantos amigos ele tem por perto. A roupa é uma coleção de coisas roubadas que não foram feitas para o tamanho dele, usadas com criatividade se não com elegância.

Individualmente, o goblin é uma ameaça mínima. Em grupos de trinta com emboscada preparada, é um auténtico pesadelo por saturação. A fuga fácil que usam como ação bônus torna impossível eliminar grupos eficientemente, e cada goblin que escapa volta com reforços. A estratégia goblin é volume e persistência, não qualidade.',
    ARRAY['humanoide'],
    1, 8,
    1, 3,
    17,
    8, 12, 12, 8, 12, 10,
    4, 7,
    '1d6',
    '[{"nome":"Ataque Furtivo","descricao":"O monstro executa ataque furtivo contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    50,
    'pequeno',
    ARRAY['caverna', 'floresta', 'ruínas'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Bugbear (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Bugbear',
    'Um urso humanóide de dois metros com pele parda e peluda, olhos laranja de predador noturno, e uma expressão permanente de quem está calculando o momento ideal para atacar. Mais silencioso que deveria ser para o tamanho, com habilidades de furtividade que parecem impossíveis para algo tão grande. Carrega uma maça pesada e usa-a com o refinamento de quem fez isso muitas vezes.

O bônus de dano de surpresa do bugbear transforma golpes de emboscada em eventos potencialmente letais. A habilidade de aparecer de espaços que parecem pequenos demais e o alcance extra das armas tornam os bugbears predadores ideais para masmorras e corredores estreitos. Frequentemente usados como caçadores por hobgoblins mais táticos.',
    ARRAY['humanoide'],
    2, 8,
    2, 5,
    30,
    12, 13, 10, 12, 10, 10,
    7, 8,
    '1d6+2',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"2d6","efeito":null,"cooldown":3,"chance":50},{"nome":"Grito de Comando","descricao":"O monstro executa grito de comando contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    200,
    'medio',
    ARRAY['floresta', 'dungeon'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Hobgoblin (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Hobgoblin',
    'Humanóide de metro e oitenta com pele laranja-acinzentada, postura militarmente ereta, olhos vermelhos que olham para você como um sargento avaliando um recruta, e uma armadura de placas mantida com o cuidado que um profissional dedica às ferramentas do ofício. Não há nada desleixado ou improvisado num hobgoblin: cada detalhe é funcional e deliberado.

A disciplina marcial dos hobgoblins é genuína: formam linhas, cobrem retiradas uns dos outros, e o bônus em ataque quando próximo de aliados reflete táticas de formação real. Uma guarnição de hobgoblins não é uma matilha de monstros mas um pelotão, e precisa de estratégia militar real para ser derrotado eficientemente.',
    ARRAY['humanoide'],
    2, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Ataque Furtivo","descricao":"O monstro executa ataque furtivo contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    100,
    'medio',
    ARRAY['fortaleza', 'campo militar'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Hobgoblin Capitão (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Hobgoblin Capitão',
    'Hobgoblin de postura de comando com cicatrizes estrategicamente acumuladas e armadura com as marcas de campanha de dezenas de conflitos. Os olhos vermelhos têm a qualidade de alguém que passou décadas avaliando situações táticas e raramente subestimou um oponente. Fala pouco, observa muito, e decide rápido.

O grito de guerra que emite como ação bônus coordena ataques de aliados com eficiência de veterano: uma unidade de hobgoblins liderada por um capitão ataca com coordenação que pode suplantar grupos maiores de aventureiros que não esperavam enfrentar táticas militares reais numa masmorra.',
    ARRAY['humanoide'],
    3, 8,
    3, 7,
    45,
    14, 13, 10, 14, 10, 10,
    9, 10,
    '1d8+2',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Posição Defensiva","descricao":"O monstro executa posição defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    700,
    'medio',
    ARRAY['fortaleza hobgoblin'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Kobold (Tier 1, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Kobold',
    'Humanóide de sessenta centímetros com escamas de vermelho-escuro, focinho de réptil, olhos de topázio que brilham na escuridão, e uma postura simultaneamente servilha e rancorosa. Cada kobold sabe que é pequeno e fraco, e cada kobold passou a vida construindo sistemas de compensação: armadilhas elaboradas, posições defensivas, e vantagem numérica como princípio estratégico central.

Na luz solar o kobold é claramente em desvantagem. Na mina escura onde construíram o próprio lar, é uma ameaça muito maior que o tamanho sugere. A vantagem em ataque quando perto de aliados é uma filosofia kobold inteira: nunca lutar um-a-um quando você pode fazer três-a-um.',
    ARRAY['humanoide'],
    1, 8,
    1, 2,
    10,
    6, 12, 12, 6, 12, 10,
    3, 5,
    '1d4+1',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['radiante'],
    ARRAY['fantasia', 'medieval'],
    25,
    'pequeno',
    ARRAY['mina', 'caverna', 'montanha'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gnoll (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gnoll',
    'Humanóide com cabeça de hiena no corpo de um humano robusto com pelagem manchada e olhos de âmbar com pupila vertical. A postura é ligeiramente encurvada, tensionada, como alguém prestes a correr ou atacar sem ter decidido ainda qual. O riso que produzem quando matam não é uma expressão: é um som que os gnolls literalmente não controlam, reflexo de prazer biológico codificado por Khrovash.

A habilidade de atacar como bônus após matar um inimigo cria momentum em batalha: um gnoll que mata o primeiro oponente imediatamente ataca o segundo, e se matar o segundo ataca o terceiro. Em grupos grandes contra oponentes menores, essa cascata pode limpar uma formação inteira antes que a oportunidade de resposta exista.',
    ARRAY['humanoide'],
    2, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    100,
    'medio',
    ARRAY['planície', 'deserto', 'savana'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gnoll Fang of Khrovash (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gnoll Fang of Khrovash',
    'Gnoll de tamanho e musculatura claramente superior aos da matilha, com marcas rituais queimadas na pelagem e olhos que brilham com luz sobrenatural nos momentos de violência máxima. Funciona como sacerdote-guerreiro de Khrovash, e a presença da divindade é tangível: quando mata, o corpo do morto pode se transformar em novo gnoll.

Três ataques por rodada com a velocidade frenética de um predador em modo de caça, e a habilidade sobrenatural de criar novos gnolls de hienas e cadáveres de humanóides mortos na área. Uma batalha que começa com cinco gnolls e um fang pode terminar com dez se não for gerenciada cuidadosamente.',
    ARRAY['humanoide'],
    3, 8,
    3, 7,
    45,
    14, 13, 10, 14, 10, 10,
    9, 10,
    '1d8+2',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Esquiva Tática","descricao":"O monstro executa esquiva tática contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    1100,
    'medio',
    ARRAY['horda gnoll'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Orc (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Orc',
    'Humanóide de dois metros com pele de verde-acinzentado, presas que projetam levemente além dos lábios inferiores, olhos de vermelho-escuro que exalam hostilidade ativa, e musculatura de trabalhador pesado em formato de guerreiro. A postura não é de defesa mas de ocupação: um orc no espaço sente-se no direito de estar lá e comunica isso com o corpo.

A habilidade Agressiva que avança gratuitamente em direção a inimigos como ação bônus e a resistência que mantém o orc com 1 ponto de vida quando deveria cair morto uma vez por dia fazem-no um combatente persistente que não facilita para quem esperava terminá-lo com um golpe grande.',
    ARRAY['humanoide'],
    2, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    100,
    'medio',
    ARRAY['montanha', 'caverna', 'fortaleza'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Orc War Chief (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Orc War Chief',
    'Um orc de dois metros e vinte com cicatrizes que são praticamente um mapa de batalhas, armadura improvisada com peças de uma dúzia de inimigos derrotados, e um machado que claramente já foi de alguém mais alto na cadeia alimentar antes de encontrar seu dono atual. Os olhos vermelhos têm a profundidade de alguém que sobreviveu quando todos ao redor morreram.

O grito de guerra que acelera toda a horda ao redor transforma um grupo de orcs já perigosos em torrente de violência coordenada. A resistência dobrada do chefe de guerra significa que ele continua lutando mesmo após golpes que matariam três orcs comuns, absorvendo punição enquanto seus guerreiros avançam.',
    ARRAY['humanoide'],
    3, 8,
    3, 7,
    45,
    14, 13, 10, 14, 10, 10,
    9, 10,
    '1d8+2',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Esquiva Tática","descricao":"O monstro executa esquiva tática contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    1100,
    'medio',
    ARRAY['fortaleza orc'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Troll (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Troll',
    'Humanóide de três metros com pele de verde-esverdeado irregular como musgo, braços que chegam quase ao chão mesmo em postura ereta, e uma expressão de fome permanente que não distingue entre comida e combate. A textura da pele parece borracha vulcanizada: impressões de golpes desaparecem em segundos conforme a carne se regenera visivelmente.

A regeneração do troll é a característica mais importante de saber antes de enfrentá-lo: sem fogo ou ácido para cauterizar os ferimentos, um troll cortado ao meio voltará a ser inteiro em minutos. Grupos sem fonte de fogo descobrem rapidamente que ferir um troll apenas atrasa o inevitável.',
    ARRAY['gigante'],
    3, 8,
    5, 8,
    80,
    20, 9, 8, 20, 8, 8,
    13, 11,
    '2d6+2',
    '[{"nome":"Pisoteamento","descricao":"O monstro executa pisoteamento contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Grito de Guerra","descricao":"O monstro executa grito de guerra contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'acido'],
    ARRAY['fantasia', 'medieval'],
    1800,
    'grande',
    ARRAY['floresta', 'caverna', 'montanha'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Naghari Purebood (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Naghari Purebood',
    'Um ser que parece completamente humano até uma inspeção muito próxima revelar olhos com pupila vertical, pele com um padrão levemente escamoso em certas áreas, e movimentos com suavidade de réptil que a maioria dos humanos não possui. Os pureblood são o resultado de gerações de ritual de transformação serpentina da cultura Naghari, e vivem entre humanos como agentes e espiões.

A imunidade completa a encantos e venenos torna inúteis as estratégias mais comuns para lidar com infiltrados. A capacidade de lançar Sugestão torna fácil redirecionar aventureiros que estejam próximos de descobrir a verdadeira natureza ou agenda do pureblood antes que chegue a um confronto.',
    ARRAY['monstrosity'],
    2, 8,
    2, 5,
    30,
    12, 6, 10, 12, 10, 6,
    7, 8,
    '1d6+2',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6"},"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'medieval'],
    200,
    'medio',
    ARRAY['ruínas de selva', 'templo de cobra'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Naghari Malison (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Naghari Malison',
    'A transformação mais avançada de um Naghari humanoide que abandonou parcialmente a forma humana: alguns têm cabeça de cobra em corpo humano, outros têm braços de serpente em vez de braços humanos, e outros têm o corpo inferior de cobra em vez de pernas. Os olhos em qualquer variação são dourados com pupila vertical que não pisca.

Combinam magia de clérigo com veneno e a resistência sobrenatural dos Naghari ao encantamento e ao veneno. A variedade de formas torna cada encontro ligeiramente diferente em termos de capacidades específicas: o malison com cabeça de cobra tem mordida venenosa diferente do que tem braços de serpente mas usa magia.',
    ARRAY['monstrosity'],
    3, 8,
    3, 7,
    45,
    14, 6, 10, 14, 10, 6,
    9, 10,
    '1d8+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6+1"},"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval'],
    700,
    'medio',
    ARRAY['templo naghari', 'selva'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Naghari Anathema (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Naghari Anathema',
    'A forma mais extrema de transformação Naghari: seis cabeças de cobra num corpo de serpente massiva de seis metros, completamente afastado de qualquer forma humana original. As seis cabeças conferem imunidade ao atordoamento pois sempre há pelo menos uma que mantém a consciência quando as outras são distraídas. A escala e o poder combinados são de um semideus serpentino.

Conjurador de poder equivalente a clérigo de nível 9 além do corpo físico massivo de serpente. As seis cabeças podem encarar seis direções simultaneamente tornando impossível surpreender a anathema de qualquer ângulo. Comanda colônias inteiras Naghari como imperador serpente ungido pelos próprios deuses da espécie.',
    ARRAY['monstrosity'],
    4, 8,
    7, 10,
    140,
    26, 7, 6, 26, 6, 6,
    18, 14,
    '2d8+4',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+2"},"cooldown":4,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque Múltiplo","descricao":"O monstro executa ataque múltiplo contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'medieval'],
    8400,
    'enorme',
    ARRAY['templo naghari'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Lizardfolk (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Lizardfolk',
    'Humanóide réptil de metro e oitenta com escamas de verde a marrom dependendo do habitat, olhos de âmbar com pupila vertical, e uma expressão que humanos interpretam como fria mas que é apenas a face de reptil de um ser completamente diferente em termos de processamento emocional. Pragmático ao ponto de ser perturbador: sem a teatralidade emocional que humanos usam nas interações sociais.

Os lizardfolk não são maus, são alienígenas: matam o que precisam comer, comem o que matam, e não gastam energia emocional em crueldade ou misericórdia além do necessário. O pragmatismo extremo torna-os aliados potencialmente úteis mas imprevisíveis em termos de lealdade quando as condições do acordo mudam.',
    ARRAY['humanoide'],
    2, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    100,
    'medio',
    ARRAY['pântano', 'río', 'selva aquática'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sahuagin (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sahuagin',
    'Humanóide aquático de metro e noventa com pele azul-acinzentada coberta de escamas finas, quatro braços com garras webbed, e a expressão inconfundível de um predador de topo de cadeia alimentar. Os olhos são adaptados ao azul profundo do oceano e têm dificuldade com luzes intensas em superfície. O nome Demônio do Mar é exagero poético mas não completamente injustificado.

O frenesi de sangue que ativa quando um alvo está sangrando é literal: a percepção do sangue no mesmo corpo d''água ativa uma resposta predatória quase compulsória. Uma batalha aquática com sahuagins que inclui qualquer ferimento que sangre no mar tende a escalar rapidamente para todos os sahuagins na área.',
    ARRAY['humanoide'],
    2, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    100,
    'medio',
    ARRAY['mar profundo', 'costa'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Duergar (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Duergar',
    'Anão de aparência cinza e árida com olhos que parecem ter visto coisas que apagaram qualquer jovialidade que possam ter tido. Habita o Umbraterra e foi escravizado por sorvedores de mentes por séculos antes de conquistar a liberdade, processo que deixou tanto marcas físicas quanto psíquicas. A amargura é uma qualidade cultural além de traço individual.

A capacidade de aumentar para tamanho Grande dobra o dano de ataques por um tempo limitado, e a invisibilidade permite emboscadas em cavernas escuras. A resistência a magia é um legado da escravidão pelos sorvedores: séculos de exposição a ataques psiônicos criaram resistência hereditária que os torna frustrantemente imunes a estratégias psíquicas.',
    ARRAY['humanoide'],
    2, 8,
    2, 5,
    30,
    12, 13, 10, 12, 10, 10,
    7, 8,
    '1d6+2',
    '[{"nome":"Ataque Furtivo","descricao":"O monstro executa ataque furtivo contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6"},"cooldown":3,"chance":50},{"nome":"Posição Defensiva","descricao":"O monstro executa posição defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'medieval'],
    200,
    'medio',
    ARRAY['underdark'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Drow (Tier 2, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Drow',
    'Elfo de pele cinza-escura com cabelo branco liso, olhos de lilás, rosa ou vermelho que brilham levemente na escuridão, e a postura refinada que toda a cultura élfica compartilha, mas com uma qualidade afiada de vigilância que os elfos da superfície raramente desenvolvem. A beleza elfica está presente mas tem a qualidade de uma faca bem polida.

A resistência à magia herdada torna feitiços de controle e encantamento muito menos eficazes contra drows que contra humanóides comuns. O veneno de adormecimento das armas pode derrubar aventureiros que passaram pela maioria dos golpes, e a habilidade de criar escuridão mágica permite reposicionamento no caos do combate.',
    ARRAY['humanoide'],
    1, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Ataque Furtivo","descricao":"O monstro executa ataque furtivo contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['fogo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'medieval'],
    50,
    'medio',
    ARRAY['underdark'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Drow Elite Warrior (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Drow Elite Warrior',
    'Drow com o treinamento de elite das casas nobres do Umbraterra: armadura de mythril que é mais leve que couro mas mais forte que aço, armas de qualidade que seriam tesouros na superfície, e reflexos de alguém que começou a treinar combate antes de aprender a ler. Os olhos têm a qualidade calculada de quem avalia cada situação em termos de vantagem e desvantagem tática.

Três ataques por turno com a precisão de décadas de treinamento, veneno de adormecimento em cada arma, Dispel Magic para neutralizar feitiços de proteção inimigos e Parry como reação para reduzir dano. Um guerreiro de elite drow é o equivalente de um paladin de alto nível em competência de combate, mas sem as restrições morais.',
    ARRAY['humanoide'],
    3, 8,
    5, 8,
    65,
    16, 13, 10, 16, 10, 10,
    11, 12,
    '2d6+2',
    '[{"nome":"Ataque Furtivo","descricao":"O monstro executa ataque furtivo contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Esquiva Tática","descricao":"O monstro executa esquiva tática contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'medieval'],
    1800,
    'medio',
    ARRAY['underdark', 'menzoberranzan'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Zerath Warrior (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Zerath Warrior',
    'Humanoide de aparência esquelética com pele de tom amarelo-esverdeado, olhos de um âmbar intenso com pupilas que parecem muito pequenas para o tamanho do olho, e uma postura que lembra humanos mas com os ângulos todos ligeiramente errados. Veste armadura de couro trabalhado e empunha uma espada prateada com a familiaridade de quem não consegue lembrar um tempo sem ela.

A espada prateada dos zerath causa dano psíquico adicional contra qualquer alvo, e a resistência à magia reflete séculos de guerra contra sorvedores que usavam poder psiônico. Misty Step permite reposicionamento tático constante que frustra oponentes que tentam prender um guerreiro zerath em posição desvantajosa.',
    ARRAY['humanoide'],
    3, 8,
    3, 7,
    45,
    14, 13, 10, 14, 10, 10,
    9, 10,
    '1d8+2',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"1d8","efeito":null,"cooldown":3,"chance":50},{"nome":"Grito de Comando","descricao":"O monstro executa grito de comando contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval'],
    700,
    'medio',
    ARRAY['plano astral', 'nave zerath'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Kythari Monk (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Kythari Monk',
    'Humanóide de aparência semelhante ao zerath mas com postura completamente diferente: onde o guerreiro é tenso e agressivo, o kythari é relaxado e centrado, com aquela qualidade de monge que pode explodir em violência sem tensão ou hesitação prévia. Habita o plano Limbo que moldou a disciplina psiônica através de séculos de meditação em caos puro.

O corpo se move com precisão de cirurgião: cada golpe é aplicado no ponto de maior eficiência, não na posição de maior força. A resistência à magia é ainda mais desenvolvida que no zerath, e as magias utilitárias de levitação e aceleração permitem combate em três dimensões que adversários convencionais raramente sabem antecipar.',
    ARRAY['humanoide'],
    2, 8,
    2, 5,
    30,
    12, 13, 10, 12, 10, 10,
    7, 8,
    '1d6+2',
    '[{"nome":"Ataque Furtivo","descricao":"O monstro executa ataque furtivo contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Posição Defensiva","descricao":"O monstro executa posição defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval'],
    450,
    'medio',
    ARRAY['limbo', 'monastério psiônico'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Murgal (Tier 2, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Murgal',
    'Humanóide de metro e setenta com pele de peixe escorregadia de cor de mar profundo, olhos grandes inexpressivos que não piscam, e boca cheia de dentes de peixe distribuídos de forma que um sorriso murgal é algo que a maioria preferia não ver. A pele secreta um muco aderente que torna difícil agarrar ou segurar qualquer coisa que toque.

Os murgal são teologicamente instáveis de uma forma que fascina estudiosos: coletivamente podem inventar um deus do nada, e se suficientes deles acreditam com fervor suficiente, a criatura inventada pode genuinamente ganhar poder divino. Esta característica torna colônias grandes de murgal particularmente imprevisíveis em termos do que podem ter convocado recentemente.',
    ARRAY['humanoide'],
    1, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    50,
    'medio',
    ARRAY['underdark aquático', 'lago subterrâneo'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sapo-Guerreiro (Tier 2, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sapo-Guerreiro',
    'Sapo humanóide de metro e quarenta com pele úmida de cor de pântano, olhos protuberantes que giram independentemente, e uma postura encurvada que comprime a musculatura das pernas em espirais de mola. O coaxar que usam para comunicar parece caótico mas tem estrutura hierárquica elaborada onde tons ligeiramente diferentes indicam status social com precisão absoluta.

Os saltos que podem executar são de uma escala completamente desproporcional ao tamanho: um bullywug de metro e quarenta pode saltar seis metros verticalmente ou doze horizontalmente. A obsessão hierárquica da espécie significa que matar o líder de um grupo frequentemente paralisa o grupo inteiro enquanto uma batalha de coaxares determina o próximo líder.',
    ARRAY['humanoide'],
    1, 8,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    50,
    'medio',
    ARRAY['pântano'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Rã Venenosa (Tier 2, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Rã Venenosa',
    'Sapo humanóide de setenta centímetros com pele brilhante de cores que são avisos de veneno em toda a natureza: azul vibrante, verde-ácido, amarelo-ovo. O veneno cutâneo libera-se automaticamente ao contato, tornando perigoso até aprisionar um grung com a mão desprotegida. A postura é ereta e até arrogante para algo tão pequeno, reflexo de uma cultura que acredita ser a espécie escolhida dos deuses.

Os grungs são arrogantes de uma forma que vai além do habitual: genuinamente acreditam que todas as outras espécies existem para servir aos grungs. A estratégia de combate reflete isso: prefere envenenar à distância com setas tratadas com o próprio veneno cutâneo e esperar que o oponente incapacitado seja capturado para servir.',
    ARRAY['humanoide'],
    1, 8,
    1, 3,
    17,
    8, 12, 12, 8, 12, 10,
    4, 7,
    '1d6',
    '[{"nome":"Ataque Furtivo","descricao":"O monstro executa ataque furtivo contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval'],
    50,
    'pequeno',
    ARRAY['selva', 'árvores tropicais'],
    '{}',
    '{}',
    '{"terrestre":25,"natacao":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Pardalino (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Pardalino',
    'Felino humanóide de metro e oitenta com pelagem listrada ou maculada de padrões únicos como impressão digital, olhos de âmbar ou verde que enxergam seis vezes melhor que humanos no escuro, e a postura de quem está simultâneamente relaxado e completamente pronto para se mover na velocidade que seus músculos permitem. Os pardalino são fisicamente superiores em movimento a praticamente qualquer humanóide.

A Fúria Felina permite cinco ataques de garra num único turno uma vez por descanso curto, velocidade que ultrapassa cavalos em sprint curto, e escalada de superfícies verticais como hábito casual. A curiosidade compulsiva que caracteriza a espécie pode ser explorada: um pardalino hostil que perceba algo genuinamente interessante tem reflexo condicionado de investigar antes de continuar a agressão.',
    ARRAY['humanoide'],
    2, 8,
    2, 5,
    30,
    12, 13, 10, 12, 10, 10,
    7, 8,
    '1d6+2',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Posição Defensiva","descricao":"O monstro executa posição defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval'],
    200,
    'medio',
    ARRAY['floresta tropical', 'selva'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Bestas e Animais Magicos (25 monstros)
-- =============================================================================

-- Pantera Espectral (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Pantera Espectral',
    'Um felino de seis patas do tamanho de leão adulto com dois tentáculos saindo dos ombros, cada qual terminado em ponta óssea de golpe, e uma pele que parece negra mas reflete luz em padrões que nunca correspondem à posição real do corpo. Parente dimensional de felinos do Sylvaris adaptados para engano como estratégia de sobrevivência primária.

O deslocamento é uma ilusão constante de posição: a primeira vez que qualquer atacante mira a pantera espectral por turno, a percepção da posição real está errada e o ataque falhará a menos que seja baseado em detecção não visual. Combinar ataques de dois tentáculos com mobilidade felina e disfarce de posição cria um predador que gasta inimigos com frustração antes de desgastá-los com dano.',
    ARRAY['monstrosity'],
    3, 9,
    3, 7,
    60,
    18, 6, 8, 18, 8, 6,
    11, 9,
    '1d8+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"1d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    700,
    'grande',
    ARRAY['floresta', 'sylvaris'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Owlbear (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Owlbear',
    'O resultado de uma experiência de um mago esquecido que cruzou urso pardo com coruja gigante e criou algo que a natureza nunca produziria mas o plano material adotou completamente. O corpo é de urso com pelagem espessa, mas a cabeça é de coruja com bico que parte osso e olhos enormes que enxergam no escuro com nitidez. Grunhe e guinca ao mesmo tempo.

É o encontro icônico de dungeon pela razão mais simples possível: é brutal, resistente, imprevisível e impossível de intimidar porque não entende negociação. O abraço de urso prende vítimas enquanto o bico trabalha, e o faro e audição apurados de coruja tornam emboscadas contra owlbears extremamente difíceis.',
    ARRAY['monstrosity'],
    3, 9,
    3, 7,
    60,
    18, 6, 8, 18, 8, 6,
    11, 9,
    '1d8+2',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"2d8+5","efeito":null,"cooldown":3,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    700,
    'grande',
    ARRAY['floresta', 'colina'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Basilisk (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Basilisk',
    'Uma lagartixa de oito patas de dois metros de comprimento com pele verde-acinzentada coberta de escamas irregulares, e os olhos — os olhos são o problema. Dois olhos verde-amarelados de brilho levemente sobrenatural que não deve ser encontrado em olhos de réptil comum. Em volta do covil há estátuas de pedra de adventureiros menos sortudos.

O olhar petrificante do basilisco funciona em estágios: primeiro restrição dos músculos, depois enrijecimento completo em pedra numa cascata de segundos. Aventureiros que lutam de costas para a criatura ou de olhos fechados sobrevivem — mas lutar cego tem os próprios problemas óbvios. Um espelho pode voltar o olhar contra o basilisco.',
    ARRAY['monstrosity'],
    3, 9,
    3, 7,
    45,
    14, 6, 10, 14, 10, 6,
    9, 10,
    '1d8+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"3d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    700,
    'medio',
    ARRAY['caverna', 'dungeon', 'colina'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cockatrice (Tier 2, pequeno, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cockatrice',
    'Cruzamento impossível de galo com réptil alado: cabeça e pés de galo num corpo de lagarto com asas de morcego membranosas. Ridicularmente pequeninoa para o terror que causa — do tamanho de um galo grande. A crista vermelha brilhante, o bico afiado e os olhos amarelos sem expressão reconhecível tornam a aparência simultaneamente cômica e perturbadora.

O bico da cocatriz não causa grande dano físico — mas qualquer ferimento que penetrar a pele começa um processo de petrifição que se completa em 24 horas sem cura mágica específica. Uma criatura que sobrevive ao ataque físico pode morrer de pedra no dia seguinte enquanto sente o corpo endurecer progressivamente.',
    ARRAY['monstrosity'],
    2, 9,
    1, 3,
    17,
    8, 5, 12, 8, 12, 6,
    4, 7,
    '1d6',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    100,
    'pequeno',
    ARRAY['caverna', 'ruínas', 'campo'],
    '{}',
    '{}',
    '{"terrestre":25,"voo":45}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Manticore (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Manticore',
    'Corpo de leão adulto com pelagem vermelha, cabeça humana de rosto masculino com dentes triplos em fileiras como tubarão, asas de dragão-morcego e cauda terminada em esfera de espinhos que regeneram continuamente. A combinação resulta num predador que caça do ar, ataca à distância, e pode sustentar uma chuva de projéteis enquanto voa fora do alcance de retaliação.

Os espinhos da cauda são armas de arremesso recarregáveis: até seis por turno em alcance de trinta metros, com dano relevante cada. O predador ideal é aquele que a presa não consegue alcançar. A manticora combate de altitude suficiente para seus espinhos alcançarem mas onde garras e espadas da presa são inúteis.',
    ARRAY['monstrosity'],
    3, 9,
    3, 7,
    60,
    18, 6, 8, 18, 8, 6,
    11, 9,
    '1d8+2',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    700,
    'grande',
    ARRAY['montanha', 'planície'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Griffon (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Griffon',
    'Parte traseira de leão e parte dianteira de águia dourada: garras de predador aéreo no dianteiro, patas de felino atrás, asas que permitem voo de oitenta pés por round e olhos de águia que enxergam presas a quilômetros de altitude. O bico pode partir armaduras de couro facilmente. Majestuoso é a palavra — mas não seguro.

Os grifos são territoriais em raio de muitos quilômetros ao redor do ninho e atacarão qualquer coisa que perceberem como ameaça ou oportunidade de alimentação. Podem ser domados com paciência e início de treinamento na juventude — grifos domesticados são montarias de guerra que valem fortunas. Selvagens são simplesmente predadores aéreos eficientes.',
    ARRAY['monstrosity'],
    2, 9,
    2, 5,
    45,
    16, 6, 8, 16, 8, 6,
    9, 7,
    '1d6+2',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'grande',
    ARRAY['montanha', 'planície aberta'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Hippogriff (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Hippogriff',
    'Cruzamento de grifo com cavalo: metade dianteira de águia e metade traseira de cavalo com asas de águia. Mais manso que o grifo por natureza equina, mais facilmente treinável como montaria e mais comum em regiões onde são criados deliberadamente para cavalaria aérea. Os olhos de águia e o bico ainda são ferramentas de predador funcional.

O hipogrifo domado é a montaria aérea padrão de cavaleiros de alto prestígio — combina velocidade de voo de sessenta pés com a capacidade de carga de um cavalo adulto. Selvagem é predador capaz mas não o pesadelo que o grifo representa; pode ser intimidado em retirada por grupo organizado.',
    ARRAY['monstrosity'],
    2, 9,
    2, 5,
    45,
    16, 6, 8, 16, 8, 6,
    9, 7,
    '1d6+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    200,
    'grande',
    ARRAY['montanha aberta', 'planície'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Pegasus (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Pegasus',
    'Um cavalo de beleza impossível com asas de ângulo branco de envergadura que toca o céu, olhos violeta ou dourado que transmitem inteligência além de animal. A crina e a cauda possuem leve bioluminescência em noites escuras. Surge de regiões de alta concentração de magia positiva — planícies celestiais, clareiras sagradas, topos de montanhas abençoadas.

O pegasus não é apenas montaria — é aliado consciente que escolhe seu cavaleiro com base em alinhamento e intenção. Recusa cavaleiros de coração corrompido mesmo sob coerção. Para aqueles que considera dignos, oferece velocidade de voo de noventa pés e coices devastadores a serviço de causas boas.',
    ARRAY['celestial'],
    2, 9,
    2, 5,
    45,
    16, 15, 8, 16, 8, 16,
    9, 7,
    '1d6+2',
    '[{"nome":"Lança de Luz","descricao":"O monstro executa lança de luz contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura Sagrada","descricao":"O monstro executa aura sagrada contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['gelo', 'psiquico'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'grande',
    ARRAY['planície celestial', 'nuvens'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Unicórnio (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Unicórnio',
    'O cavalo sagrado: pelagem branca sem mácula, chifre único espiralado de um metro que emite luz dourada suave, olhos de azul-violeta com profundidade de séculos e uma presença que torna florestas ao redor mais vivas, mais saudáveis e mais seguras. Símbolo da pureza mágica que ainda existe no mundo natural apesar de tudo.

O chifre cura ferimentos e neutraliza venenos com toque. O unicórnio pode teleportar dentro de sua floresta guardada. É imune a encantamento e veneno. Atacar um unicórnio traz a ira de toda a floresta que habita — druidas, fadas, animais e as próprias árvores. Protetor que nunca abandona o território.',
    ARRAY['celestial'],
    3, 9,
    5, 8,
    80,
    20, 15, 8, 20, 8, 16,
    13, 11,
    '2d6+2',
    '[{"nome":"Smite Divino","descricao":"O monstro executa smite divino contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Escudo de Fé","descricao":"O monstro executa escudo de fé contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    1800,
    'grande',
    ARRAY['floresta sagrada', 'sylvaris'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sphinx (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sphinx',
    'Uma esfinge com cabeça de homem barbado e corpo de leão alado — a variante feminina é a Ginosfinge. O rosto carrega a expressão de quem conhece a resposta para todas as perguntas já feitas e muitas que ainda serão. A voz é simultânea em múltiplas frequências. Habita locais de poder antigo que aceitaram seu dever de guardar como modo de existência.

O rugido da esfinge tem três efeitos sequenciais: primeiro assusta, segundo atordoa, terceiro ensurdece — e usa todos de acordo com a gravidade do intruso. Conjuradora de nível 9, resolve enigmas antes de usar violência quando respeito adequado for demonstrado. A esfinge que decide lutar é calamidade de múltiplas frentes.',
    ARRAY['monstrosity'],
    4, 9,
    7, 10,
    125,
    24, 7, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    7200,
    'grande',
    ARRAY['deserto', 'montanha antiga'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Androsphinx (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Androsphinx',
    'A esfinge masculina maior: juba de leão dourado, asas imensas e uma expressão que combina benevolência com poder absoluto de julgamento. Habita ruínas de civilizações que reconheciam valor em sapiência guardada. Os rugidos do Androsphinx são ações lendárias de efeito crescente que afetam todos em áreas largas ao redor.

Conjurador de nível 12 com acesso a magias de múltiplas escolas acumuladas em séculos de estudo. As ações lendárias incluem garras que causam dano devastador e rugidos de efeito múltiplo. O androsphinx testa antes de lutar, questiona antes de atacar — aventureiros que respondem com sabedoria encontram aliado; os que atacam encontram destruição.',
    ARRAY['monstrosity'],
    6, 9,
    8, 12,
    180,
    28, 7, 6, 28, 6, 6,
    21, 16,
    '2d10+5',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"4d8+6","efeito":{"tipo":"medo","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    18000,
    'enorme',
    ARRAY['deserto', 'ruínas antigas'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gynosphinx (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gynosphinx',
    'A esfinge feminina que guarda segredos — especialista em acúmulo e proteção de conhecimento que não deve ser difundido livremente. Mais inclinada à magia do que ao combate físico que o androsphinx prefere. Suas garras são letais quando necessário, mas frequentemente guarda com enigmas e maldições em vez de violência direta.

Legend Lore e Locate Object como magias inatas significam que a ginosfinge sabe onde está tudo que lhe interessa. Dispel Magic neutraliza qualquer tentativa de magia de invasão. Aventureiros que chegam com respeito e propósito válido podem encontrar nela a fonte de informação mais valiosa do mundo — ou um novo conjunto de enigmas que precisam responder primeiro.',
    ARRAY['monstrosity'],
    4, 9,
    7, 10,
    125,
    24, 7, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"2d8+6","efeito":null,"cooldown":4,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque Múltiplo","descricao":"O monstro executa ataque múltiplo contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    7200,
    'grande',
    ARRAY['deserto', 'templo'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Chimera (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Chimera',
    'Três animais num: cabeça de leão no centro, cabeça de bode atrás e cabeça de dragão à frente, sobre corpo de leão com asas de dragão e cauda de dragão. As três cabeças possuem personalidades distintas que lutam pelo controle do corpo — a de leão quer caça, a de bode quer vegetação e território, a de dragão quer fogo e poder. O resultado é uma criatura caoticamente agressiva.

Três ataques diferentes por rodada — mordida do leão, chifre do bode, sopro de fogo do dragão — direcionados a alvos distintos se necessário. O sopro de fogo em cone pode atingir toda a linha de frente de um grupo de uma vez. A imprevisibilidade das três vontades distintas torna o comportamento da quimera genuinamente difícil de antecipar.',
    ARRAY['monstrosity'],
    3, 9,
    5, 8,
    80,
    20, 6, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"7d8","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    2300,
    'grande',
    ARRAY['montanha', 'planície', 'colina'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Catoblepas (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Catoblepas',
    'Uma criatura de pântano com corpo de búfalo de pescoço extremamente longo e fraco que mantém a cabeça quase sempre voltada para o chão — a cabeça é simplesmente pesada demais para erguer facilmente. Os olhos pequenos e sanguíneos raramente ficam visíveis. A cauda é grossa e musculosa. O cheiro de podridão que emana é de tirar o fôlego.

Quer o catoblepas veja alguém nos olhos, o efeito é instantaneamente letal — morte imediata sem salvaguarda para os mais fracos, paralisia e morte para os outros. Não é uma criatura agressiva por natureza — o perigo está em acidentalmente entrar no campo de visão quando ela finalmente ergue a cabeça para olhar ao redor. Caçar catoblepas exige precisão de mira no escuro.',
    ARRAY['monstrosity'],
    3, 9,
    5, 8,
    80,
    20, 6, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    1800,
    'grande',
    ARRAY['pântano', 'zona úmida'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Peryton (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Peryton',
    'Um cervo com asas de águia, cor verde-escuro de bosque, olhos vermelhos profundos e uma particularidade perturbadora: a sombra projetada é de forma humana, não de cervo alado. Predador de coração humano — literalmente, precisa do coração de um humano adulto para reproduzir, transportando-o ao ninho após cada caçada bem-sucedida.

O comportamento de caçada do peryton é sofisticado demais para um animal: seleciona alvos isolados, mergulha do ar, fere para capturar em vez de matar imediatamente e carrega a presa para local controlado. A sombra humana sugere origem mágica ou planar para uma criatura que fisicamente parece produto natural.',
    ARRAY['monstrosity'],
    2, 9,
    2, 5,
    30,
    12, 6, 10, 12, 10, 6,
    7, 8,
    '1d6+2',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'medio',
    ARRAY['montanha', 'floresta'],
    '{}',
    '{}',
    '{"terrestre":30,"voo":50}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Roc (Tier 7, gargantuesco, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Roc',
    'Uma ave de proporções que desafiam a compreensão inicial: envergadura que obscurece o sol numa área de quarteirão, garras que têm o tamanho de uma câmara de dungeon, bico que poderia engolir cavaleiro com cavalo. Os ovos são confundidos com cúpulas ou colinas por exploradores sem referência de escala adequada. O rugido ao descer sobre presa ressoa como trovão.

A Roca não tem inimigos naturais exceto dragões ancião e entidades divinas — é o topo absoluto da cadeia alimentar aérea. Pega elefantes para alimentar filhotes. Para aventureiros, representa escala diferente de ameaça: não é questão de táticas mas de se o grupo tem poder suficiente para sequer alcançar uma criatura que voa a velocidade de cento e vinte pés.',
    ARRAY['monstrosity'],
    4, 9,
    7, 10,
    150,
    27, 7, 5, 27, 5, 6,
    19, 13,
    '2d8+4',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"4d8+9","efeito":null,"cooldown":4,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"8d8+9","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    7200,
    'gargantuesco',
    ARRAY['montanha alta', 'ilha remota'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Tarrasque (Tier 10, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Tarrasque',
    'A criatura. O pesadelo de escala civilizacional. Trinta metros de comprimento, carapaça que faz flechas ricochetearem de volta para o atirador, cinco ataques por turno que cada um pode matar cavaleiro e cavalo juntos, e uma regeneração de trinta pontos de vida por turno que torna morrer quase impossível. Dorme no núcleo do planeta e desperta periodicamente para alimentar-se de civilizações.

Não existe estratégia convencional para a Tarrasque — existe apenas sobreviver tempo suficiente para aplicar soluções extremas. A carapaça reflete magia. O desejo Wish é a única forma de destruição permanente. É um evento de campanha, não um encontro.',
    ARRAY['monstrosity'],
    6, 9,
    10, 16,
    320,
    33, 8, 5, 33, 5, 6,
    28, 19,
    '3d10+8',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"4d12+10","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+4"},"cooldown":5,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Ataque Múltiplo","descricao":"O monstro executa ataque múltiplo contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":9,"chance":30}]',
    ARRAY['fogo', 'veneno'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    155000,
    'gargantuesco',
    ARRAY['qualquer lugar / dorme no núcleo do planeta'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Bulette (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Bulette',
    'Um tubarão que aprendeu a nadar em terra: carapaça azul-cinza de metal natural que serve de armadura, boca enorme capaz de morder pedra sólida, e quatro patas adaptadas para escavar solo de qualquer tipo a velocidade impressionante. Não tem olhos visíveis — sente vibrações no solo para detectar presas. Uma masmorra com um bulette é uma masmorra com piso que ataca.

O ataque de salto é a assinatura: emerge do solo, salta sobre o grupo, cai com quatro patas e esmaga a área ao redor com dano em cone ao aterrissar. Depois mergulha de volta no solo para reposicionamento. Um grupo que não pode monitorar tremores no chão dificilmente vai se preparar para o próximo surgimento.',
    ARRAY['monstrosity'],
    3, 9,
    5, 8,
    80,
    20, 6, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"4d12+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    1800,
    'grande',
    ARRAY['planície', 'colina (subterrâneo)'],
    '{}',
    '{}',
    '{"terrestre":35,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Rastejante Necrófago (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Rastejante Necrófago',
    'Uma larva de quinze pés de comprimento de mandíbulas múltiplas com oito tentáculos ao redor da boca frontal — cada tentáculo termina em glândula que secreta veneno paralisante de contato. Escala tetos, paredes e chão com igual facilidade pela adesão química das patas. O cheiro de cadáver que emite atrai mais da própria espécie.

Os tentáculos paralizam ao toque de contato — e uma criatura paralisada no chão de dungeon enquanto o rastejador avança é uma morte garantida sem intervenção dos aliados. Oito tentáculos podem paralisar oito criaturas diferentes em um turno se o posicionamento for favorável.',
    ARRAY['monstrosity'],
    2, 9,
    2, 5,
    45,
    16, 6, 8, 16, 8, 6,
    9, 7,
    '1d6+2',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":3,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'grande',
    ARRAY['dungeon', 'esgoto', 'caverna'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gorgon (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gorgon',
    'Um touro de duas toneladas com couro de placas de aço natural que resistem a espadas convencionais como armadura de placa. Os olhos são vermelhos e furiosos, as narinas fumegam vapor levemente esverdeado que é pré-cursor do sopro petrificante. Trotam com som de armada de cavalaria e a carga levantaria paredes de fortaleza.

O sopro petrificante em cone transforma criaturas em estátuas de pedra perfeitas em poucos segundos. Um grupo que não monitora o carregamento de sopro — vapor verde crescente das narinas — descobrirá metade dos membros transformados em pedra antes de reagir. A petrifição total é irreversível sem magia específica de restauração.',
    ARRAY['monstrosity'],
    3, 9,
    5, 8,
    80,
    20, 6, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    1800,
    'grande',
    ARRAY['planície', 'colina'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Purple Worm (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Purple Worm',
    'Uma cobra de quinze metros de diâmetro de cor púrpura-cinza com mandíbulas que podem engolir um gigante inteiro em resultado crítico de mordida e um ferrão caudal do tamanho de uma lança que injeta veneno de quantidade capaz de derrubar elefante. Escava através de qualquer rocha a trinta pés por turno, criando os túneis que muitas masmorras do Umbraterra utilizam.

O verme roxo é uma catástrofe ambulante no Umbraterra: sem veneno adequado, sem magia de área e sem posicionamento defensivo, grupos de nível médio são simplesmente esmagados. A mordida pode engolir vivo qualquer criatura de tamanho Médio ou menor em acerto crítico — dentro do corpo, o digestivo começa imediatamente.',
    ARRAY['monstrosity'],
    6, 9,
    8, 12,
    190,
    29, 7, 5, 29, 5, 6,
    22, 15,
    '2d10+5',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"7d8+9","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"7d6","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    13000,
    'gargantuesco',
    ARRAY['underdark profundo'],
    '{}',
    '{}',
    '{"terrestre":40,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Xorn (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Xorn',
    'Um ser elemental de simetria radial perfeita: três pernas, três braços, três olhos e uma boca enorme no topo da cabeça em arranjo perfeitamente equidistante. A pele tem textura e cor de granito. Come metais e pedras preciosas com a mesma facilidade que humanos comem pão — literalmente mastigando ouro e rubis como snack enquanto passa por paredes de pedra como névoa.

Atravessar pedra sólida é movimento normal para o xorn — emerge de chão, paredes ou teto sem aviso. Detecta metais e gemas a noventa pés. Geralmente não ataca aventureiros a menos que eles carreguem metais preciosos que o xorn queira — e o querer do xorn é urgente e imediato.',
    ARRAY['elemental'],
    3, 9,
    5, 8,
    65,
    16, 7, 10, 16, 10, 6,
    11, 12,
    '2d6+2',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"4d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Escudo Primordial","descricao":"O monstro executa escudo primordial contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    1800,
    'medio',
    ARRAY['plano elemental da terra', 'mina'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Landshark (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Landshark',
    'Filhote do lendário bulete adulto, mas já com o tamanho de um pônei — uma bola de músculo e escamas de azul-aço com uma boca em espiral que ocupa quase metade da face frontal e dentes que triturariam pedregulhos. O jovem bulete ainda não aprendeu a controlar o apetite ou a selecionar presas com julgamento, atacando qualquer coisa do tamanho certo.

Perfura o chão como um projétil subaquático perfuraria água, emergindo sob os pés de inimigos sem aviso. Mesmo jovem, a mordida pode bipartir um aventureiro descuidado, e a resistência natural das escamas absorve a maioria dos golpes convencionais.',
    ARRAY['monstrosity'],
    2, 9,
    2, 5,
    30,
    12, 6, 10, 12, 10, 6,
    7, 8,
    '1d6+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'medio',
    ARRAY['planície arenosa'],
    '{}',
    '{}',
    '{"terrestre":30,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Batracolosso (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Batracolosso',
    'Um anfíbio aberrante de cinco metros de altura que parece rã mas com quatro tentáculos além das patas e uma língua muscular de vinte pés que se estende e retrai como chicote vivo. Os três olhos em pedúnculos movem-se independentemente. Parece criação de um mago que queria a rã mais aterrorizante possível e depois perdeu o controle do experimento.

Os tentáculos imobilizam múltiplos alvos simultaneamente, a língua arrasta presas isoladas para a boca enorme, e a mordida pode engolir criaturas de tamanho Médio inteiras. Imune a relâmpago — começa a caça a tempestade elétrica. Habita pântanos profundos onde o ambiente restrito elimina a vantagem de mobilidade dos adventureiros.',
    ARRAY['monstrosity'],
    4, 9,
    7, 10,
    140,
    26, 7, 6, 26, 6, 6,
    18, 14,
    '2d8+4',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque Múltiplo","descricao":"O monstro executa ataque múltiplo contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['eletricidade'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    5900,
    'enorme',
    ARRAY['pântano', 'selva aquática'],
    '{}',
    ARRAY['eletricidade'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Grick (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Grick',
    'Uma larva cilíndrica de dois metros com quatro tentáculos em torno da boca e pele que muda de cor e textura para imitar pedra com perfeição de camaleão especializado. Imóvel num corredor de dungeon, o grick é indistinguível de paredes ou colunas de pedra para observação casual. Ataca de surpresa de distâncias que parecem impossíveis dado o tamanho.

Resistência a dano não mágico significa que aventureiros sem acesso a magia ou prata ficam em combate prolongado e desgastante. A camuflagem natural em pedra torna o primeiro ataque garantidamente surpresa na maioria dos ambientes de dungeon. Habita salas de pedra que raramente têm outros ocupantes — é competição que eliminou.',
    ARRAY['monstrosity'],
    2, 9,
    2, 5,
    30,
    12, 6, 10, 12, 10, 6,
    7, 8,
    '1d6+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'medio',
    ARRAY['dungeon', 'caverna'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Elementais e Genios (18 monstros)
-- =============================================================================

-- Elemental de Fogo (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Elemental de Fogo',
    'Uma forma humanoide de fogo vivo: chamas que se organizam em silhueta de braços, torso e cabeça sem rostos definidos, com núcleo de brancura intensa no centro e bordas de laranja e amarelo que ondulam com cada passo. O chão sob os pés estalha e escurece, madeira próxima fumega e papel queima espontaneamente a poucos metros de distância.

Movimento pelo fogo e chamas sem qualquer penalidade. Imune a todo dano de fogo. Vulnerável a água e dano de frio que o enfraquece visivelmente. O toque queima, e o elemental pode se espalhar por superfícies combustíveis ao redor para engajar múltiplos alvos indiretamente.',
    ARRAY['elemental'],
    3, 10,
    5, 8,
    80,
    20, 7, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Forma Instável","descricao":"O monstro executa forma instável contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    1800,
    'grande',
    ARRAY['plano elemental do fogo', 'vulcão'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Elemental de Água (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Elemental de Água',
    'Uma massa de água salgada ou doce em movimento autônomo no formato de humanoide ondulante, com espirais e bolhas que formam olhos vagos numa face que muda a cada segundo. A superfície onde se move fica molhada e escorregadia, e o som de água correndo é constante em sua presença mesmo em ambientes secos.

Engolfa criaturas na massa aquosa, submerge pulmões e sufoca do interior. Pode dispersar-se para atravessar aberturas pequenas antes de reconstituir forma humanoide. Resiste significativamente a dano de fogo, tendo água como substrato físico.',
    ARRAY['elemental'],
    3, 10,
    5, 8,
    80,
    20, 7, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Explosão Primordial","descricao":"O monstro executa explosão primordial contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    1800,
    'grande',
    ARRAY['plano elemental da água', 'lago', 'rio'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Elemental de Terra (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Elemental de Terra',
    'Uma massa de rocha, terra e mineral que assume forma humanoide apenas quando se move — estático, parece apenas uma formação de pedra irregular. Os olhos são dois buracos de sombra, os braços são colunas de granito sólido que pesam toneladas e os passos fazem o chão tremir em raio de dezenas de metros.

Escava pelo solo a velocidade apreciável, podendo surgir do chão onde não havia antes. Imune a relâmpago e veneno. Soco de pedra maciça que pode derrubar paredes. Lento mas praticamente imparável em linha reta.',
    ARRAY['elemental'],
    3, 10,
    5, 8,
    80,
    20, 7, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"2d8+5","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['eletricidade', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    1800,
    'grande',
    ARRAY['plano elemental da terra', 'caverna'],
    '{"nao-magico":0.5}',
    ARRAY['veneno'],
    '{"terrestre":35,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Elemental de Ar (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Elemental de Ar',
    'Uma turbulência visível — o ar que se condensa levemente para mostrar forma humanoide em espiral de vento, com relâmpagos ocasionais internos visíveis através da névoa. A temperatura cai alguns graus na presença imediata, e qualquer objeto não fixo ao redor tremula ou voa em direção ao vórtice quando o elemental se agita.

Voa a noventa pés por round com agilidade total em três dimensões. O turbilhão pode prender criaturas menores dentro da forma corporal. Imune a veneno. Resistência a dano não mágico de fontes físicas convencionais. Praticamente invulnerável a ataques de curto alcance a menos que o atacante voe.',
    ARRAY['elemental'],
    3, 10,
    5, 8,
    80,
    20, 7, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Explosão Primordial","descricao":"O monstro executa explosão primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Escudo Primordial","descricao":"O monstro executa escudo primordial contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    1800,
    'grande',
    ARRAY['plano elemental do ar', 'montanha alta'],
    '{"nao-magico":0.5}',
    ARRAY['veneno'],
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mephit de Magma (Tier 2, pequeno, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mephit de Magma',
    'Um demoniozinho de magma resfriado em forma de humanoide de meio metro, com superfície de lava solidificando e rachando para revelar brilho interno de fogo. Fala com voz de pedra rangendo e tem personalidade de criança travessa num corpo de destruição concentrada. O calor próximo a ele é tangível e desconfortável.

Cuspe magma em alvos a distância, e ao morrer explode em fragmentos de lava que queimam tudo ao redor. Pode ser convocado por rituais e serve como mensageiro entre planos ígneos. Sozinho é menor ameaça; em grupos de seis ou mais tornam-se presença de controle de área significativa.',
    ARRAY['elemental'],
    2, 10,
    1, 3,
    17,
    8, 6, 12, 8, 12, 6,
    4, 7,
    '1d6',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"2d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['fogo', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    100,
    'pequeno',
    ARRAY['vulcão', 'forja mágica'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mephit de Gelo (Tier 2, pequeno, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mephit de Gelo',
    'A versão ártica do mephit: forma de gelo translúcido com brilho interno azul-branco, voz de vidro quebrando e personalidade igualmente travessa mas com crueldade adicional de frio genuíno. O toque congela a pele, e uma área de cinco metros ao redor fica coberta de escarça em minutos de sua presença estacionária.

Sopro de frio em cone que pode congelar momentaneamente vítimas menores, e ao morrer explode em fragmentos de gelo cortante que atingem área ao redor. Imune a frio e veneno. A explosão de morte frequentemente causa mais dano que o combate em si.',
    ARRAY['elemental'],
    2, 10,
    1, 3,
    17,
    8, 6, 12, 8, 12, 6,
    4, 7,
    '1d6',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"2d4","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['gelo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    100,
    'pequeno',
    ARRAY['plano elemental do gelo', 'masmorra gelada'],
    '{}',
    ARRAY['frio'],
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Djinn (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Djinn',
    'Um ser de beleza e poder que faz personagens de histórias árabes parecerem modestos: quatro metros de altura com forma de coluna de vento visível da cintura para baixo, torso humanoide musculoso de pele azul-celeste, cabelos de nuvem branca e olhos de tempestade. A voz carrega o peso de quem concedeu desejos por milênios.

O djinn genuinamente bom — ou pelo menos neutro caótico em vez de maligno como o efreet. Pode conceder três Wishes como servo de quem o controlar, criar alimento e bebida à vontade, e lançar magias de vento e teleportação. Como inimigo, cria turbilhões de área, teleporta fora do alcance continuamente e é muito veloz.',
    ARRAY['elemental'],
    4, 10,
    7, 10,
    125,
    24, 8, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Nova Primordial","descricao":"O monstro executa nova primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    7200,
    'grande',
    ARRAY['plano elemental do ar', 'djinnabad'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Efreet (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Efreet',
    'Onde o djinn é ar e liberdade, o efreet é fogo e escravidão: quatro metros de forma humanoide de chamas contidas em pele negra-brilhante com chifres de fumaça, olhos de brasa incandescente e uma expressão de orgulho que nunca desaparece mesmo em servidão forçada. Habita a Cidade de Latão no Plano do Fogo e resiste visceralmente a ser controlado.

Concede Wishes com malícia interpretativa — tecnicamente cumpre o desejo mas da pior forma possível. Imune a todo fogo. Lança magias de fogo e teleportação. Como combatente, seus punhos são colunas de chama e ele não faz prisioneiros. O efreet de humor ruim é uma das criaturas mais perigosas para grupos de aventureiros.',
    ARRAY['elemental'],
    4, 10,
    7, 10,
    125,
    24, 8, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Forma Instável","descricao":"O monstro executa forma instável contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    7200,
    'grande',
    ARRAY['cidade de latão', 'plano do fogo'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dao (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dao',
    'Um gênio corpulento e sólido que parece esculpido em pedra polida de cor amarelo-ocre ou marrom-avermelhado, com detalhes de metal precioso incrustado naturalmente na pele. Colecionador obsessivo de pedras preciosas e minerais raros. Carrega martelo enorme ou maça de rocha. A personalidade é de comerciante que está sempre melhorando do negócio, especialmente para o próprio lado.

Escava e passa por pedra sólida. Lança terremoto e feitiços de pedra. Escraviza outras criaturas para trabalho em minas que comanda. Como servo forçado, cumpre ordens mas sempre busca lacunas para reverter a situação. Justo no sentido de mercado — se pago adequadamente, cumpre o combinado.',
    ARRAY['elemental'],
    4, 10,
    7, 10,
    125,
    24, 8, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Forma Instável","descricao":"O monstro executa forma instável contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Nova Primordial","descricao":"O monstro executa nova primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    7200,
    'grande',
    ARRAY['plano da terra', 'minas profundas'],
    '{}',
    '{}',
    '{"terrestre":35,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Marid (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Marid',
    'O gênio mais arrogante de todos: dezenas de metros de forma humanoide de água salgada com escamas iridescentes onde a pele deveria ser e um nariz levemente arqueado de desprezo permanente. Fala em terceira pessoa quando lembra de rebaixar-se à comunicação com mortais. Habita a imensidão do oceano primordial e considera qualquer espaço fechado uma indignidade.

Respira em qualquer meio, nada a velocidades impossíveis e lança magias de água e névoa. Pode conceder Wishes mas com o desprezo performático de quem faz enorme favor. O marid é mais fácil de lidar com bajulação extravagante que com ameaças — o ego pode ser explorado por negociadores espertos.',
    ARRAY['elemental'],
    4, 10,
    7, 10,
    125,
    24, 8, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"1d8","efeito":null,"cooldown":4,"chance":50},{"nome":"Forma Instável","descricao":"O monstro executa forma instável contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Nova Primordial","descricao":"O monstro executa nova primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    7200,
    'grande',
    ARRAY['oceano primordial', 'plano da água'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Salamander (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Salamander',
    'Uma serpente de fogo de seis metros com torso humanoide e braços acima do ponto onde a forma serpentina começa. A pele é de escamas de magma que brilham laranja-vermelho internamente, os olhos são chamas amarelas e a cauda enorme serve tanto de arma quanto de motor de movimento. Habita o Plano Elemental do Fogo e vem ao plano material para guerrear ou caçar.

A lança de fogo lança projéteis de magma a distância e a cauda envolve em constrição que queima e aperta simultaneamente. Imune a fogo. Vulnerável a frio que apaga o brilho interno progressivamente. Frequentemente comanda grupos de mephits de fogo como tropas básicas.',
    ARRAY['elemental'],
    3, 10,
    5, 8,
    80,
    20, 7, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"3d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'gelo', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    1800,
    'grande',
    ARRAY['plano do fogo', 'forja mágica'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Frost Salamander (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Frost Salamander',
    'A versão glacial da salamandra: maior, mais fria e mais silenciosa. Escamas de gelo que refletem o ambiente em azul-branco, olhos de cristal de quartzo sem calor interno e uma cauda que deixa rastro de gelo ao deslizar. Habita planos de gelo eterno onde a temperatura impossível é normalidade.

O sopro de gelo em cone de sessenta metros causa dano maciço e pode congelar vítimas menores. A constrição da cauda envolve e congela simultaneamente. Imune a todo frio. A temperatura que emite é suficientemente baixa para fazer armadura metálica dolorosamente fria ao toque.',
    ARRAY['elemental'],
    4, 10,
    6, 9,
    115,
    24, 8, 6, 24, 6, 6,
    16, 12,
    '2d6+4',
    '[{"nome":"Explosão Primordial","descricao":"O monstro executa explosão primordial contra seu alvo.","tipo":"ofensiva","dano":"12d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Escudo Primordial","descricao":"O monstro executa escudo primordial contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Nova Primordial","descricao":"O monstro executa nova primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'gelo', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    5000,
    'enorme',
    ARRAY['plano do gelo', 'ártico'],
    '{}',
    ARRAY['frio'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Invisible Stalker (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Invisible Stalker',
    'Não existe visualmente — é ausência de forma no ar, levemente perceptível em noites úmidas quando condensa vapor ao redor de si. O som de vento quando está próximo é o único aviso sensorial disponível sem detecção mágica. Age com propósito e determinação de assassino contratado que nunca falhou em missão.

Convocado por mago para perseguir um alvo específico, o perseguidor invisível rastreia com capacidade infalível — sente a posição do alvo de qualquer distância no plano material. Não para, não negocia, não dorme, não desiste. A única forma de terminar a missão é destruí-lo ou negociar com o mago que o invocou.',
    ARRAY['elemental'],
    3, 10,
    5, 8,
    65,
    16, 7, 10, 16, 10, 6,
    11, 12,
    '2d6+2',
    '[{"nome":"Explosão Primordial","descricao":"O monstro executa explosão primordial contra seu alvo.","tipo":"ofensiva","dano":"2d6+6","efeito":null,"cooldown":3,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    2300,
    'medio',
    ARRAY['qualquer (convocado)'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Guardião Pétreo (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Guardião Pétreo',
    'Uma pedra com rostos. Literalmente — o galeb duhr parece uma pedra ou rocha grande irregular até um observador muito próximo notar os olhos entalhados e a boca que fala. Quando completamente imóvel, Furtividade de +8 torna o engano perfeito para passagem casual. Habita formações rochosas naturais e defende-as com a violência territorial de quem acredita que a pedra pertence a ele.

Anima pedras ao redor como soldados, rola sobre inimigos causando dano de esmagamento, e pode fazer a pedra do chão e das paredes responderem. A batalha contra galeb duhrs em ambientes rochosos é batalha contra o ambiente completo.',
    ARRAY['elemental'],
    3, 10,
    5, 8,
    65,
    16, 7, 10, 16, 10, 6,
    11, 12,
    '2d6+2',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Instável","descricao":"O monstro executa forma instável contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    2300,
    'medio',
    ARRAY['montanha', 'caverna'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Azers (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Azers',
    'Anões de fogo literais: corpo e pele de anão, mas com cabeça e barba de chamas que não consomem seu corpo mas consomem qualquer outro material que toquem. Trabalham em forjas sobre o Plano Elemental do Fogo criando armamentos de qualidade incomparável que ocasionalmente chegam ao plano material por comércio extraplanar.

O corpo em chamas deles causa queimaduras ao toque — qualquer combate corpo a corpo é automaticamente punido pelo calor. Imunes a fogo e veneno. O martelo de guerra é ferramenta de ofício e arma funcional. São trabalhadores civis do plano de fogo, não soldados — mas trabalhadores que não aceitam invasão de oficina.',
    ARRAY['elemental'],
    2, 10,
    2, 5,
    30,
    12, 7, 10, 12, 10, 6,
    7, 8,
    '1d6+2',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"1d10","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6"},"cooldown":3,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'epico'],
    450,
    'medio',
    ARRAY['plano do fogo', 'forja demoníaca'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Water Weird (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Water Weird',
    'Um serpente d''água que habita fontes, poços e piscinas mágicas, invisível quando submersa e visível quando emerge em ataque como serpente d''água sinuosa de três metros. Guarda a fonte que habita com devoção silenciosa, atacando qualquer criatura que se aproxime sem a senha ou ritual de passagem específico do criador original.

Constrição que arrasta a vítima para dentro d''água para afogamento. Invisível dentro da água — o primeiro ataque é sempre surpresa para quem não sabe que existe. Resistência ao dano não mágico fora do ambiente aquático.',
    ARRAY['elemental'],
    3, 10,
    3, 7,
    60,
    18, 7, 8, 18, 8, 6,
    11, 9,
    '1d8+2',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    700,
    'grande',
    ARRAY['lagos', 'fontes', 'piscinas mágicas'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mud Mephit (Tier 2, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mud Mephit',
    'Criatura de lama viva do tamanho de uma criança com asas inutilmente pequenas que ainda assim a mantêm levemente suspensa, rosto que sorri com toda a autoconfiança de algo que sabe que é literalmente impossível de sujar ainda mais. A lama que compõe o corpo torna-a pegajosa ao toque e a superfície está sempre em lento movimento.

A explosão ao morrer cobre uma área de dois metros em lama que desacelera quem estiver no raio. Pode convocar outro mephit de lama e o sopro de lama pode cegar temporariamente. Criaturas completamente imersas em lama por um mephit morto descobrem-se quase imóveis, o que é muito mais perturbador que parece.',
    ARRAY['elemental'],
    1, 10,
    1, 3,
    17,
    8, 6, 12, 8, 12, 6,
    4, 7,
    '1d6',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":2,"chance":50}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    50,
    'pequeno',
    ARRAY['pântano', 'lama'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Steam Mephit (Tier 2, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Steam Mephit',
    'Um mephit feito de vapor superaquecido visível como névoa densa branca, com olhos de vapor mais quente que criam um efeito de brilho de dentro para fora. A temperatura ao redor de um steam mephit é genuinamente perigosa: aproximar-se demais causa queimaduras mesmo antes de qualquer ataque deliberado.

A explosão ao morrer cria uma nuvem de vapor superaquecido que causa dano em toda a área. O sopro de vapor pode queimar e cegar simultaneamente. Encontrar múltiplos steam mephits em espaço fechado cria rapidamente temperaturas de forno que drenam a capacidade de combate de grupos sem proteção específica.',
    ARRAY['elemental'],
    1, 10,
    1, 3,
    17,
    8, 6, 12, 8, 12, 6,
    4, 7,
    '1d6',
    '[{"nome":"Golpe Elemental","descricao":"O monstro executa golpe elemental contra seu alvo.","tipo":"ofensiva","dano":"2d4","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico'],
    50,
    'pequeno',
    ARRAY['fontes termais', 'vulcão'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Criaturas Miticas e Lendarias (19 monstros)
-- =============================================================================

-- Kraken (Tier 9, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Kraken',
    'O horror do oceano profundo: um cefalópode de proporções continentais com dez tentáculos de trinta metros de comprimento, bico central que pode partir cascos de navio, e olhos do tamanho de portas que brilham com bioluminescência azul nas profundezas. A sua presença gera tempestades locais por simples agitação da água superficial com movimento.

Os tentáculos alcançam navios inteiros e os partem; o relâmpago que lança a distância afunda o que os tentáculos poupam. Imune a relâmpago. Para aventureiros em barco, representa encontro onde o ambiente é inimigo igual à criatura. Criaturas deste calibre são lendas que civilizações inteiras constroem mitologias para explicar.',
    ARRAY['monstrosity'],
    6, 11,
    9, 14,
    240,
    31, 8, 5, 31, 5, 6,
    24, 17,
    '3d8+6',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"3d6+9","efeito":null,"cooldown":5,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Destruição","descricao":"O monstro executa destruição contra seu alvo.","tipo":"ofensiva","dano":"3d8+9","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['eletricidade'],
    ARRAY['fantasia', 'epico', 'medieval'],
    50000,
    'gargantuesco',
    ARRAY['oceano profundo'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Leviathan (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Leviathan',
    'A serpente do mar da tradição hebraica transposta para fantasia: uma serpente aquática de escala planetária que dorme no fundo dos oceanos mais profundos e cujo simples movimento ao virar cria ondas que alcançam costas a quilômetros. Não é agressiva — simplesmente existe em escala que torna preocupações mortais irrelevantes.

Criatura primordial de antes da organização do plano material, o Leviathan não é um encontro no sentido convencional. É um evento geológico que aventureiros são testemunhas, não participantes. Mobilizar-se contra ele requer poder de escala divina.',
    ARRAY['elemental'],
    6, 11,
    8, 12,
    190,
    29, 8, 5, 29, 5, 6,
    22, 15,
    '2d10+5',
    '[{"nome":"Explosão Primordial","descricao":"O monstro executa explosão primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Escudo Primordial","descricao":"O monstro executa escudo primordial contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Cataclismo","descricao":"O monstro executa cataclismo contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['gelo', 'veneno', 'psiquico'],
    ARRAY['fantasia', 'epico', 'medieval'],
    25000,
    'gargantuesco',
    ARRAY['oceano abissal'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Behemoth (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Behemoth',
    'O equivalente terrestre do Leviathan: uma besta quadrúpede de escala impossível cuja existência define o limite do que o plano material pode conter numa forma física única. Ossos de ferro, tendões de pedra, cada passo cria tremores de terra mensuráveis a dezenas de quilômetros. Não precisa ser agressivo — tudo ao redor simplesmente é destruído pela existência física.

Como o Leviathan, é evento natural de escala geológica mais que criatura convencional. A mitologia hebraica o coloca como irmão do Leviathan, ambos criados no quinto dia antes de qualquer outra criatura — primeiros e maiores de tudo que veio depois.',
    ARRAY['monstrosity'],
    6, 11,
    8, 12,
    190,
    29, 7, 5, 29, 5, 6,
    22, 15,
    '2d10+5',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'epico', 'medieval'],
    20000,
    'gargantuesco',
    ARRAY['planície primordial'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Remorhaz (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Remorhaz',
    'Uma lagartixa ártica de oito metros com cristais de gelo naturalmente fundidos na carapaça dorsal que emitem calor sobrenatural contradizendo o ambiente glacial que habita. O interior do corpo é uma fornalha biológica que supera qualquer fundição humana, e a mordida engole presas que literalmente começam a cozinhar por dentro antes de chegar ao estômago.

O corpo superaquecido causa queimadura grave a qualquer criatura que o toque em combate corpo a corpo. Engolir uma criatura viva significa submetê-la a dano de fogo por rodada a partir do digestivo. Em tundra ártica, é o predador de topo sem competição — nada sobrevive ao frio e depois ao remorhaz.',
    ARRAY['monstrosity'],
    4, 11,
    7, 10,
    140,
    26, 7, 6, 26, 6, 6,
    18, 14,
    '2d8+4',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"6d6","efeito":null,"cooldown":4,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição","descricao":"O monstro executa destruição contra seu alvo.","tipo":"ofensiva","dano":"3d6","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'epico', 'medieval'],
    7200,
    'enorme',
    ARRAY['tundra ártica'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Naga Espiritual (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Naga Espiritual',
    'Uma serpente de seis metros com rosto humano de feições femininas que nunca abandona a expressão de arrogância de quem dominou magia por séculos. As escamas são de verde-escuro ou preto com iridescência. Os olhos hipnóticos possuem profundidade hipnótica real. A voz é de mulher de meia-idade de autoridade incontestável disfarçada de suavidade.

Conjuradora de nível 10 numa forma que nunca ficou exposta como os magos humanos ficam: sem corpo para cansaço, veneno natural na mordida, e Rejuvenescimento que a faz ressurgir em dias após morte. Guarda templos abandonados como se fossem sua propriedade sagrada, porque na perspectiva dela, são.',
    ARRAY['monstrosity'],
    4, 11,
    6, 9,
    100,
    22, 7, 8, 22, 8, 6,
    15, 13,
    '2d6+4',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+2"},"cooldown":4,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque Múltiplo","descricao":"O monstro executa ataque múltiplo contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'epico', 'medieval'],
    3900,
    'grande',
    ARRAY['dungeon', 'templo abandonado'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Naga Guardiã (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Naga Guardiã',
    'Uma naga de bom alinhamento — uma serpente de seis metros com rosto humano de expressão vigilante mas não maliciosa, escamas douradas ou azul-turquesa que brilham com luz interna de benevolência mágica. Guarda locais sagrados como dever genuíno, não por orgulho — e distingue entre intrusos que devem ser detidos e peregrinos que devem ser guiados.

Conjuradora divina que usa magia de cura e proteção com a mesma facilidade que veneno. O cuspe venenoso é disuasivo, não predatório. Uma naga guardiã que aceite aventureiros como aliados oferece acesso a locais sagrados, informação de anos de observação e proteção mágica de clérigo de alto nível.',
    ARRAY['celestial'],
    4, 11,
    7, 10,
    125,
    24, 16, 8, 24, 8, 16,
    17, 15,
    '2d8+4',
    '[{"nome":"Smite Divino","descricao":"O monstro executa smite divino contra seu alvo.","tipo":"ofensiva","dano":"3d8","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+2"},"cooldown":4,"chance":50},{"nome":"Cura Divina","descricao":"O monstro executa cura divina contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Pilar de Luz","descricao":"O monstro executa pilar de luz contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['veneno', 'radiante', 'psiquico'],
    ARRAY['fantasia', 'epico', 'medieval'],
    5900,
    'grande',
    ARRAY['templo sagrado'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Aboleth Sorcerer (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Aboleth Sorcerer',
    'Um aboleth que além da telepáia ancestral desenvolveu magia arcana ao longo de milênios, criando um ser capaz de dominar mentes e destruir corpos ao mesmo tempo com poder de dois eixos independentes. O corpo é idêntico ao aboleth comum mas as vesículas de muco ao redor do corpo são ligeiramente mais densas e brilhantes, concentradas pelo foco arcano adicional.

Lança feitiços de alto nível enquanto mantém múltiplas escravidões psíquicas simultâneas, criando exércitos de servos que atacam aventureiros enquanto ele permanece em segurança no fundo do lago ou caverna submersa. A combinação de resistência arcana ancestral com poder de conjurador avançado o torna um dos adversários mais difíceis de abordar sem estratégia múltipla e detalhada.',
    ARRAY['besta'],
    6, 11,
    8, 12,
    165,
    26, 5, 8, 26, 8, 4,
    20, 17,
    '2d10+5',
    '[{"nome":"Garras Afiadas","descricao":"O monstro executa garras afiadas contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Despedaçar","descricao":"O monstro executa despedaçar contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico', 'medieval'],
    18000,
    'grande',
    ARRAY['oceano profundo', 'lago subterrâneo'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Phoenix (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Phoenix',
    'Uma ave de proporções impossíveis de ser comum — o envergadura de uma casa — com plumagem que é literalmente fogo organizado em padrão de penas, cauda de chamas que traça arcos brilhantes no ar e um canto que soa como cristal e fogo simultaneamente. A temperatura ao redor sobe dramaticamente na presença de uma fênix em voo.

Ao ser destruída, colapsa em pilha de cinzas que dentro de horas ou dias reconstituem a fênix completamente — a ressurreição de cinzas é literal, não metafórica. Imune a todo fogo. Cura aliados com o calor que emite. A aura de chamas ao redor do corpo queima continuamente qualquer criatura próxima.',
    ARRAY['elemental'],
    6, 11,
    8, 12,
    180,
    28, 8, 6, 28, 6, 6,
    21, 16,
    '2d10+5',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Absorção Elemental","descricao":"O monstro executa absorção elemental contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Nova Primordial","descricao":"O monstro executa nova primordial contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['fogo', 'psiquico'],
    ARRAY['fantasia', 'epico', 'medieval'],
    15000,
    'enorme',
    ARRAY['vulcão', 'deserto quente'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sea Serpent (Tier 7, gargantuesco, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sea Serpent',
    'Um réptil aquático de tamanho impossível cujo pescoço sozinho tem a envergadura de navio mercante. A cor varia de verde-escuro a azul-marinho dependendo das profundidades que habita habitualmente. Os olhos são grandes e amarelos com pupila vertical que registra objetos na superfície a grande distância. Raramente visto, frequentemente temido.

Capaz de enrolar o corpo ao redor de navios e afundá-los com constrição pura ou simplesmente colidindo. A mordida abre cascos de madeira como papel. Não é necessariamente agressiva — ataca quando seus territórios oceânicos são invadidos repetidamente ou quando estímulos específicos disparam resposta predatória.',
    ARRAY['monstrosity'],
    4, 11,
    7, 10,
    150,
    27, 7, 5, 27, 5, 6,
    19, 13,
    '2d8+4',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição","descricao":"O monstro executa destruição contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'epico', 'medieval'],
    8400,
    'gargantuesco',
    ARRAY['oceano aberto'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Jörmungandr (Tier 2, colossal, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Jörmungandr',
    'A Serpente do Mundo da mitologia nórdica: serpente de tamanho planetário que envolve o oceano mundial com seu próprio corpo e morde a própria cauda. O inimigo natural e destino de Thor. Quando Ragnarök começa, Jörmungandr solta a cauda — o que significa que toda mitologia nórdica gira parcialmente ao redor de manter a serpente ocupada mordendo a si mesma.

Como encontro: impossível no sentido convencional. É um evento cosmológico que move o mundo. O veneno que exala pode matar deuses. A dimensão dos objetivos de aventureiros que envolvem Jörmungandr não é ''derrotá-lo'' mas ''encontrar a profecia que modifica seu papel'' — ou correr.',
    ARRAY['monstrosity'],
    1, 11,
    1, 3,
    72,
    18, 5, 4, 18, 4, 6,
    9, 3,
    '1d6',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'epico', 'medieval'],
    50,
    'colossal',
    ARRAY['oceano mundial'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Minotauro (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Minotauro',
    'Um humanoide de dois metros de cabeça de touro sobre corpo de humano musculoso — cornos que apontam para frente, mandíbulas que podem triturar osso, a expressão de fúria canalizada que nunca desliga completamente. O machado duplo que carrega parece pequeno nas mãos que o seguram. Habita labirintos que constrói ou é colocado para guardar.

Nunca se perde em labirinto — o faro de labirinto é orientação perfeita em qualquer estrutura de corredores, tornando tentativas de confundi-lo inúteis. A carga em linha reta derruba alvos grandes com força de impacto de touro adulto. Em labirinto fechado, combinar orientação perfeita com força bruta o torna quase imbatível para grupos que não têm o mesmo nível de mobilidade.',
    ARRAY['monstrosity'],
    3, 11,
    3, 7,
    60,
    18, 6, 8, 18, 8, 6,
    11, 9,
    '1d8+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'epico', 'medieval'],
    700,
    'grande',
    ARRAY['labirinto', 'dungeon'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Medusa (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Medusa',
    'Figura feminina de proporções perfeitas com cabelos que são cobras vivas e independentes enroladas na cabeça, cada uma reagindo ao ambiente separadamente. Os olhos são a única parte que não pode ser vista em segurança: um olhar direto petrifica progressivamente, iniciando pelos pés e subindo em segundos. A pele tem qualidade pálida e fria de alguém que passou muito tempo em ambientes sem luz natural.

O maior perigo da medusa é a distância de segurança impossível de determinar: o alcance da petrifação pelo olhar é de trinta metros, mas combatê-la sem olhar diretamente significa lutar às cegas ou através de reflexos, ambos com desvantagens severas. As serpentes do cabelo mordem independentemente enquanto ela usa os olhos como arma principal.',
    ARRAY['monstrosity'],
    3, 11,
    5, 8,
    65,
    16, 6, 10, 16, 10, 6,
    11, 12,
    '2d6+2',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"4d4+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'epico', 'medieval'],
    2300,
    'medio',
    ARRAY['ruínas', 'templo esquecido'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cyclops Elder (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cyclops Elder',
    'Um ciclope que viveu séculos o suficiente para desenvolver a visão profética intermitente em algo mais confiável — vê o futuro em flashes regulares que informam suas decisões de forma sobrenatural. O tamanho aumentou com a idade, os chifres cresceram em curva dramática e a clava de pedra tem marca de uso de gerações de inimigos.

A sabedoria acumulada combinada com força física ainda enorme e profecias intermitentes torna o ancião um oponente genuinamente estratégico além de fisicamente assustador. Civilizações costeiras o consultam como oráculo — o que significa que tem informação sobre todos que o visitaram.',
    ARRAY['gigante'],
    4, 11,
    7, 10,
    140,
    26, 10, 6, 26, 6, 8,
    18, 14,
    '2d8+4',
    '[{"nome":"Pisoteamento","descricao":"O monstro executa pisoteamento contra seu alvo.","tipo":"ofensiva","dano":"4d8+9","efeito":null,"cooldown":4,"chance":50},{"nome":"Pele Rochosa","descricao":"O monstro executa pele rochosa contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Terremoto","descricao":"O monstro executa terremoto contra seu alvo.","tipo":"ofensiva","dano":"4d10+9","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'epico', 'medieval'],
    8400,
    'enorme',
    ARRAY['ilha', 'montanha'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Nue (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Nue',
    'Criatura da mitologia japonesa que combina cabeça de macaco, corpo de tanuki, patas de tigre e cauda de cobra — e que, na fantasia, adiciona a capacidade de voar sem asas explícitas. A névoa sobrenatural que emana causa mal-estar e insônia em humanos que dormem próximos, sem contato físico necessário. O mero sonho de uma nue passando pode deixar uma pessoa doente por dias.

Usa transformação para se misturar a populações antes de atacar. A névoa psíquica age à distância, desgastando vítimas sem confronto direto. Em combate, a combinação de fúria de felino com veneno de cobra e a imprevisibilidade de macaco cria oponente que não tem modo de combate único a ser aprendido.',
    ARRAY['monstrosity'],
    3, 11,
    5, 8,
    80,
    20, 6, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'epico', 'medieval'],
    1800,
    'grande',
    ARRAY['floresta densa', 'montanha'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sleipnir (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sleipnir',
    'O cavalo de Odin: oito patas em arranjo de quatro pares que permite velocidade impossível em qualquer terreno — terra, ar, água ou planos. Pele cinza-prata, olhos de tempestade e uma inteligência que supera cavalos normais tão completamente quanto um inteligente filósofo supera uma ostra. Carregou Odin ao Hel e de volta mais vezes do que Odin admite.

As oito patas permitem Plane Shift à vontade — literalmente correr de um plano para outro sem ritual ou portal. Velocidade de oitenta pés em qualquer meio. Invencível em corrida não tem exceção detectada. Como montaria para aventureiro, é infinitamente superior a tudo que existe. Como criatura independente, vai e vem de acordo com vontade própria.',
    ARRAY['besta', 'celestial'],
    4, 11,
    7, 10,
    125,
    24, 5, 8, 24, 8, 4,
    17, 15,
    '2d8+4',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ataque em Salto","descricao":"O monstro executa ataque em salto contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'epico', 'medieval'],
    5900,
    'grande',
    ARRAY['asgard', 'plano astral'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cerberus (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cerberus',
    'O cão de três cabeças que guarda o Hades: corpo de mastim de três metros de altura multiplicado em três pescoços terminados em cabeças com mandíbulas de ferro. Cada cabeça processa informação independentemente — uma dorme enquanto as outras vigiam, garantindo que a guarda nunca falhe. A cauda de serpente morde por conta própria.

O uivo de medo afeta toda criatura viva em campo largo. Três mordidas simultâneas em alvos diferentes ou concentradas no mesmo. Imune aos efeitos que envolvem a morte — nenhuma morte pode passar pelo Hades sem que ele saiba. A fraqueza clássica é música — a lira de Orfeu o adormeceu. Aventureiros deveriam trazer instrumento.',
    ARRAY['monstrosity'],
    6, 11,
    8, 12,
    180,
    28, 7, 6, 28, 6, 6,
    21, 16,
    '2d10+5',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":{"tipo":"medo","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'epico', 'medieval'],
    13000,
    'enorme',
    ARRAY['portão do hades', 'plano da morte'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Griffin of Doom (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Griffin of Doom',
    'Uma versão do grifo corrupta por entidade sombria — o que seria majestoso tornou-se sombrio. A plumagem que era dourada tornou-se enegrecida com reflexos violeta de energia negativa, os olhos que eram dourados tornaram-se vermelhos com fissura vertical de pupila de demônio, e o comportamento de caçador territorial tornou-se agressão obsessiva de criatura que ataca mesmo quando não tem fome.

As garras corrompidas injetam veneno de energia necrótica que não cura facilmente. A aura de medo afasta aliados animais e enfraquecer moral de humanóides. Difícil de negociar, difícil de intimidar — a entidade sombria que o corrompeu removeu os instintos de auto-preservação que tornavam o grifo normal manejável.',
    ARRAY['monstrosity'],
    4, 11,
    6, 9,
    100,
    22, 7, 8, 22, 8, 6,
    15, 13,
    '2d6+4',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+2"},"cooldown":4,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['veneno', 'sombrio'],
    ARRAY['fantasia', 'epico', 'medieval'],
    3900,
    'grande',
    ARRAY['montanha corrompida'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ziz (Tier 8, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ziz',
    'O irmão aéreo do Leviathan e do Behemoth: uma ave de tamanho incompreensível cujas asas, quando abertas, cobrem uma área de céu suficiente para escurecer uma região. Primo mitológico do roc mas de dimensão mítica genuína — criado no mesmo momento primordial como criatura de escala diferente da natureza ordinária.

As asas criam tempestades por simples batida — não intencionalmente, apenas como efeito de mover ar em volume equivalente a tornados. O voo a duzentos pés por round atravessa continentes em horas. Como o Leviathan e o Behemoth, é mais evento que encontro para a maioria dos grupos.',
    ARRAY['celestial', 'monstrosity'],
    6, 11,
    8, 12,
    190,
    29, 16, 5, 29, 5, 16,
    22, 15,
    '2d10+5',
    '[{"nome":"Smite Divino","descricao":"O monstro executa smite divino contra seu alvo.","tipo":"ofensiva","dano":"4d10+12","efeito":null,"cooldown":4,"chance":50},{"nome":"Escudo de Fé","descricao":"O monstro executa escudo de fé contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Ira Celestial","descricao":"O monstro executa ira celestial contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'epico', 'medieval'],
    11500,
    'gargantuesco',
    ARRAY['céu aberto', 'montanha muito alta'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Mortos-Vivos Especiais (13 monstros)
-- =============================================================================

-- Vampire Bride/Groom (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vampire Bride/Groom',
    'Vampiro criado especificamente por um mestre como companheiro eterno em vez de servo utilitário: a transformação foi mais cuidadosa, preservando mais da personalidade e aparência original, e o vínculo emocional com o criador é genuinamente real e profundo mesmo sendo sobrenatural. A beleza é preservada e amplificada pela transformação como presente deliberado.

Mais versátil que um spawn comum por causa da liberdade limitada que o criador concede, e mais motivada por manter o mestre seguro do que qualquer outra consideração. A lealdade não é escravidão mas devoção escolhida, o que a torna paradoxalmente mais perigosa: não pode ser usada contra o mestre através de manipulação emocional como um servo poderia.',
    ARRAY['morto-vivo'],
    4, 12,
    6, 9,
    85,
    18, 6, 10, 18, 10, 3,
    13, 14,
    '2d6+4',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Grito dos Mortos","descricao":"O monstro executa grito dos mortos contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    5000,
    'medio',
    ARRAY['cripta de vampiro', 'castelo'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Draug (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Draug',
    'Guerreiro nórdico que morreu na batalha e foi enterrado com seu navio e tesouros, recusando o descanso eterno por ódio dos vivos ou apego irracional ao ouro. A forma é distorcida pelo tempo e pela maldição: maior que em vida, pele da cor de cadáver bêbado em mar frio, com uma força que triplica no ambiente aquático de onde veio. O cheiro é de sal, algas e morte antiga.

A força e resistência do draug são amplificadas em água salgada ou perto de navios. A maldição que carrega pode reduzir a Força máxima de quem for atingido, e a forma que consegue tomar de névoa marinha torna-o impossível de ferir com armas não mágicas quando em modo de aproximação.',
    ARRAY['morto-vivo'],
    3, 12,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    2300,
    'medio',
    ARRAY['túmulo de guerreiro', 'barco naufragado'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Jack-o-Lantern Spirit (Tier 3, pequeno, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Jack-o-Lantern Spirit',
    'Uma abóbora esculpida animada pela magia de Samhain com chama verde ou laranja dentro que emite luz fria e serve de olhos e boca para o espírito que a habita. Flutua a altura de olhos humanos, girando lentamente, e a expressão esculpida nunca muda mas de alguma forma transmite diferentes emoções através do movimento do corpo inteiro.

A chama interna pode ser arremessada como projétil que causa dano de fogo e faz a abóbora temporariamente cega mas ainda funcional. A essência do espírito é a própria chama: apagá-la incapacita temporariamente o jack-o-lantern, mas a chama se reacende em segundos da energia sazonal que o alimenta em outubro.',
    ARRAY['morto-vivo'],
    2, 12,
    2, 5,
    25,
    10, 5, 12, 10, 12, 3,
    6, 9,
    '1d6+2',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    200,
    'pequeno',
    ARRAY['cemitério', 'área rural em outubro'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Hollow One (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Hollow One',
    'Uma criatura que parece um humanoide completamente normal até o momento em que é ferida e o interior oco é revelado: não há órgãos nem sangue, apenas escuridão dentro da casca de pele e osso. O hollow one é o resultado de uma alma que foi completamente consumida deixando apenas a carcaça animada por alguma força residual incompreensível.

Imune ao dano necrótico e psíquico por não ter alma que possa ser afetada. O vazio interior pode absorver objetos lançados contra ele que desaparecem no interior oco sem efeito. A perturbação de combater algo fisicamente humano que não sangra, não geme e não morre de formas normais é desgastante psicologicamente além do dano físico.',
    ARRAY['morto-vivo'],
    3, 12,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"medo","duracao":2,"dano_por_turno":null},"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1100,
    'medio',
    ARRAY['cidade grande', 'lugar de morte massiva'],
    '{}',
    ARRAY['charme'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Nightshade Vampire (Tier 7, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Nightshade Vampire',
    'Um vampiro que passou tempo suficiente no Umbrália que a transformação foi além do vampirismo padrão: as escamas de poder sombrio que o Umbrália imprime se adicionaram ao conjunto vampírico, criando algo que combina os poderes de ambos os estados. A pele é mais escura que qualquer vampiro comum e os olhos não refletem nenhuma luz.

Os poderes de sombra adicionados permitem teleporte entre sombras sem gasto de recurso, criação de escuridão mágica instantânea, e imunidade adicional ao dano radiante que normalmente afeta vampiros. Uma versão mais difícil de matar que um vampiro comum por ter a fragilidade à luz solar parcialmente mitigada pelo endurecimento do Umbrália.',
    ARRAY['morto-vivo'],
    4, 12,
    7, 10,
    110,
    20, 6, 10, 20, 10, 3,
    15, 16,
    '2d8+4',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão Necrótica","descricao":"O monstro executa explosão necrótica contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['fogo', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    7200,
    'medio',
    ARRAY['floresta morta', 'ruínas'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ghoul Lord (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ghoul Lord',
    'O ghoul que liderou e sobreviveu tempo suficiente para absorver poder suficiente dos devorados para ultrapassar os limites normais da espécie: maior, mais inteligente e com a fome transformada de necessidade biológica em poder mágico. A pele é mais escura que a dos ghouls comuns e os olhos têm uma qualidade de fogo frio que os menores não possuem.

A paralisia que causa é mais potente e dura mais, afetando mesmo criaturas que normalmente seriam imunes. Comanda matilhas de ghouls e ghasts com inteligência tática real, não apenas instinto de predador. A aura de terror que emana mantém as presas paralisadas de medo mesmo antes do primeiro contato físico.',
    ARRAY['morto-vivo'],
    4, 12,
    6, 9,
    85,
    18, 6, 10, 18, 10, 3,
    13, 14,
    '2d6+4',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d6+3","efeito":{"tipo":"paralisia","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Grito dos Mortos","descricao":"O monstro executa grito dos mortos contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['sombrio', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    5000,
    'medio',
    ARRAY['catacumba profunda'],
    '{}',
    ARRAY['charme'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Soul Eater (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Soul Eater',
    'Uma entidade de escuridão pura que não tem forma física própria além de um rosto vagamente definido no centro de uma nuvem de trevas em movimento constante. Existe exclusivamente para consumir almas humanas, sendo atraído por emoções fortes — medo, raiva, desespero — como uma mariposa à chama.

O dano que causa é exclusivamente à alma: cada ataque reduz o máximo de pontos de vida permanentemente até cura mágica específica. Criaturas mortas por um soul eater não podem ser ressuscitadas por meios convencionais porque literalmente não há alma para retornar. Imune a toda magia exceto sagrada e luz solar.',
    ARRAY['morto-vivo'],
    4, 12,
    6, 9,
    85,
    18, 6, 10, 18, 10, 3,
    13, 14,
    '2d6+4',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão Necrótica","descricao":"O monstro executa explosão necrótica contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['gelo', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    3900,
    'medio',
    ARRAY['plano da morte', 'dungeon profundo'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Werecreature (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Werecreature',
    'Em forma humana, aparência completamente normal com talvez apenas um detalhe fora do lugar: olhos ligeiramente mais reflexivos que o normal, cabelo mais espesso, unhas que parecem mais resistentes que deveriam. A transformação em forma híbrida revela o lado animal: dobra o tamanho, músculos que rasgariam qualquer roupa normal, e uma fome que não distingue entre inimigo e aliado.

A arma principal do licantropo em termos de impacto a longo prazo não é a força mas o contágio: arranhões que penetram a pele infectam a vítima com a maldição da licantropia. Sem Cure Disease lançado dentro de três dias, a vítima começa a transformar na próxima lua cheia. Prata é a única arma que causa dano completo.',
    ARRAY['humanoide', 'monstrosity'],
    3, 12,
    3, 7,
    45,
    14, 13, 10, 14, 10, 10,
    9, 10,
    '1d8+2',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Esquiva Tática","descricao":"O monstro executa esquiva tática contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    700,
    'medio',
    ARRAY['floresta', 'montanha', 'pântano'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Zombie Dragon (Tier 2, gargantuesco, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Zombie Dragon',
    'Um dragão que morreu e foi reanimado por necromância de alto poder: o corpo conserva o tamanho e a estrutura física do original, o que significa que mesmo como cadáver ambulante é uma ameaça de escala dracônica. As escamas estão enegrecidas pelo processo necrômantico e a carne visível entre elas tem cor de cadáver de semanas.

O sopro original é substituído por exalação de gás necrótico que drena vida em vez de causar dano elemental. Mantém garras, mordida e peso de impacto totais, perdendo apenas a velocidade aérea de dragão vivo. A imunidade de morto-vivo combina com a resistência física de corpo dracônico para criar um ser difícil de destruir por qualquer vetor único.',
    ARRAY['morto-vivo'],
    1, 12,
    1, 3,
    62,
    17, 4, 5, 17, 5, 3,
    9, 3,
    '1d6',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d6+1","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d4"},"cooldown":2,"chance":50}]',
    ARRAY['acido', 'veneno', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    50,
    'gargantuesco',
    ARRAY['dungeon de necromante', 'covil de dragão amaldiçoado'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Bone Naga (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Bone Naga',
    'Uma naga assassinada e reanimada como servo por um conjurador de alto poder: o esqueleto de cobra de cinco metros mantém a capacidade de movimento sinuoso completo e a cabeça conserva os dentes venenosos do original. Os ossos são mantidos unidos por energia necrômantica visível como ligamentos escuros translúcidos.

O veneno que os dentes ainda injetam causa necrose em vez do veneno natural original, e a naga pode conjurar magias de seu sacerdócio anterior mesmo em forma esquelética. Frequentemente encontrada guardando câmaras de lich ou servindo como guardião permanente de templos profanados.',
    ARRAY['morto-vivo'],
    3, 12,
    3, 7,
    60,
    18, 5, 8, 18, 8, 3,
    11, 9,
    '1d8+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6+1"},"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1100,
    'grande',
    ARRAY['dungeon', 'templo de naga morta'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Withered One (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Withered One',
    'Um ser humano que buscou imortalidade através de magia proibida de definhamento em vez de necromância completa: o corpo ainda vive, tecnicamente, mas encolheu ao mínimo absoluto de função vital. A pele é papel sobre osso, os olhos são enormes demais para o rosto reduzido, e a voz é um sussurro que parece vir de muito longe.

A longevidade foi alcançada ao custo de toda a humanidade física. O definhado drena vida de vítimas através do toque para se sustentar, e a magia que acumulou durante séculos de estudo é de escala considerável. A aparência pitosa é deliberadamente enganosa: o poder arcano dentro da carcaça definhada é genuinamente terrível.',
    ARRAY['morto-vivo'],
    3, 12,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"1d10","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico', 'sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    2900,
    'medio',
    ARRAY['ruínas de hospital ou manicômio'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vampire True Form (Tier 8, medio, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vampire True Form',
    'O que Vaszlav von Zarovich representa quando completamente sem restrições: o vampiro que foi o primeiro, aprisionado em Barovia por seu próprio pacto sombrio, com séculos de poder acumulado em isolamento forçado. A elegância de um conde europeu da Renascença envolve poder que faria qualquer vampiro comum parecer um aprendiz.

Não apenas vampiro mas senhor do domínio: em Barovia, literalmente controla o clima, o castelo e as criaturas de toda a região como extensões de sua vontade. A regeneração é tão rápida que ferimentos visíveis fecham em tempo real, e os poderes de encantamento reescrevem memórias em vez de apenas charmar. Derrotá-lo requer destruir o domínio tanto quanto o ser.',
    ARRAY['morto-vivo'],
    6, 12,
    8, 12,
    150,
    22, 6, 10, 22, 10, 3,
    18, 18,
    '2d10+5',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão Necrótica","descricao":"O monstro executa explosão necrótica contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    13000,
    'medio',
    ARRAY['castelo ravenloft', 'barovia'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Crypt Keeper (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Crypt Keeper',
    'Diferente do crypt thing que teletransporta, o crypt keeper é o espírito do sacerdote que consagrou a cripta original, ligado permanentemente ao lugar por escolha e dever. Aparece como figura translúcida de sacerdote em vestes de cerimônia que nunca ataca diretamente mas que invoca os mecanismos de defesa da cripta com eficiência de alguém que os projetou.

Arma armadilhas adormecidas, direciona mortos-vivos menores para posições táticas, e a profundidade do conhecimento que tem da cripta torna qualquer exploração uma caminhada num tabuleiro que ele projeta completamente. Pode ser apaziguado por ritual adequado, o que é frequentemente mais inteligente que tentar destruí-lo.',
    ARRAY['morto-vivo'],
    3, 12,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'terror', 'medieval'],
    1800,
    'medio',
    ARRAY['cripta nobre', 'mausoléu'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Criaturas de Outros Planos (15 monstros)
-- =============================================================================

-- Zerath Knight (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Zerath Knight',
    'A elite militar zerath no pico do treinamento marcial psíquico: armadura de prata astral forjada com métodos que combinam metalurgia e telecinese, espada longa prateada que conduz energia psíquica em cada golpe, e a postura de alguém que passou décadas matando sorvedores de mentes no Plano Astral. Os olhos de âmbar têm a qualidade de um predador que raramente encontra algo mais perigoso que ele.

A telecinese de combate permite ao cavaleiro mover aliados e inimigos fisicamente durante o combate, reorganizando o campo ao redor. A espada prateada que empunha pode ser usada para abrir rifts para o Plano Astral em emergências, e a imunidade a doenças e envelhecimento no Plano Astral se estende parcialmente ao plano material.',
    ARRAY['humanoide'],
    4, 13,
    6, 9,
    85,
    18, 14, 10, 18, 10, 10,
    13, 14,
    '2d6+4',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"2d8","efeito":null,"cooldown":4,"chance":50},{"nome":"Esquiva Tática","descricao":"O monstro executa esquiva tática contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Execução","descricao":"O monstro executa execução contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    3900,
    'medio',
    ARRAY['plano astral', 'spelljammer'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Leviatã Astral (Tier 9, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Leviatã Astral',
    'Um colosso de noventa metros que nada no Plano Astral como um tubarão em oceano profundo: corpo de crustáceo gigantesco, tentáculos de quilômetro, um único olho enorme que pode petrificar qualquer criatura que olhe para ele, e uma mandíbula que serve de portal dimensional quando aberta completamente. Existia antes do Plano Astral ser habitado e pode existir depois.

O estômago do astral dreadnought é um espaço dimensional separado onde o tempo não passa: aventureiros engolidos estão presos num bolso fora do tempo enquanto o Plano Astral ao redor continua normalmente. Escapar do interior requer magia de dimensão ou encontrar e destruir o mecanismo digestivo de um ser de escala quase cósmica.',
    ARRAY['besta'],
    6, 13,
    9, 14,
    240,
    31, 6, 5, 31, 5, 4,
    24, 17,
    '3d8+6',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+3"},"cooldown":5,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Ataque em Salto","descricao":"O monstro executa ataque em salto contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['eletricidade', 'veneno'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    33000,
    'gargantuesco',
    ARRAY['plano astral'],
    '{}',
    ARRAY['eletricidade'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Couatl (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Couatl',
    'Uma serpente de seis metros com asas de penas de todas as cores do espectro que brilham com luz própria, escamas de ouro-e-esmeralda e olhos de profundidade celestial que parecem conter bondade genuína e poder em partes iguais. A voz quando fala é de melodia que parece música e linguagem ao mesmo tempo, e a presença fisicamente aquece o ambiente ao redor.

O couatl é raro entre criaturas poderosas por ser genuinamente bom: usa seus poderes de leitura de pensamentos e visão verdadeira para identificar almas dignas de ajuda. A telepatia e a magia de sumo sacerdote que possui são usadas para curar, proteger e guiar. O veneno do couatl é anestésico, não letal — incapacita sem causar dano permanente.',
    ARRAY['celestial'],
    3, 13,
    3, 7,
    45,
    14, 15, 10, 14, 10, 16,
    9, 10,
    '1d8+2',
    '[{"nome":"Espada Radiante","descricao":"O monstro executa espada radiante contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d6+1"},"cooldown":3,"chance":50},{"nome":"Escudo de Fé","descricao":"O monstro executa escudo de fé contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    1100,
    'medio',
    ARRAY['selva tropical', 'templo sagrado'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Planetar (Tier 8, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Planetar',
    'Um anjo de quatro metros de altura com dois pares de asas que se dobram graciosamente quando não em voo, pele de uma cor esmeralda pálida que parece luz sólida, e olhos completamente brancos que irradiam paz perturbadora para quem não tem certeza de estar em paz com seus próprios atos. Porta uma espada longa flamejante de dois metros e meio de lâmina.

O planetar é o anjo de guerra e julgamento: onde o deva é mensageiro, o planetar é executor. Pode curar ferimentos graves com toque, ver a verdade oculta em qualquer situação através da visão verdadeira infalível, e a espada flamejante causa dano adicional de radiância a criaturas malignas. Imune a veneno, doença e encantamento.',
    ARRAY['celestial'],
    6, 13,
    8, 12,
    165,
    26, 16, 8, 26, 8, 16,
    20, 17,
    '2d10+5',
    '[{"nome":"Espada Radiante","descricao":"O monstro executa espada radiante contra seu alvo.","tipo":"ofensiva","dano":"5d8+7","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d6+3"},"cooldown":4,"chance":50},{"nome":"Cura Divina","descricao":"O monstro executa cura divina contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Pilar de Luz","descricao":"O monstro executa pilar de luz contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno', 'radiante', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    15000,
    'grande',
    ARRAY['monte celestia', 'chamado por deuses'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Solar (Tier 9, grande, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Solar',
    'O pico da hierarquia angélica abaixo dos próprios deuses: um ser de seis metros de asas de luz dourada tão pura que é fisicamente difícil de olhar diretamente, pele que literalmente emite luz branca, e uma presença que faz criaturas malignas recuarem involuntariamente. A espada que empunha pode destruir encantamentos com um toque e decapitar demônios com um arco.

O solar representa o poder divino no campo de batalha e suas habilidades refletem isso: ressurreição de mortos, invocação de tempestades de luz sagrada, e a capacidade de teleportar para qualquer lugar no multiverso à vontade. Serve apenas diretamente a divindades de bem, e ser escolhido como alvo de um solar significa ter cometido erros de escala cosmológica.',
    ARRAY['celestial'],
    6, 13,
    9, 14,
    215,
    28, 17, 8, 28, 8, 16,
    22, 19,
    '3d8+6',
    '[{"nome":"Smite Divino","descricao":"O monstro executa smite divino contra seu alvo.","tipo":"ofensiva","dano":"8d8+7","efeito":null,"cooldown":5,"chance":50},{"nome":"Cura Divina","descricao":"O monstro executa cura divina contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Ira Celestial","descricao":"O monstro executa ira celestial contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['radiante'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    33000,
    'grande',
    ARRAY['planos celestiais superiores'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Deva (Tier 7, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Deva',
    'O anjo mais próximo em aparência de humanos: forma humanóide de proporções perfeitas, asas brancas que cabem através de portas quando dobradas, e pele que tem uma luminosidade suave em vez da intensidade dos planetares e solares. Frequentemente adota forma humana para missões no plano material sem revelar a natureza verdadeira.

O deva é o mensageiro e o protetor de mortais específicos: carrega ordens divinas, protege sacerdotes escolhidos e guia heróis em missões críticas. A maça mágica que carrega causa dano adicional de radiância e pode aturdir criaturas malignas. A capacidade de mudar forma permite operação encoberta que outros anjos de maior poder não podem executar com a mesma subtileza.',
    ARRAY['celestial'],
    4, 13,
    7, 10,
    110,
    20, 16, 10, 20, 10, 16,
    15, 16,
    '2d8+4',
    '[{"nome":"Espada Radiante","descricao":"O monstro executa espada radiante contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Aura Sagrada","descricao":"O monstro executa aura sagrada contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Julgamento Divino","descricao":"O monstro executa julgamento divino contra seu alvo.","tipo":"ofensiva","dano":"4d8","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['radiante'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    5900,
    'medio',
    ARRAY['planos superiores', 'missões no plano material'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Shade (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Shade',
    'Um ser do Umbrália que alcançou poder suficiente para manter forma semi-sólida no plano material: parece um humanoide feito de sombra densa com bordas que sangram escuridão para o ar ao redor, sem feições exceto dois pontos de luz fria que servem de olhos. A temperatura cai visivelmente quando entra num ambiente e fontes de luz diminuem de intensidade.

A diferença entre shade e shadow comum é poder e inteligência: o shade planeja, comunica e usa os poderes de sombra com sofisticação estratégica que a sombra comum não possui. A incorporeidade completa no escuro torna-o imune a ataques físicos em ambientes sem iluminação adequada, e pode apagar qualquer fonte de luz não mágica simplesmente se aproximando.',
    ARRAY['morto-vivo'],
    3, 13,
    5, 8,
    65,
    16, 5, 10, 16, 10, 3,
    11, 12,
    '2d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['sombrio'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    2300,
    'medio',
    ARRAY['plano das sombras', 'shadowfell'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":30,"voo":50}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Venal Arcano (Tier 7, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Venal Arcano',
    'O bibliotecário e negociador dos venais: aparência de chacal humanóide de metro e noventa em vestes elaboradas de conjurador arcano, com pele de um amarelo-dourado suave e olhos de pena de pavão que transmitem inteligência de bibliophile combinada com ganância de advogado especializado em cláusulas impossíveis. Sempre carrega um grimório enorme.

O arcanaloth é um conjurador de alto nível que usa magia de ilusão e encantamento como preferência. Sua verdadeira ameaça é nos contratos: especializado em criar acordos com linguagem que parece favorável mas contém armadilhas que só aparecem no momento pior possível para a vítima. Negocia em nome de toda a raça venal com precisão que faz advogados humanos parecerem amadores.',
    ARRAY['fiend'],
    4, 13,
    7, 10,
    110,
    20, 16, 10, 20, 10, 12,
    15, 16,
    '2d8+4',
    '[{"nome":"Chama Infernal","descricao":"Chamas do abismo envolvem o alvo em fogo demoníaco.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura de Medo","descricao":"O monstro executa aura de medo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição Profana","descricao":"O monstro executa destruição profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    8400,
    'medio',
    ARRAY['hades', 'gehenna — mercenários neutros do mal'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Venal Supremo (Tier 7, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Venal Supremo',
    'O comandante militar dos venais: humanóide alto de pele acinzentada com olhos que são seis pontos de luz multicolorida organizados em padrão inseto, usados como arma de hipnose e controle. A armadura é de metal escuro não identificável e os movimentos têm a qualidade mecânica de alguém que apagou qualquer maneirismo humano como ineficiência desnecessária.

Os olhos hipnóticos podem paralisar ou charmar múltiplos alvos simultâneos, e o corpo do ultroloth é imune à maioria das magias por resistência desenvolvida em séculos de guerra planar. Comanda exércitos venais com a impessoalidade absoluta de um general que trata baixas como estatísticas e raramente é surpreendido por qualquer estratégia que já viu antes.',
    ARRAY['fiend'],
    4, 13,
    7, 10,
    110,
    20, 16, 10, 20, 10, 12,
    15, 16,
    '2d8+4',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fogo Infernal","descricao":"O monstro executa fogo infernal contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    10000,
    'medio',
    ARRAY['hades', 'gehenna'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Venal Inseto (Tier 5, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Venal Inseto',
    'Inseto humanóide de metro e oitenta com cabeça de besouro, exoesqueleto que serve de armadura natural e múltiplos braços articulados que tornam o posicionamento de armas complexo de acompanhar. É a infantaria pesada dos exércitos venais: abundante, resistente, mais inteligente que um soldado comum e absolutamente sem misericórdia.

As garras que usa em combate corpo-a-corpo são complementadas por uma névoa de gás venenoso que pode expelir cobrindo uma área. A resistência ao dano não mágico e as imunidades de venal padrão fazem do mezzoloth um oponente que drena recursos mesmo não sendo individualmente extraordinário.',
    ARRAY['fiend'],
    3, 13,
    5, 8,
    65,
    16, 15, 10, 16, 10, 12,
    11, 12,
    '2d6+2',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"3d8","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Aura de Medo","descricao":"O monstro executa aura de medo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['veneno'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    1800,
    'medio',
    ARRAY['hades', 'gehenna — soldado'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Venal Alado (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Venal Alado',
    'A infantaria aérea de elite dos venais: humanóide musculoso de dois metros e meio com asas de corvo que lhe permitem ataques de mergulho devastadores, garras que rasgam armaduras de placa, e uma machadinha que usa para criar feridas que se recusam a parar de sangrar. A pele verde-escura e a face brutalmente simplificada transmitem propósito sem pretensão.

O nycaloth pode teleportar a si mesmo e aliados próximos por curtas distâncias como tática de reposicionamento em combate. A combinação de mobilidade aérea com a capacidade de sangramentos que resistem à cura cria um padrão de combate que drena progressivamente mesmo oponentes resistentes.',
    ARRAY['fiend'],
    4, 13,
    6, 9,
    100,
    22, 16, 8, 22, 8, 12,
    15, 13,
    '2d6+4',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fogo Infernal","descricao":"O monstro executa fogo infernal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    5000,
    'grande',
    ARRAY['hades', 'gehenna — aereo'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Venal Farejador (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Venal Farejador',
    'O rastreador e explorador dos venais: baixo e quadrúpede com cara de hiena alargada, orelhas enormes capazes de captar sons a quilômetros de distância, e uma língua adesiva de cinco metros que usa como principal arma de captura. Os olhos têm visão de dezoito metros mesmo no escuro total absoluto.

A língua adesiva prende alvos e os puxa em direção ao canoloth com força suficiente para mover cavalos. Imune a teleporte e dimensionalidade mágica em sua área: qualquer tentativa de Misty Step ou Dimension Door dentro do raio do canoloth simplesmente falha, tornando-o o counter perfeito para grupos que dependem de mobilidade mágica.',
    ARRAY['fiend'],
    4, 13,
    6, 9,
    85,
    18, 16, 10, 18, 10, 12,
    13, 14,
    '2d6+4',
    '[{"nome":"Garra Demoníaca","descricao":"Garras afiadas como obsidiana rasgam armaduras.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fogo Infernal","descricao":"O monstro executa fogo infernal contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    3900,
    'medio',
    ARRAY['hades', 'gehenna — sentinela'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Venal Colosso (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Venal Colosso',
    'Um venal de aparência assimétrica perturbadora: um braço é de proporção humana normal e o outro é um tentáculo de quatro metros de comprimento e força suficiente para esmagar pedra. A assimetria reflete natureza dualista de mediador e bruto, o que é exatamente o papel que serve como supervisor de contratos venais no campo.

O braço gigantesco pode absorver pontos de vida de criaturas que toca, transferindo a energia vital para fortalecer o yagnoloth. A magia de relâmpago que usa distancia combatentes do braço-tentáculo enquanto o braço menor gerencia negociações impossíveis. Um ser que literalmente enfraquece você fisicamente enquanto negocia condições de rendição.',
    ARRAY['fiend'],
    4, 13,
    7, 10,
    125,
    24, 16, 8, 24, 8, 12,
    17, 15,
    '2d8+4',
    '[{"nome":"Garra Demoníaca","descricao":"Garras afiadas como obsidiana rasgam armaduras.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Escudo de Fogo","descricao":"O monstro executa escudo de fogo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fogo Infernal","descricao":"O monstro executa fogo infernal contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    7200,
    'grande',
    ARRAY['planos do mal neutro'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Celefante (Tier 5, minusculo, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Celefante',
    'Um elefante em miniatura com asas de borboleta douradas do tamanho de um gato, com presas de marfim puro que brilham levemente e olhos de uma bondade que desconcerta criaturas malignas. É um ser celestial genuinamente adorável que existe para missões específicas de proteção de mortais inocentes em situações desesperadoras.

O barrido do hollyphant causa dano de trovão em área, e pode criar barreiras de força que protegem múltiplas criaturas simultaneamente. Invoca instintivamente proteção divina quando um inocente está em perigo iminente, funcionando como alarme e escudo ao mesmo tempo. A aparência ridiculamente adorável mascara poderes que muitos anjos maiores não possuem.',
    ARRAY['celestial'],
    3, 13,
    5, 8,
    55,
    10, 15, 14, 12, 14, 16,
    9, 14,
    '2d6+2',
    '[{"nome":"Smite Divino","descricao":"O monstro executa smite divino contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura Sagrada","descricao":"O monstro executa aura sagrada contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'radiante'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    1800,
    'minusculo',
    ARRAY['planos celestiais', 'batalhas de avernus'],
    '{"nao-magico":0.5}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Zaratan (Tier 9, gargantuesco, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Zaratan',
    'Uma tartaruga de mar de tamanho descomunal com uma ilha completa desenvolvida no casco: árvores, pântanos, até construções abandonadas de marinheiros que não perceberam que não estavam em terra firme. O zaratan respira poucas vezes por hora e cada expiração é uma tempestade local. Os olhos são da cor do mar profundo e observam com a paciência de algo que conta tempo em gerações.

Quando finalmente acorda e ataca, o movimento da cabeça desfaz navios e o barrido da cauda cria maremotos. A principal dificuldade é que o zaratan não parece um inimigo até que já é tarde demais: aventureiros que acamparam no casco podem estar a quilômetros no mar quando ele finalmente mergulha.',
    ARRAY['elemental'],
    6, 13,
    9, 14,
    240,
    31, 9, 5, 31, 5, 6,
    24, 17,
    '3d8+6',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"6d10+10","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"2d8+3"},"cooldown":5,"chance":50},{"nome":"Escudo Primordial","descricao":"O monstro executa escudo primordial contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":6,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['veneno', 'psiquico'],
    ARRAY['fantasia', 'sombrio', 'epico'],
    41000,
    'gargantuesco',
    ARRAY['oceano', 'plano da terra/água'],
    '{}',
    ARRAY['veneno'],
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Plantas e Criaturas da Natureza (12 monstros)
-- =============================================================================

-- Treant (Tier 6, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Treant',
    'Uma árvore de dez metros que é também um ser senciente com séculos de memória e uma paciência de pedra. O rosto é formado pelos nós e marcas naturais do tronco, e os braços são galhos que podem se mover com a força de um gigante quando motivados. Em floresta profunda, parece exatamente uma árvore muito velha até o momento em que decide não parecer mais.

O treant pode animar outras duas árvores ao redor transformando a floresta em campo de batalha onde cada carvalho é um aliado potencial. Os galhos batem com força que derruba cavalaria, e a resistência ao dano de espada e lança é equivalente a madeira densa de séculos: requer fogo ou magia para dano eficiente.',
    ARRAY['plant'],
    4, 14,
    6, 9,
    115,
    24, 4, 6, 24, 6, 1,
    16, 12,
    '2d6+4',
    '[{"nome":"Chicote de Vinhas","descricao":"O monstro executa chicote de vinhas contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Regeneração Natural","descricao":"O monstro executa regeneração natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão de Pólen","descricao":"O monstro executa explosão de pólen contra seu alvo.","tipo":"ofensiva","dano":"4d10+9","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    5000,
    'enorme',
    ARRAY['floresta antiga'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vine Blight (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vine Blight',
    'Uma massa de videiras retorcidas que mantém vagamente a forma humanoide de um metro e oitenta: um torso de cipós entrelaçados, braços de ramos que se estendem e recolhem, e a capacidade de se misturar com a vegetação ao redor com perfeição que torna a identificação prévia uma sorte, não uma habilidade.

Os galhos que usa como braços constringem alvos com força de tornado em forma vegetal, enrolando-se ao redor de pescoços e troncos. Em grupos, vine blights criam uma rede de videiras no chão que imobiliza movimentos inteiros, tornando combate com múltiplos blights simultaneamente uma armadilha progressiva que se fecha ao redor do grupo.',
    ARRAY['plant'],
    2, 14,
    1, 3,
    22,
    10, 2, 10, 10, 10, 1,
    5, 6,
    '1d6',
    '[{"nome":"Chicote de Vinhas","descricao":"O monstro executa chicote de vinhas contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    100,
    'medio',
    ARRAY['pântano', 'floresta corrompida'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Needle Blight (Tier 2, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Needle Blight',
    'Uma criatura vegetal de metro de altura com a forma vagamente humanoide feita de agulhas de pinheiro sobrepostas, cada agulha apontada levemente para fora da superfície. Move-se em silêncio entre as coníferas e seu lançamento de agulhas cria uma chuva de projéteis vegetais que pode cobrir uma área surpreendentemente grande.

Individualmente é uma ameaça menor, mas blights raramente são encontrados sozinhos. Grupos de needle blights criam zonas de supressão através de lançamentos coordenados de agulhas que obrigam aventureiros a se moverem ou se cobrirem constantemente, permitindo que vine blights em maior distância avancem e constringam.',
    ARRAY['plant'],
    1, 14,
    1, 3,
    17,
    8, 2, 12, 8, 12, 1,
    4, 7,
    '1d6',
    '[{"nome":"Golpe de Raiz","descricao":"O monstro executa golpe de raiz contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    50,
    'pequeno',
    ARRAY['floresta corrompida'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Twig Blight (Tier 1, pequeno, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Twig Blight',
    'O menor dos blights vegetais: um metro de galhos secos retorcidos em forma de criança, com olhos de nós de madeira e dedos que são galhos literalmente. Individualmente é mais perturbador que perigoso, mas a perturbação tem valor tático real: parecer crianças vegetais causa hesitação que frações de segundo aproveitam.

Os galhos que usa para atacar constringem com força surpreendente para o tamanho, e a imunidade ao frio por ser vegetal seco é compensada por vulnerabilidade ao fogo. Em grupos de dezenas são barulhentos e perturbadores o suficiente para drenar recursos de aventureiros que os tratam levianamente.',
    ARRAY['plant'],
    1, 14,
    1, 2,
    10,
    6, 2, 12, 6, 12, 1,
    3, 5,
    '1d4+1',
    '[{"nome":"Esporos Tóxicos","descricao":"O monstro executa esporos tóxicos contra seu alvo.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['fogo'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    25,
    'pequeno',
    ARRAY['floresta', 'pântano'],
    '{}',
    '{}',
    '{"terrestre":25}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Shambling Mound (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Shambling Mound',
    'Uma pilha de vegetação apodrecida de dois metros de altura que se move: cipós, raízes, musgo e folhas decompostas organizados pela inteligência primitiva de uma coisa que quer absorver matéria orgânica. Praticamente invisível num pântano quando imóvel, identificável apenas pelo movimento não causado por vento.

O relâmpago cura o shambling mound em vez de machucá-lo, e conjuradores que usam magia elétrica descobrirão com horror que estão fortalecendo o inimigo. A constrição dos cipós pode imobilizar e sufocar criaturas engolidas, que são processadas de dentro para fora enquanto o monte absorve a matéria orgânica progressivamente.',
    ARRAY['plant'],
    3, 14,
    5, 8,
    80,
    20, 3, 8, 20, 8, 1,
    13, 11,
    '2d6+2',
    '[{"nome":"Golpe de Raiz","descricao":"O monstro executa golpe de raiz contra seu alvo.","tipo":"ofensiva","dano":"2d6+2","efeito":{"tipo":"veneno","duracao":3,"dano_por_turno":"1d8+1"},"cooldown":3,"chance":50},{"nome":"Camuflagem Florestal","descricao":"O monstro executa camuflagem florestal contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['fogo', 'eletricidade', 'veneno'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    1800,
    'grande',
    ARRAY['pântano', 'floresta úmida'],
    '{}',
    ARRAY['fogo'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Fungoide Adult (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Fungoide Adult',
    'Um cogumelo humanoide de um metro que se comunica exclusivamente através de esporos psiônicos liberados em nuvens coloridas: vermelho para alarme, verde para convite pacífico, azul para comunicação complexa. Os olhos são ausentes mas a percepção através de esporos cobre três metros ao redor com precisão total.

Os esporos de rapport permitem comunicação telepática e os esporos de animação revivem mortos frescos como zumbis fúngicos por breve período. Pacífico por natureza mas defende o círculo com determinação absoluta. Um encontro pacifico com fungoides pode revelar que sabem mais sobre o Umbraterra que qualquer outro informante disponível.',
    ARRAY['plant'],
    2, 14,
    1, 3,
    22,
    10, 2, 10, 10, 10, 1,
    5, 6,
    '1d6',
    '[{"nome":"Esporos Tóxicos","descricao":"O monstro executa esporos tóxicos contra seu alvo.","tipo":"ofensiva","dano":"2d8","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    100,
    'medio',
    ARRAY['underdark', 'caverna fúngica'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Fungoide Sovereign (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Fungoide Sovereign',
    'O mais velho e maior do círculo miconid: dois metros de cogumelo bioluminescente que serve de centro da rede psiônica coletiva que conecta todos os membros do círculo. Os esporos que libera alcançam toda a extensão da caverna e a consciência coletiva que facilita é descrita por quem a experimentou como pacífica e profunda de formas difíceis de articular.

Os esporos pacificantes do soberano podem tornar combatentes paralisados de paz temporária — literalmente incapazes de violência por minutos. O esporo animador criado pelo soberano persiste muito mais que o do adulto. Em batalha existencial, o soberano pode mobilizar o círculo inteiro numa resposta coordenada que é desorientante de sua escala coletiva.',
    ARRAY['plant'],
    2, 14,
    2, 5,
    45,
    16, 3, 8, 16, 8, 1,
    9, 7,
    '1d6+2',
    '[{"nome":"Golpe de Raiz","descricao":"O monstro executa golpe de raiz contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Regeneração Natural","descricao":"O monstro executa regeneração natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    450,
    'grande',
    ARRAY['underdark'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Corpse Flower (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Corpse Flower',
    'Uma flor de dois metros de diâmetro de pétalas cor de carne que exala odor de carniça em raio de cem metros. Cresce sobre cemitérios e campos de batalha antigos, as raízes penetrando os cadáveres para absorver os restos. Os cadáveres que contém podem ser expelidos como zumbis quando a flor se sente ameaçada.

A névoa de esporos tóxicos que emite quando agitada causa náusea e desorientação em raio grande. O mais perturbador: a flor lembra vagamente as faces dos cadáveres que absorveu, criando pétalas com traços humanos irreconhecíveis mas que causam desconforto profundo em quem os observa por tempo suficiente.',
    ARRAY['plant'],
    4, 14,
    6, 9,
    100,
    22, 4, 8, 22, 8, 1,
    15, 13,
    '2d6+4',
    '[{"nome":"Chicote de Vinhas","descricao":"O monstro executa chicote de vinhas contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Regeneração Natural","descricao":"O monstro executa regeneração natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Tempestade de Esporos","descricao":"O monstro executa tempestade de esporos contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    3900,
    'grande',
    ARRAY['pântano', 'cemitério corrompido'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Yellow Musk Creeper (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Yellow Musk Creeper',
    'Uma planta parasitária de aspecto inofensivo de flores amarelas aromáticas que pendura de ruínas e árvores de florestas antigas. O perfume que exala tem propriedades hipnóticas que atraem criaturas para perto das hastes, onde o contato injeta esporos no cérebro através de filamentos finos que penetram pela orelha ou nariz.

Vítimas infectadas pelos esporos tornam-se zumbis vegetais que a planta controla diretamente, usando os corpos para coletar mais vítimas. Em tempo suficiente, um zumbi de yellow musk creeper desenvolve raízes que prendem o corpo ao chão enquanto a planta usa a carcaça como substrato de crescimento.',
    ARRAY['plant'],
    2, 14,
    2, 5,
    30,
    12, 3, 10, 12, 10, 1,
    7, 8,
    '1d6+2',
    '[{"nome":"Esporos Tóxicos","descricao":"O monstro executa esporos tóxicos contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Regeneração Natural","descricao":"O monstro executa regeneração natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    450,
    'medio',
    ARRAY['cemitério', 'floresta úmida'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Assassin Vine (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Assassin Vine',
    'Uma videira perfeitamente normal em aparência, indistinguível de qualquer trepadeira de floresta ou ruína até que algo de tamanho de refeição se aproxime. Os galhos disparam em velocidade de cobra para enrolar e constrair, usando a estrutura da árvore ou parede em que cresce como ancoragem para multiplicar a força de constrição.

A invisibilidade da natureza — ser literalmente uma planta — é a vantagem definitiva da assassin vine. Sem magia de detecção de vida vegetal, é praticamente impossível identificar uma videira assassina de uma decorativa antes que ataque. Uma ruína coberta de trepadeiras é uma ruína coberta de potenciais garras.',
    ARRAY['plant'],
    3, 14,
    3, 7,
    60,
    18, 3, 8, 18, 8, 1,
    11, 9,
    '1d8+2',
    '[{"nome":"Golpe de Raiz","descricao":"O monstro executa golpe de raiz contra seu alvo.","tipo":"ofensiva","dano":"2d6+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Casca Protetora","descricao":"O monstro executa casca protetora contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    700,
    'grande',
    ARRAY['floresta', 'dungeon'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Mandragora (Tier 3, minusculo, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Mandragora',
    'Uma raiz vegetal de aparência humana que grita quando arrancada do solo com um som sobrenatural que pode matar aqueles que o ouvem. A forma da raiz sugere a silhueta de um recém-nascido com as proporções erradas, e o grito não é de dor mas de raiva primordial do reino vegetal perturbado por colheita.

O grito da mandragora causa dano de trovão em raio e pode atordoar todos que o ouvirem sem proteção adequada nos ouvidos. Quando arrancada mas não destruída, pode se mover para novo solo e replantar-se, tornando-a difícil de eliminar sem destruição imediata completa do espécime.',
    ARRAY['plant'],
    2, 14,
    2, 5,
    20,
    6, 3, 14, 8, 14, 1,
    5, 10,
    '1d6+2',
    '[{"nome":"Chicote de Vinhas","descricao":"O monstro executa chicote de vinhas contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Camuflagem Florestal","descricao":"O monstro executa camuflagem florestal contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza', 'floresta'],
    200,
    'minusculo',
    ARRAY['floresta', 'jardim mágico'],
    '{}',
    '{}',
    '{"terrestre":15}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Criaturas Aquaticas (11 monstros)
-- =============================================================================

-- Merfolk (Tier 1, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Merfolk',
    'Humanóide da cintura para cima com cauda de peixe da cintura para baixo, escamas de cor variável de prata a azul-verde dependendo da profundidade que habita, e olhos adaptados à pressão e à escuridão da água profunda que parecem ligeiramente maiores que o normal em superfície. A voz tem uma qualidade que ressoa de forma diferente na água e no ar.

Em combate submarino são predadores de elite, com velocidade três vezes superior à de um nadador humano e o alcance de uma lança aquática que funciona com eficiência total em água. Em terra são vulneráveis: a mobilidade reduzida sem a cauda os coloca em desvantagem severa em qualquer confronto fora do ambiente aquático.',
    ARRAY['humanoide'],
    1, 15,
    1, 2,
    15,
    8, 12, 10, 8, 10, 10,
    4, 4,
    '1d4+1',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    25,
    'medio',
    ARRAY['mar', 'rio', 'lago'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Darkmantle (Tier 2, pequeno, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Darkmantle',
    'Uma criatura de teto de caverna: parece uma estalactite de dois pés até que algo se aproxime, momento em que abre asas de manta-ray e mergulha sobre a cabeça da vítima, envolvendo o crânio com a força de um torniquete e criando escuridão mágica no local de impacto. A boca está na parte inferior do corpo e morde o crânio da vítima envolvida.

A escuridão que cria é sobrenatural e não pode ser dissipada por fontes de luz normais, apenas por Dispel Magic ou Light aplicados diretamente. O encontro padrão com darkmantles é o grupo andando em caverna e súbito entrar em escuridão absoluta com barulho de asa e crânios sendo cobertos.',
    ARRAY['monstrosity'],
    2, 15,
    1, 3,
    17,
    8, 5, 12, 8, 12, 6,
    4, 7,
    '1d6',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    100,
    'pequeno',
    ARRAY['caverna', 'dungeon com teto alto'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Shark, Hunter (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Shark, Hunter',
    'Um tubarão de quatro metros otimizado para caça aberta: o grande tubarão branco de fantasia aquática com mandíbulas que se abrem numa dimensão impossível, olhos negros sem profundidade e o movimento contínuo obrigatório que mantém a respiração. A inteligência é a de predador puro sem nenhuma consideração para além de comer.

O frenesi de sangue ativa em qualquer criatura sangrando no mesmo corpo d''água, e em batalha aquática o cheiro de sangue de ferimentos dos próprios aventureiros chama mais tubarões de distâncias de centenas de metros. A velocidade em água supera qualquer nadador e a mordida pode bipartir corpos.',
    ARRAY['besta'],
    2, 15,
    2, 5,
    45,
    16, 4, 8, 16, 8, 4,
    9, 7,
    '1d6+2',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"3d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'grande',
    ARRAY['mar aberto', 'costa'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Plesiosaurus (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Plesiosaurus',
    'O dinossauro aquático de pescoço longo do cenário pré-histórico: cinco metros de corpo com quatro nadadeiras, pescoço de dois metros terminando em cabeça de réptil com dentes cônicos, e a paciência de predador que esperou seiscentos milhões de anos de evolução. Habita lagos profundos e oceanos costeiros onde é frequentemente identificado como o monstro local lendário.

A mordida e o alcance do pescoço longo permitem ataques de distâncias que a maioria dos combatentes aquáticos não consegue alcançar reciprocamente. A velocidade subaquática supera qualquer humano e o mergulho repentino de profundidades torna-o invisível até o ataque. Em terra é lento mas o alcance do pescoço cobre o campo imediato.',
    ARRAY['besta'],
    2, 15,
    2, 5,
    45,
    16, 4, 8, 16, 8, 4,
    9, 7,
    '1d6+2',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"3d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    450,
    'grande',
    ARRAY['mar', 'lago pré-histórico'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Marid Elder (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Marid Elder',
    'O mais poderoso dos gênios aquáticos: humanóide de quatro metros de pele azul-oceano com cabelo que é literalmente água em movimento constante, vestes que são espirais de corrente marinha comprimidas em tecido e uma postura que transmite a soberba de alguém que controla os oceanos do mundo. Fala com a voz do mar em tempestade.

A magia aquática do marid elder é de alcance e poder que rivaliza com conjuradores mortais de nível máximo: pode criar maremotos, congelar mares locais, e invocar tempestades que duram semanas. Em seu reino subaquático é praticamente invencível, e fora dele mantém poder suficiente para ser ameaça catastrófica para qualquer navio ou cidade costeira.',
    ARRAY['elemental'],
    4, 15,
    7, 10,
    125,
    24, 8, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Explosão Primordial","descricao":"O monstro executa explosão primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Escudo Primordial","descricao":"O monstro executa escudo primordial contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Nova Primordial","descricao":"O monstro executa nova primordial contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    10000,
    'grande',
    ARRAY['oceano profundo', 'plano da água'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Nereida / Nymphe (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Nereida / Nymphe',
    'Uma nereida é o espírito de um corpo d''água específico em forma humana feminina de beleza que a maioria dos padrões mortais não consegue categorizar completamente: é bela da forma que o mar ao pôr do sol é belo, não da forma que uma pessoa é bela. A pele tem qualidade de água parada e os olhos são da cor do lago que habita.

O encantamento que exerce não é magia deliberada mas presença natural: criaturas que se aproximam e olham para ela ficam encantadas a não ser que resistam ativamente. A forma d''água que pode tomar permite se dissolver no próprio lago e reaparecer em qualquer ponto, tornando perseguição física impossível no ambiente aquático.',
    ARRAY['fada'],
    3, 15,
    3, 7,
    45,
    14, 13, 10, 14, 10, 16,
    9, 10,
    '1d8+2',
    '[{"nome":"Espinhos Feéricos","descricao":"O monstro executa espinhos feéricos contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Dança Encantada","descricao":"O monstro executa dança encantada contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    700,
    'medio',
    ARRAY['rio', 'lago', 'mar'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Triton Warrior (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Triton Warrior',
    'Tritons são a versão nobre e militarista dos humanóides aquáticos: metro e oitenta de musculatura marítima com escamas azul-prateadas, tridente elaborado de coral encantado, e a postura ereta de guarda-fronteira dos mares profundos que se veem como protetores dos oceanos contra invasores do Abismo Aquático.

Em combate submarino usam formações táticas militares que refletem séculos de guarda das profundezas. A magia do triton inclui controle de criaturas aquáticas e criação de correntes que podem arrastar nadadores humanos para profundidades letais em segundos.',
    ARRAY['humanoide'],
    2, 15,
    2, 5,
    30,
    12, 13, 10, 12, 10, 10,
    7, 8,
    '1d6+2',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Esquiva Tática","descricao":"O monstro executa esquiva tática contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    200,
    'medio',
    ARRAY['mar profundo', 'guarda de portais abissais'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cria das Marés (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cria das Marés',
    'Humanóides que foram transformados por entidades aquáticas malignas ou pelo próprio oceano profundo em algo entre humano e ser marinho: mantêm silhueta humanoide mas com tentáculos no lugar de uma mão, guelras no pescoço, olhos sem pupila de cor de oceano e pele que parece molhada mesmo em terra firme. São o que acontece com marinheiros que sobrevivem a encontros com seres do Abismo Aquático.

Combatentes mediocres individualmente mas em grupos grandes são difíceis de eliminar por causa da resistência ao dano não mágico e da imprevisibilidade de quais peças do kit humano ou aquático cada um reteve. O tentáculo pode agarrar e o veneno que alguns possuem causa entorpecimento progressivo.',
    ARRAY['humanoide', 'monstrosity'],
    2, 15,
    2, 5,
    30,
    12, 13, 10, 12, 10, 10,
    7, 8,
    '1d6+2',
    '[{"nome":"Investida","descricao":"O monstro executa investida contra seu alvo.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Esquiva Tática","descricao":"O monstro executa esquiva tática contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    200,
    'medio',
    ARRAY['costa', 'mar', 'porto'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Scrags (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Scrags',
    'O troll que habita rios e lagos: aparência de troll padrão mas com pele de cor de alga, estrutura mais longa e fluida para deslocamento aquático, e guelras funcionais que permitem respiração subaquática ilimitada. A regeneração dos trolls é amplificada na água, tornando ferimentos que já são difíceis de cauterizar ainda mais urgentes em ambiente aquático onde fogo é impossível.

Em água, a velocidade de regeneração dobra e a velocidade de movimento triplica, tornando o scrags praticamente um tubarão de regeneração que não morre de nenhum ferimento convencional. Em terra perde vantagens aquáticas mas mantém a regeneração base dos trolls que ainda requer fogo ou ácido para inibição.',
    ARRAY['gigante'],
    3, 15,
    5, 8,
    80,
    20, 9, 8, 20, 8, 8,
    13, 11,
    '2d6+2',
    '[{"nome":"Arremesso de Rocha","descricao":"Uma rocha enorme é arremessada com precisão devastadora.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":3,"chance":50},{"nome":"Grito de Guerra","descricao":"O monstro executa grito de guerra contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'medieval', 'natureza'],
    1800,
    'grande',
    ARRAY['rio', 'lago', 'zona costeira'],
    '{}',
    '{}',
    '{"terrestre":10,"natacao":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Vermes e Criaturas Subterraneos (10 monstros)
-- =============================================================================

-- Ankheg (Tier 3, grande, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ankheg',
    'Um inseto de dois metros e meio que emerge do chão: casca quitinosa marrom-terra que funciona como armadura natural, mandíbulas que podem partir pedra, e um spray de ácido gástrico que digere metais. O ciclo de caça é subterrâneo: perfura túneis sob fazendas e campos, sentindo vibração de pisadas e emergindo sob presas desavisadas.

O buraco que deixa é o aviso que geralmente chega tarde demais: o ankheg emerge diretamente sob a vítima, agarrando-a nas mandíbulas antes que possa reagir. O spray ácido pode ser usado como ataque de longo alcance uma vez por algumas horas, e a armadura natural torna flechas e golpes superficiais completamente ineficazes.',
    ARRAY['monstrosity'],
    2, 16,
    2, 5,
    45,
    16, 6, 8, 16, 8, 6,
    9, 7,
    '1d6+2',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['acido'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    450,
    'grande',
    ARRAY['planície agrícola', 'campo', 'bosque'],
    '{}',
    '{}',
    '{"terrestre":35,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Rust Monster (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Rust Monster',
    'Uma das criaturas mais temidas por guerreiros: aparentemente inofensivo de aparência inseto com dois tentáculos compridos e uma cauda de flail, mas com a propriedade sobrenatural de enferrujar e destruir qualquer metal ferroso que toca em segundos. A armadura de placa de um guerreiro se dissolve em pó de ferrugem num único contato com o tentáculo.

O rust monster não é perigoso por força ou veneno mas pelo efeito econômico devastador: destruição de equipamento que levou anos para adquirir e tesouros insubstituíveis em segundos. Grupos bem equipados ficam progressivamente mais vulneráveis a cada contato, e a criatura é suficientemente resiliente para resistir a golpes de armas que ela está ativamente destruindo.',
    ARRAY['monstrosity'],
    2, 16,
    1, 3,
    22,
    10, 5, 10, 10, 10, 6,
    5, 6,
    '1d6',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    100,
    'medio',
    ARRAY['dungeon', 'caverna'],
    '{}',
    '{}',
    '{"terrestre":30,"escavar":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Piercer (Tier 2, pequeno, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Piercer',
    'Uma criatura que parece uma estalactite idêntica às outras dezenas na caverna. Quando algo de tamanho adequado passa diretamente abaixo, ela solta o teto e cai como projétil de pedra pontiagudo. Se errar ou se a presa sobreviver, rasteja lentamente de volta para o teto ao longo de vários minutos.

A detecção prévia é quase impossível sem magia específica: visão verdadeira revela a criatura viva, mas olhar normal nunca distingue um piercer de uma estalactite genuína. Em cavernas com tetos altos, a velocidade de queda torna o impacto de uma criatura de noventa quilos em ponta de pedra genuinamente letal.',
    ARRAY['monstrosity'],
    2, 16,
    1, 3,
    17,
    8, 5, 12, 8, 12, 6,
    4, 7,
    '1d6',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"3d6","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    100,
    'pequeno',
    ARRAY['caverna', 'dungeon'],
    '{}',
    '{}',
    '{"terrestre":15,"escavar":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Escavador Hipnótico (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Escavador Hipnótico',
    'Inseto humanóide de dois metros e meio com exoesqueleto de preto-mineral que parece rocha comprimida, mandíbulas que perfuram pedra sólida, e quatro olhos de cores diferentes que criam um campo de visão desorientador para qualquer criatura que olhe diretamente para o conjunto. A confusão que o olhar causa é involuntária: física, não mágica.

Os quatro olhos causam confusão mental em alvos que olharem para eles: os alvos afetados ficam desorientados, atacando alvos aleatórios incluindo aliados. O escavador hipnótico usa isso para criar caos no grupo enquanto usa as mandíbulas e garras na vítima mais próxima. Perfura parede de pedra em segundos, criando surpresas de parede que aventureiros nunca esperam.',
    ARRAY['monstrosity'],
    3, 16,
    5, 8,
    80,
    20, 6, 8, 20, 8, 6,
    13, 11,
    '2d6+2',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"2d8+5","efeito":null,"cooldown":3,"chance":50},{"nome":"Faro Aguçado","descricao":"O monstro executa faro aguçado contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1800,
    'grande',
    ARRAY['underdark', 'caverna profunda'],
    '{}',
    '{}',
    '{"terrestre":35,"escavar":20}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Troglodyte (Tier 2, medio, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Troglodyte',
    'Réptil humanóide de metro e oitenta que evoluiu completamente para vida subterrânea: pele cega de luz que nunca enxergou sol direto, olhos adaptados ao escuro total, e glândulas na pele que secretam um composto de odor tão intenso que pode causar náusea incapacitante a metro de distância. A pele reflete a cor do ambiente em camuflagem passiva.

O odor de uma caverna de trogloditas identifica o problema antes do encontro: um grupo de trogloditas em espaço fechado cria um ambiente de cheiro tóxico que enfraquece progressivamente a capacidade de combate de criaturas não acostumadas. Os trogloditas são imunes ao próprio odor.',
    ARRAY['humanoide'],
    1, 16,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    50,
    'medio',
    ARRAY['underdark', 'caverna úmida'],
    '{}',
    '{}',
    '{"terrestre":30,"escavar":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Garra-Eco (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Garra-Eco',
    'Um inseto de dois metros com dois ganchos em forma de foice no final dos braços, pele de quitina branca que serve de armadura e se mistura com pedra calcária, e uma comunicação de cliques e batidas dos ganchos que serve de linguagem e de táticas de coordenação de caça. Os olhos compostos permitem visão em 360 graus sem ponto cego.

Os ganchos permitem escalada de qualquer superfície sem redução de velocidade, tornando paredes e tetos partes do campo de batalha do hook horror com a mesma naturalidade que o chão. Em grupo, os cliques coordenam emboscadas de múltiplos ângulos simultâneos.',
    ARRAY['monstrosity'],
    3, 16,
    3, 7,
    60,
    18, 6, 8, 18, 8, 6,
    11, 9,
    '1d8+2',
    '[{"nome":"Investida Brutal","descricao":"O monstro executa investida brutal contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":3,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    700,
    'grande',
    ARRAY['underdark'],
    '{}',
    '{}',
    '{"terrestre":35,"escavar":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gnoll Brutamontes (Tier 6, medio, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gnoll Brutamontes',
    'Um gnoll de liderança com força física excepcional e um mangual triplo encantado que é a arma ritual de um comandante de Khrovash. A pelagem é mais escura e mais densa que dos gnolls comuns, as cicatrizes são de batalhas que a maioria dos gnolls não sobreviveria, e os olhos de âmbar têm a qualidade de alguém que aceitou a fome divina completamente.

O mangual triplo pode imobilizar, derrubar ou desarmar em três rodadas alternadas, e o aura de presença aterrorizante sobre outros gnolls ao redor amplifica a agressividade da matilha inteira. Matar o flind coloca a matilha em desorientação temporária mas também a enfurece completamente, portanto não é vantagem automática.',
    ARRAY['humanoide'],
    4, 16,
    6, 9,
    85,
    18, 14, 10, 18, 10, 10,
    13, 14,
    '2d6+4',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Posição Defensiva","descricao":"O monstro executa posição defensiva contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Execução","descricao":"O monstro executa execução contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    5000,
    'medio',
    ARRAY['horda gnoll'],
    '{}',
    '{}',
    '{"terrestre":30,"escavar":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Cloaker (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Cloaker',
    'Uma manta-ray de três metros que voa e que se mistura perfeitamente a capas e cobertores no escuro: dobrada num canto de caverna parece equipamento abandonado até o momento em que se levanta, envolve a cabeça de um aventureiro e começa a asfixiar e morder simultaneamente. A camuflagem é tão perfeita que vítimas já mortas por cloakers foram encontradas com a capa ainda em volta da cabeça.

O gemido que produz ao ser ferido cria ilusões de múltiplas cópias ao redor, tornando impossível identificar o alvo real visualmente. Enrolado ao redor da cabeça de uma vítima, causa dano automático por rodada enquanto a vítima sufoca e o grupo tenta ferir o cloaker sem acertar o companheiro.',
    ARRAY['besta'],
    4, 16,
    6, 9,
    100,
    22, 5, 8, 22, 8, 4,
    15, 13,
    '2d6+4',
    '[{"nome":"Investida Selvagem","descricao":"O monstro executa investida selvagem contra seu alvo.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Instinto Selvagem","descricao":"O monstro executa instinto selvagem contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Frenesi","descricao":"O monstro executa frenesi contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    3900,
    'grande',
    ARRAY['underdark profundo'],
    '{}',
    '{}',
    '{"terrestre":35,"escavar":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Skulk (Tier 2, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Skulk',
    'Uma criatura de invisibilidade passiva permanente: um humanóide que nunca pode ser visto diretamente por qualquer criatura viva independente de condições de iluminação. Existe como presença implícita que só pode ser detectada pelo resultado de seus atos — pegadas, objetos movidos, o barulho de respiração em sala silenciosa.

A invisibilidade permanente torna-o o ladrão e assassino perfeito: incapaz de ser identificado, seguido ou descrito por testemunhas. Cada ataque é com vantagem plena por ser invisível para o alvo, e desengajar e reposicionar é trivial pois nenhum oponente consegue rastreá-lo visualmente em nenhuma circunstância.',
    ARRAY['humanoide'],
    2, 16,
    1, 3,
    22,
    10, 12, 10, 10, 10, 10,
    5, 6,
    '1d6',
    '[{"nome":"Golpe Preciso","descricao":"O monstro executa golpe preciso contra seu alvo.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    100,
    'medio',
    ARRAY['floresta', 'ruínas'],
    '{}',
    '{}',
    '{"terrestre":30,"escavar":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Espiritos e Criaturas Incorporeas (9 monstros)
-- =============================================================================

-- Ghost (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ghost',
    'O espírito de alguém que morreu com negócio inacabado tão urgente que a alma não pôde partir: um aventureiro que não encontrou o assassino, um pai que não protegeu o filho, um amante que foi traído na última hora. A forma é translúcida mas reconhecível como a aparência que tinha na hora da morte, com os traços da última emoção permanentemente visíveis no rosto.

O envelhecimento por horror do fantasma pode reduzir de décadas a idade de um aventureiro num segundo. O toque incorpóreo drena a Constituição. O poder mais perturbador é a possessão: pode tomar o corpo de um aliado por horas, usando-o para objetivos que o fantasma não foi capaz de completar em vida.',
    ARRAY['morto-vivo'],
    3, 17,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"4d6+4","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1100,
    'medio',
    ARRAY['local de morte traumática'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Dybbuk (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Dybbuk',
    'Um espírito maligno da tradição judaica que habita cadáveres em vez de possuir vivos: escolhe um corpo fresco e o anima com a própria vontade perversa, fazendo-o mover, falar e agir de forma que imita o morto com imperfeições perturbadoras. Os olhos do corpo possuído não refletem luz da forma certa, a voz tem um eco que não pertence ao corpo e a temperatura do cadáver é sempre errada.

O dybbuk pode abandonar e repossuir outro cadáver disponível ao ser destruído o corpo atual, tornando a batalha um jogo de identificar qual cadáver em volta se tornará o próximo recipiente. A ligação emocional com o corpo que habita é zero: usará o cadáver até que seja destruído por completo.',
    ARRAY['morto-vivo', 'fiend'],
    3, 17,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Toque Necrótico","descricao":"Um toque gélido que drena a força vital do alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1100,
    'medio',
    ARRAY['corpo de morto recente'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Haunt (Tier 3, medio, incomum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Haunt',
    'Um haunt não é uma criatura autônoma mas o eco sobrenatural de um evento traumático preso num local específico: um assassinato, uma tragédia, um momento de desespero extremo que imprimiu-se na própria estrutura do ambiente. Manifesta-se como repetição do evento em forma espectral que interage fisicamente com o ambiente mas parece não perceber o grupo ao redor.

O perigo do haunt é que as ações do evento repetido causam dano real: a faca espectral do assassino corta, a explosão espectral queima, a queda espectral causa trauma de impacto. Destruir um haunt requer resolver ou replicar de forma diferente o evento que o criou — não combate convencional.',
    ARRAY['morto-vivo'],
    2, 17,
    2, 5,
    30,
    12, 5, 10, 12, 10, 3,
    7, 8,
    '1d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d8+1","efeito":null,"cooldown":3,"chance":50},{"nome":"Reconstituição","descricao":"O monstro executa reconstituição contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    200,
    'medio',
    ARRAY['local de trauma', 'mansão assombrada'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Vestige (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Vestige',
    'O fragmento mais fraco possível de uma presença sobrenatural: não chegou a ser um fantasma completo, apenas um eco residual de personalidade que consegue mover objetos leves, apagar velas e criar sensações de desconforto em humanos sensitivos. É o fundo do espectro de ameaças sobrenaturais, mais atmosférico que perigoso.

Sozinho é irrelevante para aventureiros experientes. Em ambiente de aventura, serve como indicador de que algo maior criou esse vestígio: onde há fragmentos de presença sobrenatural, algo mais substancial está normalmente próximo. Um bom sinal de aviso e um mau sinal de conforto.',
    ARRAY['morto-vivo'],
    3, 17,
    3, 7,
    45,
    14, 5, 10, 14, 10, 3,
    9, 10,
    '1d8+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Forma Espectral","descricao":"O monstro executa forma espectral contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    700,
    'medio',
    ARRAY['ruínas', 'tumba'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Gatuno Etéreo (Tier 4, medio, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Gatuno Etéreo',
    'Uma criatura planar de quatro pernas com corpo que alterna constantemente entre o plano etéreo e o material, tornando-o intermitentemente sólido e intangível em padrão que dificulta imensamente o combate convencional. Especializado em roubo: entra no plano material, rouba objetos de aventureiros dormindo ou distraídos, volta ao etéreo para examinar o que pegou.

Não é combatente de força: foge de combate real. O problema é o que roubou antes que o combate comece: chaves de masmorras, componentes mágicos únicos, itens de plot importance que estavam em bolsos que o grupo não verificou. Um encontro com um ethereal filcher frequentemente significa uma caçada de recuperação complicada.',
    ARRAY['besta'],
    3, 17,
    3, 7,
    45,
    14, 4, 10, 14, 10, 4,
    9, 10,
    '1d8+2',
    '[{"nome":"Mordida Feroz","descricao":"Presas afiadas rasgam carne e osso.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Rugido Intimidador","descricao":"O monstro executa rugido intimidador contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    700,
    'medio',
    ARRAY['plano etéreo', 'área limítrofe'],
    '{}',
    '{}',
    '{"terrestre":30}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Nightshade (Tier 2, gargantuesco, comum)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Nightshade',
    'Uma entidade do Umbrália de poder equivalente a general: humanóide de escuridão absoluta de seis metros com dois pontos de frio vermelho de olhos, capaz de aniquilar luz em raio de quilômetros. Não é morto-vivo mas entidade do plano das sombras que odeia a vida com a intensidade de alguém com motivação pessoal.

O raio de aniquilação reduz criaturas vivas a pó que não pode ser ressucitado. A aura de escuridão é de escala que cobre cidades pequenas. Existem três variedades: nightwalker, nightwing e nighthaunt, cada uma com especialidade diferente em destruição de vida. Todas são catástrofes ambulantes sem estratégia além de eliminar qualquer coisa viva.',
    ARRAY['morto-vivo'],
    1, 17,
    1, 3,
    62,
    17, 4, 5, 17, 5, 3,
    9, 3,
    '1d6',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"1d6+1","efeito":null,"cooldown":2,"chance":50}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    50,
    'gargantuesco',
    ARRAY['shadowfell', 'escuridão profunda'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Yeth Hound (Tier 4, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Yeth Hound',
    'Um cão de caça sobrenatural que caça almas fugitivas: negro como a noite, sem patas tocando o chão, olhos de brasa e um latido que viaja distâncias impossíveis e causa terror irracional em quem o ouve. Serve a divindades do mal ou a caçadores de almas como instrumento de recuperação de espíritos que escaparam de seus destinos merecidos.

O latido aterra literalmente: criaturas que falham na resistência ao medo fogem em pânico total. O voo sem patas permite perseguição em qualquer terreno ou altitude. Uma vez designado a caçar um alvo específico, o yeth hound rastreia através de planos e dimensões até completar a missão ou ser destruído.',
    ARRAY['fiend'],
    3, 17,
    3, 7,
    60,
    18, 15, 8, 18, 8, 12,
    11, 9,
    '1d8+2',
    '[{"nome":"Lâmina Profana","descricao":"O monstro executa lâmina profana contra seu alvo.","tipo":"ofensiva","dano":"1d8+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Regeneração Demoníaca","descricao":"O monstro executa regeneração demoníaca contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    1100,
    'grande',
    ARRAY['planos malignos', 'caçada noturna'],
    '{}',
    '{}',
    '{"terrestre":35,"voo":55}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Coro das Trevas (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Coro das Trevas',
    'Uma consciência coletiva de almas que morreram de medo: dezenas de espíritos fundidos involuntariamente numa única entidade de nuvem escura com inúmeros rostos humanos aparecendo e desaparecendo na superfície, cada um preso num momento de terror. A dor coletiva dessa fusão é tanta que a criatura existe para compartilhá-la com outros.

O grito psíquico do caller drena pontos de vida máximos de múltiplos alvos simultâneos numa área enorme. Vítimas que morrem na presença do caller são absorvidas, crescendo a entidade e tornando-a progressivamente mais poderosa a cada morte. Destruí-la liberta todas as almas presas de uma vez, mas o processo de destruição é uma batalha de área psíquica.',
    ARRAY['morto-vivo'],
    4, 17,
    6, 9,
    100,
    22, 6, 8, 22, 8, 3,
    15, 13,
    '2d6+4',
    '[{"nome":"Mordida Putrefata","descricao":"Uma mordida com mandíbulas apodrecidas que infecta a ferida.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Explosão Necrótica","descricao":"O monstro executa explosão necrótica contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['psiquico'],
    ARRAY['fantasia', 'sombrio', 'terror'],
    5000,
    'grande',
    ARRAY['psionicamente ativo', 'dungeon'],
    '{}',
    ARRAY['nao-magico'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- =============================================================================
-- Criaturas de Tempestade e Clima (8 monstros)
-- =============================================================================

-- Thunderbird (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Thunderbird',
    'A ave-trovão da mitologia nativa americana em forma de D&D: uma águia de vinte metros de envergadura com plumagem azul-prateada que cria relâmpagos ao bater as asas, olhos que são esferas de energia elétrica comprimida, e um grito que é literalmente um trovão físico. Habita os picos mais altos de montanhas e comanda as tempestades do continente.

O batimento de asas cria vendavais que podem derrubar estruturas de madeira. Os relâmpagos que dispara dos olhos são de escala dracônica em poder. A tempestade que o thunderbird cria ao pousar pode durar dias depois que ele partir. É também guardian de lugares sagrados e aparece para protegê-los como a própria força da natureza.',
    ARRAY['elemental', 'monstrosity'],
    4, 18,
    7, 10,
    140,
    26, 8, 6, 26, 6, 6,
    18, 14,
    '2d8+4',
    '[{"nome":"Rajada de Energia","descricao":"O monstro executa rajada de energia contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Forma Instável","descricao":"O monstro executa forma instável contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Tempestade Elemental","descricao":"O monstro executa tempestade elemental contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['eletricidade', 'psiquico'],
    ARRAY['fantasia', 'natureza'],
    5900,
    'enorme',
    ARRAY['picos de tempestade', 'alto céu'],
    '{}',
    ARRAY['eletricidade'],
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Simurgh (Tier 7, enorme, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Simurgh',
    'O pássaro mítico persa de escala gigantesca com a cabeça de um sábio ancião, corpo de fênix com plumagem que inclui todas as cores imagináveis, e cauda de pavão com cada pena contendo um olho que observa independentemente. Viveu tempo suficiente para ter visto o nascimento do mundo e pode comunicar esse conhecimento a quem for digno de ouvir.

A magia do simurgh é de cura e proteção: a plumagem tem propriedades restauradoras e o canto pode curar maldições, doenças e ferimentos. Em combate se defendia com relutância mas devastação equivalente a um dragão ancião. É acima de tudo um ser de sabedoria que prefere ensinar a destruir e só destrói quando o que protege não tem outra proteção.',
    ARRAY['celestial', 'monstrosity'],
    4, 18,
    7, 10,
    140,
    26, 16, 6, 26, 6, 16,
    18, 14,
    '2d8+4',
    '[{"nome":"Smite Divino","descricao":"O monstro executa smite divino contra seu alvo.","tipo":"defensiva","dano":null,"efeito":null,"cooldown":4,"chance":50},{"nome":"Cura Divina","descricao":"O monstro executa cura divina contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Pilar de Luz","descricao":"O monstro executa pilar de luz contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza'],
    8400,
    'enorme',
    ARRAY['montanha sagrada', 'plano celestial'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Wendigo (Tier 6, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Wendigo',
    'O espírito canibal da mitologia algonquina que habita florestas do norte em invernos profundos: uma entidade de quatro metros com pele que parece gelo sobre osso, respiração que gela o ar em metros ao redor, e um uivo que viaja quilômetros de distância e causa fome irracional em quem o ouve. Caça especificamente humanos isolados no inverno extremo.

O toque do wendigo pode transformar humanos em outros wendigos se não resistirem à fome e ao frio sobrenatural que implanta na mente. A velocidade de corrida supera cavalos em neve profunda. A aura de fome que emana faz aliados próximos perderem a capacidade de distinguir inimigo de comida em situações de estresse extremo.',
    ARRAY['fiend', 'monstrosity'],
    4, 18,
    6, 9,
    100,
    22, 16, 8, 22, 8, 12,
    15, 13,
    '2d6+4',
    '[{"nome":"Garra Demoníaca","descricao":"Garras afiadas como obsidiana rasgam armaduras.","tipo":"ofensiva","dano":"2d6+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Aura de Medo","descricao":"O monstro executa aura de medo contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição Profana","descricao":"O monstro executa destruição profana contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['gelo'],
    ARRAY['fantasia', 'natureza'],
    3900,
    'grande',
    ARRAY['floresta nevada no norte'],
    '{}',
    ARRAY['frio'],
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Ammit (Tier 7, grande, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Ammit',
    'O guardião do julgamento das almas no Duat egípcio: um ser com cabeça de crocodilo, parte superior de leão e parte inferior de hipopótamo, que aguarda pacientemente ao lado da balança de Ma''at para devorar almas que falharam no julgamento. Não age por malícia mas por função cósmica: é o destino de almas indignas, não um predador voluntário.

A mordida do Ammit drena a alma além do corpo: vítimas mortas por ele não podem ser ressuscitadas por qualquer magia inferior a divine intervention direta. No Duat, é praticamente invencível por ser parte do sistema cosmológico; no plano material é um colosso físico com as combinações predatórias dos três animais mais perigosos do Nilo.',
    ARRAY['monstrosity'],
    4, 18,
    7, 10,
    125,
    24, 7, 8, 24, 8, 6,
    17, 15,
    '2d8+4',
    '[{"nome":"Mordida Monstruosa","descricao":"O monstro executa mordida monstruosa contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Recuo Rápido","descricao":"O monstro executa recuo rápido contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Fúria Bestial","descricao":"O monstro executa fúria bestial contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza'],
    5900,
    'grande',
    ARRAY['salão do julgamento', 'plano da morte'],
    '{}',
    '{}',
    '{"terrestre":35,"natacao":45}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Stormgiant Quintessent (Tier 8, enorme, lendario)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Stormgiant Quintessent',
    'Um gigante das tempestades que completou a ascensão à quintessência: não mais completamente físico, mas a personificação de uma tempestade permanente em forma humanoide de doze metros. A pele é visível apenas como silhueta dentro da nuvem de trovão que constitui o corpo, e cada movimento cria raios e trovões ao redor.

O poder de controle climático é de escala continental: pode criar ou dissipar tempestades de múltiplas semanas. O corpo de tempestade torna ataques físicos convencionais inúteis pois não há onde golpear que não seja relâmpago. Somente magia de força ou transmutação pode tocar efetivamente o quintessent.',
    ARRAY['gigante'],
    6, 18,
    8, 12,
    180,
    28, 10, 6, 28, 6, 8,
    21, 16,
    '2d10+5',
    '[{"nome":"Arremesso de Rocha","descricao":"Uma rocha enorme é arremessada com precisão devastadora.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":4,"chance":50},{"nome":"Grito de Guerra","descricao":"O monstro executa grito de guerra contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Avalanche","descricao":"O monstro executa avalanche contra seu alvo.","tipo":"ofensiva","dano":"3d6+5","efeito":null,"cooldown":8,"chance":30}]',
    ARRAY['eletricidade'],
    ARRAY['fantasia', 'natureza'],
    15000,
    'enorme',
    ARRAY['plano astral', 'pico de tempestade'],
    '{}',
    '{}',
    '{"terrestre":40}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Blizzard Wraith (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Blizzard Wraith',
    'Um wraith que morreu num blizzard extremo e foi tão completamente fusionado com a tempestade que a distinção entre o espírito e a neve em si tornou-se impossível. A forma é um humanoide de neve e gelo com movimento idêntico ao vento, invisível dentro de qualquer nevasca e detectável apenas pelo frio sobrenatural adicional que cria ao redor.

O toque drena Constituição com frio sobrenatural que persiste além do combate. Dentro de uma nevasca real, o blizzard wraith é praticamente impossível de detectar ou flanquear pois se move com o vento. Em climas quentes ou dentro de estruturas, perde a invisibilidade fornecida pelo ambiente mas mantém os poderes de drenagem.',
    ARRAY['morto-vivo'],
    3, 18,
    5, 8,
    80,
    20, 5, 8, 20, 8, 3,
    13, 11,
    '2d6+2',
    '[{"nome":"Garra Mortal","descricao":"Garras imbuídas de energia necrótica dilaceram a carne.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Aura de Morte","descricao":"O monstro executa aura de morte contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['gelo', 'psiquico'],
    ARRAY['fantasia', 'natureza'],
    2300,
    'grande',
    ARRAY['tundra', 'montanha gelada'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Sand Golem (Tier 5, grande, raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Sand Golem',
    'Um golem construído de areia do deserto por meio de magia elemental rara: não tem a solidez do golem de pedra mas a capacidade de se dissolver em tempestade de areia e reconstituir-se em distância, tornando-o impossível de imobilizar por meios físicos convencionais. A face que apresenta quando solidificado é obra de artesão que conhecia faces humanas mas não as entendia completamente.

O sopro de areia comprimida pode cegar e causar dano em cone, e a dissolução em tempestade permite atravessar grades, portões e armaduras de forma que outros golems não conseguem. Em desertos, a areia disponível torna-o potencialmente regenerável indefinidamente se não for destruído completamente.',
    ARRAY['constructo'],
    3, 18,
    5, 8,
    80,
    20, 4, 8, 20, 8, 1,
    13, 11,
    '2d6+2',
    '[{"nome":"Punho de Ferro","descricao":"Um golpe mecânico preciso com força implacável.","tipo":"ofensiva","dano":"2d6+2","efeito":null,"cooldown":3,"chance":50},{"nome":"Autocorreção","descricao":"O monstro executa autocorreção contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":4,"chance":40}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza'],
    2900,
    'grande',
    ARRAY['deserto', 'tumba egípcia'],
    '{}',
    '{}',
    '{"terrestre":35}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Roc do Deserto (Tier 7, gargantuesco, muito raro)
INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    'Roc do Deserto',
    'A variante do roc padrão adaptada ao deserto extremo: a mesma escala avassaladora de ave com envergadura de navio de guerra, mas com plumagem de cor de areia e adaptações ao calor que incluem a capacidade de criar correntes de ar quente ascendente para manter o voo em térmica. Os ovos são do tamanho de casas pequenas.

O roc do deserto pode carregar camelos e cavalos como presas normais, e sente-se competindo com fortes e caravanas pela soberania do deserto. Os ninhos são construídos em penhascos inacessíveis com ossos e restos de caravanas passadas como material de construção, criando um arquivo arqueológico perturbador das décadas de caças bem-sucedidas.',
    ARRAY['monstrosity'],
    4, 18,
    7, 10,
    150,
    27, 7, 5, 27, 5, 6,
    19, 13,
    '2d8+4',
    '[{"nome":"Garra Devastadora","descricao":"O monstro executa garra devastadora contra seu alvo.","tipo":"ofensiva","dano":"2d8+3","efeito":null,"cooldown":4,"chance":50},{"nome":"Couraça Natural","descricao":"O monstro executa couraça natural contra seu alvo.","tipo":"defensiva","dano":null,"efeito":{"tipo":"buff","duracao":2,"dano_por_turno":null},"cooldown":5,"chance":40},{"nome":"Destruição","descricao":"O monstro executa destruição contra seu alvo.","tipo":"ofensiva","dano":"2d8+4","efeito":null,"cooldown":7,"chance":30}]',
    ARRAY['natureza'],
    ARRAY['fantasia', 'natureza'],
    10000,
    'gargantuesco',
    ARRAY['deserto', 'oásis enorme'],
    '{}',
    '{}',
    '{"terrestre":40,"voo":60}'
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;

-- Total: 305 monstros gerados