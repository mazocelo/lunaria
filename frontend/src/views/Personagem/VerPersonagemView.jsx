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
  const atributos = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];

  useEffect(() => {
    if (id) {
      vm.loadPersonagem(id);
    }
    vm.clearError();
  }, [id]);

  if (vm.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="card-rpg max-w-md w-full">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse-slow">
                <span className="text-3xl">⚔️</span>
              </div>
              <div className="text-slate-300 font-modern text-lg">Carregando personagem...</div>
              <div className="text-slate-400 font-modern text-sm mt-2">Preparando sua aventura</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vm.personagemAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="card-rpg max-w-md w-full text-center py-16">
          <div className="w-24 h-24 gradient-primary rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h3 className={`text-xl font-semibold mb-3 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            Personagem não encontrado
          </h3>
          <p className="text-slate-400 font-modern mb-8 leading-relaxed">
            O personagem que você está procurando não existe ou foi removido.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/personagens')}
            className="px-8 py-3"
          >
            ← Voltar para Personagens
          </Button>
        </div>
      </div>
    );
  }

  const personagem = vm.personagemAtual;

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header Hero */}
      <div className={`relative overflow-hidden rounded-2xl mb-8 ${isLight ? 'bg-gradient-to-br from-slate-50 to-slate-100' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10"></div>
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isLight ? 'bg-white shadow-lg' : 'bg-slate-700 shadow-xl'}`}>
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h1 className={`text-4xl lg:text-5xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
                    {personagem.nome}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1 rounded-full text-sm font-modern font-semibold ${isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-300'}`}>
                      Nível {personagem.nivel || 1}
                    </span>
                    <span className="text-slate-400 font-modern text-sm">
                      ID: #{personagem.id}
                    </span>
                  </div>
                </div>
              </div>
              <p className={`text-lg font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Detalhes do herói épico
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/personagens')}
                className="px-6 py-3"
              >
                ← Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate(`/editar-personagem/${personagem.id}`)}
                className="px-6 py-3"
              >
                ✏️ Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column - Main Info */}
        <div className="xl:col-span-3 space-y-8">
          {/* Basic Info Card */}
          <RPGCard className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <div className="text-sm text-slate-400 font-modern">Classe</div>
                    <div className={`text-xl font-bold font-fantasy ${isLight ? 'text-slate-700' : 'text-white'}`}>
                      {personagem.classe || 'Aventureiro'}
                    </div>
                  </div>
                </div>
              </div>
              <div className={`p-6 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏃</span>
                  <div>
                    <div className="text-sm text-slate-400 font-modern">Raça</div>
                    <div className={`text-xl font-bold font-fantasy ${isLight ? 'text-slate-700' : 'text-white'}`}>
                      {personagem.raca || 'Humano'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Atributos */}
            <div>
              <h3 className={`text-2xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                ⚔️ Atributos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {atributos.map((atributo) => (
                  <div key={atributo} className={`p-4 rounded-xl text-center ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                    <div className="text-sm text-slate-400 font-modern mb-2">
                      {atributo.charAt(0).toUpperCase() + atributo.slice(1)}
                    </div>
                    <div className={`text-3xl font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                      {personagem?.[atributo] || 0}
                    </div>
                    <div className="text-xs text-slate-400 font-modern">
                      Mod: {Math.floor((Number(personagem?.[atributo] || 0) - 10) / 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RPGCard>

          {/* Background Card */}
          <RPGCard className="p-8">
            <h3 className={`text-2xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              📖 Background
            </h3>
            <div className={`p-6 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
              {personagem.background ? (
                <p className={`font-modern leading-relaxed text-lg ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {personagem.background}
                </p>
              ) : (
                <p className={`font-modern italic text-lg ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Background não definido
                </p>
              )}
            </div>
          </RPGCard>

          {/* Vantagens e Desvantagens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vantagens */}
            <RPGCard className="p-8">
              <h3 className={`text-2xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                ⭐ Vantagens
              </h3>
              {personagem.vantagens && personagem.vantagens.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {personagem.vantagens.map((vantagem, i) => (
                    <span
                      key={i}
                      className={`px-4 py-2 rounded-full text-sm font-modern font-semibold ${isLight
                        ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg'
                        }`}
                    >
                      {vantagem.nome || vantagem}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={`p-6 rounded-xl text-center ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                  <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhuma vantagem definida
                  </p>
                </div>
              )}
            </RPGCard>

            {/* Desvantagens */}
            <RPGCard className="p-8">
              <h3 className={`text-2xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                ⚠️ Desvantagens
              </h3>
              {personagem.desvantagens && personagem.desvantagens.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {personagem.desvantagens.map((desvantagem, i) => (
                    <span
                      key={i}
                      className={`px-4 py-2 rounded-full text-sm font-modern font-semibold ${isLight
                        ? 'bg-red-100 text-red-800 border border-red-200 shadow-sm'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg'
                        }`}
                    >
                      {desvantagem.nome || desvantagem}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={`p-6 rounded-xl text-center ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                  <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhuma desvantagem definida
                  </p>
                </div>
              )}
            </RPGCard>
          </div>

          {/* Equipamentos */}
          <RPGCard className="p-8">
            <h3 className={`text-2xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              🛡️ Equipamentos
            </h3>
            <div className={`p-6 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
              {personagem.equipamentos ? (
                <p className={`font-modern leading-relaxed text-lg ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {personagem.equipamentos}
                </p>
              ) : (
                <p className={`font-modern italic text-lg ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nenhum equipamento definido
                </p>
              )}
            </div>
          </RPGCard>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <RPGCard className="p-6">
            <h3 className={`text-xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              💚 Status
            </h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    HP Atual
                  </span>
                  <span className="font-bold text-red-400 font-modern text-lg">
                    {personagem.hp || 100}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((personagem.hp || 100) / (personagem.hp_maximo || 100)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/50">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  HP Máximo:
                </span>
                <span className="font-bold text-green-400 font-modern">
                  {personagem.hp_maximo || 100}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/50">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Classe de Armadura:
                </span>
                <span className="font-bold text-cyan-400 font-modern">
                  {10 + Math.floor((Number(personagem?.destreza || 10) - 10) / 2)}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* System Info Card */}
          <RPGCard className="p-6">
            <h3 className={`text-xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              ⚙️ Informações
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/50">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Criado em:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(personagem.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/50">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Última atualização:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(personagem.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* Actions Card */}
          <RPGCard className="p-6">
            <h3 className={`text-xl font-bold font-fantasy mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              🎯 Ações
            </h3>
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={() => navigate(`/editar-personagem/${personagem.id}`)}
                className="w-full py-3"
              >
                ✏️ Editar Personagem
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/personagens')}
                className="w-full py-3"
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