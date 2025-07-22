import { Route, Routes } from 'react-router-dom';
import { 
  HistoriaView, 
  NovaHistoriaView, 
  VerHistoriaView, 
  PersonagemView, 
  NovoPersonagemView, 
  EditarPersonagemView, 
  VerPersonagemView, 
  RacaView, 
  VerRacaView, 
  ClasseView, 
  VerClasseView, 
  VantagemView, 
  VerVantagemView, 
  DesvantagemView, 
  NovaDesvantagemView, 
  EditarDesvantagemView, 
  VerDesvantagemView 
} from './views';
// 🎮 Arquitetura Zustand otimizada - View principal integrada
import { JogoView } from './views/Jogo';

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
  JOGO: '/jogo/:id', // 🎮 Arquitetura Zustand - gerencia todas as etapas
  
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
  VER_DESVANTAGEM: '/ver-desvantagem/:id'
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
  jogo: (id) => `/jogo/${id}`,
  jogoPreparacao: (id) => `/jogo/${id}/preparacao`,
  jogoSalaEspera: (id) => `/jogo/${id}/sala-espera`,
  jogoAtivo: (id) => `/jogo/${id}/jogo`,
  
  // Personagens
  editarPersonagem: (id) => `/editar-personagem/${id}`,
  verPersonagem: (id) => `/ver-personagem/${id}`,
  
  // Sistema
  verRaca: (id) => `/ver-raca/${id}`,
  verClasse: (id) => `/ver-classe/${id}`,
  verVantagem: (id) => `/ver-vantagem/${id}`,
  editarDesvantagem: (id) => `/editar-desvantagem/${id}`,
  verDesvantagem: (id) => `/ver-desvantagem/${id}`
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
      { path: ROUTES.DESVANTAGENS, name: 'Desvantagens', exact: true }
    ]
  },
  
  JOGO: {
    title: 'Jogo',
    icon: '🎲',
    routes: [
      { path: ROUTES.JOGO, name: 'Jogo RPG', exact: false }
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
    component: HistoriaView,
    name: 'Home',
    category: 'HISTORIAS'
  },
  {
    path: ROUTES.HISTORIAS,
    component: HistoriaView,
    name: 'Histórias',
    category: 'HISTORIAS'
  },

  // ===== HISTÓRIAS =====
  {
    path: ROUTES.NOVA_HISTORIA,
    component: NovaHistoriaView,
    name: 'Nova História',
    category: 'HISTORIAS'
  },
  {
    path: ROUTES.VER_HISTORIA,
    component: VerHistoriaView,
    name: 'Ver História',
    category: 'HISTORIAS',
    hasParams: true
  },

  // ===== JOGO - Arquitetura Zustand Otimizada =====
  {
    path: ROUTES.JOGO,
    component: JogoView, // 🎮 View principal que gerencia todas as etapas
    name: 'Jogo',
    category: 'JOGO',
    hasParams: true
  },

  // ===== PERSONAGENS =====
  {
    path: ROUTES.PERSONAGENS,
    component: PersonagemView,
    name: 'Personagens',
    category: 'PERSONAGENS'
  },
  {
    path: ROUTES.NOVO_PERSONAGEM,
    component: NovoPersonagemView,
    name: 'Novo Personagem',
    category: 'PERSONAGENS'
  },
  {
    path: ROUTES.EDITAR_PERSONAGEM,
    component: EditarPersonagemView,
    name: 'Editar Personagem',
    category: 'PERSONAGENS',
    hasParams: true
  },
  {
    path: ROUTES.VER_PERSONAGEM,
    component: VerPersonagemView,
    name: 'Ver Personagem',
    category: 'PERSONAGENS',
    hasParams: true
  },

  // ===== RAÇAS =====
  {
    path: ROUTES.RACAS,
    component: RacaView,
    name: 'Raças',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.VER_RACA,
    component: VerRacaView,
    name: 'Ver Raça',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== CLASSES =====
  {
    path: ROUTES.CLASSES,
    component: ClasseView,
    name: 'Classes',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.VER_CLASSE,
    component: VerClasseView,
    name: 'Ver Classe',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== VANTAGENS =====
  {
    path: ROUTES.VANTAGENS,
    component: VantagemView,
    name: 'Vantagens',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.VER_VANTAGEM,
    component: VerVantagemView,
    name: 'Ver Vantagem',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== DESVANTAGENS =====
  {
    path: ROUTES.DESVANTAGENS,
    component: DesvantagemView,
    name: 'Desvantagens',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVA_DESVANTAGEM,
    component: NovaDesvantagemView,
    name: 'Nova Desvantagem',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.EDITAR_DESVANTAGEM,
    component: EditarDesvantagemView,
    name: 'Editar Desvantagem',
    category: 'SISTEMA',
    hasParams: true
  },
  {
    path: ROUTES.VER_DESVANTAGEM,
    component: VerDesvantagemView,
    name: 'Ver Desvantagem',
    category: 'SISTEMA',
    hasParams: true
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