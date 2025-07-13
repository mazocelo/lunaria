import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/form/button';
import RPGCard from '../../components/RPGCard';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { personagemViewModel } from '../../viewmodels/Personagens/PersonagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';

const VerPersonagemView = () => {
  const vm = useViewModel(personagemViewModel);
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    if (id) {
      vm.loadPersonagem(id);
    }
    vm.clearError();
  }, [id]);

  if (vm.loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <span className="text-2xl">⚔️</span>
              </div>
              <div className="text-slate-300 font-modern">Carregando personagem...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vm.personagemAtual) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg text-center py-12">
          <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            Personagem não encontrado
          </h3>
          <p className="text-slate-400 font-modern mb-6">
            O personagem que você está procurando não existe.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/personagens')}
          >
            Voltar para Personagens
          </Button>
        </div>
      </div>
    );
  }

  const personagem = vm.personagemAtual;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            {personagem.nome}
          </h1>
          <p className="text-slate-400 font-modern">
            Detalhes do herói épico
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/personagens')}
          >
            ← Voltar
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/editar-personagem/${personagem.id}`)}
          >
            ✏️ Editar
          </Button>
        </div>
      </div>

      {/* Grid de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card principal */}
        <div className="lg:col-span-2">
          <RPGCard className="p-6">
            <div className="space-y-6">
              {/* Nome e ID */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-1`}>
                    {personagem.nome}
                  </h2>
                  <p className="text-slate-400 font-modern text-sm">
                    ID: #{personagem.id}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-modern ${
                  isLight 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  Nível {personagem.nivel || 1}
                </div>
              </div>

              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200' 
                    : 'bg-slate-800/50 border border-slate-700'
                }`}>
                  <div className="text-sm text-slate-400 font-modern mb-1">Classe</div>
                  <div className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    {personagem.classe || 'Aventureiro'}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200' 
                    : 'bg-slate-800/50 border border-slate-700'
                }`}>
                  <div className="text-sm text-slate-400 font-modern mb-1">Raça</div>
                  <div className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    {personagem.raca || 'Humano'}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200' 
                    : 'bg-slate-800/50 border border-slate-700'
                }`}>
                  <div className="text-sm text-slate-400 font-modern mb-1">Profissão</div>
                  <div className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    {personagem.profissao || 'Aventureiro'}
                  </div>
                </div>
              </div>

              {/* Atributos */}
              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  ⚔️ Atributos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(personagem.atributos || {}).map(([atributo, valor]) => (
                    <div key={atributo} className={`p-3 rounded-lg ${
                      isLight 
                        ? 'bg-slate-50 border border-slate-200' 
                        : 'bg-slate-800/50 border border-slate-700'
                    }`}>
                      <div className="text-sm text-slate-400 font-modern mb-1">
                        {atributo.charAt(0).toUpperCase() + atributo.slice(1)}
                      </div>
                      <div className={`text-xl font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                        {valor}
                      </div>
                      <div className="text-xs text-slate-400">
                        Mod: {Math.floor((Number(valor) - 10) / 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  📖 Background
                </h3>
                <div className={`p-4 rounded-lg ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200' 
                    : 'bg-slate-800/50 border border-slate-700'
                }`}>
                  {personagem.background ? (
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {personagem.background}
                    </p>
                  ) : (
                    <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Background não definido
                    </p>
                  )}
                </div>
              </div>

              {/* Habilidades */}
              {personagem.habilidades && personagem.habilidades.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    🎯 Habilidades
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {personagem.habilidades.map((habilidade, i) => (
                      <span 
                        key={i} 
                        className={`px-3 py-1 rounded-full text-sm font-modern ${
                          isLight 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {habilidade}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipamentos */}
              {personagem.equipamentos && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    🛡️ Equipamentos
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isLight 
                      ? 'bg-slate-50 border border-slate-200' 
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {personagem.equipamentos}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </RPGCard>
        </div>

        {/* Sidebar com informações adicionais */}
        <div className="space-y-6">
          {/* Status */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              💚 Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  HP Atual:
                </span>
                <span className={`font-semibold text-red-400 font-modern`}>
                  {personagem.hp || 100}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  HP Máximo:
                </span>
                <span className={`font-semibold text-green-400 font-modern`}>
                  {personagem.hp_maximo || 100}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Classe de Armadura:
                </span>
                <span className={`font-semibold text-cyan-400 font-modern`}>
                  {10 + Math.floor((Number(personagem.atributos?.destreza || 10) - 10) / 2)}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* Informações do sistema */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              ⚙️ Informações
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Criado em:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(personagem.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Última atualização:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(personagem.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* Ações */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              🎯 Ações
            </h3>
            <div className="space-y-3">
              <Button 
                variant="primary"
                onClick={() => navigate(`/editar-personagem/${personagem.id}`)}
                className="w-full"
              >
                ✏️ Editar Personagem
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/personagens')}
                className="w-full"
              >
                ← Voltar aos Personagens
              </Button>
            </div>
          </RPGCard>
        </div>
      </div>
    </div>
  );
};

export default VerPersonagemView; 