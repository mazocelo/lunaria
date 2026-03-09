import React from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { Palette, Save, Loader2 } from 'lucide-react';

const EditarTemaView = ({
  nome, descricao, loading, saving, error, isLight,
  setField, handleSubmit, handleCancel, clearError,
}) => {
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <Palette size={24} className="text-white" />
              </div>
              <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando tema...</div>
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
          <Palette size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Editar Tema</h1>
        <p className="text-slate-400 font-modern">Atualize os dados do tema</p>
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
        <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome do tema" required />
        <div>
          <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Descricao</label>
          <textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao do tema..." rows={3} className={`w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`} />
        </div>
        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Salvando...</span></div>
            ) : (
              <div className="flex items-center space-x-2"><Save size={16} /><span>Salvar Tema</span></div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarTemaView;
