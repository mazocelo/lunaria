import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useTheme } from '../../../../contexts/theme.jsx';
import PointsBar from './components/PointsBar.jsx';
import CaracteristicasSection from './components/CaracteristicasSection.jsx';
import VantagensDesvantagensSection from './components/VantagensDesvantagensSection.jsx';
import FocusSection from './components/FocusSection.jsx';
import HistoriaSection from './components/HistoriaSection.jsx';
import MestrePanelLateral from './components/MestrePanelLateral.jsx';

export default function FichaLivreView(props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [mestreAberto, setMestreAberto] = useState(false);

  const {
    nome, setNome,
    nivelPoder, mudarNivelPoder,
    caracteristicas, setCaracteristica,
    vantagensIds, adicionarVantagem, removerVantagem,
    desvantagensIds, adicionarDesvantagem, removerDesvantagem,
    focus, setFocusNivel,
    historia, setHistoria,
    pontosTotal, pontosCaracteristicas, pontosVantagens, pontosDesvantagens,
    pontosFocus, pontosRestantes,
    temMagia, pv, pm, podeCriar, maxAttr,
    vantagensCatalogo, desvantagensCatalogo, catalogoLoading,
    salvando, error, setError,
    onCriar, navigate,
    // Mestre
    mestreMensagens, mestreEnviando, mestreEnviarMensagem, mestreOnSugestao,
  } = props;

  return (
    <div className={`flex flex-col h-full ${isLight ? 'bg-slate-50' : 'bg-[#0f0d1a]'}`}>
      {/* Top bar */}
      <div className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-purple-900/30'
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/personagens')} className={`cursor-pointer p-1 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={`text-lg font-bold font-fantasy ${isLight ? 'text-slate-800' : 'text-purple-200'}`}>
            <span className="text-amber-400">3D&T Alpha</span> — Ficha de Personagem
          </h1>
        </div>
        <button onClick={() => setMestreAberto(v => !v)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
          mestreAberto
            ? 'bg-purple-500 text-white border-purple-500'
            : isLight
              ? 'border-slate-200 text-slate-500 hover:border-purple-300'
              : 'border-purple-900/30 text-purple-400 hover:border-purple-500/50'
        }`}>
          <MessageCircle size={14} /> Mestre
        </button>
      </div>

      {/* Points bar */}
      <PointsBar
        nivelPoder={nivelPoder}
        mudarNivelPoder={mudarNivelPoder}
        pontosTotal={pontosTotal}
        pontosRestantes={pontosRestantes}
        pontosCaracteristicas={pontosCaracteristicas}
        pontosVantagens={pontosVantagens}
        pontosFocus={pontosFocus}
        pontosDesvantagens={pontosDesvantagens}
      />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400 flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)} className="cursor-pointer text-red-400/50 hover:text-red-400">&#x2715;</button>
            </div>
          )}

          {/* Nome */}
          <section className={`rounded-2xl border p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Nome</h3>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome do personagem..."
              className={`w-full rounded-xl border px-4 py-3 text-lg font-semibold outline-none transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-400' : 'bg-slate-800/50 border-purple-900/20 text-slate-100 focus:border-purple-500'
              }`}
            />
          </section>

          <CaracteristicasSection
            caracteristicas={caracteristicas}
            setCaracteristica={setCaracteristica}
            pontosCaracteristicas={pontosCaracteristicas}
            pontosRestantes={pontosRestantes}
            pv={pv} pm={pm} temMagia={temMagia}
            maxAttr={maxAttr}
          />

          <VantagensDesvantagensSection
            vantagensIds={vantagensIds}
            desvantagensIds={desvantagensIds}
            vantagensCatalogo={vantagensCatalogo}
            desvantagensCatalogo={desvantagensCatalogo}
            adicionarVantagem={adicionarVantagem}
            removerVantagem={removerVantagem}
            adicionarDesvantagem={adicionarDesvantagem}
            removerDesvantagem={removerDesvantagem}
            pontosVantagens={pontosVantagens}
            pontosDesvantagens={pontosDesvantagens}
            pontosRestantes={pontosRestantes}
          />

          <FocusSection
            focus={focus}
            setFocusNivel={setFocusNivel}
            pontosFocus={pontosFocus}
            pontosRestantes={pontosRestantes}
            temMagia={temMagia}
            maxAttr={maxAttr}
          />

          {/* Equipamentos stub */}
          <section className={`rounded-2xl border p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Equipamentos</h3>
            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Em breve</p>
          </section>

          <HistoriaSection historia={historia} setHistoria={setHistoria} />

          {/* Create button */}
          <button
            disabled={!podeCriar || salvando}
            onClick={onCriar}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 text-white text-base font-bold cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {salvando ? 'Criando...' : 'Criar Personagem'}
          </button>
          <div className="h-6" />
        </div>

        {/* Mestre Panel */}
        <MestrePanelLateral
          aberto={mestreAberto}
          onToggle={() => setMestreAberto(v => !v)}
          mensagens={mestreMensagens}
          enviando={mestreEnviando}
          enviarMensagem={mestreEnviarMensagem}
          onSugestaoClick={mestreOnSugestao}
        />
      </div>
    </div>
  );
}
