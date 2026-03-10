import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/theme.jsx';
import { User, Shield, Sword, Calendar, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../services/ApiClient.js';

const PerfilPublicoPage = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/usuarios/publico/${id}`);
        if (res.success) {
          setPerfil(res.data);
        } else {
          setError(res.error || 'Erro ao carregar perfil');
        }
      } catch (err) {
        setError(err.message || 'Perfil não encontrado');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Lock size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
        <h2 className={`text-xl font-fantasy font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
          Perfil indisponível
        </h2>
        <p className={`font-modern mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-modern text-sm transition-colors cursor-pointer"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!perfil) return null;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto p-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-1.5 mb-6 text-sm font-modern transition-colors cursor-pointer ${
          isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Profile Header */}
      <div className="card-rpg p-6 text-center mb-6">
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${
          isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-900/60 text-purple-300'
        }`}>
          {perfil.avatar ? (
            <img src={perfil.avatar} alt={perfil.nome} className="w-full h-full rounded-full object-cover" />
          ) : (
            perfil.nome?.charAt(0)?.toUpperCase() || '?'
          )}
        </div>
        <h1 className={`text-2xl font-fantasy font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
          {perfil.nome}
        </h1>
        {perfil.bio && (
          <p className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {perfil.bio}
          </p>
        )}
        <div className={`flex items-center justify-center gap-1 mt-2 text-xs font-modern ${
          isLight ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <Calendar size={12} />
          Membro desde {new Date(perfil.criado_em).toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Stats */}
      {perfil.estatisticas && (
        <div className="card-rpg p-6 mb-6">
          <h2 className={`text-lg font-fantasy font-bold mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Estatísticas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(perfil.estatisticas).map(([key, val]) => (
              <div key={key} className={`text-center p-3 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
                <div className={`text-xl font-bold ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                  {typeof val === 'number' ? val : '-'}
                </div>
                <div className={`text-[10px] font-modern uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters */}
      {perfil.personagens?.length > 0 && (
        <div className="card-rpg p-6">
          <h2 className={`text-lg font-fantasy font-bold mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Personagens
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {perfil.personagens.map(p => (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                isLight ? 'bg-slate-100' : 'bg-slate-800/50'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-purple-100' : 'bg-purple-900/40'
                }`}>
                  {p.imagem ? (
                    <img src={p.imagem} alt={p.nome} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Sword size={16} className="text-purple-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className={`font-modern font-semibold text-sm truncate ${
                    isLight ? 'text-slate-800' : 'text-white'
                  }`}>
                    {p.nome}
                  </div>
                  <div className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {p.raca_nome || '???'} · {p.classe_nome || '???'} · Nv {p.nivel || 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilPublicoPage;
