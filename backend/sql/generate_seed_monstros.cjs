/**
 * Script para gerar seed SQL de monstros a partir do compendio JSON.
 * Converte 311 monstros com lore em entries jogaveis com stats auto-gerados.
 *
 * Uso: node generate_seed_monstros.cjs
 * Output: seed_monstros_compendio.sql
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const data = JSON.parse(fs.readFileSync(path.join(projectRoot, 'compendio_monstros.json'), 'utf8'));
const monstros = data.monstros;

// ========== MAPEAMENTO DE CATEGORIAS ==========

// IDs fixos correspondendo ao banco existente (categorias_monstro)
const CATEGORIA_MAP = {
  'mortosVivos':          { id: 1,  nome: 'Mortos-Vivos' },
  'demoniosDiabos':       { id: 2,  nome: 'Demonios e Diabos' },
  'dragoes':              { id: 3,  nome: 'Dragoes' },
  'constructos':          { id: 4,  nome: 'Constructos e Golems' },
  'gigantes':             { id: 5,  nome: 'Gigantes e Titas' },
  'aberracoes':           { id: 6,  nome: 'Aberracoes' },
  'fadas':                { id: 7,  nome: 'Fadas e Criaturas do Sylvaris' },
  'humanoidesMonstr':     { id: 8,  nome: 'Humanoides Monstruosos' },
  'bestas':               { id: 9,  nome: 'Bestas e Animais Magicos' },
  'elementais':           { id: 10, nome: 'Elementais e Genios' },
  'miticas':              { id: 11, nome: 'Criaturas Miticas e Lendarias' },
  'undeadRaros':          { id: 12, nome: 'Mortos-Vivos Especiais' },
  'outrosPlanos':         { id: 13, nome: 'Criaturas de Outros Planos' },
  'plantasNatureza':      { id: 14, nome: 'Plantas e Criaturas da Natureza' },
  'aquaticas':            { id: 15, nome: 'Criaturas Aquaticas' },
  'vermesSub':            { id: 16, nome: 'Vermes e Criaturas Subterraneos' },
  'espiritos':            { id: 17, nome: 'Espiritos e Criaturas Incorporeas' },
  'elementaisClimaticos': { id: 18, nome: 'Criaturas de Tempestade e Clima' },
};

// ========== TABELAS DE STATS ==========

// Tiers baseados em XP
function inferirTier(xp) {
  if (xp <= 25) return 1;
  if (xp <= 100) return 2;
  if (xp <= 450) return 3;
  if (xp <= 1100) return 4;
  if (xp <= 2900) return 5;
  if (xp <= 5000) return 6;
  if (xp <= 10000) return 7;
  if (xp <= 25000) return 8;
  if (xp <= 50000) return 9;
  return 10;
}

function inferirNivel(xp) {
  const tier = inferirTier(xp);
  const ranges = {
    1: { min: 1, max: 2 },
    2: { min: 1, max: 3 },
    3: { min: 2, max: 5 },
    4: { min: 3, max: 7 },
    5: { min: 5, max: 8 },
    6: { min: 6, max: 9 },
    7: { min: 7, max: 10 },
    8: { min: 8, max: 12 },
    9: { min: 9, max: 14 },
    10: { min: 10, max: 16 },
  };
  return ranges[tier] || ranges[10];
}

// Stats base por tier
const TIER_STATS = {
  1:  { hp: 15,  forca: 8,  con: 8,  ataque: 4,  defesa: 4,  dano: '1d4+1' },
  2:  { hp: 22,  forca: 10, con: 10, ataque: 5,  defesa: 6,  dano: '1d6' },
  3:  { hp: 30,  forca: 12, con: 12, ataque: 7,  defesa: 8,  dano: '1d6+2' },
  4:  { hp: 45,  forca: 14, con: 14, ataque: 9,  defesa: 10, dano: '1d8+2' },
  5:  { hp: 65,  forca: 16, con: 16, ataque: 11, defesa: 12, dano: '2d6+2' },
  6:  { hp: 85,  forca: 18, con: 18, ataque: 13, defesa: 14, dano: '2d6+4' },
  7:  { hp: 110, forca: 20, con: 20, ataque: 15, defesa: 16, dano: '2d8+4' },
  8:  { hp: 150, forca: 22, con: 22, ataque: 18, defesa: 18, dano: '2d10+5' },
  9:  { hp: 200, forca: 24, con: 24, ataque: 20, defesa: 20, dano: '3d8+6' },
  10: { hp: 280, forca: 26, con: 26, ataque: 24, defesa: 22, dano: '3d10+8' },
};

// Modificadores por tamanho
const MOD_TAMANHO = {
  minusculo:   { hp: -10, forca: -6, con: -4, destreza: 4,  agilidade: 4,  ataque: -2, defesa: 2 },
  pequeno:     { hp: -5,  forca: -2, con: -2, destreza: 2,  agilidade: 2,  ataque: -1, defesa: 1 },
  medio:       { hp: 0,   forca: 0,  con: 0,  destreza: 0,  agilidade: 0,  ataque: 0,  defesa: 0 },
  grande:      { hp: 15,  forca: 4,  con: 4,  destreza: -2, agilidade: -2, ataque: 2,  defesa: -1 },
  enorme:      { hp: 30,  forca: 6,  con: 6,  destreza: -4, agilidade: -4, ataque: 3,  defesa: -2 },
  gargantuesco:{ hp: 40,  forca: 7,  con: 7,  destreza: -5, agilidade: -5, ataque: 4,  defesa: -3 },
  colossal:    { hp: 50,  forca: 8,  con: 8,  destreza: -6, agilidade: -6, ataque: 4,  defesa: -3 },
};

// Inteligencia/Carisma por tipo de monstro
const TIPO_MENTAL = {
  'morto-vivo':  { int: 4,  car: 3 },
  'constructo':  { int: 3,  car: 1 },
  'besta':       { int: 3,  car: 4 },
  'plant':       { int: 2,  car: 1 },
  'elemental':   { int: 6,  car: 6 },
  'humanoide':   { int: 12, car: 10 },
  'dragao':      { int: 16, car: 14 },
  'fada':        { int: 12, car: 16 },
  'aberracao':   { int: 14, car: 6 },
  'fiend':       { int: 14, car: 12 },
  'gigante':     { int: 8,  car: 8 },
  'celestial':   { int: 14, car: 16 },
  'monstrosity': { int: 5,  car: 6 },
  'default':     { int: 8,  car: 6 },
};

// ========== NORMALIZACAO ==========

function normalizarTamanho(tam) {
  if (!tam) return 'medio';
  const lower = tam.toLowerCase()
    .replace(/é/g, 'e').replace(/ú/g, 'u').replace(/í/g, 'i')
    .replace(/ã/g, 'a').replace(/â/g, 'a').replace(/ê/g, 'e')
    .trim();

  if (lower.includes('minusculo') || lower.includes('diminuto') || lower.includes('tiny')) return 'minusculo';
  if (lower.includes('pequeno') || lower.includes('small')) return 'pequeno';
  if (lower.includes('colossal')) return 'colossal';
  if (lower.includes('gargantuesco') || lower.includes('gargantuan')) return 'gargantuesco';
  if (lower.includes('enorme') || lower.includes('huge')) return 'enorme';
  if (lower.includes('grande') || lower.includes('large')) return 'grande';
  return 'medio';
}

function normalizarTipo(tipo) {
  if (!tipo) return 'besta';
  const lower = tipo.toLowerCase()
    .replace(/ê/g, 'e').replace(/ã/g, 'a').replace(/â/g, 'a')
    .replace(/ó/g, 'o').replace(/í/g, 'i');

  if (lower.includes('dragao') || lower.includes('dragon') || lower.includes('drago')) return 'dragao';
  if (lower.includes('morto-vivo') || lower.includes('undead') || lower.includes('morto vivo')) return 'morto-vivo';
  if (lower.includes('demon') || lower.includes('diabo') || lower.includes('fiend')) return 'fiend';
  if (lower.includes('constructo') || lower.includes('construct') || lower.includes('golem')) return 'constructo';
  if (lower.includes('gigante') || lower.includes('giant') || lower.includes('tita')) return 'gigante';
  if (lower.includes('aberracao') || lower.includes('aberration') || lower.includes('aberracao')) return 'aberracao';
  if (lower.includes('fada') || lower.includes('fey') || lower.includes('feeri') || lower.includes('archfey')) return 'fada';
  if (lower.includes('humanoide') || lower.includes('humanoid')) return 'humanoide';
  if (lower.includes('besta') || lower.includes('beast') || lower.includes('animal')) return 'besta';
  if (lower.includes('elemental')) return 'elemental';
  if (lower.includes('celestial')) return 'celestial';
  if (lower.includes('plant')) return 'plant';
  if (lower.includes('monstrosity') || lower.includes('monstru')) return 'monstrosity';
  return 'besta';
}

function getTipoMental(tipo) {
  return TIPO_MENTAL[tipo] || TIPO_MENTAL['default'];
}

function normalizarNome(nome) {
  // Pegar so o nome principal antes do parentese (ex: "Goblin (Goblin)" → "Goblin")
  // Mas se o nome pt e en sao diferentes, usar o pt
  const match = nome.match(/^(.+?)\s*\(/);
  if (match) return match[1].trim();
  return nome.trim();
}

// ========== PARSING DE HABILIDADES ==========

function extrairResistenciasImunidades(habilidades) {
  const resistencias = {};
  const imunidades = [];

  if (!habilidades) return { resistencias, imunidades };

  const lower = habilidades.toLowerCase();

  // Imunidades
  const imunePatterns = [
    { regex: /imune?\s+a?\s*veneno/i, val: 'veneno' },
    { regex: /imune?\s+a?\s*fogo/i, val: 'fogo' },
    { regex: /imune?\s+a?\s*frio/i, val: 'gelo' },
    { regex: /imune?\s+a?\s*gelo/i, val: 'gelo' },
    { regex: /imune?\s+a?\s*relâmpago|imune?\s+a?\s*eletricidade|imune?\s+a?\s*raio/i, val: 'eletrico' },
    { regex: /imune?\s+a?\s*ácido/i, val: 'acido' },
    { regex: /imune?\s+a?\s*necr[oó]tico/i, val: 'necrotico' },
    { regex: /imune?\s+a?\s*psíquico|imune?\s+a?\s*psiqu/i, val: 'psiquico' },
    { regex: /imune?\s+a?\s*charme/i, val: 'charme' },
    { regex: /imune?\s+a?\s*medo/i, val: 'medo' },
    { regex: /imune?\s+a?\s*paralisia/i, val: 'paralisia' },
    { regex: /imune?\s+a?\s*exaustão|imune?\s+a?\s*exaustao/i, val: 'exaustao' },
    { regex: /imune?\s+a?\s*envenenado|condição envenenado/i, val: 'veneno' },
    { regex: /imune?\s+a?\s*sono/i, val: 'sono' },
    { regex: /imune?\s+a?\s*dano não[- ]mágico|imune?\s+a?\s*armas? não[- ]mágic/i, val: 'nao-magico' },
  ];

  for (const p of imunePatterns) {
    if (p.regex.test(habilidades)) {
      if (!imunidades.includes(p.val)) imunidades.push(p.val);
    }
  }

  // Resistencias
  const resistPatterns = [
    { regex: /resist[eê]ncia?\s+a?\s*fogo/i, val: 'fogo' },
    { regex: /resist[eê]ncia?\s+a?\s*frio|resist[eê]ncia?\s+a?\s*gelo/i, val: 'gelo' },
    { regex: /resist[eê]ncia?\s+a?\s*relâmpago|resist[eê]ncia?\s+a?\s*eletricidade/i, val: 'eletrico' },
    { regex: /resist[eê]ncia?\s+a?\s*ácido/i, val: 'acido' },
    { regex: /resist[eê]ncia?\s+a?\s*necr[oó]tico/i, val: 'necrotico' },
    { regex: /resist[eê]ncia?\s+a?\s*dano não[- ]mágico|resist[eê]ncia?\s+a?\s*armas? não[- ]mágic/i, val: 'nao-magico' },
  ];

  for (const p of resistPatterns) {
    if (p.regex.test(habilidades) && !imunidades.includes(p.val)) {
      resistencias[p.val] = 0.5;
    }
  }

  // Vulnerabilidades
  if (/vulnera\w+\s+a?\s*fogo/i.test(habilidades)) resistencias['fogo'] = 1.5;
  if (/vulnera\w+\s+a?\s*frio|vulnera\w+\s+a?\s*gelo/i.test(habilidades)) resistencias['gelo'] = 1.5;
  if (/vulnera\w+\s+a?\s*contundente/i.test(habilidades)) resistencias['contundente'] = 1.5;
  if (/vulnera\w+\s+a?\s*radiante/i.test(habilidades)) resistencias['radiante'] = 1.5;

  return { resistencias, imunidades };
}

function extrairElementos(tipo, habilidades, categoriaId) {
  const elementos = [];
  const lower = (habilidades || '').toLowerCase() + ' ' + (tipo || '').toLowerCase();

  if (lower.includes('fogo') || lower.includes('fire') || lower.includes('chama') || lower.includes('flame')) elementos.push('fogo');
  if (lower.includes('frio') || lower.includes('gelo') || lower.includes('frost') || lower.includes('ice') || lower.includes('cold')) elementos.push('gelo');
  if (lower.includes('relâmpago') || lower.includes('eletric') || lower.includes('lightning') || lower.includes('raio')) elementos.push('eletrico');
  if (lower.includes('ácido') || lower.includes('acid')) elementos.push('acido');
  if (lower.includes('veneno') || lower.includes('poison')) elementos.push('veneno');
  if (lower.includes('necr') || lower.includes('sombr') || lower.includes('shadow') || lower.includes('dark')) elementos.push('sombrio');
  if (lower.includes('radiante') || lower.includes('radiant') || lower.includes('luz') || lower.includes('light') || lower.includes('sagrado')) elementos.push('radiante');
  if (lower.includes('psíquic') || lower.includes('psychic') || lower.includes('ment') || lower.includes('telepa')) elementos.push('psiquico');
  if (lower.includes('trovão') || lower.includes('thunder')) elementos.push('sonico');

  if (categoriaId === 'mortosVivos' || categoriaId === 'undeadRaros') {
    if (!elementos.includes('sombrio')) elementos.push('sombrio');
  }
  if (categoriaId === 'demoniosDiabos') {
    if (!elementos.includes('fogo') && !elementos.includes('sombrio')) elementos.push('fogo');
  }

  return elementos.length > 0 ? elementos : ['natureza'];
}

function inferirTemas(categoriaId, tipo) {
  const temas = ['fantasia'];

  const catTemas = {
    'mortosVivos': ['sombrio', 'terror', 'medieval'],
    'undeadRaros': ['sombrio', 'terror', 'medieval'],
    'demoniosDiabos': ['sombrio', 'terror', 'fantasia'],
    'dragoes': ['medieval', 'fantasia', 'epico'],
    'constructos': ['fantasia', 'steampunk', 'medieval'],
    'gigantes': ['medieval', 'fantasia', 'epico'],
    'aberracoes': ['terror', 'sombrio', 'fantasia'],
    'fadas': ['fantasia', 'floresta', 'medieval'],
    'humanoidesMonstr': ['medieval', 'fantasia'],
    'bestas': ['medieval', 'fantasia', 'natureza'],
    'elementais': ['fantasia', 'epico'],
    'elementaisClimaticos': ['fantasia', 'natureza'],
    'miticas': ['fantasia', 'epico', 'medieval'],
    'outrosPlanos': ['fantasia', 'sombrio', 'epico'],
    'plantasNatureza': ['fantasia', 'natureza', 'floresta'],
    'aquaticas': ['fantasia', 'medieval', 'natureza'],
    'vermesSub': ['sombrio', 'fantasia', 'terror'],
    'espiritos': ['sombrio', 'terror', 'fantasia'],
  };

  const extra = catTemas[categoriaId] || ['medieval'];
  for (const t of extra) {
    if (!temas.includes(t)) temas.push(t);
  }

  return temas;
}

function inferirVelocidade(tipo, tamanho, categoriaId, habilidades) {
  const vel = { terrestre: 30 };
  const lower = (habilidades || '').toLowerCase() + ' ' + (tipo || '').toLowerCase();

  // Ajustar velocidade terrestre por tamanho
  if (tamanho === 'minusculo') vel.terrestre = 15;
  else if (tamanho === 'pequeno') vel.terrestre = 25;
  else if (tamanho === 'grande') vel.terrestre = 35;
  else if (tamanho === 'enorme' || tamanho === 'gargantuesco') vel.terrestre = 40;
  else if (tamanho === 'colossal') vel.terrestre = 40;

  // Voo
  if (lower.includes('voo') || lower.includes('voar') || lower.includes('fly') || lower.includes('asas') || lower.includes('wing')) {
    vel.voo = vel.terrestre + 20;
  }
  if (categoriaId === 'dragoes' && !vel.voo) {
    vel.voo = 60;
  }

  // Natacao
  if (lower.includes('nada') || lower.includes('swim') || lower.includes('aquatic') || lower.includes('agua')) {
    vel.natacao = vel.terrestre + 10;
  }
  if (categoriaId === 'aquaticas' && !vel.natacao) {
    vel.natacao = 40;
    vel.terrestre = 10;
  }

  // Escavar
  if (lower.includes('escav') || lower.includes('burrow') || lower.includes('tunel')) {
    vel.escavar = 20;
  }
  if (categoriaId === 'vermesSub' && !vel.escavar) {
    vel.escavar = 30;
  }

  // Lento
  if (/lento|slow|arrastado/i.test(lower)) {
    vel.terrestre = Math.max(10, vel.terrestre - 10);
  }

  return vel;
}

function gerarHabilidades(nome, tipo, tier, habilidadesTexto) {
  const habs = [];
  const lower = (habilidadesTexto || '').toLowerCase();

  // Tentar extrair habilidades do texto
  const danoMatch = habilidadesTexto ? habilidadesTexto.match(/(\d+d\d+(?:\+\d+)?)/g) : null;
  const dados = danoMatch || [];

  // Habilidade 1: ataque especial (sempre tem)
  const danoHab1 = dados[0] || _danoPorTier(tier, 1);
  let tipoHab1 = 'ofensiva';
  let nomeHab1 = _gerarNomeHabilidade(tipo, 'ofensiva', lower);
  let descHab1 = _gerarDescHabilidade(nomeHab1, tipo);
  let efeitoHab1 = null;

  // Detectar efeitos no texto
  if (/veneno|poison|envenen/i.test(lower)) {
    efeitoHab1 = { tipo: 'veneno', duracao: 3, dano_por_turno: _danoPorTier(Math.max(1, tier - 1), 0) };
  } else if (/paralisi|paralyz|imobiliz/i.test(lower)) {
    efeitoHab1 = { tipo: 'paralisia', duracao: 2, dano_por_turno: null };
  } else if (/medo|frighten|terror|aterroriz/i.test(lower)) {
    efeitoHab1 = { tipo: 'medo', duracao: 2, dano_por_turno: null };
  } else if (/cura|heal|regenera/i.test(lower)) {
    tipoHab1 = 'defensiva';
  }

  habs.push({
    nome: nomeHab1,
    descricao: descHab1,
    tipo: tipoHab1,
    dano: tipoHab1 === 'ofensiva' ? danoHab1 : null,
    efeito: efeitoHab1,
    cooldown: 2 + Math.floor(tier / 3),
    chance: 50
  });

  // Habilidade 2: defensiva ou suporte (tier >= 3)
  if (tier >= 3) {
    const nomeHab2 = _gerarNomeHabilidade(tipo, 'defensiva', lower);
    habs.push({
      nome: nomeHab2,
      descricao: _gerarDescHabilidade(nomeHab2, tipo),
      tipo: 'defensiva',
      dano: null,
      efeito: { tipo: 'buff', duracao: 2, dano_por_turno: null },
      cooldown: 3 + Math.floor(tier / 3),
      chance: 40
    });
  }

  // Habilidade 3: especial poderosa (tier >= 6)
  if (tier >= 6) {
    const danoHab3 = dados[1] || _danoPorTier(tier, 2);
    const nomeHab3 = _gerarNomeHabilidade(tipo, 'especial', lower);
    habs.push({
      nome: nomeHab3,
      descricao: _gerarDescHabilidade(nomeHab3, tipo),
      tipo: 'ofensiva',
      dano: danoHab3,
      efeito: null,
      cooldown: 4 + Math.floor(tier / 2),
      chance: 30
    });
  }

  return habs;
}

function _danoPorTier(tier, bonus) {
  const danos = ['1d4', '1d6', '1d6+1', '1d8+1', '1d8+2', '2d6+2', '2d6+3', '2d8+3', '2d8+4', '3d6+5'];
  return danos[Math.min(tier - 1 + bonus, danos.length - 1)] || '1d6';
}

const NOMES_HABILIDADES = {
  'morto-vivo':  { ofensiva: ['Toque Necrótico', 'Garra Mortal', 'Mordida Putrefata'], defensiva: ['Reconstituição', 'Aura de Morte', 'Forma Espectral'], especial: ['Drenar Vida', 'Grito dos Mortos', 'Explosão Necrótica'] },
  'fiend':       { ofensiva: ['Chama Infernal', 'Garra Demoníaca', 'Lâmina Profana'], defensiva: ['Escudo de Fogo', 'Regeneração Demoníaca', 'Aura de Medo'], especial: ['Fogo Infernal', 'Invocação Abissal', 'Destruição Profana'] },
  'dragao':      { ofensiva: ['Mordida Draconiana', 'Garras Devastadoras', 'Cauda Esmagadora'], defensiva: ['Escamas Reforçadas', 'Presença Aterrorizante', 'Aura Elemental'], especial: ['Sopro Elemental', 'Fúria Draconiana', 'Tempestade Elemental'] },
  'constructo':  { ofensiva: ['Punho de Ferro', 'Esmagamento', 'Golpe Mecânico'], defensiva: ['Blindagem Mágica', 'Autocorreção', 'Deflexão'], especial: ['Sobrecarga', 'Investida Implacável', 'Explosão de Energia'] },
  'gigante':     { ofensiva: ['Pancada Brutal', 'Arremesso de Rocha', 'Pisoteamento'], defensiva: ['Pele Rochosa', 'Grito de Guerra', 'Postura Defensiva'], especial: ['Terremoto', 'Fúria Colossal', 'Avalanche'] },
  'aberracao':   { ofensiva: ['Tentáculo Mental', 'Olhar Enlouquecedor', 'Ataque Psíquico'], defensiva: ['Distorção Espacial', 'Escudo Mental', 'Teleporte Curto'], especial: ['Explosão Psíquica', 'Dominação Mental', 'Anomalia Dimensional'] },
  'fada':        { ofensiva: ['Encantamento Hostil', 'Espinhos Feéricos', 'Ilusão Cortante'], defensiva: ['Véu de Ilusão', 'Dança Encantada', 'Bruma Protetora'], especial: ['Tempestade Feérica', 'Maldição Feérica', 'Caos Encantado'] },
  'humanoide':   { ofensiva: ['Golpe Preciso', 'Ataque Furtivo', 'Investida'], defensiva: ['Esquiva Tática', 'Grito de Comando', 'Posição Defensiva'], especial: ['Execução', 'Emboscada Mortal', 'Ataque Devastador'] },
  'besta':       { ofensiva: ['Mordida Feroz', 'Garras Afiadas', 'Investida Selvagem'], defensiva: ['Instinto Selvagem', 'Camuflagem Natural', 'Rugido Intimidador'], especial: ['Frenesi', 'Ataque em Salto', 'Despedaçar'] },
  'elemental':   { ofensiva: ['Golpe Elemental', 'Rajada de Energia', 'Explosão Primordial'], defensiva: ['Forma Instável', 'Absorção Elemental', 'Escudo Primordial'], especial: ['Tempestade Elemental', 'Nova Primordial', 'Cataclismo'] },
  'celestial':   { ofensiva: ['Espada Radiante', 'Smite Divino', 'Lança de Luz'], defensiva: ['Aura Sagrada', 'Cura Divina', 'Escudo de Fé'], especial: ['Julgamento Divino', 'Pilar de Luz', 'Ira Celestial'] },
  'plant':       { ofensiva: ['Chicote de Vinhas', 'Esporos Tóxicos', 'Golpe de Raiz'], defensiva: ['Regeneração Natural', 'Casca Protetora', 'Camuflagem Florestal'], especial: ['Tempestade de Esporos', 'Enraizar', 'Explosão de Pólen'] },
  'monstrosity': { ofensiva: ['Mordida Monstruosa', 'Garra Devastadora', 'Investida Brutal'], defensiva: ['Couraça Natural', 'Faro Aguçado', 'Recuo Rápido'], especial: ['Fúria Bestial', 'Ataque Múltiplo', 'Destruição'] },
  'default':     { ofensiva: ['Ataque Selvagem', 'Golpe Brutal', 'Investida'], defensiva: ['Defesa Natural', 'Esquiva Instintiva', 'Grito'], especial: ['Fúria', 'Ataque Devastador', 'Explosão'] },
};

function _gerarNomeHabilidade(tipo, categoria, habTexto) {
  const nomes = NOMES_HABILIDADES[tipo] || NOMES_HABILIDADES['default'];
  const lista = nomes[categoria] || nomes['ofensiva'];
  return lista[Math.floor(Math.random() * lista.length)];
}

function _gerarDescHabilidade(nomeHab, tipo) {
  const descs = {
    'Toque Necrótico': 'Um toque gélido que drena a força vital do alvo.',
    'Garra Mortal': 'Garras imbuídas de energia necrótica dilaceram a carne.',
    'Mordida Putrefata': 'Uma mordida com mandíbulas apodrecidas que infecta a ferida.',
    'Chama Infernal': 'Chamas do abismo envolvem o alvo em fogo demoníaco.',
    'Garra Demoníaca': 'Garras afiadas como obsidiana rasgam armaduras.',
    'Sopro Elemental': 'Um cone devastador de energia elemental pura.',
    'Mordida Draconiana': 'Mandíbulas enormes trituram com força descomunal.',
    'Punho de Ferro': 'Um golpe mecânico preciso com força implacável.',
    'Pancada Brutal': 'Um golpe com força descomunal que estremece o chão.',
    'Arremesso de Rocha': 'Uma rocha enorme é arremessada com precisão devastadora.',
    'Tentáculo Mental': 'Extensões psíquicas penetram a mente do alvo.',
    'Mordida Feroz': 'Presas afiadas rasgam carne e osso.',
  };
  return descs[nomeHab] || `O monstro executa ${nomeHab.toLowerCase()} contra seu alvo.`;
}

function inferirRaridade(xp) {
  if (xp <= 50) return 'comum';
  if (xp <= 450) return 'incomum';
  if (xp <= 2900) return 'raro';
  if (xp <= 10000) return 'muito raro';
  return 'lendario';
}

// ========== GERACAO DE STATS ==========

function gerarStats(monstro) {
  const xp = typeof monstro.xp === 'number' ? monstro.xp : 50;
  const tier = inferirTier(xp);
  const nivel = inferirNivel(xp);
  const tamanho = normalizarTamanho(monstro.tamanho);
  const tipoNorm = normalizarTipo(monstro.tipo);
  const nome = normalizarNome(monstro.nome);

  const base = TIER_STATS[tier];
  const modTam = MOD_TAMANHO[tamanho] || MOD_TAMANHO['medio'];
  const mental = getTipoMental(tipoNorm);

  const { resistencias, imunidades } = extrairResistenciasImunidades(monstro.habilidades);
  const elementos = extrairElementos(monstro.tipo, monstro.habilidades, monstro.categoria_id);
  const temas = inferirTemas(monstro.categoria_id, tipoNorm);
  const velocidade = inferirVelocidade(monstro.tipo, tamanho, monstro.categoria_id, monstro.habilidades);
  const habilidades = gerarHabilidades(nome, tipoNorm, tier, monstro.habilidades);

  // Habitat do compendio
  const habitat = monstro.habitat
    ? monstro.habitat.split(/[,;]/).map(h => h.trim().toLowerCase()).filter(Boolean)
    : [];

  // Tipo array para o campo tipo[] do banco
  const tipoArray = [tipoNorm];
  // Adicionar subtipo se relevante
  if (monstro.tipo && monstro.tipo.includes('/')) {
    const subtipos = monstro.tipo.split('/').map(t => normalizarTipo(t.trim()));
    for (const st of subtipos) {
      if (!tipoArray.includes(st)) tipoArray.push(st);
    }
  }

  return {
    nome,
    descricao: monstro.descricao || '',
    tipo: tipoArray,
    raridade: inferirRaridade(xp),
    categoria_id: monstro.categoria_id,
    nivel_min: nivel.min,
    nivel_max: nivel.max,
    hp_base: Math.max(5, base.hp + modTam.hp),
    forca: Math.max(1, base.forca + modTam.forca),
    inteligencia: Math.max(1, mental.int + Math.floor(tier / 3)),
    destreza: Math.max(1, 10 + (modTam.destreza || 0)),
    constituicao: Math.max(1, base.con + modTam.con),
    agilidade: Math.max(1, 10 + (modTam.agilidade || 0)),
    carisma: Math.max(1, mental.car),
    ataque_base: Math.max(1, base.ataque + modTam.ataque),
    defesa_base: Math.max(1, base.defesa + modTam.defesa),
    dano_base: base.dano,
    habilidades,
    elemento: elementos,
    temas,
    xp_base: xp,
    tamanho,
    habitat,
    resistencias,
    imunidades,
    velocidade,
  };
}

// ========== SQL GENERATION ==========

function escapeSQL(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function toSQLArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  return "ARRAY[" + arr.map(v => escapeSQL(v)).join(', ') + ']';
}

function toJSON(obj) {
  return escapeSQL(JSON.stringify(obj));
}

function gerarSQL(stats) {
  const catInfo = CATEGORIA_MAP[stats.categoria_id];
  const catId = catInfo ? catInfo.id : 1;
  // Raridades existentes no banco: 1=Comum, 2=Incomum, 3=Raro, 4=Muito Raro, 6=Lendario
  const rarMap = { 'comum': 1, 'incomum': 2, 'raro': 3, 'muito raro': 4, 'lendario': 6 };
  const rarId = rarMap[stats.raridade] || 1;

  const desc = stats.descricao.length > 1500
    ? stats.descricao.substring(0, 1500) + '...'
    : stats.descricao;

  return `INSERT INTO monstros (nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max, hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma, ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, tamanho, habitat, resistencias, imunidades, velocidade)
VALUES (
    ${escapeSQL(stats.nome)},
    ${escapeSQL(desc)},
    ${toSQLArray(stats.tipo)},
    ${rarId}, ${catId},
    ${stats.nivel_min}, ${stats.nivel_max},
    ${stats.hp_base},
    ${stats.forca}, ${stats.inteligencia}, ${stats.destreza}, ${stats.constituicao}, ${stats.agilidade}, ${stats.carisma},
    ${stats.ataque_base}, ${stats.defesa_base},
    ${escapeSQL(stats.dano_base)},
    ${toJSON(stats.habilidades)},
    ${toSQLArray(stats.elemento)},
    ${toSQLArray(stats.temas)},
    ${stats.xp_base},
    ${escapeSQL(stats.tamanho)},
    ${toSQLArray(stats.habitat)},
    ${toJSON(stats.resistencias)},
    ${toSQLArray(stats.imunidades)},
    ${toJSON(stats.velocidade)}
)
ON CONFLICT (nome) DO UPDATE SET
    tamanho = EXCLUDED.tamanho,
    habitat = EXCLUDED.habitat,
    resistencias = EXCLUDED.resistencias,
    imunidades = EXCLUDED.imunidades,
    velocidade = EXCLUDED.velocidade;`;
}

// ========== MAIN ==========

function main() {
  const lines = [];

  lines.push('-- =============================================================================');
  lines.push('-- SEED: Monstros do RPG (gerado automaticamente de compendio_monstros.json)');
  lines.push(`-- Total: ${monstros.length} monstros em ${Object.keys(CATEGORIA_MAP).length} categorias`);
  lines.push('-- Compativel com PostgreSQL');
  lines.push('-- =============================================================================');
  lines.push('');

  // Categorias e raridades ja existem no banco — nao gerar INSERTs

  // Agrupar por categoria
  const porCategoria = {};
  for (const m of monstros) {
    const cat = m.categoria_id;
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(m);
  }

  // Gerar monstros
  let total = 0;
  const nomesVistos = new Set();

  for (const [catId, catMonstros] of Object.entries(porCategoria)) {
    const catInfo = CATEGORIA_MAP[catId] || { nome: catId };
    lines.push(`-- =============================================================================`);
    lines.push(`-- ${catInfo.nome || catId} (${catMonstros.length} monstros)`);
    lines.push(`-- =============================================================================`);
    lines.push('');

    for (const m of catMonstros) {
      const stats = gerarStats(m);

      // Evitar nomes duplicados
      if (nomesVistos.has(stats.nome)) {
        console.warn(`⚠️ Nome duplicado: ${stats.nome} — pulando`);
        continue;
      }
      nomesVistos.add(stats.nome);

      lines.push(`-- ${stats.nome} (Tier ${inferirTier(stats.xp_base)}, ${stats.tamanho}, ${stats.raridade})`);
      lines.push(gerarSQL(stats));
      lines.push('');
      total++;
    }
  }

  lines.push(`-- Total: ${total} monstros gerados`);

  const outputPath = path.join(__dirname, 'seed_monstros_compendio.sql');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`✅ Gerado: ${outputPath}`);
  console.log(`📊 ${total} monstros em ${Object.keys(porCategoria).length} categorias`);

  // Estatisticas
  const tierCount = {};
  for (const m of monstros) {
    const t = inferirTier(typeof m.xp === 'number' ? m.xp : 50);
    tierCount[t] = (tierCount[t] || 0) + 1;
  }
  console.log('📈 Distribuição por tier:', tierCount);
}

main();
