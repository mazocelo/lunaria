import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/theme.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { useSocketStore } from '../../store';

const Sidebar = () => {
    const location = useLocation();
    const { theme } = useTheme();
    const { isSuperAdmin } = useAuth();
    const isLight = theme === 'light';

    // 🌐 SOCKET STORE - Usando o store Zustand integrado
    const {
        isConnected,
        isAuthenticated,
        isConnecting,
        error,
        connectToSocket
    } = useSocketStore();

    const playerItems = [
        {
            path: '/historias',
            label: 'Historias',
            icon: '📚',
            description: 'Gerencie suas aventuras'
        },
        {
            path: '/personagens',
            label: 'Personagens',
            icon: '⚔️',
            description: 'Crie e edite personagens'
        }
    ];

    const catalogItems = [
        {
            path: '/racas',
            label: 'Racas',
            icon: '🧬',
            description: 'Gerencie as racas'
        },
        {
            path: '/classes',
            label: 'Classes',
            icon: '🛡️',
            description: 'Gerencie as classes'
        },
        {
            path: '/vantagens',
            label: 'Vantagens',
            icon: '⭐',
            description: 'Gerencie as vantagens'
        },
        {
            path: '/desvantagens',
            label: 'Desvantagens',
            icon: '⚠️',
            description: 'Gerencie as desvantagens'
        },
        {
            path: '/equipamentos',
            label: 'Equipamentos',
            icon: '⚔️',
            description: 'Armas e itens magicos'
        },
        {
            path: '/monstros',
            label: 'Monstros',
            icon: '👹',
            description: 'Bestiario de Lunaria'
        },
        {
            path: '/temas',
            label: 'Temas',
            icon: '🎨',
            description: 'Gerencie os temas'
        },
        {
            path: '/mestres',
            label: 'Mestres',
            icon: '🧙',
            description: 'Gerencie seus mestres'
        }
    ];

    const menuItems = isSuperAdmin
        ? [...playerItems, ...catalogItems]
        : playerItems;

    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`w-[260px] h-screen flex flex-col ${isLight ? 'sidebar-rpg-light' : 'sidebar-rpg'
            }`}>
            {/* Logo e título */}
            <div className={`p-6 border-b ${isLight ? 'border-slate-200/50' : 'border-slate-700/50'
                }`} style={{ height: '8vh' }}>
                <div className="flex items-center space-x-3">
                    {/* Logo Lunaria */}
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden">
                        <img 
                            src="/assets/logo_lunaria.png" 
                            alt="Lunaria" 
                            className="w-full h-full object-contain filter drop-shadow-lg"
                        />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                Lunaria
                            </h2>
                        </div>
                        <p className={`text-xs font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}>
                            Plataforma de Roleplay
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu de navegação */}
            <nav className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-2">
                    {playerItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group relative block p-4 rounded-xl transition-all duration-300 hover-lift ${isActive(item.path)
                                ? 'gradient-primary text-slate-700 shadow-lg'
                                : isLight
                                    ? 'glass-light text-slate-700 hover:text-slate-900 hover:bg-slate-100/50'
                                    : 'glass text-slate-300 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold font-modern">
                                        {item.label}
                                    </div>
                                    <div className={`text-xs ${isActive(item.path)
                                        ? 'text-slate-700'
                                        : isLight
                                            ? 'text-slate-500'
                                            : 'text-slate-400'
                                        }`}>
                                        {item.description}
                                    </div>
                                </div>
                            </div>
                            {!isActive(item.path) && (
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/10 to-cyan-500/10" />
                            )}
                        </Link>
                    ))}

                    {isSuperAdmin && (
                        <>
                            <div className={`flex items-center gap-2 pt-4 pb-2 px-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                <div className={`flex-1 h-px ${isLight ? 'bg-slate-300/50' : 'bg-slate-600/50'}`} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Catalogo</span>
                                <div className={`flex-1 h-px ${isLight ? 'bg-slate-300/50' : 'bg-slate-600/50'}`} />
                            </div>
                            {catalogItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`group relative block p-4 rounded-xl transition-all duration-300 hover-lift ${isActive(item.path)
                                        ? 'gradient-primary text-slate-700 shadow-lg'
                                        : isLight
                                            ? 'glass-light text-slate-700 hover:text-slate-900 hover:bg-slate-100/50'
                                            : 'glass text-slate-300 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold font-modern">
                                                {item.label}
                                            </div>
                                            <div className={`text-xs ${isActive(item.path)
                                                ? 'text-slate-700'
                                                : isLight
                                                    ? 'text-slate-500'
                                                    : 'text-slate-400'
                                                }`}>
                                                {item.description}
                                            </div>
                                        </div>
                                    </div>
                                    {!isActive(item.path) && (
                                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/10 to-cyan-500/10" />
                                    )}
                                </Link>
                            ))}
                        </>
                    )}
                </div>



                {/* Status da conexão WebSocket (versão expandida quando há erro) */}
                {error && (
                    <div className={`mt-4 p-3 rounded-xl border ${
                        isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/20 border-red-500/30'
                    }`}>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-red-500">⚠️</span>
                            <span className={`text-sm font-semibold ${isLight ? 'text-red-800' : 'text-red-300'}`}>
                                Erro de Conexão
                            </span>
                        </div>
                        <p className={`text-xs ${isLight ? 'text-red-700' : 'text-red-400'} mb-2`}>
                            {error}
                        </p>
                        <button
                            onClick={connectToSocket}
                            className={`w-full px-3 py-2 text-xs rounded-lg font-semibold transition-colors ${
                                isLight 
                                    ? 'bg-red-200 hover:bg-red-300 text-red-800' 
                                    : 'bg-red-500/30 hover:bg-red-500/50 text-red-300'
                            }`}
                        >
                            Tentar Reconectar
                        </button>
                    </div>
                )}
            </nav>

            {/* Perfil link */}
            <div className={`px-6 pb-2 pt-4 border-t ${isLight ? 'border-slate-200/50' : 'border-slate-700/50'}`}>
                <Link
                    to="/perfil"
                    className={`group relative block p-4 rounded-xl transition-all duration-300 hover-lift ${isActive('/perfil')
                        ? 'gradient-primary text-slate-700 shadow-lg'
                        : isLight
                            ? 'glass-light text-slate-700 hover:text-slate-900 hover:bg-slate-100/50'
                            : 'glass text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl flex-shrink-0">👤</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold font-modern">Meu Perfil</div>
                            <div className={`text-xs ${isActive('/perfil')
                                ? 'text-slate-700'
                                : isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                                Configurações da conta
                            </div>
                        </div>
                    </div>
                    {!isActive('/perfil') && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/10 to-cyan-500/10" />
                    )}
                </Link>
            </div>

            {/* Footer da sidebar */}
            <div className={`px-6 pb-6 pt-2`}>
                <div className="text-center">
                    <div className={`w-8 h-8 gradient-accent rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        🎯
                    </div>
                    <p className={`text-xs font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                        Versão 1.0.0
                    </p>
                    <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-500'
                        }`}>
                        © 2024 Lunaria
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
