import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Scroll, Sword, MapPin, Users, Gem,
  Zap, Swords, Flag, BookOpen, Compass, CheckCircle2, Circle,
  ImagePlus, Loader2, X
} from 'lucide-react';
import { imageGenerationService } from '../services';
import ImageLightbox from './ImageLightbox.jsx';
import NarrationAudioButton from './shared/NarrationAudioButton.jsx';

const Section = ({ title, icon: Icon, children, defaultOpen = false, isLight }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-lg border ${isLight ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-800/30'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-4 py-3 text-left font-fantasy font-semibold text-sm transition-all cursor-pointer ${
          isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-white hover:bg-slate-700/30'
        }`}
      >
        <Icon size={16} className="text-purple-400 flex-shrink-0" />
        <span className="flex-1">{title}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className={`px-4 pb-4 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

const ImagemCard = ({ imageUrl, entityType, entityData, isLight, onGenerated }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await imageGenerationService.generate({ entityType, entityData });
      const url = response.data?.url;
      if (url) onGenerated(url);
      else setError('Nenhuma imagem retornada');
    } catch (err) {
      setError(err.message || 'Erro ao gerar');
    } finally {
      setGenerating(false);
    }
  };

  if (imageUrl) {
    return (
      <div className="relative group mt-2">
        <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg cursor-pointer select-none caret-transparent" draggable={false} onError={(e) => { e.target.style.display = 'none'; }} onClick={() => setLightboxOpen(true)} />
        <button onClick={() => onGenerated('')} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity select-none caret-transparent" title="Remover">
          <X size={12} />
        </button>
        <ImageLightbox src={imageUrl} alt="Preview" isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleGenerate}
        disabled={generating}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
          generating ? 'bg-gray-500/30 cursor-not-allowed text-gray-400' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300'
        }`}
      >
        {generating ? <><Loader2 size={12} className="animate-spin" /> Gerando...</> : <><ImagePlus size={12} /> Gerar Imagem</>}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

const joinNarrationParts = (...parts) => parts.filter(Boolean).join(' ');

const buildAntagonistaNarration = (antagonista) => {
  if (!antagonista) return '';
  return joinNarrationParts(
    `Antagonista ${antagonista.nome}.`,
    antagonista.titulo ? `${antagonista.titulo}.` : '',
    antagonista.descricao,
    antagonista.motivacao ? `Motivacao: ${antagonista.motivacao}.` : '',
    antagonista.poderes?.length ? `Poderes: ${antagonista.poderes.join(', ')}.` : '',
    antagonista.fraquezas?.length ? `Fraquezas: ${antagonista.fraquezas.join(', ')}.` : ''
  );
};

const buildLocalNarration = (local) => {
  if (!local) return '';
  return joinNarrationParts(
    `Local ${local.nome}.`,
    local.tipo ? `Tipo: ${local.tipo}.` : '',
    local.perigo ? `Perigo: ${local.perigo}.` : '',
    local.descricao
  );
};

const buildNpcNarration = (npc) => {
  if (!npc) return '';
  return joinNarrationParts(
    `NPC ${npc.nome}.`,
    npc.papel ? `Papel: ${npc.papel}.` : '',
    npc.descricao,
    npc.motivacao ? `Motivacao: ${npc.motivacao}.` : '',
    npc.local ? `Local associado: ${npc.local}.` : '',
    npc.dialogo_exemplo ? `Dialogo exemplo: ${npc.dialogo_exemplo}.` : ''
  );
};

const RoteiroViewer = ({
  roteiro,
  isLight,
  historiaId,
  onRoteiroUpdate,
  estiloImagem,
  temasHistoria = [],
  historiaContexto = '',
  tts = null,
  mestreVoiceId = null,
  mestreVoiceProvider = 'elevenlabs'
}) => {
  // Ref para manter versão mais recente do roteiro (evita race condition em gerações paralelas)
  const roteiroRef = useRef(roteiro);
  useEffect(() => { roteiroRef.current = roteiro; }, [roteiro]);

  if (!roteiro) return null;

  const updateItemImage = (arrayKey, index, url) => {
    if (!onRoteiroUpdate) return;
    const current = roteiroRef.current || roteiro;
    const updated = { ...current, [arrayKey]: current[arrayKey].map((item, i) => i === index ? { ...item, imagem: url } : item) };
    roteiroRef.current = updated;
    onRoteiroUpdate(updated);
  };

  return (
    <div className="space-y-2">
      {/* Sinopse (always open) */}
      {roteiro.sinopse && (
        <Section title="Sinopse" icon={BookOpen} defaultOpen isLight={isLight}>
          <p className="whitespace-pre-line">{roteiro.sinopse}</p>
          <NarrationAudioButton
            tts={tts}
            text={roteiro.sinopse}
            itemId={`historia:${historiaId}:roteiro:sinopse`}
            voiceId={mestreVoiceId}
            voiceProvider={mestreVoiceProvider}
            isLight={isLight}
          />
        </Section>
      )}

      {/* Antagonista */}
      {roteiro.antagonista && (
        <Section title={`Antagonista: ${roteiro.antagonista.nome}`} icon={Sword} isLight={isLight}>
          <div className="space-y-2">
            {roteiro.antagonista.titulo && <p className="font-semibold italic">{roteiro.antagonista.titulo}</p>}
            <p>{roteiro.antagonista.descricao}</p>
            {roteiro.antagonista.motivacao && <p><span className="font-semibold">Motivacao:</span> {roteiro.antagonista.motivacao}</p>}
            {roteiro.antagonista.poderes?.length > 0 && (
              <p><span className="font-semibold">Poderes:</span> {roteiro.antagonista.poderes.join(', ')}</p>
            )}
            {roteiro.antagonista.fraquezas?.length > 0 && (
              <p><span className="font-semibold">Fraquezas:</span> {roteiro.antagonista.fraquezas.join(', ')}</p>
            )}
            <NarrationAudioButton
              tts={tts}
              text={buildAntagonistaNarration(roteiro.antagonista)}
              itemId={`historia:${historiaId}:roteiro:antagonista`}
              voiceId={mestreVoiceId}
              voiceProvider={mestreVoiceProvider}
              isLight={isLight}
            />
          </div>
        </Section>
      )}

      {/* Arcos Narrativos */}
      {roteiro.arcos?.length > 0 && (
        <Section title={`Arcos Narrativos (${roteiro.arcos.length})`} icon={Compass} isLight={isLight}>
          <div className="space-y-3">
            {roteiro.arcos.map((arco, i) => (
              <div key={i} className={`p-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-purple-400">Arco {arco.numero}</span>
                  <span className="font-semibold">{arco.titulo}</span>
                  {arco.nivel_sugerido && <span className="text-xs text-slate-400">Nv {arco.nivel_sugerido}</span>}
                </div>
                <p className="text-xs">{arco.descricao}</p>
                {arco.objetivos?.length > 0 && (
                  <ul className="mt-1 text-xs list-disc list-inside opacity-80">
                    {arco.objetivos.map((obj, j) => <li key={j}>{obj}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Mapa Mundi */}
      {roteiro.mapaMundi && (
        <Section title="Mapa Mundi" icon={MapPin} isLight={isLight}>
          <p className="mb-2">{roteiro.mapaMundi.descricao_geral}</p>
          {roteiro.mapaMundi.regioes?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {roteiro.mapaMundi.regioes.map((r, i) => (
                <div key={i} className={`p-2 rounded text-xs ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                  <span className="font-semibold">{r.nome}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    r.perigo === 'extremo' ? 'bg-red-500/20 text-red-400' :
                    r.perigo === 'alto' ? 'bg-orange-500/20 text-orange-400' :
                    r.perigo === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>{r.perigo}</span>
                  <p className="mt-1 opacity-80">{r.descricao}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Locais */}
      {roteiro.locais?.length > 0 && (
        <Section title={`Locais (${roteiro.locais.length})`} icon={MapPin} isLight={isLight}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roteiro.locais.map((local, i) => (
              <div key={i} className={`p-2 rounded text-xs ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-semibold">{local.nome}</span>
                  <span className="text-purple-400">({local.tipo})</span>
                </div>
                <p className="opacity-80">{local.descricao?.substring(0, 120)}{local.descricao?.length > 120 ? '...' : ''}</p>
                <NarrationAudioButton
                  tts={tts}
                  text={buildLocalNarration(local)}
                  itemId={`historia:${historiaId}:roteiro:local:${i}`}
                  voiceId={mestreVoiceId}
                  voiceProvider={mestreVoiceProvider}
                  isLight={isLight}
                />
                {onRoteiroUpdate && (
                  <ImagemCard
                    imageUrl={local.imagem}
                    entityType="local"
                    entityData={{
                      nome: local.nome,
                      tipo: local.tipo,
                      perigo: local.perigo,
                      descricao: local.descricao,
                      temas: temasHistoria,
                      contexto_historia: historiaContexto,
                      estilo_imagem: estiloImagem
                    }}
                    isLight={isLight}
                    onGenerated={(url) => updateItemImage('locais', i, url)}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* NPCs */}
      {roteiro.npcs?.length > 0 && (
        <Section title={`NPCs (${roteiro.npcs.length})`} icon={Users} isLight={isLight}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roteiro.npcs.map((npc, i) => (
              <div key={i} className={`p-2 rounded text-xs ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-semibold">{npc.nome}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    npc.papel === 'aliado' ? 'bg-green-500/20 text-green-400' :
                    npc.papel === 'antagonista' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>{npc.papel}</span>
                </div>
                <p className="opacity-80">{npc.descricao?.substring(0, 100)}{npc.descricao?.length > 100 ? '...' : ''}</p>
                {npc.dialogo_exemplo && (
                  <p className="mt-1 italic opacity-60">"{npc.dialogo_exemplo}"</p>
                )}
                <NarrationAudioButton
                  tts={tts}
                  text={buildNpcNarration(npc)}
                  itemId={`historia:${historiaId}:roteiro:npc:${i}`}
                  voiceId={mestreVoiceId}
                  voiceProvider={mestreVoiceProvider}
                  isLight={isLight}
                />
                {onRoteiroUpdate && (
                  <ImagemCard
                    imageUrl={npc.imagem}
                    entityType="npc"
                    entityData={{
                      nome: npc.nome,
                      papel: npc.papel,
                      descricao: npc.descricao,
                      local: npc.local,
                      motivacao: npc.motivacao,
                      segredo: npc.segredo,
                      temas: temasHistoria,
                      contexto_historia: historiaContexto,
                      estilo_imagem: estiloImagem
                    }}
                    isLight={isLight}
                    onGenerated={(url) => updateItemImage('npcs', i, url)}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tesouros e Segredos */}
      {roteiro.tesourosSegretos?.length > 0 && (
        <Section title={`Tesouros e Segredos (${roteiro.tesourosSegretos.length})`} icon={Gem} isLight={isLight}>
          <div className="space-y-2">
            {roteiro.tesourosSegretos.map((t, i) => (
              <div key={i} className={`p-2 rounded text-xs ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                <span className="font-semibold">{t.nome}</span> <span className="text-purple-400">({t.tipo})</span>
                <p className="opacity-80">{t.descricao}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Plot Twists */}
      {roteiro.plotTwists?.length > 0 && (
        <Section title={`Plot Twists (${roteiro.plotTwists.length})`} icon={Zap} isLight={isLight}>
          <div className="space-y-2">
            {roteiro.plotTwists.map((tw, i) => (
              <div key={i} className={`p-2 rounded text-xs ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                <span className="font-semibold">Momento:</span> {tw.momento}
                <p className="mt-1"><span className="font-semibold">Revelacao:</span> {tw.revelacao}</p>
                <p className="opacity-80"><span className="font-semibold">Impacto:</span> {tw.impacto}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Encontros-Chave */}
      {roteiro.encontrosChave?.length > 0 && (
        <Section title={`Encontros-Chave (${roteiro.encontrosChave.length})`} icon={Swords} isLight={isLight}>
          <div className="space-y-2">
            {roteiro.encontrosChave.map((e, i) => (
              <div key={i} className={`p-2 rounded text-xs ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{e.nome}</span>
                  <span className="text-purple-400">({e.tipo})</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    e.dificuldade === 'letal' ? 'bg-red-500/20 text-red-400' :
                    e.dificuldade === 'dificil' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{e.dificuldade}</span>
                </div>
                <p className="opacity-80">{e.descricao?.substring(0, 150)}{e.descricao?.length > 150 ? '...' : ''}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Desfechos Possiveis */}
      {roteiro.desfechosPossiveis?.length > 0 && (
        <Section title={`Desfechos Possiveis (${roteiro.desfechosPossiveis.length})`} icon={Flag} isLight={isLight}>
          <div className="space-y-2">
            {roteiro.desfechosPossiveis.map((d, i) => (
              <div key={i} className={`p-2 rounded text-xs ${isLight ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                <span className="font-semibold capitalize">{d.tipo?.replace(/_/g, ' ')}</span>
                <p className="opacity-80">{d.descricao}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Instrucoes para o Mestre */}
      {roteiro.instrucoesGeraisParaOMestre && (
        <Section title="Instrucoes para o Mestre" icon={Scroll} isLight={isLight}>
          <div className="space-y-2 text-xs">
            {roteiro.instrucoesGeraisParaOMestre.tom_narrativo && (
              <p><span className="font-semibold">Tom:</span> {roteiro.instrucoesGeraisParaOMestre.tom_narrativo}</p>
            )}
            {roteiro.instrucoesGeraisParaOMestre.ritmo && (
              <p><span className="font-semibold">Ritmo:</span> {roteiro.instrucoesGeraisParaOMestre.ritmo}</p>
            )}
            {roteiro.instrucoesGeraisParaOMestre.adaptacao && (
              <p><span className="font-semibold">Adaptacao:</span> {roteiro.instrucoesGeraisParaOMestre.adaptacao}</p>
            )}
            {roteiro.instrucoesGeraisParaOMestre.dicas_imersao?.length > 0 && (
              <ul className="list-disc list-inside opacity-80">
                {roteiro.instrucoesGeraisParaOMestre.dicas_imersao.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            )}
          </div>
        </Section>
      )}

      {/* Progressao */}
      {roteiro.progressao?.marcos?.length > 0 && (
        <Section title={`Progressao (${roteiro.progressao.marcos.filter(m => m.concluido).length}/${roteiro.progressao.marcos.length})`} icon={Flag} defaultOpen isLight={isLight}>
          <div className="space-y-1">
            {roteiro.progressao.marcos.map((marco, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {marco.concluido ? (
                  <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                ) : (
                  <Circle size={14} className="text-slate-500 flex-shrink-0" />
                )}
                <span className={marco.concluido ? 'line-through opacity-60' : ''}>{marco.descricao}</span>
              </div>
            ))}
          </div>
          {roteiro.progressao.porcentagem_estimada > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 rounded-full bg-slate-700">
                <div
                  className="h-2 rounded-full bg-purple-500 transition-all"
                  style={{ width: `${roteiro.progressao.porcentagem_estimada}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{roteiro.progressao.porcentagem_estimada}% completo</p>
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

export default RoteiroViewer;
