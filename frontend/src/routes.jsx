import React, { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import SuperAdminRoute from './components/SuperAdminRoute';
import LoadingSpinner from './components/LoadingSpinner';
import RouteErrorBoundary from './components/RouteErrorBoundary';

// Lazy loading de todas as páginas
const HistoriaListaPage = React.lazy(() => import('./Pages/Historia/Lista'));
const NovaHistoriaPage = React.lazy(() => import('./Pages/Historia/Nova'));
const VerHistoriaPage = React.lazy(() => import('./Pages/Historia/Ver'));
const ExplorarHistoriasPage = React.lazy(() => import('./Pages/Historia/Explorar'));
const PersonagemListaPage = React.lazy(() => import('./Pages/Personagem/Lista'));
const NovoPersonagemPage = React.lazy(() => import('./Pages/Personagem/Novo'));
const VerPersonagemPage = React.lazy(() => import('./Pages/Personagem/Ver'));
const RacaPage = React.lazy(() => import('./Pages/Raca/Lista'));
const NovaRacaPage = React.lazy(() => import('./Pages/Raca/Nova'));
const EditarRacaPage = React.lazy(() => import('./Pages/Raca/Editar'));
const VerRacaPage = React.lazy(() => import('./Pages/Raca/Ver'));
const ClassePage = React.lazy(() => import('./Pages/Classe/Lista'));
const NovaClassePage = React.lazy(() => import('./Pages/Classe/Nova'));
const EditarClassePage = React.lazy(() => import('./Pages/Classe/Editar'));
const VerClassePage = React.lazy(() => import('./Pages/Classe/Ver'));
const VantagemPage = React.lazy(() => import('./Pages/Vantagem/Lista'));
const NovaVantagemPage = React.lazy(() => import('./Pages/Vantagem/Nova'));
const EditarVantagemPage = React.lazy(() => import('./Pages/Vantagem/Editar'));
const VerVantagemPage = React.lazy(() => import('./Pages/Vantagem/Ver'));
const TemaListaPage = React.lazy(() => import('./Pages/Tema/Lista'));
const NovoTemaPage = React.lazy(() => import('./Pages/Tema/Nova'));
const EditarTemaPage = React.lazy(() => import('./Pages/Tema/Editar'));
const DesvantagemPage = React.lazy(() => import('./Pages/Desvantagem/Lista'));
const NovaDesvantagemPage = React.lazy(() => import('./Pages/Desvantagem/Nova'));
const EditarDesvantagemPage = React.lazy(() => import('./Pages/Desvantagem/Editar'));
const VerDesvantagemPage = React.lazy(() => import('./Pages/Desvantagem/Ver'));
const EquipamentoPage = React.lazy(() => import('./Pages/Equipamento/Lista'));
const NovoEquipamentoPage = React.lazy(() => import('./Pages/Equipamento/Nova'));
const EditarEquipamentoPage = React.lazy(() => import('./Pages/Equipamento/Editar'));
const VerEquipamentoPage = React.lazy(() => import('./Pages/Equipamento/Ver'));
const MonstroListaPage = React.lazy(() => import('./Pages/Monstro/Lista'));
const NovoMonstroPage = React.lazy(() => import('./Pages/Monstro/Nova'));
const EditarMonstroPage = React.lazy(() => import('./Pages/Monstro/Editar'));
const VerMonstroPage = React.lazy(() => import('./Pages/Monstro/Ver'));
const MestreListaPage = React.lazy(() => import('./Pages/Mestre/Lista'));
const NovoMestrePage = React.lazy(() => import('./Pages/Mestre/Nova'));
const EditarMestrePage = React.lazy(() => import('./Pages/Mestre/Editar'));
const VerMestrePage = React.lazy(() => import('./Pages/Mestre/Ver'));
const SelecaoPersonagemPage = React.lazy(() => import('./Pages/Jogo/SelecaoPersonagem'));
const SalaEsperaPage = React.lazy(() => import('./Pages/Jogo/SalaEspera'));
const JogoAtivoPage = React.lazy(() => import('./Pages/Jogo/JogoAtivo'));
const ConviteJogoPage = React.lazy(() => import('./Pages/ConviteJogo'));
const PerfilPage = React.lazy(() => import('./Pages/Perfil'));
const PerfilPublicoPage = React.lazy(() => import('./Pages/PerfilPublico'));
const AmigosPage = React.lazy(() => import('./Pages/Amigos'));
const FeedPage = React.lazy(() => import('./Pages/Feed'));
const HabilidadePage = React.lazy(() => import('./Pages/Habilidade/Lista'));
const NovaHabilidadePage = React.lazy(() => import('./Pages/Habilidade/Nova'));
const EditarHabilidadePage = React.lazy(() => import('./Pages/Habilidade/Editar'));
const VerHabilidadePage = React.lazy(() => import('./Pages/Habilidade/Ver'));
const BillingPage = React.lazy(() => import('./Pages/Billing'));

/**
 * ============================================================================
 * CONSTANTES DE ROTAS - Lunaria
 * ============================================================================
 * Centraliza todas as rotas da aplicação para facilitar manutenção
 * 
 * EXEMPLO DE USO:
 * import { ROUTES, generateRoute } from './routes.jsx';
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
  EXPLORAR_HISTORIAS: '/historias/explorar',

  // ===== HISTÓRIAS =====
  NOVA_HISTORIA: '/nova-historia',
  VER_HISTORIA: '/historias/:id',
  
  // ===== JOGO =====
  JOGO_SELECAO_PERSONAGEM: '/jogo/:id/selecao-personagem',
  JOGO_SALA_ESPERA: '/jogo/:id/sala-espera',
  JOGO_ATIVO: '/jogo/:id/jogo-ativo',
  CONVITE_JOGO: '/convite-jogo/:id', // 🎮 Rota de convite para redirecionamento
  
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

  // ===== HABILIDADES =====
  HABILIDADES: '/habilidades',
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
  BILLING: '/billing'
};

/**
 * ============================================================================
 * FUNÇÕES GERADORAS DE ROTAS
 * ============================================================================
 * Funções utilitárias para gerar rotas dinâmicas com type-safety
 * 
 * VANTAGENS:
 * ✅ Type-safe (evita erros de digitação)
 * ✅ Auto-complete no IDE
 * ✅ Refatoração facilitada
 * ✅ Centralizadas (mudar em um lugar só)
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
  editarHabilidade: (id) => `/editar-habilidade/${id}`
};

/**
 * ============================================================================
 * CONFIGURAÇÃO DECLARATIVA DE ROTAS
 * ============================================================================
 * Definição centralizada de todas as rotas da aplicação
 * Cada rota é declarada com seu path, componente e metadados
 */
const ROUTE_CONFIG = [
  // ===== ROTAS PRINCIPAIS =====
  {
    path: ROUTES.HOME,
    component: HistoriaListaPage,
    name: 'Home',
    category: 'HISTORIAS'
  },
  {
    path: ROUTES.HISTORIAS,
    component: HistoriaListaPage,
    name: 'Histórias',
    category: 'HISTORIAS'
  },

  // ===== HISTÓRIAS =====
  {
    path: ROUTES.EXPLORAR_HISTORIAS,
    component: ExplorarHistoriasPage,
    name: 'Explorar Aventuras',
    category: 'HISTORIAS'
  },
  {
    path: ROUTES.NOVA_HISTORIA,
    component: NovaHistoriaPage,
    name: 'Nova História',
    category: 'HISTORIAS'
  },
  {
    path: ROUTES.VER_HISTORIA,
    component: VerHistoriaPage,
    name: 'Ver História',
    category: 'HISTORIAS',
    hasParams: true
  },

  // ===== JOGO - Redirecionamento de Compatibilidade =====
  {
    path: '/jogo/:id',
    component: () => {
      const id = window.location.pathname.split('/')[2];
      return <Navigate to={`/jogo/${id}/selecao-personagem`} replace />;
    },
    name: 'Redirect Jogo',
    category: 'JOGO',
    hasParams: true
  },
  
  // ===== JOGO - 3 Rotas Separadas =====
  {
    path: ROUTES.JOGO_SELECAO_PERSONAGEM,
    component: SelecaoPersonagemPage,
    name: 'Seleção de Personagem',
    category: 'JOGO',
    hasParams: true
  },
  {
    path: ROUTES.JOGO_SALA_ESPERA,
    component: SalaEsperaPage,
    name: 'Sala de Espera',
    category: 'JOGO',
    hasParams: true
  },
  {
    path: ROUTES.JOGO_ATIVO,
    component: JogoAtivoPage,
    name: 'Jogo Ativo',
    category: 'JOGO',
    hasParams: true
  },
  {
    path: ROUTES.CONVITE_JOGO,
    component: ConviteJogoPage,
    name: 'Convite Jogo',
    category: 'JOGO',
    hasParams: true
  },

  // ===== PERSONAGENS =====
  {
    path: ROUTES.PERSONAGENS,
    component: PersonagemListaPage,
    name: 'Personagens',
    category: 'PERSONAGENS'
  },
  {
    path: ROUTES.NOVO_PERSONAGEM,
    component: NovoPersonagemPage,
    name: 'Novo Personagem',
    category: 'PERSONAGENS'
  },
  {
    path: ROUTES.VER_PERSONAGEM,
    component: VerPersonagemPage,
    name: 'Ver Personagem',
    category: 'PERSONAGENS',
    hasParams: true
  },

  // ===== RAÇAS =====
  {
    path: ROUTES.RACAS,
    component: RacaPage,
    name: 'Raças',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVA_RACA,
    component: NovaRacaPage,
    name: 'Nova Raça',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_RACA,
    component: EditarRacaPage,
    name: 'Editar Raça',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_RACA,
    component: VerRacaPage,
    name: 'Ver Raça',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== CLASSES =====
  {
    path: ROUTES.CLASSES,
    component: ClassePage,
    name: 'Classes',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVA_CLASSE,
    component: NovaClassePage,
    name: 'Nova Classe',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_CLASSE,
    component: EditarClassePage,
    name: 'Editar Classe',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_CLASSE,
    component: VerClassePage,
    name: 'Ver Classe',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== VANTAGENS =====
  {
    path: ROUTES.VANTAGENS,
    component: VantagemPage,
    name: 'Vantagens',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVA_VANTAGEM,
    component: NovaVantagemPage,
    name: 'Nova Vantagem',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_VANTAGEM,
    component: EditarVantagemPage,
    name: 'Editar Vantagem',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_VANTAGEM,
    component: VerVantagemPage,
    name: 'Ver Vantagem',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== TEMAS =====
  {
    path: ROUTES.TEMAS,
    component: TemaListaPage,
    name: 'Temas',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVO_TEMA,
    component: NovoTemaPage,
    name: 'Novo Tema',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_TEMA,
    component: EditarTemaPage,
    name: 'Editar Tema',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },

  // ===== DESVANTAGENS =====
  {
    path: ROUTES.DESVANTAGENS,
    component: DesvantagemPage,
    name: 'Desvantagens',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVA_DESVANTAGEM,
    component: NovaDesvantagemPage,
    name: 'Nova Desvantagem',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_DESVANTAGEM,
    component: EditarDesvantagemPage,
    name: 'Editar Desvantagem',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_DESVANTAGEM,
    component: VerDesvantagemPage,
    name: 'Ver Desvantagem',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== EQUIPAMENTOS =====
  {
    path: ROUTES.EQUIPAMENTOS,
    component: EquipamentoPage,
    name: 'Equipamentos',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVO_EQUIPAMENTO,
    component: NovoEquipamentoPage,
    name: 'Novo Equipamento',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_EQUIPAMENTO,
    component: EditarEquipamentoPage,
    name: 'Editar Equipamento',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_EQUIPAMENTO,
    component: VerEquipamentoPage,
    name: 'Ver Equipamento',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== MONSTROS =====
  {
    path: ROUTES.MONSTROS,
    component: MonstroListaPage,
    name: 'Monstros',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVO_MONSTRO,
    component: NovoMonstroPage,
    name: 'Novo Monstro',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_MONSTRO,
    component: EditarMonstroPage,
    name: 'Editar Monstro',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_MONSTRO,
    component: VerMonstroPage,
    name: 'Ver Monstro',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== HABILIDADES =====
  {
    path: ROUTES.HABILIDADES,
    component: HabilidadePage,
    name: 'Habilidades',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVA_HABILIDADE,
    component: NovaHabilidadePage,
    name: 'Nova Habilidade',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_HABILIDADE,
    component: EditarHabilidadePage,
    name: 'Editar Habilidade',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_HABILIDADE,
    component: VerHabilidadePage,
    name: 'Ver Habilidade',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== MESTRES =====
  {
    path: ROUTES.MESTRES,
    component: MestreListaPage,
    name: 'Mestres',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVO_MESTRE,
    component: NovoMestrePage,
    name: 'Novo Mestre',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_MESTRE,
    component: EditarMestrePage,
    name: 'Editar Mestre',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_MESTRE,
    component: VerMestrePage,
    name: 'Ver Mestre',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== PERFIL =====
  {
    path: ROUTES.PERFIL,
    component: PerfilPage,
    name: 'Meu Perfil',
    category: 'USUARIO'
  },
  {
    path: ROUTES.PERFIL_PUBLICO,
    component: PerfilPublicoPage,
    name: 'Perfil Público',
    category: 'USUARIO',
    hasParams: true
  },

  // ===== SOCIAL =====
  {
    path: ROUTES.AMIGOS,
    component: AmigosPage,
    name: 'Amigos',
    category: 'SOCIAL'
  },
  {
    path: ROUTES.FEED,
    component: FeedPage,
    name: 'Feed',
    category: 'SOCIAL'
  },

  // ===== BILLING =====
  {
    path: ROUTES.BILLING,
    component: BillingPage,
    name: 'Billing',
    category: 'USUARIO'
  }
];

/**
 * ============================================================================
 * COMPONENTE DE ROTAS PRINCIPAL
 * ============================================================================
 * Componente React Router que renderiza todas as rotas da aplicação
 * Gerado automaticamente a partir da configuração declarativa
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner /></div>}>
      <Routes>
        {ROUTE_CONFIG.map((route, index) => {
          const Component = route.component;
          const inner = route.requireSuperAdmin
            ? <SuperAdminRoute><Component /></SuperAdminRoute>
            : <Component />;
          return (
            <Route
              key={`${route.path}-${index}`}
              path={route.path}
              element={<RouteErrorBoundary>{inner}</RouteErrorBoundary>}
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 