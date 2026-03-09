import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../contexts/theme.jsx';
import { useViewModel } from '../../shared/hooks';
import { amigosViewModel } from './viewmodel';
import AmizadeItem from '../../components/AmizadeItem';
import { Users, UserPlus, Search, Loader2 } from 'lucide-react';

const AmigosView = () => {
  const { theme } = useTheme();
  const vm = useViewModel(amigosViewModel);
  const isDark = theme === 'dark';
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    amigosViewModel.initialize();
  }, []);

  const handleSearch = useCallback(() => {
    amigosViewModel.search(searchInput);
    amigosViewModel.setSearchQuery(searchInput);
  }, [searchInput]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const tabs = [
    { id: 'amigos', label: 'Meus Amigos', icon: Users, count: vm.friends?.length },
    { id: 'pendentes', label: 'Solicitacoes', icon: UserPlus, count: vm.pending?.length },
    { id: 'buscar', label: 'Buscar', icon: Search },
  ];

  return (
    <div className={`max-w-4xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-6">Amigos</h1>

      {/* Mensagens */}
      {vm.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {vm.error}
        </div>
      )}
      {vm.successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {vm.successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-1 mb-6 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = vm.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => amigosViewModel.setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {vm.loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      )}

      {/* Tab: Amigos */}
      {!vm.loading && vm.activeTab === 'amigos' && (
        <div className="space-y-3">
          {vm.friends?.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum amigo ainda</p>
              <p className="text-sm mt-1">Busque usuarios para adicionar</p>
            </div>
          ) : (
            vm.friends.map(friend => (
              <AmizadeItem
                key={friend.amizadeId}
                usuario={friend.usuario}
                tipo="amigo"
                amizadeId={friend.amizadeId}
                desde={friend.desde}
                loading={vm.loadingAction === friend.amizadeId}
                onRemove={() => amigosViewModel.removeFriend(friend.amizadeId)}
                isDark={isDark}
              />
            ))
          )}
        </div>
      )}

      {/* Tab: Pendentes */}
      {!vm.loading && vm.activeTab === 'pendentes' && (
        <div className="space-y-3">
          {vm.pending?.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <UserPlus size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhuma solicitacao pendente</p>
            </div>
          ) : (
            vm.pending.map(item => (
              <AmizadeItem
                key={item.id}
                usuario={item.usuario}
                tipo="pendente"
                amizadeId={item.id}
                criado_em={item.criado_em}
                loading={vm.loadingAction === item.id}
                onAccept={() => amigosViewModel.acceptRequest(item.id)}
                onReject={() => amigosViewModel.rejectRequest(item.id)}
                isDark={isDark}
              />
            ))
          )}
        </div>
      )}

      {/* Tab: Buscar */}
      {!vm.loading && vm.activeTab === 'buscar' && (
        <div>
          {/* Search input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar por nome ou email..."
              className={`flex-1 px-4 py-2.5 rounded-lg border outline-none transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
              }`}
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Resultados da busca */}
          {vm.searchResults?.length > 0 && (
            <div className="mb-8">
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Resultados ({vm.searchResults.length})
              </h3>
              <div className="space-y-3">
                {vm.searchResults.map(user => (
                  <AmizadeItem
                    key={user.id}
                    usuario={user}
                    tipo="busca"
                    relacao={user.relacao}
                    loading={vm.loadingAction === user.id}
                    onAdd={() => amigosViewModel.sendRequest(user.id)}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sugestoes */}
          {vm.suggestions?.length > 0 && (
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Sugestoes (jogaram na mesma historia)
              </h3>
              <div className="space-y-3">
                {vm.suggestions.map(user => (
                  <AmizadeItem
                    key={user.id}
                    usuario={user}
                    tipo="sugestao"
                    loading={vm.loadingAction === user.id}
                    onAdd={() => amigosViewModel.sendRequest(user.id)}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          )}

          {vm.searchResults?.length === 0 && vm.suggestions?.length === 0 && !vm.loading && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>Busque por nome ou email</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmigosView;
