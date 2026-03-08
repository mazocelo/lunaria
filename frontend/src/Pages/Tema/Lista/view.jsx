import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/form/button';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { temaViewModel } from '../../../viewmodels/Temas';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';
import { PageHeader } from '../../../components/shared';
import { Palette, Plus, Pencil, Trash2 } from 'lucide-react';

const TemaListaView = () => {
  const vm = useViewModel(temaViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => { vm.loadTemas(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este tema?')) {
      await vm.deleteTema(id);
    }
  };

  if (vm.loading) {
    return (<div className="animate-fade-in"><div className="card-rpg"><div className="flex items-center justify-center py-12"><div className="text-center"><div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow"><Palette size={24} className="text-white" /></div><div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando temas...</div></div></div></div></div>);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Temas"
        subtitle={`${vm.temas.length} temas cadastrados`}
        icon={Palette}
        actions={
          <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer" onClick={() => navigate(ROUTES.NOVO_TEMA)}>
            <Plus size={18} />
            <span>Novo Tema</span>
          </button>
        }
      />

      {vm.error && (<div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">{vm.error}</div>)}
      <div className="grid gap-4">
        {vm.temas.map(tema => (
          <div key={tema.id} className={`card-rpg p-4 flex items-center justify-between`}>
            <div>
              <h3 className={`font-semibold font-modern ${isLight ? 'text-slate-800' : 'text-white'}`}>{tema.nome}</h3>
              {tema.descricao && <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{tema.descricao}</p>}
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={() => navigate(generateRoute.editarTema(tema.id))}>
                <span className="flex items-center gap-1"><Pencil size={14} /> Editar</span>
              </Button>
              <Button variant="ghost" onClick={() => handleDelete(tema.id)} className="text-red-400 hover:text-red-300">
                <span className="flex items-center gap-1"><Trash2 size={14} /> Excluir</span>
              </Button>
            </div>
          </div>
        ))}
        {vm.temas.length === 0 && (
          <div className={`text-center py-12 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-slate-800/60 text-slate-500">
              <Palette size={32} />
            </div>
            <p className="font-modern">Nenhum tema cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemaListaView;
