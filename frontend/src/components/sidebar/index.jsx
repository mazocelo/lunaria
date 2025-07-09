import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        {
            path: '/historias',
            label: 'Histórias',
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

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="sidebar-rpg w-80 h-screen flex flex-col">
            {/* Logo e título */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        🎲
                    </div>
                    <div>
                        <h2 className="text-xl font-fantasy font-bold text-white">
                            RPG Portal
                        </h2>
                        <p className="text-xs text-slate-400 font-modern">
                            Plataforma de Roleplay
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu de navegação */}
            <nav className="flex-1 p-6">
                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group relative block p-4 rounded-xl transition-all duration-300 hover-lift ${
                                isActive(item.path)
                                    ? 'gradient-primary text-white shadow-lg'
                                    : 'glass text-slate-300 hover:text-white hover:bg-slate-700/50'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{item.icon}</span>
                                <div className="flex-1">
                                    <div className="font-semibold font-modern">
                                        {item.label}
                                    </div>
                                    <div className={`text-xs ${
                                        isActive(item.path) ? 'text-white/80' : 'text-slate-400'
                                    }`}>
                                        {item.description}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Efeito de brilho no hover */}
                            {!isActive(item.path) && (
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/10 to-cyan-500/10" />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Seção de estatísticas */}
                <div className="mt-8 p-4 glass rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 font-modern">
                        Estatísticas
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Histórias Ativas</span>
                            <span className="text-purple-400 font-semibold">12</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Personagens</span>
                            <span className="text-cyan-400 font-semibold">48</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Sessões Hoje</span>
                            <span className="text-green-400 font-semibold">3</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Footer da sidebar */}
            <div className="p-6 border-t border-slate-700/50">
                <div className="text-center">
                    <div className="w-8 h-8 gradient-accent rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold">
                        🎯
                    </div>
                    <p className="text-xs text-slate-400 font-modern">
                        Versão 1.0.0
                    </p>
                    <p className="text-xs text-slate-500 font-modern">
                        © 2024 RPG Portal
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
