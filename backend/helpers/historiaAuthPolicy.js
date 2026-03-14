/**
 * Auth policy e cache helpers para histórias.
 * Extraídos de historiaController para reuso e testabilidade.
 */
import db from '../Model/index.js';
import { sincronizarRoteiroNaSessao as sincronizarRoteiroNaSessaoService } from '../services/roteiroGenerationService.js';
import logger from './logger.js';
const log = logger.child({ module: 'historiaAuthPolicy' });

/**
 * Verifica se o usuário pode acessar uma história.
 * Hierarquia: pública → superadmin → owner → participação/convite.
 * @param {Object} historia — registro da história (precisa de id, id_usuario, publica)
 * @param {Object|null} user — req.user (precisa de id, role)
 * @returns {Promise<boolean>}
 */
export async function usuarioPodeAcessarHistoria(historia, user) {
  if (!historia) return false;
  if (historia.publica === true) return true;
  if (!user || !user.id) return false;
  if (user.role === 'superadmin') return true;
  if (String(historia.id_usuario) === String(user.id)) return true;

  const userId = parseInt(user.id, 10);
  const historiaId = parseInt(historia.id, 10);

  const [participacao, convite] = await Promise.all([
    db.prisma.historias_personagens.findFirst({
      where: {
        historia_id: historiaId,
        personagens: {
          id_usuario: userId,
          deleted_at: null
        }
      },
      select: { id: true }
    }),
    db.prisma.historias_convite.findFirst({
      where: {
        historia_id: historiaId,
        usuario_id: userId,
        status: { in: ['pendente', 'aceito'] }
      },
      select: { id: true }
    })
  ]);

  return Boolean(participacao || convite);
}

/**
 * Sincroniza roteiro na sessão Redis e invalida cache do Mestre.
 * @param {Object} historia — registro da história (precisa de id)
 * @param {Object} roteiro — JSON do roteiro
 * @param {string} [roteiroStatus='completed']
 */
export async function sincronizarRoteiroNaSessao(historia, roteiro, roteiroStatus = 'completed') {
  await sincronizarRoteiroNaSessaoService(historia, roteiro, roteiroStatus);

  const salaId = `historia_${historia.id}`;
  try {
    const { default: socketManager } = await import('../websocket/socketManager.js');
    if (socketManager?.mestresCache) {
      socketManager.mestresCache.delete(salaId);
    }
  } catch (error) {
    log.warn({ err: error, salaId }, 'Erro ao invalidar cache do Mestre');
  }
}
