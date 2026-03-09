import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/theme.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useSocketStore } from '../../store';
import {
  BookOpen, Users, Dna, Shield, Star, AlertTriangle,
  Sword, Skull, Palette, Crown, User, AlertCircle, RefreshCw,
  UserPlus, Rss
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const { isSuperAdmin } = useAuth();
  const { sidebarCollapsed } = useLayout();
  const isLight = theme === 'light';

  const { error, connectToSocket } = useSocketStore();

  const collapsed = sidebarCollapsed;

  const playerItems = [
    { path: '/historias', label: 'Historias', icon: BookOpen, description: 'Gerencie suas aventuras' },
    { path: '/personagens', label: 'Personagens', icon: Users, description: 'Crie e edite personagens' },
  ];

  const socialItems = [
    { path: '/amigos', label: 'Amigos', icon: UserPlus, description: 'Gerencie seus amigos' },
    { path: '/feed', label: 'Feed', icon: Rss, description: 'Feed social' },
  ];

  const catalogItems = [
    { path: '/racas', label: 'Racas', icon: Dna, description: 'Gerencie as racas' },
    { path: '/classes', label: 'Classes', icon: Shield, description: 'Gerencie as classes' },
    { path: '/vantagens', label: 'Vantagens', icon: Star, description: 'Gerencie as vantagens' },
    { path: '/desvantagens', label: 'Desvantagens', icon: AlertTriangle, description: 'Gerencie as desvantagens' },
    { path: '/equipamentos', label: 'Equipamentos', icon: Sword, description: 'Armas e itens magicos' },
    { path: '/monstros', label: 'Monstros', icon: Skull, description: 'Bestiario de Lunaria' },
    { path: '/temas', label: 'Temas', icon: Palette, description: 'Gerencie os temas' },
    { path: '/mestres', label: 'Mestres', icon: Crown, description: 'Gerencie seus mestres' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        title={collapsed ? item.label : undefined}
        className={`group relative flex items-center rounded-xl transition-all duration-200 ${
          collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
        } ${
          active
            ? `nav-item-active ${isLight ? 'bg-purple-100/80 text-purple-700' : 'bg-purple-900/40 text-purple-300'}`
            : isLight
              ? 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-800'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
      >
        <Icon size={20} className="flex-shrink-0" strokeWidth={active ? 2.2 : 1.8} />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium font-modern truncate">{item.label}</div>
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside className={`h-screen flex flex-col ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${
      isLight ? 'bg-white/95 border-r border-slate-200/60' : 'bg-slate-900/95 border-r border-slate-700/50'
    } backdrop-blur-xl`}>
      {/* Logo section */}
      <div className={`flex items-center h-14 flex-shrink-0 border-b ${
        collapsed ? 'justify-center px-2' : 'px-4 gap-3'
      } ${isLight ? 'border-slate-200/60' : 'border-slate-700/50'}`}>
        <div className="w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0">
          <img
            src="/assets/logo_lunaria.png"
            alt="Lunaria"
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-fantasy font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Lunaria
            </h2>
            <p className={`text-[10px] font-modern truncate ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Plataforma de Roleplay
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        {/* Player section */}
        {!collapsed && (
          <div className={`text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Jogador
          </div>
        )}
        <div className="space-y-0.5">
          {playerItems.map(item => <NavItem key={item.path} item={item} />)}
        </div>

        {/* Social section */}
        {collapsed ? (
          <div className={`my-3 mx-2 h-px ${isLight ? 'bg-slate-200/60' : 'bg-slate-700/50'}`} />
        ) : (
          <div className={`text-[10px] font-semibold uppercase tracking-widest px-3 mt-5 mb-2 ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Social
          </div>
        )}
        <div className="space-y-0.5">
          {socialItems.map(item => <NavItem key={item.path} item={item} />)}
        </div>

        {/* Catalog section (SuperAdmin only) */}
        {isSuperAdmin && (
          <>
            {collapsed ? (
              <div className={`my-3 mx-2 h-px ${isLight ? 'bg-slate-200/60' : 'bg-slate-700/50'}`} />
            ) : (
              <div className={`text-[10px] font-semibold uppercase tracking-widest px-3 mt-5 mb-2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Catalogo
              </div>
            )}
            <div className="space-y-0.5">
              {catalogItems.map(item => <NavItem key={item.path} item={item} />)}
            </div>
          </>
        )}

        {/* Socket error */}
        {error && !collapsed && (
          <div className={`mt-4 p-3 rounded-xl border ${
            isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/20 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-red-500" />
              <span className={`text-xs font-semibold ${isLight ? 'text-red-800' : 'text-red-300'}`}>
                Erro de Conexão
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-red-700' : 'text-red-400'} mb-2`}>{error}</p>
            <button
              onClick={connectToSocket}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'bg-red-200 hover:bg-red-300 text-red-800'
                  : 'bg-red-500/30 hover:bg-red-500/50 text-red-300'
              }`}
            >
              <RefreshCw size={12} /> Reconectar
            </button>
          </div>
        )}
      </nav>

      {/* Footer: Profile + Version */}
      <div className={`flex-shrink-0 border-t ${collapsed ? 'px-2 py-3' : 'px-3 py-3'} ${
        isLight ? 'border-slate-200/60' : 'border-slate-700/50'
      }`}>
        <Link
          to="/perfil"
          title={collapsed ? 'Meu Perfil' : undefined}
          className={`flex items-center rounded-xl transition-all duration-200 ${
            collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
          } ${
            isActive('/perfil')
              ? `nav-item-active ${isLight ? 'bg-purple-100/80 text-purple-700' : 'bg-purple-900/40 text-purple-300'}`
              : isLight
                ? 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-800'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          <User size={20} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium font-modern">Meu Perfil</span>
          )}
        </Link>

        {!collapsed && (
          <div className="text-center mt-3">
            <p className={`text-[10px] font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              v1.0.0 · © 2024 Lunaria
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
