import React, { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import SuperAdminRoute from './components/SuperAdminRoute';
import LoadingSpinner from './components/LoadingSpinner';
import RouteErrorBoundary from './components/RouteErrorBoundary';

// Re-export constantes de rotas (fonte: constants/routes.js)
// Mantém backward-compatibility para quem importa de routes.jsx
export { ROUTES, generateRoute } from './constants/routes.js';
import { ROUTES } from './constants/routes.js';

// Lazy loading de todas as páginas
const HistoriaListaPage = React.lazy(() => import('./Pages/Historia/Lista'));
const NovaHistoriaPage = React.lazy(() => import('./Pages/Historia/Nova'));
const VerHistoriaPage = React.lazy(() => import('./Pages/Historia/Ver'));
const ExplorarHistoriasPage = React.lazy(() => import('./Pages/Historia/Explorar'));
const PersonagemListaPage = React.lazy(() => import('./Pages/Personagem/Lista'));
const NovoPersonagemPage = React.lazy(() => import('./Pages/Personagem/Wizard'));
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
const ItemTresDetListaPage = React.lazy(() => import('./Pages/ItemTresDet/Lista'));
const NovoItemTresDetPage = React.lazy(() => import('./Pages/ItemTresDet/Nova'));
const EditarItemTresDetPage = React.lazy(() => import('./Pages/ItemTresDet/Editar'));
const VerItemTresDetPage = React.lazy(() => import('./Pages/ItemTresDet/Ver'));
const MagiaTresDetListaPage = React.lazy(() => import('./Pages/MagiaTresDet/Lista'));
const NovaMagiaTresDetPage = React.lazy(() => import('./Pages/MagiaTresDet/Nova'));
const EditarMagiaTresDetPage = React.lazy(() => import('./Pages/MagiaTresDet/Editar'));
const VerMagiaTresDetPage = React.lazy(() => import('./Pages/MagiaTresDet/Ver'));
const BillingPage = React.lazy(() => import('./Pages/Billing'));
const AdminMotorPage = React.lazy(() => import('./Pages/Admin/Motor'));
const DocsJogadorPage = React.lazy(() => import('./Pages/Docs/Jogador'));
const DocsInternoPage = React.lazy(() => import('./Pages/Docs/Interno'));

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

  // ===== ITENS 3D&T =====
  {
    path: ROUTES.ITENS_TRESDET,
    component: ItemTresDetListaPage,
    name: 'Itens 3D&T',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVO_ITEM_TRESDET,
    component: NovoItemTresDetPage,
    name: 'Novo Item 3D&T',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_ITEM_TRESDET,
    component: EditarItemTresDetPage,
    name: 'Editar Item 3D&T',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_ITEM_TRESDET,
    component: VerItemTresDetPage,
    name: 'Ver Item 3D&T',
    category: 'SISTEMA',
    hasParams: true
  },

  // ===== MAGIAS 3D&T =====
  {
    path: ROUTES.MAGIAS_TRESDET,
    component: MagiaTresDetListaPage,
    name: 'Magias 3D&T',
    category: 'SISTEMA'
  },
  {
    path: ROUTES.NOVA_MAGIA_TRESDET,
    component: NovaMagiaTresDetPage,
    name: 'Nova Magia 3D&T',
    category: 'SISTEMA',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.EDITAR_MAGIA_TRESDET,
    component: EditarMagiaTresDetPage,
    name: 'Editar Magia 3D&T',
    category: 'SISTEMA',
    hasParams: true,
    requireSuperAdmin: true
  },
  {
    path: ROUTES.VER_MAGIA_TRESDET,
    component: VerMagiaTresDetPage,
    name: 'Ver Magia 3D&T',
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
  },

  // ===== ADMIN =====
  {
    path: ROUTES.ADMIN_MOTOR,
    component: AdminMotorPage,
    name: 'Admin Motor',
    category: 'ADMIN',
    requireSuperAdmin: true
  },

  // ===== DOCS =====
  {
    path: ROUTES.DOCS,
    component: DocsJogadorPage,
    name: 'Documentação',
    category: 'DOCS'
  },
  {
    path: ROUTES.DOCS_SLUG,
    component: DocsJogadorPage,
    name: 'Documentação',
    category: 'DOCS',
    hasParams: true
  },
  {
    path: ROUTES.ADMIN_DOCS,
    component: DocsInternoPage,
    name: 'Docs Interno',
    category: 'ADMIN',
    requireSuperAdmin: true
  },
  {
    path: ROUTES.ADMIN_DOCS_SECTION,
    component: DocsInternoPage,
    name: 'Docs Interno',
    category: 'ADMIN',
    requireSuperAdmin: true,
    hasParams: true
  },
  {
    path: ROUTES.ADMIN_DOCS_SECTION_SLUG,
    component: DocsInternoPage,
    name: 'Docs Interno',
    category: 'ADMIN',
    requireSuperAdmin: true,
    hasParams: true
  },
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