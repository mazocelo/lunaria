/**
 * Service de criacao de personagem D&D 5e (SRD).
 * Ability scores chegam keyed pelas siglas (STR/DEX/CON/INT/WIS/CHA) e sao
 * validados pela regra D&D (point buy / standard array).
 */
import db from '../Model/index.js';
import { ABILITY_IDS, SRD_CLASSES, SKILLS } from '../game-systems/dnd5e/constants.js';
import { validarCriacao } from '../game-systems/dnd5e/characterEngine.js';
import { sanitizeCharacterName, sanitizePromptInput } from '../helpers/sanitize.js';
import { xpParaNivel } from '../helpers/evolucaoHelper.js';
import { httpError } from '../helpers/httpError.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'PersonagemDnd5eService' });

function normalizeIds(raw, fieldName) {
  if (!raw) return [];
  if (!Array.isArray(raw)) throw httpError(400, `${fieldName} deve ser um array de IDs`);
  return raw.map(id => parseInt(id, 10)).filter(id => Number.isInteger(id) && id > 0);
}

/**
 * Le os ability scores do body. Aceita tanto o mapa `atributos` quanto o
 * `dnd_ability_scores` enviado pelo wizard, ambos keyed pelas siglas D&D.
 */
function lerAbilityScores(body) {
  const fonte = body.atributos || body.dnd_ability_scores || {};
  const scores = {};
  for (const sigla of ABILITY_IDS) {
    scores[sigla] = parseInt(fonte[sigla], 10) || 10;
  }
  return scores;
}

const SKILL_IDS = new Set(SKILLS.map(s => s.id));

/**
 * Le as proficiencias de pericia do body. Aceita apenas ids validos do SRD
 * (SKILLS); ids desconhecidos sao ignorados silenciosamente.
 */
function lerSkillProficiencies(body) {
  const raw = body.skill_proficiencies;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(id => typeof id === 'string' && SKILL_IDS.has(id)))];
}

export async function criarPersonagemDnd5e(body, userId) {
  const {
    nome, nivel, background, raca_id, classe_id, imagem,
    metodo, historias,
  } = body;

  const nomeSanitizado = sanitizeCharacterName(nome);
  if (!nomeSanitizado) throw httpError(400, 'Nome e obrigatorio');

  const backgroundSanitizado = sanitizePromptInput(background || '', 2000);

  const nivelEfetivo = parseInt(nivel, 10) || 1;
  if (nivelEfetivo < 1 || nivelEfetivo > 20) {
    throw httpError(400, 'Nivel deve estar entre 1 e 20');
  }

  const scores = lerAbilityScores(body);
  const skillProficiencies = lerSkillProficiencies(body);

  // Validacao D&D conforme o metodo informado (point_buy / standard_array).
  // Sem metodo, validarCriacao nao aplica restricao de distribuicao.
  const validacao = validarCriacao({ ...scores, metodo });
  if (!validacao.valido) {
    throw httpError(400, validacao.erros.join('; '));
  }

  const racaId = raca_id ? parseInt(raca_id, 10) : null;
  const classeId = classe_id ? parseInt(classe_id, 10) : null;

  if (racaId) {
    const raca = await db.prisma.racas.findFirst({ where: { id: racaId, sistema: 'dnd5e' } });
    if (!raca) throw httpError(400, `Raca D&D com ID ${racaId} nao encontrada`);
  }

  let classeKey = null;
  if (classeId) {
    const classe = await db.prisma.classes.findFirst({ where: { id: classeId, sistema: 'dnd5e' } });
    if (!classe) throw httpError(400, `Classe D&D com ID ${classeId} nao encontrada`);
    const slug = (classe.nome || '').trim().toLowerCase();
    classeKey = SRD_CLASSES[slug] ? slug : null;
  }

  const historiaIds = normalizeIds(historias, 'historias');

  const personagem = await db.prisma.$transaction(async (tx) => {
    if (historiaIds.length > 0) {
      const existentes = await tx.historias.findMany({
        where: { id: { in: historiaIds }, deleted_at: null },
        select: { id: true },
      });
      const encontradas = new Set(existentes.map(h => h.id));
      const invalidas = historiaIds.filter(id => !encontradas.has(id));
      if (invalidas.length > 0) {
        throw httpError(400, `Historias nao encontradas: ${invalidas.join(', ')}`);
      }
    }

    const created = await tx.personagens.create({
      data: {
        nome: nomeSanitizado,
        sistema: 'dnd5e',
        nivel: nivelEfetivo,
        pontos_totais: 0,
        pontos_iniciais: 0,
        background: backgroundSanitizado,
        raca_id: racaId,
        classe_id: classeId,
        xp_atual: 0,
        xp_proximo_nivel: xpParaNivel(nivelEfetivo),
        pontos_atributo_pendentes: 0,
        id_usuario: userId || null,
        criado_em: new Date(),
        stats_sistema: { classeKey, metodo: metodo || null, skillProficiencies },
        ...(imagem ? { imagem } : {}),
      },
    });

    await tx.atributos_personagem.createMany({
      data: ABILITY_IDS.map(sigla => ({
        personagem_id: created.id,
        nome: sigla,
        valor: scores[sigla],
      })),
    });

    if (historiaIds.length > 0) {
      await tx.historias_personagens.createMany({
        data: historiaIds.map(hid => ({ personagem_id: created.id, historia_id: hid, papel: 'jogador' })),
      });
    }

    return created;
  });

  log.info(
    { id: personagem.id, nome: nomeSanitizado, classeKey, skills: skillProficiencies.length },
    'Personagem D&D 5e criado',
  );
  return personagem;
}
