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
export const ROUTES = {
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
export const generateRoute = {
  // Histórias
  verHistoria: (id) => `/historias/${id}`,

  // Jogo
  jogoSelecaoPersonagem: (id) => `/jogo/${id}/selecao-personagem`,
  jogoSalaEspera: (id) => `/jogo/${id}/sala-espera`,
  jogoAtivo: (id) => `/jogo/${id}/jogo-ativo`,
  conviteJogo: (id) => `/convite-jogo/${id}`,

  // Personagens
  verPersonagem: (id) => `/ver-personagem/${id}`,

  // Sistema
  editarRaca: (id) => `/editar-raca/${id}`,
  verRaca: (id) => `/ver-raca/${id}`,
  editarClasse: (id) => `/editar-classe/${id}`,
  verClasse: (id) => `/ver-classe/${id}`,
  verVantagem: (id) => `/ver-vantagem/${id}`,
  editarVantagem: (id) => `/editar-vantagem/${id}`,
  editarTema: (id) => `/editar-tema/${id}`,
  editarDesvantagem: (id) => `/editar-desvantagem/${id}`,
  verDesvantagem: (id) => `/ver-desvantagem/${id}`,
  editarEquipamento: (id) => `/editar-equipamento/${id}`,
  verEquipamento: (id) => `/ver-equipamento/${id}`,
  editarMonstro: (id) => `/editar-monstro/${id}`,
  verMonstro: (id) => `/ver-monstro/${id}`,
  editarMestre: (id) => `/editar-mestre/${id}`,
  verMestre: (id) => `/ver-mestre/${id}`,
  verHabilidade: (id) => `/ver-habilidade/${id}`,
  editarHabilidade: (id) => `/editar-habilidade/${id}`,
  verItemTresDet: (id) => `/ver-item-tresdet/${id}`,
  editarItemTresDet: (id) => `/editar-item-tresdet/${id}`,
};
