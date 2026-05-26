/**
 * ============================================================================
 * CONSTANTES DE ROTAS - Lunaria
 * ============================================================================
 * Centraliza todas as rotas da aplicação para facilitar manutenção
 *
 * SEPARADO de routes.jsx para evitar dependências circulares.
 * routes.jsx importa as páginas (React.lazy) e os modelos dessas páginas
 * importam ROUTES/generateRoute. Se ambos estivessem no mesmo arquivo,
 * cria-se um ciclo que causa "Cannot access X before initialization" no build.
 *
 * EXEMPLO DE USO:
 * import { ROUTES, generateRoute } from '../constants/routes.js';
 *
 * // Navegação simples:
 * navigate(ROUTES.HISTORIAS);
 *
 * // Navegação com parâmetros:
 * navigate(generateRoute.verHistoria(123));
 */

// ===== ROTAS PRINCIPAIS =====
export const ROUTES: Record<string, string> = {
  HOME: '/',
  HISTORIAS: '/historias',
  EXPLORAR_HISTORIAS: '/explorar',

  // ===== HISTÓRIAS =====
  NOVA_HISTORIA: '/nova-historia',
  VER_HISTORIA: '/historias/:id',

  // ===== JOGO =====
  JOGO_SELECAO_PERSONAGEM: '/jogo/:id/selecao-personagem',
  JOGO_SALA_ESPERA: '/jogo/:id/sala-espera',
  JOGO_ATIVO: '/jogo/:id/jogo-ativo',
  CONVITE_JOGO: '/convite-jogo/:id',

  // ===== PERSONAGENS =====
  PERSONAGENS: '/personagens',
  NOVO_PERSONAGEM: '/novo-personagem',
  VER_PERSONAGEM: '/ver-personagem/:id',

  // ===== RAÇAS =====
  RACAS: '/racas',
  NOVA_RACA: '/criar-raca',
  EDITAR_RACA: '/editar-raca/:id',
  VER_RACA: '/ver-raca/:id',

  // ===== CLASSES =====
  CLASSES: '/classes',
  NOVA_CLASSE: '/criar-classe',
  EDITAR_CLASSE: '/editar-classe/:id',
  VER_CLASSE: '/ver-classe/:id',

  // ===== VANTAGENS =====
  VANTAGENS: '/vantagens',
  NOVA_VANTAGEM: '/criar-vantagem',
  EDITAR_VANTAGEM: '/editar-vantagem/:id',
  VER_VANTAGEM: '/ver-vantagem/:id',

  // ===== TEMAS =====
  TEMAS: '/temas',
  NOVO_TEMA: '/criar-tema',
  EDITAR_TEMA: '/editar-tema/:id',

  // ===== DESVANTAGENS =====
  DESVANTAGENS: '/desvantagens',
  NOVA_DESVANTAGEM: '/criar-desvantagem',
  EDITAR_DESVANTAGEM: '/editar-desvantagem/:id',
  VER_DESVANTAGEM: '/ver-desvantagem/:id',

  // ===== EQUIPAMENTOS =====
  EQUIPAMENTOS: '/equipamentos',
  NOVO_EQUIPAMENTO: '/criar-equipamento',
  EDITAR_EQUIPAMENTO: '/editar-equipamento/:id',
  VER_EQUIPAMENTO: '/ver-equipamento/:id',

  // ===== MONSTROS =====
  MONSTROS: '/monstros',
  NOVO_MONSTRO: '/criar-monstro',
  EDITAR_MONSTRO: '/editar-monstro/:id',
  VER_MONSTRO: '/ver-monstro/:id',

  // ===== ITENS 3D&T =====
  ITENS_TRESDET: '/itens-tresdet',
  NOVO_ITEM_TRESDET: '/criar-item-tresdet',
  EDITAR_ITEM_TRESDET: '/editar-item-tresdet/:id',
  VER_ITEM_TRESDET: '/ver-item-tresdet/:id',

  // ===== MAGIAS 3D&T =====
  MAGIAS_TRESDET: '/magias-tresdet',
  NOVA_MAGIA_TRESDET: '/criar-magia-tresdet',
  EDITAR_MAGIA_TRESDET: '/editar-magia-tresdet/:id',
  VER_MAGIA_TRESDET: '/ver-magia-tresdet/:id',

  // ===== HABILIDADES =====
  HABILIDADES: '/habilidades-magias',
  NOVA_HABILIDADE: '/criar-habilidade',
  EDITAR_HABILIDADE: '/editar-habilidade/:id',
  VER_HABILIDADE: '/ver-habilidade/:id',

  // ===== MESTRES =====
  MESTRES: '/mestres',
  NOVO_MESTRE: '/criar-mestre',
  EDITAR_MESTRE: '/editar-mestre/:id',
  VER_MESTRE: '/ver-mestre/:id',

  // ===== PERFIL =====
  PERFIL: '/perfil',
  PERFIL_PUBLICO: '/perfil/:id',

  // ===== SOCIAL =====
  AMIGOS: '/amigos',
  FEED: '/feed',

  // ===== BILLING =====
  BILLING: '/billing',

  // ===== ADMIN =====
  ADMIN_MOTOR: '/admin/motor',

  // ===== DOCS =====
  DOCS: '/docs',
  DOCS_SLUG: '/docs/:slug',
  ADMIN_DOCS: '/admin/docs',
  ADMIN_DOCS_SECTION: '/admin/docs/:section',
  ADMIN_DOCS_SECTION_SLUG: '/admin/docs/:section/:slug',
};

/**
 * ============================================================================
 * FUNÇÕES GERADORAS DE ROTAS
 * ============================================================================
 * Funções utilitárias para gerar rotas dinâmicas com type-safety
 */
type RouteId = string | number;

export const generateRoute = {
  // Historias
  verHistoria: (id: RouteId) => `/historias/${id}`,

  // Jogo
  jogoSelecaoPersonagem: (id: RouteId) => `/jogo/${id}/selecao-personagem`,
  jogoSalaEspera: (id: RouteId) => `/jogo/${id}/sala-espera`,
  jogoAtivo: (id: RouteId) => `/jogo/${id}/jogo-ativo`,
  conviteJogo: (id: RouteId) => `/convite-jogo/${id}`,

  // Personagens
  verPersonagem: (id: RouteId) => `/ver-personagem/${id}`,

  // Sistema
  editarRaca: (id: RouteId) => `/editar-raca/${id}`,
  verRaca: (id: RouteId) => `/ver-raca/${id}`,
  editarClasse: (id: RouteId) => `/editar-classe/${id}`,
  verClasse: (id: RouteId) => `/ver-classe/${id}`,
  verVantagem: (id: RouteId) => `/ver-vantagem/${id}`,
  editarVantagem: (id: RouteId) => `/editar-vantagem/${id}`,
  editarTema: (id: RouteId) => `/editar-tema/${id}`,
  editarDesvantagem: (id: RouteId) => `/editar-desvantagem/${id}`,
  verDesvantagem: (id: RouteId) => `/ver-desvantagem/${id}`,
  editarEquipamento: (id: RouteId) => `/editar-equipamento/${id}`,
  verEquipamento: (id: RouteId) => `/ver-equipamento/${id}`,
  editarMonstro: (id: RouteId) => `/editar-monstro/${id}`,
  verMonstro: (id: RouteId) => `/ver-monstro/${id}`,
  editarMestre: (id: RouteId) => `/editar-mestre/${id}`,
  verMestre: (id: RouteId) => `/ver-mestre/${id}`,
  verHabilidade: (id: RouteId) => `/ver-habilidade/${id}`,
  editarHabilidade: (id: RouteId) => `/editar-habilidade/${id}`,
  verItemTresDet: (id: RouteId) => `/ver-item-tresdet/${id}`,
  editarItemTresDet: (id: RouteId) => `/editar-item-tresdet/${id}`,
  verMagiaTresDet: (id: RouteId) => `/ver-magia-tresdet/${id}`,
  editarMagiaTresDet: (id: RouteId) => `/editar-magia-tresdet/${id}`,
};
