import { RunnableSequence } from '@langchain/core/runnables';
import { createFinalizacaoModel } from './model.js';
import {
  createFinalizacaoPrompt,
  createRegeneracaoComboPrompt,
  createRegeneracaoEquipamentosPrompt,
} from './prompts.js';
import { DEFAULT_MODEL_SETTINGS } from './config.js';
import { trackLLMUsage } from '../../../services/llmTracker.js';
import logger from '../../../helpers/logger.js';
import { getCapsPerfilCombo } from '../../../helpers/finalizacaoInicialHelper.js';

const log = logger.child({ module: 'FinalizacaoInicialAgent' });

const TIMEOUT_MS = 15_000;
const ATTR_LABELS = {
  forca: 'forca',
  destreza: 'destreza',
  constituicao: 'resistencia',
  inteligencia: 'astucia',
  agilidade: 'agilidade',
  carisma: 'presenca',
};

function parseIAJson(content) {
  try { return JSON.parse(content); } catch (_) { /* noop */ }

  const cleaned = String(content || '')
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  try { return JSON.parse(cleaned); } catch (_) { /* noop */ }

  const match = String(content || '').match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) { /* noop */ }
  }

  log.warn({ rawContent: String(content || '').substring(0, 300) }, 'JSON parse falhou');
  return null;
}

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms)),
  ]);
}

function contarPalavras(texto) {
  return String(texto || '').trim().split(/\s+/).filter(Boolean).length;
}

function resumirBackground(background) {
  const limpo = String(background || '').replace(/\s+/g, ' ').trim();
  if (!limpo) return '';

  const primeiraFrase = limpo.split(/[.!?]/)[0]?.trim() || limpo;
  return primeiraFrase.length > 120 ? `${primeiraFrase.slice(0, 117).trim()}...` : primeiraFrase;
}

function getAtributosFortes(atributos) {
  return Object.entries(atributos || {})
    .map(([key, value]) => [key, Number(value) || 0])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => ATTR_LABELS[key] || key);
}

function buildFalaFallback(snapshot) {
  const nome = snapshot.nome || 'um aventureiro';
  const identidade = [snapshot.classe, snapshot.raca].filter(Boolean).join(' ');
  const backgroundResumo = resumirBackground(snapshot.background);
  const atributosFortes = getAtributosFortes(snapshot.atributos);

  const intro = `Sou ${nome}, ${identidade || 'forjado para a estrada'}.`;
  const passado = backgroundResumo
    ? `Trago comigo a marca de ${backgroundResumo}.`
    : 'Meu caminho foi moldado por luta, perda e escolhas que me obrigaram a endurecer cedo demais.';
  const postura = atributosFortes.length > 0
    ? `Agora sigo em frente confiando em ${atributosFortes.join(' e ')}, pronto para cobrar meu lugar neste mundo.`
    : 'Agora sigo em frente com a certeza de que cada passo precisa valer mais do que o ultimo.';

  return `${intro} ${passado} ${postura}`;
}

function normalizarFalaPersonagem(texto, snapshot) {
  const fala = String(texto || '').trim();
  if (!fala) return buildFalaFallback(snapshot);
  if (contarPalavras(fala) < 16 || fala.length < 90) return buildFalaFallback(snapshot);
  return fala;
}

function formatCatalogo(items) {
  if (!items || items.length === 0) return '(vazio)';
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo || item.categoria || null,
      descricao: item.descricao || '',
      nivel_requerido: item.nivel_requerido || null,
      custo_mana: item.custo_mana || 0,
      raridade: item.raridade || null,
      peso: item.peso || null,
    })),
    null,
    0
  );
}

function buildLookups(catalogoEditavel) {
  return {
    equipamentos: new Map((catalogoEditavel.equipamentos || []).map((item) => [item.id, item])),
    habilidades: new Map((catalogoEditavel.habilidades || []).map((item) => [item.id, item])),
    magias: new Map((catalogoEditavel.magias || []).map((item) => [item.id, item])),
  };
}

function sanitizarCombo(combo, catalogoEditavel) {
  const lookups = buildLookups(catalogoEditavel);
  const filtrar = (items, lookup) =>
    (Array.isArray(items) ? items : [])
      .filter((item) => item && typeof item.id === 'number' && lookup.has(item.id))
      .map((item) => ({
        id: item.id,
        nome: String(item.nome || ''),
        motivo: String(item.motivo || ''),
      }));

  return {
    equipamentos: filtrar(combo?.equipamentos, lookups.equipamentos),
    habilidades: filtrar(combo?.habilidades, lookups.habilidades),
    magias: filtrar(combo?.magias, lookups.magias),
  };
}

function sortTaticos(lista, catalogoEditavel) {
  const habilidadeLookup = new Map((catalogoEditavel.habilidades || []).map((item) => [item.id, item]));
  const magiaLookup = new Map((catalogoEditavel.magias || []).map((item) => [item.id, item]));

  return [...lista].sort((a, b) => {
    const aSource = a.grupo === 'habilidade' ? habilidadeLookup.get(a.id) : magiaLookup.get(a.id);
    const bSource = b.grupo === 'habilidade' ? habilidadeLookup.get(b.id) : magiaLookup.get(b.id);

    const aGrupo = a.grupo === 'habilidade' ? 0 : 1;
    const bGrupo = b.grupo === 'habilidade' ? 0 : 1;
    if (aGrupo !== bGrupo) return aGrupo - bGrupo;

    const aNivel = aSource?.nivel_requerido || 1;
    const bNivel = bSource?.nivel_requerido || 1;
    if (aNivel !== bNivel) return aNivel - bNivel;

    const aMana = aSource?.custo_mana || 0;
    const bMana = bSource?.custo_mana || 0;
    if (aMana !== bMana) return aMana - bMana;

    return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
  });
}

function enforceComboPolicy(combo, catalogoEditavel, meta) {
  const sanitizado = sanitizarCombo(combo, catalogoEditavel);
  const caps = getCapsPerfilCombo(meta?.perfil_combo);

  const equipamentos = sanitizado.equipamentos.slice(0, caps.maxEquipamentos);
  const slotsLivres = Math.max(0, caps.maxTotal - equipamentos.length);
  const limiteTatico = Math.min(caps.maxTaticos, slotsLivres);

  const taticosOrdenados = sortTaticos([
    ...sanitizado.habilidades.map((item) => ({ ...item, grupo: 'habilidade' })),
    ...sanitizado.magias.map((item) => ({ ...item, grupo: 'magia' })),
  ], catalogoEditavel).slice(0, limiteTatico);

  return {
    equipamentos,
    habilidades: taticosOrdenados.filter((item) => item.grupo === 'habilidade').map(({ grupo, ...item }) => item),
    magias: taticosOrdenados.filter((item) => item.grupo === 'magia').map(({ grupo, ...item }) => item),
  };
}

function selectWindow(items, offset, count) {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) return [];

  const resultado = [];
  const start = ((offset % items.length) + items.length) % items.length;

  for (let step = 0; step < items.length && resultado.length < count; step += 1) {
    const item = items[(start + step) % items.length];
    if (!resultado.some((current) => current.id === item.id)) {
      resultado.push(item);
    }
  }

  return resultado;
}

function formatComboAnterior(comboAnterior) {
  if (Array.isArray(comboAnterior)) {
    if (comboAnterior.length === 0) return '(nenhum)';
    return comboAnterior
      .map((item) => `${item.grupo || 'item'}:${item.nome || item.id}`)
      .join(' | ');
  }

  if (!comboAnterior || typeof comboAnterior !== 'object') {
    return '(nenhum)';
  }

  const itens = [
    ...(comboAnterior.equipamentos || []).map((item) => `equipamento:${item.nome || item.id}`),
    ...(comboAnterior.habilidades || []).map((item) => `habilidade:${item.nome || item.id}`),
    ...(comboAnterior.magias || []).map((item) => `magia:${item.nome || item.id}`),
  ];

  return itens.length > 0 ? itens.join(' | ') : '(nenhum)';
}

function buildFallback(snapshot, catalogoEditavel, meta, tentativa = 0) {
  const caps = getCapsPerfilCombo(meta?.perfil_combo);
  const equipamentosCatalogo = catalogoEditavel.equipamentos || [];
  const habilidadesCatalogo = catalogoEditavel.habilidades || [];
  const magiasCatalogo = catalogoEditavel.magias || [];

  const equipamentos = selectWindow(
    equipamentosCatalogo,
    tentativa * caps.maxEquipamentos,
    caps.maxEquipamentos
  ).map((item) => ({
    id: item.id,
    nome: item.nome,
    motivo: tentativa > 0 ? 'Leitura alternativa do Mestre' : 'Leitura inicial do Mestre',
  }));

  const slotsLivres = Math.max(0, caps.maxTotal - equipamentos.length);
  const limiteTatico = Math.min(caps.maxTaticos, slotsLivres);

  const taticosCatalogo = sortTaticos([
    ...habilidadesCatalogo.map((item) => ({ id: item.id, nome: item.nome, grupo: 'habilidade' })),
    ...magiasCatalogo.map((item) => ({ id: item.id, nome: item.nome, grupo: 'magia' })),
  ], catalogoEditavel);

  const taticos = selectWindow(
    taticosCatalogo,
    tentativa * Math.max(1, limiteTatico),
    limiteTatico
  );

  return {
    fala_personagem: buildFalaFallback(snapshot),
    leitura_ficha: `${snapshot.classe} ${snapshot.raca} Nv${meta.nivel}`,
    combo: {
      equipamentos,
      habilidades: taticos
        .filter((item) => item.grupo === 'habilidade')
        .map((item) => ({ id: item.id, nome: item.nome, motivo: 'Sugestao padrao' })),
      magias: taticos
        .filter((item) => item.grupo === 'magia')
        .map((item) => ({ id: item.id, nome: item.nome, motivo: 'Sugestao padrao' })),
    },
  };
}

export default async function criarFinalizacaoInicialAgent() {
  const modelName = DEFAULT_MODEL_SETTINGS.model;

  const prompt = createFinalizacaoPrompt();
  const model = createFinalizacaoModel();
  const chain = RunnableSequence.from([prompt, model]);

  const regenPrompt = createRegeneracaoComboPrompt();
  const regenModel = createFinalizacaoModel();
  const regenChain = RunnableSequence.from([regenPrompt, regenModel]);

  const regenEquipPrompt = createRegeneracaoEquipamentosPrompt();
  const regenEquipModel = createFinalizacaoModel();
  const regenEquipChain = RunnableSequence.from([regenEquipPrompt, regenEquipModel]);

  return {
    gerarFinalizacao: async (base, userId) => {
      const { snapshot, catalogo_editavel, meta } = base;

      try {
        const startTime = Date.now();
        const response = await withTimeout(chain.invoke({
          snapshot: JSON.stringify(snapshot, null, 2),
          catalogo_equipamentos: formatCatalogo(catalogo_editavel.equipamentos),
          catalogo_habilidades: formatCatalogo(catalogo_editavel.habilidades),
          catalogo_magias: formatCatalogo(catalogo_editavel.magias),
          meta: JSON.stringify({
            ...meta,
            caps_combo: getCapsPerfilCombo(meta?.perfil_combo),
          }),
        }));

        trackLLMUsage(response, {
          modelName,
          userId,
          startTime,
          agent: 'FinalizacaoInicial',
        });

        const parsed = parseIAJson(response.content);
        if (!parsed || !parsed.combo) {
          log.warn('IA retornou JSON invalido, usando fallback');
          return buildFallback(snapshot, catalogo_editavel, meta);
        }

        const comboFinal = enforceComboPolicy(parsed.combo, catalogo_editavel, meta);
        const totalItens = comboFinal.equipamentos.length + comboFinal.habilidades.length + comboFinal.magias.length;

        if (totalItens === 0) {
          log.warn({ personagem: snapshot.nome }, 'Combo esvaziado apos sanitizacao, usando fallback');
          const fallback = buildFallback(snapshot, catalogo_editavel, meta);
          return {
            fala_personagem: normalizarFalaPersonagem(parsed.fala_personagem || fallback.fala_personagem, snapshot),
            leitura_ficha: String(parsed.leitura_ficha || fallback.leitura_ficha),
            combo: fallback.combo,
          };
        }

        return {
          fala_personagem: normalizarFalaPersonagem(parsed.fala_personagem || '', snapshot),
          leitura_ficha: String(parsed.leitura_ficha || ''),
          combo: comboFinal,
        };
      } catch (error) {
        log.error({ err: error.message, personagem: snapshot.nome }, 'Erro na finalizacao inicial, usando fallback');
        return buildFallback(snapshot, catalogo_editavel, meta);
      }
    },

    regenerarFinalizacao: async (base, tentativa, comboAnterior, userId) => {
      const { snapshot, catalogo_editavel, meta } = base;

      try {
        const startTime = Date.now();
        const response = await withTimeout(regenChain.invoke({
          snapshot: JSON.stringify(snapshot, null, 2),
          catalogo_equipamentos: formatCatalogo(catalogo_editavel.equipamentos),
          catalogo_habilidades: formatCatalogo(catalogo_editavel.habilidades),
          catalogo_magias: formatCatalogo(catalogo_editavel.magias),
          meta: JSON.stringify({
            ...meta,
            caps_combo: getCapsPerfilCombo(meta?.perfil_combo),
          }),
          tentativa: String(tentativa),
          combo_anterior: formatComboAnterior(comboAnterior),
        }));

        trackLLMUsage(response, {
          modelName,
          userId,
          startTime,
          agent: 'FinalizacaoInicial:RegenCombo',
        });

        const parsed = parseIAJson(response.content);
        if (!parsed || !parsed.combo) {
          log.warn({ tentativa }, 'Regeneracao de combo retornou JSON invalido, usando fallback');
          return buildFallback(snapshot, catalogo_editavel, meta, tentativa);
        }

        const comboFinal = enforceComboPolicy(parsed.combo, catalogo_editavel, meta);
        const totalItens = comboFinal.equipamentos.length + comboFinal.habilidades.length + comboFinal.magias.length;

        if (totalItens === 0) {
          log.warn({ tentativa, personagem: snapshot.nome }, 'Regeneracao de combo esvaziou apos sanitizacao, usando fallback');
          const fallback = buildFallback(snapshot, catalogo_editavel, meta, tentativa);
          return {
            fala_personagem: normalizarFalaPersonagem(parsed.fala_personagem || fallback.fala_personagem, snapshot),
            leitura_ficha: String(parsed.leitura_ficha || fallback.leitura_ficha),
            combo: fallback.combo,
          };
        }

        return {
          fala_personagem: normalizarFalaPersonagem(parsed.fala_personagem || '', snapshot),
          leitura_ficha: String(parsed.leitura_ficha || ''),
          combo: comboFinal,
        };
      } catch (error) {
        log.error({ err: error.message, tentativa }, 'Erro na regeneracao completa, usando fallback');
        return buildFallback(snapshot, catalogo_editavel, meta, tentativa);
      }
    },

    regenerarEquipamentos: async (base, tentativa, anteriores, userId) => {
      const { snapshot, catalogo_editavel, meta } = base;
      const idsEquip = new Set((catalogo_editavel.equipamentos || []).map((item) => item.id));
      const caps = getCapsPerfilCombo(meta?.perfil_combo);

      try {
        const startTime = Date.now();
        const response = await withTimeout(regenEquipChain.invoke({
          snapshot: JSON.stringify(snapshot, null, 2),
          catalogo_equipamentos: formatCatalogo(catalogo_editavel.equipamentos),
          meta: JSON.stringify(meta),
          tentativa: String(tentativa),
          equipamentos_anteriores: anteriores.length > 0 ? anteriores.join(', ') : '(nenhum)',
        }));

        trackLLMUsage(response, {
          modelName,
          userId,
          startTime,
          agent: 'FinalizacaoInicial:RegenEquip',
        });

        const parsed = parseIAJson(response.content);
        if (!parsed || !Array.isArray(parsed.equipamentos)) {
          log.warn('Regeneracao retornou JSON invalido, usando fallback');
          return buildFallback(snapshot, catalogo_editavel, meta, tentativa).combo.equipamentos;
        }

        const sanitizados = (parsed.equipamentos || [])
          .filter((item) => item && typeof item.id === 'number' && idsEquip.has(item.id))
          .map((item) => ({
            id: item.id,
            nome: String(item.nome || ''),
            motivo: String(item.motivo || ''),
          }))
          .slice(0, caps.maxEquipamentos);

        if (sanitizados.length === 0) {
          log.warn({ tentativa }, 'Regeneracao esvaziou apos sanitizacao, usando fallback');
          return buildFallback(snapshot, catalogo_editavel, meta, tentativa).combo.equipamentos;
        }

        return sanitizados;
      } catch (error) {
        log.error({ err: error.message, tentativa }, 'Erro na regeneracao de equipamentos, usando fallback');
        return buildFallback(snapshot, catalogo_editavel, meta, tentativa).combo.equipamentos;
      }
    },
  };
}
