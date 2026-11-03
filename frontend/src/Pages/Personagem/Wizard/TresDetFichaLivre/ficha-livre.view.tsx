import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useTheme } from '../../../../contexts/theme';
import '../wizard-theme.css';
import PointsBar from './components/PointsBar';
import CaracteristicasSection from './components/CaracteristicasSection';
import VantagensDesvantagensSection from './components/VantagensDesvantagensSection';
import FocusSection from './components/FocusSection';
import GrimorioTresDetSection from './components/GrimorioTresDetSection';
import EquipamentosTresDetSection from './components/EquipamentosTresDetSection';
import HistoriaSection from './components/HistoriaSection';
import MestrePanelLateral from './components/MestrePanelLateral';
import type { TresDetFichaModel } from './ficha-livre.model';

interface FichaLivreViewProps extends TresDetFichaModel {
  focusCatalogo?: Array<{ nome: string; label: string; emoji?: string; descricao?: string }>;
  onCriar: () => void;
  mestreMensagens: Array<{ id?: number | string; role?: string; content?: string; sugestoes?: unknown[] }>;
  mestreEnviando: boolean;
  mestreEnviarMensagem: (texto: string) => void;
  mestreOnSugestao?: (s: { nome?: string; [key: string]: unknown }) => void;
}

export default function FichaLivreView(props: FichaLivreViewProps) {
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
    magiasIds, adicionarMagia, removerMagia,
    magiasDisponiveis, magiasCatalogo,
    equipamentosIds, adicionarEquipamento, removerEquipamento,
    itensCatalogo,
    historia, setHistoria,
    pontosTotal, pontosCaracteristicas, pontosVantagens, pontosDesvantagens,
    pontosFocus, pontosRestantes,
    temMagia, pv, pm, podeCriar, maxAttr,
    vantagensCatalogo, desvantagensCatalogo, focusCatalogo,
    salvando, error, setError,
    onCriar, navigate,
    // Mestre
    mestreMensagens, mestreEnviando, mestreEnviarMensagem, mestreOnSugestao,
  } = props;

  return (
    <div className={`wizard-atelier ${isLight ? 'light' : ''} ${theme === 'gothic' ? 'gothic' : ''} flex flex-col h-full min-h-0 overflow-hidden`}>
      <div className="relative z-[1] flex flex-col flex-1 min-h-0">
        {/* Top bar */}
        <div
          className="wa-panel-strong wa-etched flex items-center justify-between px-6 py-3 shrink-0"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/personagens')}
              className="cursor-pointer p-1 transition-colors"
              style={{ color: 'var(--wa-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--wa-ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--wa-muted)'; }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold font-fantasy" style={{ color: 'var(--wa-ink)' }}>
              <span style={{ color: 'var(--wa-forge-gold)' }}>3D&T Alpha</span>
              <span style={{ color: 'var(--wa-muted)' }}> — </span>
              Ficha de Personagem
            </h1>
          </div>
          <button
            onClick={() => setMestreAberto(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
              mestreAberto ? 'wa-violet-chip' : 'wa-teal-chip'
            }`}
            style={mestreAberto ? {
              boxShadow: '0 0 12px color-mix(in srgb, var(--wa-accent) 30%, transparent)',
            } : {}}
          >
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
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ background: 'var(--wa-bg)' }}
          >
            {/* Error banner */}
            {error && (
              <div
                className="wa-stage-enter rounded-xl p-4 text-sm flex items-center justify-between"
                style={{
                  background: 'color-mix(in srgb, var(--wa-ember) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--wa-ember) 30%, transparent)',
                  color: 'var(--wa-danger)',
                }}
              >
                {error}
                <button
                  onClick={() => setError(null)}
                  className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--wa-danger)' }}
                >
                  &#x2715;
                </button>
              </div>
            )}

            {/* Nome */}
            <section className="wa-main-shell wa-stage-enter wa-stagger-1 rounded-2xl p-3">
              <h3
                className="font-fantasy text-base font-bold tracking-wider mb-3"
                style={{ color: 'var(--wa-accent-bright)' }}
              >
                Nome
              </h3>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome do personagem..."
                className="w-full rounded-xl px-4 py-3 text-lg font-fantasy font-semibold outline-none transition-colors"
                style={{
                  background: 'var(--wa-panel-soft)',
                  border: '1px solid var(--wa-border)',
                  color: 'var(--wa-ink)',
                }}
              />
            </section>

            <div className="wa-stage-enter wa-stagger-2">
              <CaracteristicasSection
                caracteristicas={caracteristicas}
                setCaracteristica={setCaracteristica}
                pontosCaracteristicas={pontosCaracteristicas}
                pontosRestantes={pontosRestantes}
                pv={pv} pm={pm} temMagia={temMagia}
                maxAttr={maxAttr}
              />
            </div>

            <div className="wa-stage-enter wa-stagger-3">
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
            </div>

            <div className="wa-stage-enter wa-stagger-4">
              <FocusSection
                focus={focus}
                setFocusNivel={setFocusNivel}
                pontosFocus={pontosFocus}
                pontosRestantes={pontosRestantes}
                maxAttr={maxAttr}
                focusCatalogo={focusCatalogo}
              />
            </div>

            <div className="wa-stage-enter wa-stagger-5">
              <GrimorioTresDetSection
                magiasDisponiveis={magiasDisponiveis}
                magiasCatalogo={magiasCatalogo}
                magiasIds={magiasIds}
                adicionarMagia={adicionarMagia}
                removerMagia={removerMagia}
              />
            </div>

            <div className="wa-stage-enter wa-stagger-6">
              <EquipamentosTresDetSection
                itensCatalogo={itensCatalogo as unknown as Parameters<typeof EquipamentosTresDetSection>[0]['itensCatalogo']}
                equipamentosIds={equipamentosIds}
                adicionarEquipamento={adicionarEquipamento}
                removerEquipamento={removerEquipamento}
              />
            </div>

            <div className="wa-stage-enter wa-stagger-7">
              <HistoriaSection historia={historia} setHistoria={setHistoria} />
            </div>

            {/* Create button */}
            <button
              disabled={!podeCriar || salvando}
              onClick={onCriar}
              className="wa-stage-enter w-full py-4 rounded-2xl text-white text-base font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--wa-accent), var(--wa-teal))',
                boxShadow: podeCriar && !salvando
                  ? '0 0 20px color-mix(in srgb, var(--wa-accent) 30%, transparent)'
                  : 'none',
              }}
              onMouseEnter={e => {
                if (podeCriar && !salvando) {
                  e.currentTarget.style.boxShadow = '0 0 32px color-mix(in srgb, var(--wa-accent) 50%, transparent), 0 0 16px color-mix(in srgb, var(--wa-teal) 30%, transparent)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                if (podeCriar && !salvando) {
                  e.currentTarget.style.boxShadow = '0 0 20px color-mix(in srgb, var(--wa-accent) 30%, transparent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {salvando ? 'Criando...' : 'Criar Personagem'}
            </button>
            <div className="h-6" />
          </div>

          {/* Mestre Panel */}
          <MestrePanelLateral
            aberto={mestreAberto}
            onToggle={() => setMestreAberto(v => !v)}
            mensagens={mestreMensagens as unknown as Parameters<typeof MestrePanelLateral>[0]['mensagens']}
            enviando={mestreEnviando}
            enviarMensagem={mestreEnviarMensagem}
            onSugestaoClick={mestreOnSugestao}
          />
        </div>
      </div>
    </div>
  );
}
