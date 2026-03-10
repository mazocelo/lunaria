import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Notification from '../../../components/Notification.jsx';
import RPGCard from '../../../components/RPGCard.jsx';
import { Badge } from '../../../components/shared';
import { ROUTES } from '../../../routes.jsx';
import {
  Crown, ArrowLeft, Pencil, X, BookOpen, Theater, ScrollText,
  Settings, Target, Terminal, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';

const PromptPreviewSection = ({ promptPreview, isLight }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promptPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 cursor-pointer transition-colors ${
          isLight ? 'text-slate-700 hover:text-purple-600' : 'text-white hover:text-purple-300'
        }`}
      >
        <Terminal size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
        Prompt do Sistema
        <span className="ml-auto">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {expanded && (
        <div className="relative">
          <button
            onClick={handleCopy}
            className={`absolute top-3 right-3 p-1.5 rounded-md transition-all cursor-pointer ${
              isLight
                ? 'hover:bg-slate-200 text-slate-500'
                : 'hover:bg-slate-600 text-slate-400'
            }`}
            title="Copiar prompt"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <div className={`p-4 rounded-lg overflow-auto max-h-96 ${
            isLight
              ? 'bg-slate-100 border border-slate-200'
              : 'bg-slate-900/80 border border-slate-600'
          }`}>
            <pre className={`font-mono text-xs leading-relaxed whitespace-pre-wrap break-words ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {promptPreview}
            </pre>
          </div>
          <p className={`text-xs mt-2 font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Previa do prompt enviado a IA. Temas e personagens sao adicionados dinamicamente na sessao.
          </p>
        </div>
      )}
    </div>
  );
};

const VerMestreView = ({
  id, mestre, loading, error, isLight, voiceName,
  clearError, navigate, generateRoute,
}) => {
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <Crown size={24} className="text-white" />
              </div>
              <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando mestre...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mestre && !loading && error) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg text-center py-12">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-500/20">
            <X size={36} className="text-red-400" />
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            Mestre nao encontrado
          </h3>
          <p className="text-slate-400 font-modern mb-6">
            O mestre que voce esta procurando nao existe ou foi removido.
          </p>
          <Link to={ROUTES.MESTRES}>
            <button className="btn-rpg">Voltar aos Mestres</button>
          </Link>
        </div>
      </div>
    );
  }

  if (!mestre) return null;

  const { nome, descricao, personalidade, modelo, temperatura, max_tokens, tom_narrativo, regras_especiais, imagem, voice_id } = mestre;

  const promptPreview = useMemo(() => {
    const parts = [];
    parts.push('Voce e um Mestre de RPG envolvente e criativo. Narre uma aventura textual interativa em portugues brasileiro.');
    if (nome) parts.push(`Seu nome como Mestre e "${nome}".`);
    if (personalidade) parts.push(`PERSONALIDADE: ${personalidade}`);
    if (tom_narrativo) parts.push(`TOM NARRATIVO: ${tom_narrativo}`);
    if (regras_especiais) parts.push(`REGRAS ESPECIAIS: ${regras_especiais}`);
    parts.push('');
    parts.push('TEMAS DA CAMPANHA: [definidos pela historia]');
    parts.push('PERSONAGENS JOGANDO: [definidos na sessao]');
    parts.push('');
    parts.push('## REGRAS FUNDAMENTAIS');
    parts.push('1. Reaja com criatividade e coerencia a cada acao do jogador');
    parts.push('2. Descreva ambiente, efeitos e desdobramentos narrativos');
    parts.push('3. Nunca tome decisoes pelo personagem — apenas descreva consequencias');
    parts.push('4. Mantenha imersao, suspense e ritmo adequado aos temas');
    parts.push('5. SEMPRE responda em JSON valido');
    parts.push('');
    parts.push('## ROLAGEM DE DADOS');
    parts.push('Solicite rolagem quando a acao for ARRISCADA, INCERTA ou de COMBATE (~30-40% das acoes).');
    parts.push('Testes: Forca, Destreza, Constituicao, Inteligencia, Agilidade, Carisma, Atletismo, Intimidacao, Percepcao, Furtividade, etc.');
    parts.push('Dificuldades: Muito Facil | Facil | Media | Dificil | Muito Dificil | Quase Impossivel');
    parts.push('');
    parts.push('## FORMATO DE RESPOSTA (JSON)');
    parts.push('{ "narrativa": "...", "fimDeTurno": false, "solicitaDados": { "solicita": false, "tipo": "d20", "teste": "", "dificuldade": "" }, "combate": null, "acoes": [] }');
    return parts.join('\n');
  }, [nome, personalidade, tom_narrativo, regras_especiais]);

  const InfoRow = ({ label, value, fallback = 'Nao definido' }) => (
    <div className="flex items-center justify-between">
      <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{label}:</span>
      <span className={`font-modern text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
        {value || fallback}
      </span>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {imagem ? (
            <img
              src={imagem}
              alt={nome}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/40 text-purple-400'
            }`}>
              <Crown size={22} />
            </div>
          )}
          <div>
            <h1 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {nome}
            </h1>
            <p className={`text-sm font-modern mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Detalhes do mestre narrador
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={ROUTES.MESTRES}>
            <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
              isLight
                ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
            }`}>
              <ArrowLeft size={16} />
              Voltar
            </button>
          </Link>
          <button
            onClick={() => navigate(generateRoute.editarMestre(id))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
          >
            <Pencil size={16} />
            Editar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RPGCard className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {imagem && (
                    <img
                      src={imagem}
                      alt={nome}
                      className="w-16 h-16 rounded-xl object-cover shadow-lg"
                    />
                  )}
                  <div>
                    <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-1`}>
                      {nome}
                    </h2>
                    <p className="text-slate-400 font-modern text-sm">
                      ID: #{id}
                    </p>
                  </div>
                </div>
                {tom_narrativo && (
                  <Badge variant="purple">{tom_narrativo}</Badge>
                )}
              </div>

              {descricao && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <BookOpen size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Descricao
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {descricao}
                    </p>
                  </div>
                </div>
              )}

              {personalidade && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <Theater size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Personalidade
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {personalidade}
                    </p>
                  </div>
                </div>
              )}

              {regras_especiais && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <ScrollText size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Regras Especiais
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {regras_especiais}
                    </p>
                  </div>
                </div>
              )}

              <PromptPreviewSection promptPreview={promptPreview} isLight={isLight} />
            </div>
          </RPGCard>
        </div>

        <div className="space-y-6">
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Settings size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Configuracoes
            </h3>
            <div className="space-y-3">
              <InfoRow label="Modelo" value={modelo} />
              <InfoRow label="Temperatura" value={temperatura} />
              <InfoRow label="Max Tokens" value={max_tokens} />
              <InfoRow label="Tom Narrativo" value={tom_narrativo} />
              <InfoRow label="Voz (TTS)" value={voice_id ? (voiceName || voice_id) : null} fallback="Sem voz" />
            </div>
          </RPGCard>

          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Target size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Acoes
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(generateRoute.editarMestre(id))}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
              >
                <Pencil size={16} />
                Editar Mestre
              </button>
              <Link to={ROUTES.MESTRES} className="block">
                <button className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}>
                  <ArrowLeft size={16} />
                  Voltar aos Mestres
                </button>
              </Link>
            </div>
          </RPGCard>
        </div>
      </div>
    </div>
  );
};

export default VerMestreView;
