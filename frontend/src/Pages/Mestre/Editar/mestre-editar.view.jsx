import React from 'react';
import { Crown, Save, Loader2 } from 'lucide-react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';

const EditarMestreView = ({
  nome, descricao, personalidade, modelo, temperatura,
  max_tokens, tom_narrativo, regras_especiais, imagem,
  loading, saving, error, isLight,
  setField, handleSubmit, handleCancel, clearError,
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

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <Crown size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Editar Mestre
        </h1>
        <p className="text-slate-400 font-modern">
          Atualize as configuracoes do mestre narrador
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
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Rapido)</option>
                  <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Ultra-rapido)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Avancado)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </optgroup>
                <optgroup label="Groq (Llama)">
                  <option value="openai/gpt-oss-120b">GPT OSS 120B (Recomendado)</option>
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                  <option value="openai/gpt-oss-20b">GPT OSS 20B (Rapido)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
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
            <InputSimples
              label="Max Tokens"
              name="max_tokens"
              type="number"
              value={max_tokens}
              onChange={e => setField('max_tokens', e.target.value)}
              min={100}
              max={32000}
            />
          </div>
        </div>

        <InputSimples
          label="URL da Imagem"
          name="imagem"
          value={imagem}
          onChange={e => setField('imagem', e.target.value)}
          placeholder="https://exemplo.com/imagem.png"
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
                <span>Salvando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save size={16} />
                <span>Salvar Mestre</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarMestreView;
