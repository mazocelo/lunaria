import AmizadeItem from '../../components/AmizadeItem';
import type { AmizadeUsuario, AmizadeRelacao } from '../../components/AmizadeItem';
import { Users, UserPlus, Search, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/theme';
import type { ComponentType } from 'react';
import type { Amigo, Pendente, Sugestao } from '../../store/amizade/states';

type AmigosTab = 'amigos' | 'pendentes' | 'buscar';

interface TabConfig {
  id: AmigosTab;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  countKey: 'friends' | 'pending' | null;
}

const TABS: TabConfig[] = [
  { id: 'amigos', label: 'Meus Amigos', icon: Users, countKey: 'friends' },
  { id: 'pendentes', label: 'Solicitacoes', icon: UserPlus, countKey: 'pending' },
  { id: 'buscar', label: 'Buscar', icon: Search, countKey: null },
];

interface AmigosViewProps {
  friends: Amigo[];
  pending: Pendente[];
  suggestions: Sugestao[];
  searchResults: Sugestao[];
  searchInput: string;
  activeTab: AmigosTab;
  loading: boolean;
  loadingAction: number | null;
  error: string | null;
  successMessage: string | null;
  setActiveTab: (tab: AmigosTab) => void;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  sendRequest: (id: number) => void;
  acceptRequest: (id: number) => void;
  rejectRequest: (id: number) => void;
  removeFriend: (id: number) => void;
  clearMessages: () => void;
}

const AmigosView = ({
  friends,
  pending,
  suggestions,
  searchResults,
  searchInput,
  activeTab,
  loading,
  loadingAction,
  error,
  successMessage,
  setActiveTab,
  setSearchInput,
  handleSearch,
  handleSearchKeyDown,
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
}: AmigosViewProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const counts: Record<'friends' | 'pending', number> = { friends: friends?.length || 0, pending: pending?.length || 0 };

  return (
    <div className={`max-w-4xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-6">Amigos</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      <div className={`flex gap-1 mb-6 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.countKey ? counts[tab.countKey] : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {count !== null && count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      )}

      {!loading && activeTab === 'amigos' && (
        <div className="space-y-3">
          {friends?.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum amigo ainda</p>
              <p className="text-sm mt-1">Busque usuarios para adicionar</p>
            </div>
          ) : (
            friends.map((friend) => {
              const f = friend as Amigo & { amizadeId: number; usuario?: AmizadeUsuario | null; desde?: string };
              return (
                <AmizadeItem
                  key={f.amizadeId}
                  usuario={f.usuario}
                  tipo="amigo"
                  amizadeId={f.amizadeId}
                  desde={f.desde}
                  loading={loadingAction === f.amizadeId}
                  onRemove={() => removeFriend(f.amizadeId)}
                  isDark={isDark}
                />
              );
            })
          )}
        </div>
      )}

      {!loading && activeTab === 'pendentes' && (
        <div className="space-y-3">
          {pending?.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <UserPlus size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhuma solicitacao pendente</p>
            </div>
          ) : (
            pending.map((item) => {
              const p = item as Pendente & { id: number; usuario?: AmizadeUsuario | null; criado_em?: string };
              return (
                <AmizadeItem
                  key={p.id}
                  usuario={p.usuario}
                  tipo="pendente"
                  amizadeId={p.id}
                  criado_em={p.criado_em}
                  loading={loadingAction === p.id}
                  onAccept={() => acceptRequest(p.id)}
                  onReject={() => rejectRequest(p.id)}
                  isDark={isDark}
                />
              );
            })
          )}
        </div>
      )}

      {!loading && activeTab === 'buscar' && (
        <div>
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

          {searchResults?.length > 0 && (
            <div className="mb-8">
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Resultados ({searchResults.length})
              </h3>
              <div className="space-y-3">
                {searchResults.map((user) => {
                  const u = user as Sugestao & { id: number; relacao?: AmizadeRelacao };
                  return (
                    <AmizadeItem
                      key={u.id}
                      usuario={u}
                      tipo="busca"
                      relacao={u.relacao}
                      loading={loadingAction === u.id}
                      onAdd={() => sendRequest(u.id)}
                      isDark={isDark}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {suggestions?.length > 0 && (
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Sugestoes (jogaram na mesma historia)
              </h3>
              <div className="space-y-3">
                {suggestions.map((user) => {
                  const u = user as Sugestao & { id: number };
                  return (
                    <AmizadeItem
                      key={u.id}
                      usuario={u}
                      tipo="sugestao"
                      loading={loadingAction === u.id}
                      onAdd={() => sendRequest(u.id)}
                      isDark={isDark}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {searchResults?.length === 0 && suggestions?.length === 0 && !loading && (
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
