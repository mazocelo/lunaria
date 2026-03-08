/**
 * Script para gerar seed SQL enriquecido a partir do compendio JSON.
 * Extrai automaticamente: bonus, dano_base, elemento, requisitos, propriedades, cargas, usos_por_dia, peso, preco_sugerido
 */
const fs = require('fs');
const path = require('path');

// Caminho relativo ao projeto (2 niveis acima de Backend/sql/)
const projectRoot = path.resolve(__dirname, '..', '..');
const data = JSON.parse(fs.readFileSync(path.join(projectRoot, 'compendio_itens_magicos.json'), 'utf8'));
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

  // Armadura: itens que mencionam CA base (armaduras) → converter para armadura
  let caBase = efeitos.match(/(?:CA|TA)\s+(\d+)/i);
  if (caBase) {
    const caVal = parseInt(caBase[1]);
    // Armaduras pesadas (ca_base >= 17): alta armadura, penalidade esquiva
    if (caVal >= 17) {
      result.armadura = Math.round(caVal * 0.45);
      result.esquiva_penalidade = 10;
    }
    // Armaduras medias (14-16): armadura moderada, penalidade leve
    else if (caVal >= 14) {
      result.armadura = Math.round(caVal * 0.35);
      result.esquiva_penalidade = 3;
    }
    // Armaduras leves (< 14): pouca armadura, bonus esquiva
    else if (caVal >= 10) {
      result.armadura = Math.round(caVal * 0.25);
      result.esquiva_bonus = 3;
    }
  }

  // Bonus de esquiva/armadura: "+2 em CA", "CA +1" → agora esquiva para itens leves
  let caBonus = efeitos.match(/\+(\d+)\s*(?:em\s+)?(?:CA|TA|classe de armadura)/i)
        || efeitos.match(/(?:CA|TA)\s*\+(\d+)/i);
  if (caBonus && !caBase) {
    // Itens de proteção gerais → esquiva
    result.esquiva_bonus = parseInt(caBonus[1]) * 2;
  }

  return Object.keys(result).length > 0 ? result : null;
}

function extrairDanoBase(efeitos) {
  // Separar frases para analisar contexto
  const frases = efeitos.split(/[.;]/).map(s => s.trim());

  for (const frase of frases) {
    const lower = frase.toLowerCase();

    // Pular frases que são de cura, recarga ou recuperação
    if (/recupera|cura|heal|regener|restaur/i.test(lower)) {
      // Mas permitir se também menciona dano explicitamente
      if (!/dano|damage|ataque|attack/i.test(lower)) continue;
    }

    // Pular frases de recarga de cargas ("recupera 1d3 cargas", "recupera 1d6+4 ao amanhecer")
    if (/recupera\s+\d+d\d+.*(?:carga|amanhecer|descanso)/i.test(lower)) continue;

    // Pular frases onde o dado é duração/tempo ("1d6+1 dias", "1d4 horas")
    if (/\d+d\d+(?:\+\d+)?\s*(?:dias?|horas?|minutos?|rodadas?|turnos?)/i.test(lower)) continue;

    // Procurar dado de dano nesta frase
    const m = frase.match(/(\d+d\d+(?:\+\d+)?)/);
    if (m) return m[1];
  }

  return null;
}

function extrairElementos(efeitos) {
  const elementosMap = {
    'fogo': 'fogo', 'fire': 'fogo',
    'gelo': 'gelo', 'frio': 'gelo', 'cold': 'gelo', 'frost': 'gelo',
    'radiante': 'radiante', 'radiant': 'radiante',
    'necrótico': 'necrotico', 'necrotic': 'necrotico', 'necrotico': 'necrotico',
    'trovão': 'trovao', 'thunder': 'trovao', 'trovao': 'trovao',
    'relâmpago': 'relampago', 'lightning': 'relampago', 'elétrico': 'relampago', 'relampago': 'relampago',
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

  // "solar" só conta como radiante se acompanhado de contexto de dano
  if (/solar/.test(lower) && /dano|damage|sofre|extra|adicional/i.test(lower)) {
    found.add('radiante');
  }

  // "força"/"force" só conta como elemento se em contexto de dano (evita confundir com atributo Força/Strength)
  if (/dano\s+de\s+for[cç]a|force\s+damage|for[cç]a\s+(?:extra|adicional)/i.test(lower)) {
    found.add('forca');
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
  if (/\bca\b|\bta\b|classe de armadura|armadura/.test(e)) props.push('bonus_armadura');
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

function extrairVinculo(reqText, efeitos) {
  // "Nenhum" ou "sem attuning" = sem vinculo
  if (reqText.startsWith('Nenhum') || /sem\s+attuning/i.test(reqText)) {
    return null;
  }
  if (!reqText.includes('sintonização') && !reqText.includes('Requer')) {
    return null;
  }

  const vinculo = { requer: true };

  // Extrair texto da restrição
  const m = reqText.match(/sintonização\s*\(([^)]+)\)/i)
         || reqText.match(/sintonização\s+por\s+(?:um\s+)?(.+?)(?:\.|$)/i);
  let restricaoRaw = m ? m[1].trim() : null;

  if (!restricaoRaw) {
    const after = reqText.match(/sintonização\.\s*(.+)/i);
    if (after && !after[1].startsWith('A espada')) {
      restricaoRaw = after[1].trim().replace(/\.$/, '');
    }
  }

  // Classificar tipo de restrição
  if (restricaoRaw) {
    const r = restricaoRaw.toLowerCase();
    const classes = ['paladino', 'clerigo', 'clérigo', 'mago', 'feiticeiro', 'bruxo', 'druida', 'bardo', 'guerreiro', 'ladino', 'bárbaro', 'barbaro', 'conjurador', 'assassino', 'cavaleiro', 'patrulheiro', 'caçador'];
    const alinhamentos = ['bom', 'mau', 'maligno', 'caótico', 'caotico', 'lawful', 'neutro', 'sagrado', 'não bom', 'não-bom', 'não bom', 'qualquer não bom', 'qualquer não-bom'];
    const racas = ['anão', 'anao', 'elfo', 'elfos', 'meio-elfo', 'humano', 'élfico'];

    const classeMatch = classes.filter(c => r.includes(c));
    const alinhMatch = alinhamentos.filter(a => r.includes(a));
    const racaMatch = racas.filter(rc => r.includes(rc));

    if (/amaldiçoad|cursed|corrompid|item amaldiçoado|item corrompido/.test(r)) {
      vinculo.restricao_tipo = 'maldicao';
      vinculo.restricao = [restricaoRaw];
    } else if (/for\s*\d|str\s*\d|território|envelhece|dependência|complexo|perigoso|7 dias|cada uso|coroa de estrelas|nível/i.test(r)) {
      vinculo.restricao_tipo = 'especial';
      vinculo.restricao = [restricaoRaw];
    } else if (classeMatch.length > 0 && alinhMatch.length === 0 && racaMatch.length === 0) {
      vinculo.restricao_tipo = 'classe';
      vinculo.restricao = classeMatch.map(c => c.replace('clérigo', 'clerigo').replace('bárbaro', 'barbaro'));
    } else if (alinhMatch.length > 0 && classeMatch.length === 0) {
      vinculo.restricao_tipo = 'alinhamento';
      vinculo.restricao = alinhMatch;
    } else if (racaMatch.length > 0 && classeMatch.length === 0) {
      vinculo.restricao_tipo = 'raca';
      vinculo.restricao = racaMatch.map(rc => rc.replace('élfico', 'elfo').replace('anão', 'anao'));
    } else if (classeMatch.length > 0 && (alinhMatch.length > 0 || racaMatch.length > 0)) {
      vinculo.restricao_tipo = 'misto';
      vinculo.restricao = [restricaoRaw];
    } else {
      vinculo.restricao_tipo = 'especial';
      vinculo.restricao = [restricaoRaw];
    }
  }

  // Extrair descricao do efeito do vinculo (resumo do que o item faz quando vinculado)
  // Pegar as primeiras frases significativas do efeito
  if (efeitos) {
    const frases = efeitos.split(/[.!]/).map(s => s.trim()).filter(s => s.length > 10);
    // Pegar ate 2 frases que descrevem o efeito principal
    const desc = frases.slice(0, 2).join('. ');
    if (desc) vinculo.descricao = desc;
  }

  return vinculo;
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

// ========== PESO E PREÇO SUGERIDO ==========

// Peso em kg por categoria/tipo
const pesosPorCategoria = {
  'espadasLaminas': 1.5,
  'machados': 2.5,
  'lancas': 2.0,
  'alcance': 1.0,
  'armaduras': 10.0,
  'aneis': 0.01,
  'amuletos': 0.05,
  'cajadosVarinhas': 1.0,
  'pocoes': 0.25,
  'itensDiversos': 0.5,
  'artefatos': 1.0,
  'miscMagico': 0.3
};

// Ajustes de peso por tipo específico
const pesosPorTipo = {
  'espada longa': 1.5, 'espada curta': 1.0, 'espada larga': 2.0, 'espada grande': 3.0,
  'adaga': 0.5, 'cimitarra': 1.5, 'rapieira': 1.0, 'sabre': 1.2,
  'martelo de guerra': 2.5, 'maça': 2.0, 'machado': 2.5, 'machado grande': 3.5,
  'lança': 1.5, 'alabarda': 3.0, 'tridente': 2.0, 'glaive': 3.0,
  'arco longo': 1.0, 'arco curto': 0.5, 'besta': 2.5, 'funda': 0.1,
  'placas': 30.0, 'cota de malhas': 25.0, 'meia-placa': 18.0, 'couro': 5.0, 'escudo': 3.0,
  'anel': 0.01, 'amuleto': 0.05, 'colar': 0.05, 'medalhão': 0.08,
  'cajado': 2.0, 'varinha': 0.1, 'orbe': 1.5,
  'poção': 0.25, 'elixir': 0.25, 'frasco': 0.25,
  'capa': 0.5, 'manto': 0.5, 'botas': 1.0, 'luvas': 0.2, 'elmo': 1.5, 'cinturão': 0.5,
};

// Preço sugerido em PO (peças de ouro) por raridade
const precosPorRaridade = {
  'Comum': '50-100 PO',
  'Incomum': '100-500 PO',
  'Raro': '500-5.000 PO',
  'Muito Raro': '5.000-50.000 PO',
  'Épico': '50.000-100.000 PO',
  'Epico': '50.000-100.000 PO',
  'Lendário': '100.000-500.000 PO',
  'Lendario': '100.000-500.000 PO',
  'Artefato': 'Inestimável',
  'Variável': 'Variável',
  'Variavel': 'Variável',
};

function extrairPeso(categoriaId, tipos) {
  // Tentar match por tipo específico primeiro
  for (const t of tipos) {
    for (const [key, peso] of Object.entries(pesosPorTipo)) {
      if (t.includes(key) || key.includes(t)) {
        return peso;
      }
    }
  }
  // Fallback: peso por categoria
  return pesosPorCategoria[categoriaId] || 0.5;
}

function extrairPrecoSugerido(raridade) {
  return precosPorRaridade[raridade] || precosPorRaridade['Comum'];
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

// Carregar mapas de IDs (gerados por seed_raridades_categorias.cjs)
const rarIdMap = JSON.parse(fs.readFileSync(__dirname + '/raridade_map.json', 'utf8'));
const catIdMap = JSON.parse(fs.readFileSync(__dirname + '/categoria_map.json', 'utf8'));

// Mapear categoria JSON key -> ID (com acentos, matching seed_raridades_categorias.cjs)
const catKeyToId = {
  'espadasLaminas': catIdMap['Espadas e Lâminas'],
  'machados': catIdMap['Machados, Martelos e Contundentes'],
  'lancas': catIdMap['Lanças, Alabardas e Armas de Haste'],
  'alcance': catIdMap['Armas de Alcance'],
  'armaduras': catIdMap['Armaduras e Escudos'],
  'aneis': catIdMap['Anéis Mágicos'],
  'amuletos': catIdMap['Amuletos e Colares'],
  'cajadosVarinhas': catIdMap['Cajados, Varinhas e Orbes'],
  'pocoes': catIdMap['Poções e Elixires'],
  'itensDiversos': catIdMap['Itens de Uso e Ferramentas Mágicas'],
  'artefatos': catIdMap['Artefatos Lendários'],
  'miscMagico': catIdMap['Miscelânea Mágica']
};

function mapRaridadeId(rarStr) {
  if (!rarStr) return rarIdMap['comum'];
  const lower = rarStr.toLowerCase().trim();
  if (rarIdMap[lower]) return rarIdMap[lower];
  if (lower.includes('artefato')) return rarIdMap['artefato'];
  if (lower.includes('muito raro')) return rarIdMap['muito raro'];
  if (lower.includes('raro') && (lower.includes('incomum') || lower.includes('lend'))) return rarIdMap['variavel'];
  if (lower.includes('lend')) return rarIdMap['lendario'];
  if (lower.includes('raro')) return rarIdMap['raro'];
  if (lower.includes('incomum')) return rarIdMap['incomum'];
  if (lower.includes('varia')) return rarIdMap['variavel'];
  return rarIdMap['comum'];
}

// Processar todos os itens
const rows = [];
let stats = { bonus: 0, dano: 0, elem: 0, req: 0, props: 0, cargas: 0, usos: 0, vinculo: 0 };

itens.forEach(item => {
  const tipo = extrairTipo(item.tipo);
  const bonus = extrairBonus(item.efeitos_stats);
  const dano = extrairDanoBase(item.efeitos_stats);
  const elementos = extrairElementos(item.efeitos_stats);
  const requisitos = extrairRequisitos(item.requisitos, item.efeitos_stats);
  const vinculo = extrairVinculo(item.requisitos, item.efeitos_stats);
  const propriedades = extrairPropriedades(item.efeitos_stats, item.requisitos);
  const cargas = extrairCargas(item.efeitos_stats);
  const usos = extrairUsosPorDia(item.efeitos_stats);
  const peso = extrairPeso(item.categoria_id, tipo);
  const precoSugerido = extrairPrecoSugerido(item.raridade);

  if (bonus) stats.bonus++;
  if (dano) stats.dano++;
  if (elementos.length > 0) stats.elem++;
  if (requisitos) stats.req++;
  if (propriedades.length > 0) stats.props++;
  if (cargas) stats.cargas++;
  if (usos) stats.usos++;
  if (vinculo) stats.vinculo++;

  const raridadeId = mapRaridadeId(item.raridade);
  const categoriaId = catKeyToId[item.categoria_id] || catIdMap['Miscelânea Mágica'];

  const values = [
    item.id,                                          // numero
    escapeSQL(item.nome),                             // nome
    escapeSQL(item.efeitos_stats),                    // descricao
    arrayToSQL(tipo),                                 // tipo[]
    jsonToSQL(bonus),                                 // bonus
    dano ? escapeSQL(dano) : 'NULL',                  // dano_base
    arrayToSQL(elementos),                            // elemento[]
    jsonToSQL(requisitos),                            // requisitos
    raridadeId,                                       // raridade_id
    escapeSQL(item.origem_lore),                      // origem_lore
    jsonToSQL(vinculo),                               // vinculo
    categoriaId,                                      // categoria_id
    arrayToSQL(propriedades),                         // propriedades[]
    cargas !== null ? cargas : 'NULL',                // cargas
    usos !== null ? usos : 'NULL',                    // usos_por_dia
    peso,                                             // peso
    escapeSQL(precoSugerido)                          // preco_sugerido
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
--   vinculo populado: ${stats.vinculo}/${itens.length} (${Math.round(stats.vinculo/itens.length*100)}%)
-- =============================================================================

-- Limpar dados existentes
DELETE FROM public.equipamentos;

-- Inserir todos os equipamentos
INSERT INTO public.equipamentos (
  numero, nome, descricao, tipo, bonus, dano_base, elemento,
  requisitos, raridade_id, origem_lore, vinculo,
  categoria_id, propriedades, cargas, usos_por_dia,
  peso, preco_sugerido
) VALUES
`;

sql += rows.join(',\n') + ';\n';

fs.writeFileSync(__dirname + '/seed_equipamentos.sql', sql);

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
console.log('  vinculo populado:', stats.vinculo + '/' + itens.length, '(' + Math.round(stats.vinculo/itens.length*100) + '%)');
console.log('');
console.log('Arquivo gerado: seed_equipamentos.sql');
