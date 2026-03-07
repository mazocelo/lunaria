import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import Button from '../../../components/form/button';
import { equipamentoService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

const raridadeColors = (raridade, isLight) => {
  const map = {
    'Comum': isLight ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'Incomum': isLight ? 'bg-green-100 text-green-800 border-green-300' : 'bg-green-500/20 text-green-400 border-green-500/30',
    'Raro': isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Muito Raro': isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Lendario': isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Artefato': isLight ? 'bg-red-100 text-red-800 border-red-300' : 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return map[raridade] || (isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-700/50 text-slate-300 border-slate-600');
};

const formatJson = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return val; }
  }
  if (typeof val === 'object' && Object.keys(val).length === 0) return null;
  return JSON.stringify(val, null, 2);
};

const VerEquipamentoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [equipamento, setEquipamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await equipamentoService.getById(id);
        setEquipamento(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando equipamento..." variant="primary" />
        </div>
      </div>
    );
  }

  if (error || !equipamento) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="card-rpg text-center py-12">
          <span className="text-4xl mb-4 block">{'\u274C'}</span>
          <p className="text-red-400 font-modern">{error || 'Equipamento nao encontrado'}</p>
          <Button variant="ghost" onClick={() => navigate(ROUTES.EQUIPAMENTOS)} className="mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  const eq = equipamento;
  const tipos = Array.isArray(eq.tipo) ? eq.tipo : [];
  const elementos = Array.isArray(eq.elemento) ? eq.elemento : [];
  const bonusStr = formatJson(eq.bonus);
  const requisitosStr = formatJson(eq.requisitos);
  const propriedades = Array.isArray(eq.propriedades) ? eq.propriedades : [];

  const SectionTitle = ({ children }) => (
    <h3 className={`text-lg font-fantasy font-bold mb-3 pb-2 border-b ${isLight ? 'text-slate-700 border-slate-200' : 'text-slate-200 border-slate-700'}`}>{children}</h3>
  );

  const InfoRow = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2">
        <span className={`text-sm font-semibold font-modern min-w-[140px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <span className={`font-modern ${isLight ? 'text-slate-800' : 'text-white'}`}>{value}</span>
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card-rpg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{'\u2694\uFE0F'}</span>
              <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{eq.nome}</h1>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {eq.numero && <span className="font-mono text-purple-400 text-sm">#{eq.numero}</span>}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${raridadeColors(eq.raridade, isLight)}`}>{eq.raridade || 'Comum'}</span>
              {eq.categoria && <span className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-500/20 text-indigo-400'}`}>{eq.categoria}</span>}
              {eq.sintonizacao && <span className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-500/20 text-yellow-400'}`}>{'\u2728'} Sintonizacao</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(ROUTES.EQUIPAMENTOS)}>Voltar</Button>
            <Button variant="primary" onClick={() => navigate(generateRoute.editarEquipamento(eq.id))}>Editar</Button>
          </div>
        </div>
      </div>

      {/* Descricao */}
      {(eq.descricao || eq.origem_lore) && (
        <div className="card-rpg">
          <SectionTitle>Descricao</SectionTitle>
          {eq.descricao && <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{eq.descricao}</p>}
          {eq.origem_lore && (
            <div className="mt-4">
              <span className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Origem / Lore</span>
              <p className={`font-modern leading-relaxed mt-1 italic ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{eq.origem_lore}</p>
            </div>
          )}
        </div>
      )}

      {/* Sintonizacao */}
      {eq.sintonizacao && (
        <div className="card-rpg">
          <SectionTitle>Sintonizacao</SectionTitle>
          <InfoRow label="Requer Sintonizacao" value="Sim" />
          {eq.sintonizacao_restricao && <InfoRow label="Restricao" value={eq.sintonizacao_restricao} />}
        </div>
      )}

      {/* Combate */}
      {(tipos.length > 0 || elementos.length > 0 || eq.dano_base) && (
        <div className="card-rpg">
          <SectionTitle>Combate</SectionTitle>
          {tipos.length > 0 && (
            <div className="py-2">
              <span className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tipo</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {tipos.map((t, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-modern ${isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400'}`}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {elementos.length > 0 && (
            <div className="py-2">
              <span className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Elemento</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {elementos.map((e, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-modern ${isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-400'}`}>{e}</span>
                ))}
              </div>
            </div>
          )}
          <InfoRow label="Dano Base" value={eq.dano_base} />
        </div>
      )}

      {/* Propriedades */}
      {(propriedades.length > 0 || eq.cargas || eq.usos_por_dia) && (
        <div className="card-rpg">
          <SectionTitle>Propriedades</SectionTitle>
          {propriedades.length > 0 && (
            <div className="py-2">
              <span className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tags</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {propriedades.map((p, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-modern ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'}`}>{p}</span>
                ))}
              </div>
            </div>
          )}
          {eq.cargas && <InfoRow label="Cargas" value={eq.cargas} />}
          {eq.usos_por_dia && <InfoRow label="Usos por dia" value={eq.usos_por_dia} />}
        </div>
      )}

      {/* Dados Avancados */}
      {(bonusStr || requisitosStr) && (
        <div className="card-rpg">
          <SectionTitle>Dados Avancados</SectionTitle>
          {bonusStr && (
            <div className="py-2">
              <span className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Bonus</span>
              <pre className={`mt-1 p-3 rounded-lg text-sm font-mono ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800/50 text-slate-300'}`}>{bonusStr}</pre>
            </div>
          )}
          {requisitosStr && (
            <div className="py-2">
              <span className={`text-sm font-semibold font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Requisitos</span>
              <pre className={`mt-1 p-3 rounded-lg text-sm font-mono ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800/50 text-slate-300'}`}>{requisitosStr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerEquipamentoView;
