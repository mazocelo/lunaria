/**
 * Service de criacao de personagem 3D&T Alpha.
 * Pool unico: caracteristicas + vantagens + focus - desvantagens.
 */
import db from '../Model/index.js';
import { TIERS, TIER_DEFAULT, CARACTERISTICA_IDS, FOCUS_KEYS } from '../game-systems/tresdet/constants.js';
import { validarCriacao } from '../game-systems/tresdet/characterEngine.js';
import { sanitizeCharacterName, sanitizePromptInput } from '../helpers/sanitize.js';
import { calcularDinheiroInicial } from '../helpers/economiaHelper.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'PersonagemTresDetService' });

function normalizeIds(raw) {
  if (!raw) return [];
  if (!Array.isArray(raw)) throw Object.assign(new Error('IDs devem ser um array'), { statusCode: 400 });
  return raw.map(id => parseInt(id, 10)).filter(id => Number.isInteger(id) && id > 0);
}

export async function criarPersonagemTresDet(body, userId) {
  const {
    nome, nivelPoder, caracteristicas, focus,
    vantagens, desvantagens, background, imagem,
  } = body;

  // --- Sanitizacao ---
  const nomeSanitizado = sanitizeCharacterName(nome);
  if (!nomeSanitizado) throw Object.assign(new Error('Nome e obrigatorio'), { statusCode: 400 });

  const backgroundSanitizado = sanitizePromptInput(background || '', 2000);

  // --- Tier ---
  const tier = nivelPoder || TIER_DEFAULT;
  const tierConfig = TIERS[tier];
  if (!tierConfig) throw Object.assign(new Error(`Nivel de poder invalido: ${tier}`), { statusCode: 400 });

  // --- IDs ---
  const vantagemIds = normalizeIds(vantagens);
  const desvantagemIds = normalizeIds(desvantagens);

  // --- Buscar vantagens/desvantagens do banco para validar custos ---
  const [vantagensObj, desvantagensObj] = await Promise.all([
    vantagemIds.length > 0
      ? db.prisma.vantagens.findMany({ where: { id: { in: vantagemIds }, sistema: 'tresdet' } })
      : [],
    desvantagemIds.length > 0
      ? db.prisma.desvantagens.findMany({ where: { id: { in: desvantagemIds }, sistema: 'tresdet' } })
      : [],
  ]);

  // Validar que todos existem
  if (vantagensObj.length !== vantagemIds.length) {
    const encontrados = new Set(vantagensObj.map(v => v.id));
    const faltando = vantagemIds.filter(id => !encontrados.has(id));
    throw Object.assign(new Error(`Vantagens nao encontradas: ${faltando.join(', ')}`), { statusCode: 400 });
  }
  if (desvantagensObj.length !== desvantagemIds.length) {
    const encontrados = new Set(desvantagensObj.map(d => d.id));
    const faltando = desvantagemIds.filter(id => !encontrados.has(id));
    throw Object.assign(new Error(`Desvantagens nao encontradas: ${faltando.join(', ')}`), { statusCode: 400 });
  }

  // --- Caracteristicas ---
  const chars = {};
  for (const c of CARACTERISTICA_IDS) {
    chars[c] = parseInt(caracteristicas?.[c], 10) || 0;
  }

  // --- Focus ---
  const focusValues = {};
  for (const k of FOCUS_KEYS) {
    focusValues[k] = parseInt(focus?.[k], 10) || 0;
  }

  // --- Detectar magia (para calculo de PM) ---
  const temMagia = vantagensObj.some(v => {
    const tipo = v.tipo;
    return tipo === 'magico' || (Array.isArray(tipo) && tipo.includes('magico'));
  });

  // --- Validacao de pool ---
  const validacao = validarCriacao({
    tier,
    ...chars,
    focus: focusValues,
    vantagens: vantagensObj,
    desvantagens: desvantagensObj,
  });

  if (!validacao.valido) {
    throw Object.assign(new Error(validacao.erros.join('; ')), { statusCode: 400 });
  }

  // --- Criar personagem em transacao ---
  const personagem = await db.prisma.$transaction(async (tx) => {
    const created = await tx.personagens.create({
      data: {
        nome: nomeSanitizado,
        sistema: 'tresdet',
        nivel: 1,
        pontos_totais: 0,
        pontos_iniciais: tierConfig.pontos,
        background: backgroundSanitizado,
        raca_id: null,
        classe_id: null,
        xp_atual: 0,
        xp_proximo_nivel: 100,
        pontos_atributo_pendentes: 0,
        id_usuario: userId || null,
        criado_em: new Date(),
        stats_sistema: { temMagia, nivelPoder: tier, focus: focusValues },
        ...(imagem ? { imagem } : {}),
      },
    });

    // Atributos (F, H, R, A, PdF)
    await tx.atributos_personagem.createMany({
      data: CARACTERISTICA_IDS.map(nome => ({
        personagem_id: created.id,
        nome,
        valor: chars[nome],
      })),
    });

    // Vantagens
    if (vantagemIds.length > 0) {
      await tx.personagem_vantagem.createMany({
        data: vantagemIds.map(id => ({ personagem_id: created.id, vantagem_id: id })),
      });
    }

    // Desvantagens
    if (desvantagemIds.length > 0) {
      await tx.personagem_desvantagem.createMany({
        data: desvantagemIds.map(id => ({ personagem_id: created.id, desvantagem_id: id })),
      });
    }

    // Dinheiro inicial baseado em vantagens/desvantagens
    const moedas = calcularDinheiroInicial(vantagensObj, desvantagensObj);
    await tx.personagens.update({
      where: { id: created.id },
      data: { moedas },
    });

    return created;
  });

  log.info({ id: personagem.id, tier, nome: nomeSanitizado }, 'Personagem 3D&T criado');
  return personagem;
}
