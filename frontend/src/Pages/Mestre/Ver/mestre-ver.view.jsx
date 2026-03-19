import React, { useState } from 'react';
import {
  Crown, BookOpen, Theater, ScrollText, Settings, Terminal, Volume2,
  ChevronDown, ChevronUp, Copy, Check,
} from 'lucide-react';
import { CatalogDetailLayout, Badge } from '../../../components/shared';

// PAGE-SPECIFIC: Prompt preview builder
const buildPromptPreview = ({ nome, personalidade, tom_narrativo, regras_especiais }) => [
  'Voce e um Mestre de RPG envolvente e criativo. Narre uma aventura textual interativa em portugues brasileiro.',
  nome && `Seu nome como Mestre e "${nome}".`,
  personalidade && `PERSONALIDADE: ${personalidade}`,
  tom_narrativo && `TOM NARRATIVO: ${tom_narrativo}`,
  regras_especiais && `REGRAS ESPECIAIS: ${regras_especiais}`,
  '',
  'TEMAS DA CAMPANHA: [definidos pela historia]',
  'PERSONAGENS JOGANDO: [definidos na sessao]',
  '',
  '## REGRAS FUNDAMENTAIS',
  '1. Reaja com criatividade e coerencia a cada acao do jogador',
  '2. Descreva ambiente, efeitos e desdobramentos narrativos',
  '3. Nunca tome decisoes pelo personagem - apenas descreva consequencias',
  '4. Mantenha imersao, suspense e ritmo adequado aos temas',
  '5. SEMPRE responda em JSON valido',
  '',
  '## ROLAGEM DE DADOS',
  'Solicite rolagem quando a acao for ARRISCADA, INCERTA ou de COMBATE (~30-40% das acoes).',
  'Testes: Forca, Destreza, Constituicao, Inteligencia, Agilidade, Carisma, Atletismo, Intimidacao, Percepcao, Furtividade, etc.',
  'Dificuldades: Muito Facil | Facil | Media | Dificil | Muito Dificil | Quase Impossivel',
  '',
  '## FORMATO DE RESPOSTA (JSON)',
  '{ "narrativa": "...", "fimDeTurno": false, "solicitaDados": { "solicita": false, "tipo": "d20", "teste": "", "dificuldade": "" }, "combate": null, "acoes": [] }',
].filter(v => v !== false).join('\n');

// PAGE-SPECIFIC: Collapsible prompt preview with copy-to-clipboard
const PromptPreviewSection = ({ promptPreview, isLight }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(promptPreview); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  const lt = isLight;
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className={`w-full text-sm font-fantasy font-bold flex items-center gap-2 cursor-pointer transition-colors ${lt ? 'text-slate-700 hover:text-purple-600' : 'text-slate-200 hover:text-purple-300'}`}>
        Prompt do Sistema
        <span className="ml-auto">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      {expanded && (
        <div className="relative mt-3">
          <button onClick={handleCopy} className={`absolute top-3 right-3 p-1.5 rounded-md transition-all cursor-pointer ${lt ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-600 text-slate-400'}`} title="Copiar prompt">
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <div className={`p-4 rounded-lg overflow-auto max-h-96 ${lt ? 'bg-slate-100 border border-slate-200' : 'bg-slate-900/80 border border-slate-600'}`}>
            <pre className={`font-mono text-xs leading-relaxed whitespace-pre-wrap break-words ${lt ? 'text-slate-700' : 'text-slate-300'}`}>{promptPreview}</pre>
          </div>
          <p className={`text-xs mt-2 font-modern ${lt ? 'text-slate-400' : 'text-slate-500'}`}>
            Previa do prompt enviado a IA. Temas e personagens sao adicionados dinamicamente na sessao.
          </p>
        </div>
      )}
    </div>
  );
};

// MAIN VIEW
const VerMestreView = ({
  id, mestre, loading, error, isLight, voiceName,
  clearError, navigate, generateRoute,
}) => {
  if (loading || error || !mestre) {
    return (
      <CatalogDetailLayout
        loading={loading}
        loadingText="Carregando mestre..."
        error={error || (!loading && !mestre ? 'Mestre nao encontrado' : undefined)}
        icon={Crown}
        title=""
        onBack={() => navigate(-1)}
        onEdit={() => navigate(generateRoute.editarMestre(id))}
      />
    );
  }

  const m = mestre;
  const tags = Array.isArray(m.tags) ? m.tags : [];
  const promptPreview = buildPromptPreview({
    nome: m.nome, personalidade: m.personalidade,
    tom_narrativo: m.tom_narrativo, regras_especiais: m.regras_especiais,
  });

  const voiceProviderLabel = m.voice_provider === 'cartesia' ? 'Cartesia'
    : m.voice_provider === 'opensource' ? 'Open Source' : 'ElevenLabs';

  // -- Badges ----------------------------------------------------------
  const badges = [
    <Badge key="model" variant="slate">{m.modelo || 'Padrao'}</Badge>,
    m.voice_id && (
      <Badge key="voice" variant="cyan">{voiceProviderLabel}</Badge>
    ),
    ...tags.slice(0, 3).map((tag) => (
      <Badge key={tag} variant="purple">{tag}</Badge>
    )),
    tags.length > 3 && (
      <Badge key="more-tags" variant="purple">+{tags.length - 3}</Badge>
    ),
  ].filter(Boolean);

  // -- Sections --------------------------------------------------------
  const sections = [];

  if (m.descricao) {
    sections.push({
      title: 'Descricao',
      icon: BookOpen,
      color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{m.descricao}</p>,
    });
  }

  if (m.personalidade) {
    sections.push({
      title: 'Personalidade',
      icon: Theater,
      color: '#8b5cf6',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{m.personalidade}</p>,
    });
  }

  if (m.regras_especiais) {
    sections.push({
      title: 'Regras Especiais',
      icon: ScrollText,
      color: '#ef4444',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{m.regras_especiais}</p>,
    });
  }

  sections.push({
    title: 'Preview do Prompt',
    icon: Terminal,
    color: '#64748b',
    content: <PromptPreviewSection promptPreview={promptPreview} isLight={isLight} />,
  });

  // -- Stats (sidebar) -------------------------------------------------
  const stats = [
    { icon: Settings, label: 'Modelo', content: m.modelo || 'Padrao' },
    { icon: Settings, label: 'Temperatura', content: m.temperatura ?? 'Nao definido' },
    { icon: Settings, label: 'Max Tokens', content: m.max_tokens ?? 'Nao definido' },
    { icon: BookOpen, label: 'Tom Narrativo', content: m.tom_narrativo || 'Nao definido' },
    {
      icon: Volume2,
      label: 'Voz (TTS)',
      content: m.voice_id
        ? `${voiceName || m.voice_id} (${voiceProviderLabel})`
        : 'Sem voz',
    },
  ];

  return (
    <CatalogDetailLayout
      title={m.nome}
      image={m.imagem}
      icon={Crown}
      accentColor="#f59e0b"
      badges={badges}
      sections={sections}
      stats={stats}
      sidebarTitle="Configuracoes"
      sidebarIcon={Settings}
      onBack={() => navigate(-1)}
      onEdit={() => navigate(generateRoute.editarMestre(id))}
    />
  );
};

export default VerMestreView;
