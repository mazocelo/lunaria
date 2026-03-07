import { Route, Routes, Navigate } from 'react-router-dom';
import { 
  HistoriaListaPage, 
  NovaHistoriaPage, 
  VerHistoriaPage, 
  PersonagemListaPage, 
  NovoPersonagemPage, 
  EditarPersonagemPage, 
  VerPersonagemPage, 
  RacaPage, 
  VerRacaPage, 
  ClassePage, 
  VerClassePage, 
  VantagemPage, 
  VerVantagemPage, 
  DesvantagemPage, 
  NovaDesvantagemPage, 
  EditarDesvantagemPage, 
  VerDesvantagemPage,
  MonstroListaPage,
  MestreListaPage,
  NovoMestrePage,
  EditarMestrePage,
  VerMestrePage,
  // Jogo - 3 rotas separadas
  SelecaoPersonagemPage,
  SalaEsperaPage,
  JogoAtivoPage,
  ConviteJogoPage,
  PerfilPage
} from './Pages';

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
  EDITAR_PERSONAGEM: '/editar-personagem/:id',
  VER_PERSONAGEM: '/ver-personagem/:id',
  
  // ===== RAÇAS =====
  RACAS: '/racas',
  VER_RACA: '/ver-raca/:id',
  
  // ===== CLASSES =====
  CLASSES: '/classes',
  VER_CLASSE: '/ver-classe/:id',
  
  // ===== VANTAGENS =====
  VANTAGENS: '/vantagens',
  VER_VANTAGEM: '/ver-vantagem/:id',
  
  // ===== DESVANTAGENS =====
  DESVANTAGENS: '/desvantagens',
  NOVA_DESVANTAGEM: '/criar-desvantagem',
  EDITAR_DESVANTAGEM: '/editar-desvantagem/:id',
  VER_DESVANTAGEM: '/ver-desvantagem/:id',

  // ===== MONSTROS =====
  MONSTROS: '/monstros',

  // ===== MESTRES =====
  MESTRES: '/mestres',
  NOVO_MESTRE: '/criar-mestre',
  EDITAR_MESTRE: '/editar-mestre/:id',
  VER_MESTRE: '/ver-mestre/:id',

  // ===== PERFIL =====
  PERFIL: '/perfil'
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
  editarPersonagem: (id) => `/editar-personagem/${id}`,
  verPersonagem: (id) => `/ver-personagem/${id}`,
  
  // Sistema
  verRaca: (id) => `/ver-raca/${id}`,
  verClasse: (id) => `/ver-classe/${id}`,
  verVantagem: (id) => `/ver-vantagem/${id}`,
  editarDesvantagem: (id) => `/editar-desvantagem/${id}`,
  verDesvantagem: (id) => `/ver-desvantagem/${id}`,
  editarMestre: (id) => `/editar-mestre/${id}`,
  verMestre: (id) => `/ver-mestre/${id}`
};

/**
 * ============================================================================
 * CATEGORIAS DE ROTAS
 * ============================================================================
 * Configurações organizadas por categoria para navegação dinâmica
 * Útil para gerar menus, breadcrumbs ou sidebars
 */
export const ROUTE_CATEGORIES = {
  HISTORIAS: {
    title: 'Histórias',
    icon: '📚',
    routes: [
      { path: ROUTES.HISTORIAS, name: 'Histórias', exact: true },
      { path: ROUTES.NOVA_HISTORIA, name: 'Nova História', exact: true }
    ]
  },
  
  PERSONAGENS: {
    title: 'Personagens',
    icon: '👤',
    routes: [
      { path: ROUTES.PERSONAGENS, name: 'Personagens', exact: true },
      { path: ROUTES.NOVO_PERSONAGEM, name: 'Novo Personagem', exact: true }
    ]
  },
  
  SISTEMA: {
    title: 'Sistema',
    icon: '⚙️',
    routes: [
      { path: ROUTES.RACAS, name: 'Raças', exact: true },
      { path: ROUTES.CLASSES, name: 'Classes', exact: true },
      { path: ROUTES.VANTAGENS, name: 'Vantagens', exact: true },
      { path: ROUTES.DESVANTAGENS, name: 'Desvantagens', exact: true },
      { path: ROUTES.MONSTROS, name: 'Monstros', exact: true },
      { path: ROUTES.MESTRES, name: 'Mestres', exact: true }
    ]
  },
  
  JOGO: {
    title: 'Jogo',
    icon: '🎲',
    routes: [
      { path: ROUTES.JOGO_SELECAO_PERSONAGEM, name: 'Seleção de Personagem', exact: false },
      { path: ROUTES.JOGO_SALA_ESPERA, name: 'Sala de Espera', exact: false },
      { path: ROUTES.JOGO_ATIVO, name: 'Jogo Ativo', exact: false }
    ]
  }
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
    path: ROUTES.EDITAR_PERSONAGEM,
    component: EditarPersonagemPage,
    name: 'Editar Personagem',
    category: 'PERSONAGENS',
    hasParams: true
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
    path: ROUTES.VER_VANTAGEM,
    component: VerVantagemPage,
    name: 'Ver Vantagem',
    category: 'SISTEMA',
    hasParams: true
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
    category: 'SISTEMA'
  },
  {
    path: ROUTES.EDITAR_DESVANTAGEM,
    component: EditarDesvantagemPage,
    name: 'Editar Desvantagem',
    category: 'SISTEMA',
    hasParams: true
  },
  {
    path: ROUTES.VER_DESVANTAGEM,
    component: VerDesvantagemPage,
    name: 'Ver Desvantagem',
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
    category: 'SISTEMA'
  },
  {
    path: ROUTES.EDITAR_MESTRE,
    component: EditarMestrePage,
    name: 'Editar Mestre',
    category: 'SISTEMA',
    hasParams: true
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
    <Routes>
      {ROUTE_CONFIG.map((route, index) => {
        const Component = route.component;
        return (
          <Route 
            key={`${route.path}-${index}`}
            path={route.path} 
            element={<Component />} 
          />
        );
      })}
    </Routes>
  );
};

/**
 * ============================================================================
 * UTILITÁRIOS ADICIONAIS
 * ============================================================================
 */

// Função para buscar rota por path
export const findRouteByPath = (path) => {
  return ROUTE_CONFIG.find(route => route.path === path);
};

// Função para buscar rotas por categoria
export const getRoutesByCategory = (category) => {
  return ROUTE_CONFIG.filter(route => route.category === category);
};

// Função para verificar se uma rota tem parâmetros
export const hasRouteParams = (path) => {
  const route = findRouteByPath(path);
  return route?.hasParams || false;
};

// Export principal
export default AppRoutes;

// Export da configuração para casos específicos
export { ROUTE_CONFIG }; 