/**
 * Script para gerar seed SQL enriquecido a partir do compendio JSON.
 * Extrai automaticamente: bonus, dano_base, elemento, requisitos, propriedades, cargas, usos_por_dia
 */
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./compendio_itens_magicos.json', 'utf8'));
const itens = data.itens;

// ========== FUNÇÕES DE EXTRAÇÃO ==========

function extrairBonus(efeitos) {
  const result = {};

  // "+3 em ataque/dano", "+2 em ataque e dano", "Bônus de +1"
  let m = efeitos.match(/\+(\d+)\s*(?:em\s+)?(?:ataque[\/e\s]+dano|ataque\/dano|ataque e dano)/i)
       || efeitos.match(/[Bb]ônus\s+de\s+\+(\d+)/)
       || efeitos.match(/\+(\d+)\s+em\s+ataque/i);

  if (m) {
    result.ataque = parseInt(m[1]);
    result.dano = parseInt(m[1]);
  }

  // CA bonus: "+2 em CA", "CA +1", "+1 em CA e salvaguardas"
  let ca = efeitos.match(/\+(\d+)\s*(?:em\s+)?(?:CA|classe de armadura)/i)
        || efeitos.match(/CA\s*\+(\d+)/i)
        || efeitos.match(/\+(\d+)\s*(?:bônus|bonus)\s*(?:em\s+)?CA/i);
  if (ca) {
    result.ca = parseInt(ca[1]);
  }

  // CA base para armaduras: "CA 18", "CA 14+Des"
  let caBase = efeitos.match(/CA\s+(\d+)/i);
  if (caBase && !result.ca) {
    result.ca_base = parseInt(caBase[1]);
  }

  return Object.keys(result).length > 0 ? result : null;
}

function extrairDanoBase(efeitos) {
  // Primeiro dado de dano mencionado: "2d6 de fogo", "3d10 dano", "1d8+2"
  const m = efeitos.match(/(\d+d\d+(?:\+\d+)?)/);
  return m ? m[1] : null;
}

function extrairElementos(efeitos) {
  const elementosMap = {
    'fogo': 'fogo', 'fire': 'fogo',
    'gelo': 'gelo', 'frio': 'gelo', 'cold': 'gelo', 'frost': 'gelo',
    'radiante': 'radiante', 'radiant': 'radiante', 'solar': 'radiante', 'luz': 'radiante',
    'necrótico': 'necrotico', 'necrotic': 'necrotico', 'necrotico': 'necrotico',
    'trovão': 'trovao', 'thunder': 'trovao', 'trovao': 'trovao',
    'relâmpago': 'relampago', 'lightning': 'relampago', 'elétrico': 'relampago', 'relampago': 'relampago',
    'força': 'forca', 'force': 'forca', 'forca': 'forca',
    'ácido': 'acido', 'acid': 'acido', 'acido': 'acido',
    'veneno': 'veneno', 'poison': 'veneno',
    'psíquico': 'psiquico', 'psychic': 'psiquico', 'psiquico': 'psiquico',
  };

  const found = new Set();
  const lower = efeitos.toLowerCase();

  for (const [keyword, normalized] of Object.entries(elementosMap)) {
    if (lower.includes(keyword)) {
      found.add(normalized);
    }
  }

  return [...found];
}

function extrairRequisitos(reqText, efeitos) {
  const result = {};

  // Classes
  const classeRegex = /paladino|guerreiro|mago|ladino|clérigo|druida|bárbaro|bardo|ranger|feiticeiro|monge|bruxa|conjurador|assassino|caçador|patrulheiro/gi;
  const classes = reqText.match(classeRegex);
  if (classes) {
    result.classe = [...new Set(classes.map(c => c.toLowerCase()))];
  }

  // Raças
  const racaRegex = /\b(elfo|anão|humano|meio-elfo|halfling|gnomo|tiefling|orc|élfico|élficas?|anã)\b/gi;
  const racas = reqText.match(racaRegex);
  if (racas) {
    result.raca = [...new Set(racas.map(r => r.toLowerCase()))];
  }

  // Alinhamento
  const alinhRegex = /\b(lawful good|chaotic|leal|caótico|bom|maligno|não.?bom|não.?maligno|neutro)\b/gi;
  const alinh = reqText.match(alinhRegex);
  if (alinh) {
    result.alinhamento = [...new Set(alinh.map(a => a.toLowerCase()))];
  }

  // Stats mínimos
  const statsRegex = /(FOR|STR|CON|DES|DEX|INT|SAB|WIS|CAR|CHA)\s*(\d+)/gi;
  let sm;
  const stats = {};
  // Checar requisitos E efeitos
  const combined = reqText + ' ' + efeitos;
  const re = new RegExp(statsRegex.source, 'gi');
  while ((sm = re.exec(combined)) !== null) {
    const attr = sm[1].toUpperCase();
    const val = parseInt(sm[2]);
    // Mapear para PT-BR
    const map = { 'STR': 'FOR', 'DEX': 'DES', 'CON': 'CON', 'INT': 'INT', 'WIS': 'SAB', 'CHA': 'CAR' };
    const key = map[attr] || attr;
    // Só considerar se parece ser requisito (>= 13)
    if (val >= 13) {
      stats[key] = val;
    }
  }
  if (Object.keys(stats).length > 0) result.stats = stats;

  // Especial (item amaldiçoado, corrompido, linhagem, etc.)
  if (/amaldiçoad|cursed|corrompid/i.test(reqText)) result.especial = 'amaldicoado';
  else if (/linhagem|sangue de reis|herdeiro/i.test(reqText)) result.especial = 'linhagem_real';
  else if (/digno|dignidade/i.test(reqText)) result.especial = 'teste_dignidade';
  else if (/divindade|deus/i.test(reqText)) result.especial = 'divino';

  return Object.keys(result).length > 0 ? result : null;
}

function extrairPropriedades(efeitos, reqText) {
  const props = [];
  const e = efeitos.toLowerCase();
  const r = reqText.toLowerCase();

  if (/\d+\s*carga/.test(e)) props.push('cargas');
  if (/\/dia|por dia/.test(e)) props.push('usos_diarios');
  if (/à vontade|a vontade/.test(e)) props.push('a_vontade');
  if (/imune|imunidade/.test(e)) props.push('imunidade');
  if (/vantagem/.test(e)) props.push('vantagem');
  if (/desvantagem/.test(e)) props.push('desvantagem');
  if (/resistência|resistencia/.test(e)) props.push('resistencia');
  if (/\bca\b|classe de armadura/.test(e)) props.push('bonus_ca');
  if (/cura|recupera|heal/.test(e)) props.push('cura');
  if (/visão no escuro|darkvision/.test(e)) props.push('visao_noturna');
  if (/voo|voar|fly/.test(e)) props.push('voo');
  if (/invisib/.test(e)) props.push('invisibilidade');
  if (/teleport|teletransport|plane shift/.test(e)) props.push('teleporte');
  if (/convoca|invoca|summon/.test(e)) props.push('invocacao');
  if (/senciente|sentient|fala telepaticamente|sussurra/.test(e)) props.push('senciente');
  if (/amaldiçoad|cursed|maldição/.test(e) || /amaldiçoad|cursed/.test(r)) props.push('amaldicoado');
  if (/retorna|return/.test(e)) props.push('retorno');
  if (/luz|brilh|ilumina|light/.test(e)) props.push('luminoso');
  if (/salvaguarda|saving throw/.test(e)) props.push('salvaguarda');
  if (/concentração/.test(e)) props.push('concentracao');
  if (/arremess/.test(e)) props.push('arremessavel');

  return [...new Set(props)];
}

function extrairCargas(efeitos) {
  const m = efeitos.match(/(\d+)\s*cargas?/i);
  return m ? parseInt(m[1]) : null;
}

function extrairUsosPorDia(efeitos) {
  // "1/dia", "3/dia", "1 vez por dia", "2 vezes por dia"
  const m = efeitos.match(/(\d+)\/dia/i)
         || efeitos.match(/(\d+)\s*vez(?:es)?\s*por\s*dia/i);
  return m ? parseInt(m[1]) : null;
}

function extrairSintonizacao(reqText) {
  // "Nenhum" ou "sem attuning" = sem sintonização
  if (reqText.startsWith('Nenhum') || /sem\s+attuning/i.test(reqText)) {
    return { sintonizacao: false, restricao: null };
  }
  if (!reqText.includes('sintonização') && !reqText.includes('Requer')) {
    return { sintonizacao: false, restricao: null };
  }

  // Extrair restrição do parênteses
  const m = reqText.match(/sintonização\s*\(([^)]+)\)/i)
         || reqText.match(/sintonização\s+por\s+(?:um\s+)?(.+?)(?:\.|$)/i);

  let restricao = m ? m[1].trim() : null;

  // Limpar "Requer sintonização. Prefere adoradores do mar."
  if (!restricao) {
    const after = reqText.match(/sintonização\.\s*(.+)/i);
    if (after && !after[1].startsWith('A espada')) {
      restricao = after[1].trim().replace(/\.$/, '');
    }
  }

  return { sintonizacao: true, restricao };
}

function extrairTipo(tipoStr) {
  // "Arma (espada longa, curta ou grande)" → ["espada longa", "curta", "grande"]
  // "Armadura (placas)" → ["placas"]
  // "Anel" → ["anel"]
  const m = tipoStr.match(/\(([^)]+)\)/);
  if (m) {
    return m[1].split(/[,\/]/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s && s !== 'ou' && s !== 'e')
      .map(s => s.replace(/^ou\s+/, '').replace(/^e\s+/, '').trim());
  }
  return [tipoStr.toLowerCase()];
}

// ========== GERAR SQL ==========

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function jsonToSQL(obj) {
  if (obj === null) return 'NULL';
  return escapeSQL(JSON.stringify(obj));
}

function arrayToSQL(arr) {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]";
  return "ARRAY[" + arr.map(s => escapeSQL(s)).join(', ') + "]::text[]";
}

// Processar todos os itens
const rows = [];
let stats = { bonus: 0, dano: 0, elem: 0, req: 0, props: 0, cargas: 0, usos: 0 };

itens.forEach(item => {
  const tipo = extrairTipo(item.tipo);
  const bonus = extrairBonus(item.efeitos_stats);
  const dano = extrairDanoBase(item.efeitos_stats);
  const elementos = extrairElementos(item.efeitos_stats);
  const requisitos = extrairRequisitos(item.requisitos, item.efeitos_stats);
  const sint = extrairSintonizacao(item.requisitos);
  const propriedades = extrairPropriedades(item.efeitos_stats, item.requisitos);
  const cargas = extrairCargas(item.efeitos_stats);
  const usos = extrairUsosPorDia(item.efeitos_stats);

  if (bonus) stats.bonus++;
  if (dano) stats.dano++;
  if (elementos.length > 0) stats.elem++;
  if (requisitos) stats.req++;
  if (propriedades.length > 0) stats.props++;
  if (cargas) stats.cargas++;
  if (usos) stats.usos++;

  // Mapear categoria
  const catMap = {
    'espadasLaminas': 'Espadas e Laminas',
    'machados': 'Machados, Martelos e Contundentes',
    'lancas': 'Lancas, Alabardas e Armas de Haste',
    'alcance': 'Armas de Alcance',
    'armaduras': 'Armaduras e Escudos',
    'aneis': 'Aneis Magicos',
    'amuletos': 'Amuletos e Colares',
    'cajadosVarinhas': 'Cajados, Varinhas e Orbes',
    'pocoes': 'Pocoes e Elixires',
    'itensDiversos': 'Itens de Uso e Ferramentas Magicas',
    'artefatos': 'Artefatos Lendarios',
    'miscMagico': 'Miscelanea Magica'
  };

  const categoria = catMap[item.categoria_id] || item.categoria_nome;

  const values = [
    item.id,                                          // numero
    escapeSQL(item.nome),                             // nome
    escapeSQL(item.efeitos_stats),                    // descricao
    arrayToSQL(tipo),                                 // tipo[]
    jsonToSQL(bonus),                                 // bonus
    dano ? escapeSQL(dano) : 'NULL',                  // dano_base
    arrayToSQL(elementos),                            // elemento[]
    jsonToSQL(requisitos),                            // requisitos
    escapeSQL(item.raridade),                         // raridade
    escapeSQL(item.origem_lore),                      // origem_lore
    sint.sintonizacao,                                // sintonizacao
    sint.restricao ? escapeSQL(sint.restricao) : 'NULL', // sintonizacao_restricao
    escapeSQL(categoria),                             // categoria
    arrayToSQL(propriedades),                         // propriedades[]
    cargas !== null ? cargas : 'NULL',                // cargas
    usos !== null ? usos : 'NULL'                     // usos_por_dia
  ];

  rows.push('  (' + values.join(', ') + ')');
});

// Gerar SQL
let sql = `-- =============================================================================
-- SEED: Equipamentos (Compendio de Armas & Itens Magicos) - ENRIQUECIDO
-- Gerado automaticamente a partir do compendio_itens_magicos.json
-- Total de itens: ${itens.length}
-- =============================================================================
-- Estatisticas de enriquecimento:
--   bonus populado: ${stats.bonus}/${itens.length} (${Math.round(stats.bonus/itens.length*100)}%)
--   dano_base populado: ${stats.dano}/${itens.length} (${Math.round(stats.dano/itens.length*100)}%)
--   elemento populado: ${stats.elem}/${itens.length} (${Math.round(stats.elem/itens.length*100)}%)
--   requisitos populado: ${stats.req}/${itens.length} (${Math.round(stats.req/itens.length*100)}%)
--   propriedades populado: ${stats.props}/${itens.length} (${Math.round(stats.props/itens.length*100)}%)
--   cargas populado: ${stats.cargas}/${itens.length} (${Math.round(stats.cargas/itens.length*100)}%)
--   usos_por_dia populado: ${stats.usos}/${itens.length} (${Math.round(stats.usos/itens.length*100)}%)
-- =============================================================================

-- Limpar dados existentes
DELETE FROM public.equipamentos;

-- Remover colunas obsoletas (rodar apenas 1 vez)
-- ALTER TABLE public.equipamentos DROP COLUMN IF EXISTS efeito;
-- ALTER TABLE public.equipamentos DROP COLUMN IF EXISTS restricao;

-- Adicionar novas colunas (rodar apenas 1 vez)
-- ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS propriedades TEXT[] DEFAULT '{}';
-- ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS cargas INTEGER;
-- ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS usos_por_dia INTEGER;

-- Inserir todos os equipamentos
INSERT INTO public.equipamentos (
  numero, nome, descricao, tipo, bonus, dano_base, elemento,
  requisitos, raridade, origem_lore, sintonizacao,
  sintonizacao_restricao, categoria, propriedades, cargas, usos_por_dia
) VALUES
`;

sql += rows.join(',\n') + ';\n';

fs.writeFileSync('seed_equipamentos.sql', sql);

console.log('=== SEED GERADO COM SUCESSO ===');
console.log('Total itens:', itens.length);
console.log('');
console.log('Estatisticas de enriquecimento:');
console.log('  bonus populado:', stats.bonus + '/' + itens.length, '(' + Math.round(stats.bonus/itens.length*100) + '%)');
console.log('  dano_base populado:', stats.dano + '/' + itens.length, '(' + Math.round(stats.dano/itens.length*100) + '%)');
console.log('  elemento populado:', stats.elem + '/' + itens.length, '(' + Math.round(stats.elem/itens.length*100) + '%)');
console.log('  requisitos populado:', stats.req + '/' + itens.length, '(' + Math.round(stats.req/itens.length*100) + '%)');
console.log('  propriedades populado:', stats.props + '/' + itens.length, '(' + Math.round(stats.props/itens.length*100) + '%)');
console.log('  cargas populado:', stats.cargas + '/' + itens.length, '(' + Math.round(stats.cargas/itens.length*100) + '%)');
console.log('  usos_por_dia populado:', stats.usos + '/' + itens.length, '(' + Math.round(stats.usos/itens.length*100) + '%)');
