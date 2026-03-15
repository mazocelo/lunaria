import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/theme.jsx';
import { historiaService } from '../../../services/index.js';
import { generateRoute } from '../../../constants/routes.js';
import { Search, Globe, Users, BookOpen, Loader2, RefreshCw } from 'lucide-react';

const ExplorarHistoriasPage = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();

  const [historias, setHistorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [total, setTotal] = useState(0);

  const fetchHistorias = async () => {
    setLoading(true);
    try {
      const res = await historiaService.getPublicas({ limit: 50 });
      setHistorias(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Erro ao buscar histórias públicas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistorias(); }, []);

  const filtradas = busca
    ? historias.filter(h =>
        h.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        h.descricao?.toLowerCase().includes(busca.toLowerCase())
      )
    : historias;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <Globe size={28} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
          Explorar Aventuras
        </h1>
        <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Descubra histórias públicas e embarque em novas aventuras
        </p>
      </div>

      {/* Search + Stats */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar aventuras..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg font-modern border transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                : 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          />
        </div>
        <button
          onClick={fetchHistorias}
          className={`px-4 py-2.5 rounded-lg font-modern text-sm flex items-center gap-2 transition-colors cursor-pointer ${
            isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <p className={`text-sm font-modern mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        {busca ? filtradas.length : total} {(busca ? filtradas.length : total) === 1 ? 'aventura disponível' : 'aventuras disponíveis'}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-purple-400" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {busca ? 'Nenhuma aventura encontrada para esta busca.' : 'Nenhuma aventura pública disponível no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(historia => (
            <div
              key={historia.id}
              onClick={() => navigate(generateRoute.verHistoria(historia.id))}
              className={`card-rpg p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
                isLight ? 'hover:border-purple-400/40' : 'hover:border-purple-500/40'
              }`}
            >
              {/* Image */}
              {historia.imagem && (
                <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                  <img src={historia.imagem} alt={historia.nome} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title */}
              <h3 className={`font-fantasy font-bold text-lg mb-1 line-clamp-1 ${
                isLight ? 'text-slate-800' : 'text-white'
              }`}>
                {historia.nome}
              </h3>

              {/* Description */}
              {historia.descricao && (
                <p className={`text-xs font-modern line-clamp-2 mb-3 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {historia.descricao}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs font-modern">
                <span className={`flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Users size={12} />
                  {(() => {
                    const max = historia.maximo_de_participantes || 5;
                    const atual = historia._count?.historias_personagens || 0;
                    const vagas = Math.max(0, max - atual);
                    return <span className={vagas === 0 ? 'text-red-400 font-semibold' : ''}>{vagas}/{max} vagas</span>;
                  })()}
                </span>
                {historia.usuarios?.nome && (
                  <span className={isLight ? 'text-purple-600' : 'text-purple-400'}>
                    por {historia.usuarios.nome}
                  </span>
                )}
                {historia.sessaoAtiva && (
                  <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-semibold">
                    Ativa
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorarHistoriasPage;
