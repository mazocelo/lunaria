import React, { useRef, useState } from 'react';
import { Crown, Sparkles, Loader2, Volume2 } from 'lucide-react';
import { apiClient } from '../../../services/ApiClient.js';
import InputSimples from '../../../components/form/inputSimples';
import ImageGenerator from '../../../components/form/ImageGenerator';
import Button from '../../../components/form/button';

const EMOTION_OPTIONS = [
  { value: '', label: 'Nenhuma' },
  { value: 'positivity:high', label: 'Animado' },
  { value: 'sadness:low', label: 'Calmo' },
  { value: 'sadness:high', label: 'Triste' },
  { value: 'surprise:high', label: 'Surpreso' },
  { value: 'curiosity:high', label: 'Curioso' },
  { value: 'anger:low', label: 'Serio' },
];

const PROVIDER_LABELS = { elevenlabs: 'ElevenLabs', cartesia: 'Cartesia' };

const VoiceSelector = ({ voice_id, voice_provider, voices, providers, loadingVoices, isLight, setField }) => {
  const previewAudioRef = useRef(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [emotion, setEmotion] = useState('');

  const handlePreview = async (voiceId) => {
    if (!voiceId || loadingPreview) return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setLoadingPreview(true);
    try {
      const body = { voiceId, provider: voice_provider };
      if (voice_provider === 'cartesia' && emotion) body.emotion = emotion;
      const response = await apiClient.post('/tts/preview', body, { responseType: 'blob' });
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      previewAudioRef.current = audio;
      await audio.play();
    } catch {}
    setLoadingPreview(false);
  };

  if (!providers || providers.length === 0) return null;

  const selectClass = `flex-1 px-4 py-3 rounded-lg font-modern transition-all duration-200 ${
    isLight
      ? 'bg-slate-100 border border-slate-300 text-slate-800 focus:border-purple-500'
      : 'bg-slate-800/50 border border-slate-600 text-white focus:border-purple-500'
  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`;

  const selectedVoice = voices.find(v => v.voice_id === voice_id);

  return (
    <div className={`p-4 rounded-lg space-y-4 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/30 border border-slate-700'}`}>
      <h3 className={`text-sm font-semibold font-modern flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
        <Volume2 size={16} className="text-purple-400" />
        Voz do Mestre (TTS)
      </h3>

      {providers.length > 1 && (
        <div className="flex gap-2">
          {providers.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setField('voice_provider', p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-modern font-semibold transition-all cursor-pointer ${
                voice_provider === p
                  ? 'bg-purple-500 text-white'
                  : isLight
                    ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {PROVIDER_LABELS[p] || p}
            </button>
          ))}
        </div>
      )}

      {loadingVoices ? (
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-purple-400" />
          <span className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Carregando vozes...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <select value={voice_id} onChange={e => setField('voice_id', e.target.value)} className={selectClass}>
              <option value="">Sem voz</option>
              {voices.map(v => (
                <option key={v.voice_id} value={v.voice_id}>
                  {v.name}{v.category ? ` (${v.category})` : ''}
                </option>
              ))}
            </select>
            {selectedVoice && (
              <button
                type="button"
                onClick={() => handlePreview(voice_id)}
                disabled={loadingPreview}
                className="px-3 py-3 rounded-lg font-modern text-sm font-semibold transition-all cursor-pointer bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPreview ? <Loader2 size={16} className="animate-spin" /> : 'Preview'}
              </button>
            )}
          </div>

          {voice_provider === 'cartesia' && selectedVoice && (
            <div>
              <label className={`text-xs font-modern mb-1 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Emocao (Cartesia)
              </label>
              <select value={emotion} onChange={e => setEmotion(e.target.value)} className={selectClass}>
                {EMOTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {selectedVoice && (
            <p className={`text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              As mensagens do mestre poderao ser ouvidas com esta voz durante o jogo.
            </p>
          )}
        </>
      )}
    </div>
  );
};

const NovaMestreView = ({
  nome, descricao, personalidade, modelo, temperatura,
  max_tokens, tom_narrativo, regras_especiais, imagem,
  voice_id, voice_provider, voices, providers, loadingVoices,
  saving, error, isLight,
  setField, handleSubmit, handleCancel, clearError,
}) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <Crown size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Criar Novo Mestre
        </h1>
        <p className="text-slate-400 font-modern">
          Configure um novo mestre narrador para suas aventuras
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <InputSimples
          label="Nome do Mestre"
          name="nome"
          value={nome}
          onChange={e => setField('nome', e.target.value)}
          placeholder="Ex: Mestre Arcano, Narrador das Sombras..."
          required
        />

        <div>
          <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            Descricao
          </label>
          <textarea
            name="descricao"
            value={descricao}
            onChange={e => setField('descricao', e.target.value)}
            placeholder="Descreva o mestre e seu estilo de narracao..."
            rows={3}
            className={`w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${
              isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          />
        </div>

        <div>
          <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            Personalidade
          </label>
          <textarea
            name="personalidade"
            value={personalidade}
            onChange={e => setField('personalidade', e.target.value)}
            placeholder="Defina a personalidade e comportamento do mestre..."
            rows={3}
            className={`w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${
              isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          />
        </div>

        <InputSimples
          label="Tom Narrativo"
          name="tom_narrativo"
          value={tom_narrativo}
          onChange={e => setField('tom_narrativo', e.target.value)}
          placeholder="Ex: Sombrio, Epico, Comico, Misterioso..."
        />

        <div>
          <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            Regras Especiais
          </label>
          <textarea
            name="regras_especiais"
            value={regras_especiais}
            onChange={e => setField('regras_especiais', e.target.value)}
            placeholder="Regras ou instrucoes especiais para o mestre seguir..."
            rows={3}
            className={`w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${
              isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          />
        </div>

        <div className={`p-4 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/30 border border-slate-700'}`}>
          <h3 className={`text-sm font-semibold font-modern mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            Configuracoes Tecnicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                Modelo de IA
              </label>
              <select
                name="modelo"
                value={modelo}
                onChange={e => setField('modelo', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 ${
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-800 focus:border-purple-500'
                    : 'bg-slate-800/50 border border-slate-600 text-white focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              >
                <optgroup label="Google Gemini">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Economico)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Legado)</option>
                </optgroup>
                <optgroup label="Groq (Llama)">
                  <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                  <option value="openai/gpt-oss-20b">GPT OSS 20B (Rapido)</option>
                  <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout (Avancado)</option>
                </optgroup>
                <optgroup label="Anthropic">
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Premium)</option>
                </optgroup>
              </select>
            </div>
            <InputSimples
              label="Temperatura"
              name="temperatura"
              type="number"
              value={temperatura}
              onChange={e => setField('temperatura', e.target.value)}
              min={0}
              max={2}
              step={0.1}
            />
          </div>
        </div>

        <ImageGenerator
          imageUrl={imagem}
          onImageGenerated={(url) => setField('imagem', url)}
          entityType="mestre"
          entityData={{ nome, personalidade, tom_narrativo }}
          isLight={isLight}
        />

        <VoiceSelector
          voice_id={voice_id}
          voice_provider={voice_provider}
          voices={voices}
          providers={providers}
          loadingVoices={loadingVoices}
          isLight={isLight}
          setField={setField}
        />

        <div className="flex space-x-4 pt-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex-1"
            type="button"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Criando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles size={16} />
                <span>Criar Mestre</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovaMestreView;
