import { RunnableSequence } from '@langchain/core/runnables';
import { createFinalizacaoModel } from './model.js';
import { createFinalizacaoPrompt, createRegeneracaoEquipamentosPrompt } from './prompts.js';
import { DEFAULT_MODEL_SETTINGS } from './config.js';
import { trackLLMUsage } from '../../../services/llmTracker.js';
import logger from '../../../helpers/logger.js';

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

// ── parseIAJson (padrao do codebase — 3 estrategias) ──

function parseIAJson(content) {
  try { return JSON.parse(content); } catch (_) { /* noop */ }

  const cleaned = content
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  try { return JSON.parse(cleaned); } catch (_) { /* noop */ }

  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) { /* noop */ }
  }

  log.warn({ rawContent: content.substring(0, 300) }, 'JSON parse falhou');
  return null;
}

// ── Timeout helper ──

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), ms)
    ),
  ]);
}

// ── Sanitizacao: validar IDs contra catalogo ──

function sanitizarCombo(combo, catalogoEditavel) {
  const idsEquip = new Set(catalogoEditavel.equipamentos.map(e => e.id));
  const idsHab = new Set(catalogoEditavel.habilidades.map(h => h.id));
  const idsMag = new Set(catalogoEditavel.magias.map(m => m.id));

  const filtrar = (items, idsValidos) =>
    (Array.isArray(items) ? items : [])
      .filter(item => item && typeof item.id === 'number' && idsValidos.has(item.id))
      .map(item => ({
        id: item.id,
        nome: String(item.nome || ''),
        motivo: String(item.motivo || ''),
      }));

  return {
    equipamentos: filtrar(combo?.equipamentos, idsEquip),
    habilidades: filtrar(combo?.habilidades, idsHab),
    magias: filtrar(combo?.magias, idsMag),
  };
}

// ── Fallback local ──

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

  if (contarPalavras(fala) < 16 || fala.length < 90) {
    return buildFalaFallback(snapshot);
  }

  return fala;
}

function buildFallback(snapshot, catalogoEditavel, meta) {
  const { classe, raca } = snapshot;

  return {
    fala_personagem: buildFalaFallback(snapshot),
    leitura_ficha: `${classe} ${raca} Nv${meta.nivel}`,
    combo: {
      equipamentos: catalogoEditavel.equipamentos.slice(0, 3).map(e => ({
        id: e.id, nome: e.nome, motivo: 'Sugestao padrao',
      })),
      habilidades: catalogoEditavel.habilidades.slice(0, 2).map(h => ({
        id: h.id, nome: h.nome, motivo: 'Sugestao padrao',
      })),
      magias: catalogoEditavel.magias.slice(0, 2).map(m => ({
        id: m.id, nome: m.nome, motivo: 'Sugestao padrao',
      })),
    },
  };
}

// ── Formatar catalogo para prompt (compacto) ──

function formatCatalogo(items) {
  if (!items || items.length === 0) return '(vazio)';
  return JSON.stringify(
    items.map(i => ({ id: i.id, nome: i.nome, tipo: i.tipo || i.categoria || null, descricao: i.descricao || '' })),
    null, 0
  );
}

// ── Factory ──

export default async function criarFinalizacaoInicialAgent() {
  const modelName = DEFAULT_MODEL_SETTINGS.model;
  const prompt = createFinalizacaoPrompt();
  const model = createFinalizacaoModel();

  const chain = RunnableSequence.from([prompt, model]);

  const regenPrompt = createRegeneracaoEquipamentosPrompt();
  const regenModel = createFinalizacaoModel();
  const regenChain = RunnableSequence.from([regenPrompt, regenModel]);

  return {
    /**
     * Gera finalizacao inicial para um personagem.
     * @param {{ snapshot, catalogo_editavel, meta }} base - output de buildFinalizacaoBase
     * @param {string|number} userId - para tracking de uso
     * @returns {Promise<{ fala_personagem, leitura_ficha, combo }>}
     */
    gerarFinalizacao: async (base, userId) => {
      const { snapshot, catalogo_editavel, meta } = base;

      try {
        const startTime = Date.now();

        const response = await withTimeout(chain.invoke({
          snapshot: JSON.stringify(snapshot, null, 2),
          catalogo_equipamentos: formatCatalogo(catalogo_editavel.equipamentos),
          catalogo_habilidades: formatCatalogo(catalogo_editavel.habilidades),
          catalogo_magias: formatCatalogo(catalogo_editavel.magias),
          meta: JSON.stringify(meta),
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

        const comboSanitizado = sanitizarCombo(parsed.combo, catalogo_editavel);

        // Se sanitizacao esvaziou o combo inteiro, cair no fallback
        const totalItens = comboSanitizado.equipamentos.length
          + comboSanitizado.habilidades.length
          + comboSanitizado.magias.length;

        if (totalItens === 0) {
          log.warn({ personagem: snapshot.nome }, 'Combo esvaziado apos sanitizacao, usando fallback');
          const fb = buildFallback(snapshot, catalogo_editavel, meta);
          return {
            fala_personagem: normalizarFalaPersonagem(parsed.fala_personagem || fb.fala_personagem, snapshot),
            leitura_ficha: String(parsed.leitura_ficha || fb.leitura_ficha),
            combo: fb.combo,
          };
        }

        log.info(
          { personagem: snapshot.nome, equip: comboSanitizado.equipamentos.length, hab: comboSanitizado.habilidades.length, mag: comboSanitizado.magias.length },
          'Finalizacao inicial gerada'
        );

        return {
          fala_personagem: normalizarFalaPersonagem(parsed.fala_personagem || '', snapshot),
          leitura_ficha: String(parsed.leitura_ficha || ''),
          combo: comboSanitizado,
        };
      } catch (error) {
        log.error({ err: error.message, personagem: snapshot.nome }, 'Erro na finalizacao inicial, usando fallback');
        return buildFallback(snapshot, catalogo_editavel, meta);
      }
    },

    /**
     * Regenera apenas o combo de equipamentos com variacao.
     * @param {{ snapshot, catalogo_editavel, meta }} base
     * @param {number} tentativa - 1, 2 ou 3
     * @param {string[]} anteriores - nomes dos equipamentos anteriores
     * @param {string|number} userId
     * @returns {Promise<Array<{ id, nome, motivo }>>}
     */
    regenerarEquipamentos: async (base, tentativa, anteriores, userId) => {
      const { snapshot, catalogo_editavel, meta } = base;
      const idsEquip = new Set(catalogo_editavel.equipamentos.map(e => e.id));

      try {
        const startTime = Date.now();

        const response = await withTimeout(regenChain.invoke({
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
          const offset = (tentativa - 1) * 3;
          return catalogo_editavel.equipamentos.slice(offset, offset + 3).map(e => ({
            id: e.id, nome: e.nome, motivo: 'Sugestao alternativa',
          }));
        }

        const sanitizados = (parsed.equipamentos || [])
          .filter(item => item && typeof item.id === 'number' && idsEquip.has(item.id))
          .map(item => ({ id: item.id, nome: String(item.nome || ''), motivo: String(item.motivo || '') }));

        if (sanitizados.length === 0) {
          log.warn({ tentativa }, 'Regeneracao esvaziou apos sanitizacao, usando fallback');
          const offset = (tentativa - 1) * 3;
          return catalogo_editavel.equipamentos.slice(offset, offset + 3).map(e => ({
            id: e.id, nome: e.nome, motivo: 'Sugestao alternativa',
          }));
        }

        log.info({ personagem: snapshot.nome, tentativa, count: sanitizados.length }, 'Equipamentos regenerados');
        return sanitizados;
      } catch (error) {
        log.error({ err: error.message, tentativa }, 'Erro na regeneracao, usando fallback');
        const offset = (tentativa - 1) * 3;
        return catalogo_editavel.equipamentos.slice(offset, offset + 3).map(e => ({
          id: e.id, nome: e.nome, motivo: 'Sugestao alternativa',
        }));
      }
    },
  };
}
