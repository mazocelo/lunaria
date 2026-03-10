import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/theme.jsx';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { Sun, Moon, Bell, BellRing, BellOff, LogOut, User, ChevronDown, Settings, PanelLeftClose, PanelLeft, Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, toggleSound } from '../utils/audio.js';
import { isNotificationsEnabled, requestPermission, getPermissionState, setNotificationsEnabled } from '../utils/notifications.js';

const TopHeader = ({ notificationCount, onOpenNotifications }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [notifOn, setNotifOn] = useState(() => isNotificationsEnabled() && getPermissionState() === 'granted');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const isLight = theme === 'light';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const userInitial = user?.nome?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className={`h-14 flex items-center justify-between px-4 flex-shrink-0 z-10 border-b ${
      isLight
        ? 'bg-white/90 backdrop-blur-md border-slate-200/60'
        : 'bg-slate-900/80 backdrop-blur-md border-slate-700/50'
    }`}>
      {/* Left side: Sidebar toggle + Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className={`icon-btn ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-fantasy font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            The Fable Forge
          </h1>
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse-slow" />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundOn(toggleSound())}
          className={`icon-btn ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
          aria-label={soundOn ? 'Desativar som' : 'Ativar som'}
        >
          {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Browser Notifications Toggle */}
        <button
          onClick={async () => {
            if (notifOn) {
              setNotificationsEnabled(false);
              setNotifOn(false);
            } else {
              const granted = await requestPermission();
              setNotifOn(granted);
            }
          }}
          className={`icon-btn ${notifOn ? (isLight ? 'text-purple-600' : 'text-purple-400') : (isLight ? 'text-slate-600' : 'text-slate-400')}`}
          aria-label={notifOn ? 'Desativar notificações do navegador' : 'Ativar notificações do navegador'}
          title={notifOn ? 'Notificações ativas' : 'Ativar notificações'}
        >
          {notifOn ? <BellRing size={20} /> : <BellOff size={20} />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`icon-btn ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
          aria-label="Alternar tema"
        >
          {isLight ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className={`icon-btn relative ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
          aria-label="Notificações"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-[10px] font-bold px-1">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            </span>
          )}
        </button>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
              isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isLight
                ? 'bg-purple-100 text-purple-700'
                : 'bg-purple-900/60 text-purple-300'
            }`}>
              {userInitial}
            </div>
            <ChevronDown size={14} className={`transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            } ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              {/* User info */}
              <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-700'}`}>
                <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {user?.nome || 'Usuário'}
                </p>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {user?.email || ''}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/perfil'); }}
                  className={`user-dropdown-item w-full text-left ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                >
                  <User size={16} />
                  <span>Meu Perfil</span>
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/perfil'); }}
                  className={`user-dropdown-item w-full text-left ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                >
                  <Settings size={16} />
                  <span>Configurações</span>
                </button>
              </div>

              {/* Logout */}
              <div className={`border-t ${isLight ? 'border-slate-100' : 'border-slate-700'}`}>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className={`user-dropdown-item w-full text-left ${
                    isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'
                  }`}
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
