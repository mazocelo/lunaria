import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { editarTemaViewModel } from '../../../viewmodels/Temas';
import { useTheme } from '../../../contexts/theme.jsx';
import { Palette, Sparkles, Loader2 } from 'lucide-react';
import { ROUTES } from '../../../routes.jsx';

const NovoTemaView = () => {
  const vm = useViewModel(editarTemaViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => { vm.reset(); return () => vm.clearError(); }, []);

  const handleSubmit = async (e) => { e.preventDefault(); const r = await vm.criarTema(); if (r.success) navigate(ROUTES.TEMAS); };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Palette size={32} className="text-white" /></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Criar Novo Tema</h1>
        <p className="text-slate-400 font-modern">Adicione um novo tema ao catalogo</p>
      </div>
      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {vm.error && (<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"><div className="flex items-start space-x-3"><div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-sm">!</span></div><div><div className="font-semibold text-red-400 font-modern">Erro</div><p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p></div></div></div>)}
        <InputSimples label="Nome" name="nome" value={vm.nome} onChange={e => vm.setField('nome', e.target.value)} placeholder="Nome do tema" required />
        <div><label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Descricao</label><textarea name="descricao" value={vm.descricao} onChange={e => vm.setField('descricao', e.target.value)} placeholder="Descricao do tema..." rows={3} className={`w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`} /></div>
        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={() => navigate(ROUTES.TEMAS)} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={vm.saving} className="flex-1">{vm.saving ? (<div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Criando...</span></div>) : (<div className="flex items-center space-x-2"><Sparkles size={16} /><span>Criar Tema</span></div>)}</Button>
        </div>
      </form>
    </div>
  );
};

export default NovoTemaView;
