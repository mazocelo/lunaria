import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/theme.jsx';
import { RPGCard } from '../../components';
import Button from '../../components/form/button';
import { RacaService } from '../../services/RacaService';
import { Raca } from '../../models/Raca';
import { ApiClient } from '../../services/ApiClient';

const VerRacaView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [raca, setRaca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRaca = async () => {
      try {
        setLoading(true);
        const apiClient = new ApiClient();
        const racaService = new RacaService(apiClient);
        const response = await racaService.getById(id);
        const racaData = Raca.fromApi(response);
        setRaca(racaData);
      } catch (error) {
        // Fallback com dados de exemplo
        const racaExemplo = {
          id: id,
          nome: 'Elfo',
          descricao: 'Ágil, com sentidos aguçados e afinidade com magia. Os elfos são conhecidos por sua graça natural, longevidade e conexão com a natureza. Eles possuem sentidos extraordinários e uma afinidade natural com magia arcana.',
          custo: 2,
          atributos_bonus: { agilidade: 2, inteligencia: 1, destreza: 1 },
          vantagens_iniciais: ['Visão Noturna', 'Imunidade a Veneno'],
          desvantagens_iniciais: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const racaData = Raca.fromApi(racaExemplo);
        setRaca(racaData);
        setError(`Erro ao carregar raça: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRaca();
    }
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCustoColor = (custo) => {
    if (custo > 0) return 'text-green-400';
    if (custo < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  if (loading) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-400 font-modern">Carregando raça...</span>
        </div>
      </div>
    );
  }

  if (!raca) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
            Raça não encontrada
          </h3>
          <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern mb-4`}>
            A raça que você está procurando não existe ou foi removida.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/racas')}
          >
            ← Voltar às Raças
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">🏹</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          {raca.nome}
        </h1>
        <p className="text-slate-400 font-modern">
          Detalhes da raça
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              📖 Descrição
            </h3>
            <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {raca.descricao}
            </p>
          </RPGCard>

          {/* Bônus de atributos */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              🎯 Bônus de Atributos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(raca.atributos_bonus || {}).map(([atributo, bonus]) => (
                <div key={atributo} className={`p-3 rounded-lg ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200' 
                    : 'bg-slate-800/50 border border-slate-700'
                }`}>
                  <div className="text-sm text-slate-400 font-modern mb-1">
                    {atributo.charAt(0).toUpperCase() + atributo.slice(1)}
                  </div>
                  <div className={`text-xl font-bold ${
                    bonus > 0 ? 'text-green-400' : bonus < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {bonus > 0 ? `+${bonus}` : bonus}
                  </div>
                </div>
              ))}
            </div>
          </RPGCard>

          {/* Vantagens e desvantagens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vantagens iniciais */}
            <RPGCard className="p-6">
              <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                ⭐ Vantagens Iniciais
              </h3>
              {raca.vantagens_iniciais && raca.vantagens_iniciais.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {raca.vantagens_iniciais.map((vantagem, i) => (
                    <span 
                      key={i} 
                      className={`px-3 py-1 rounded-full text-sm font-modern ${
                        isLight 
                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' 
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {vantagem}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nenhuma vantagem inicial
                </p>
              )}
            </RPGCard>

            {/* Desvantagens iniciais */}
            <RPGCard className="p-6">
              <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                ⚠️ Desvantagens Iniciais
              </h3>
              {raca.desvantagens_iniciais && raca.desvantagens_iniciais.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {raca.desvantagens_iniciais.map((desvantagem, i) => (
                    <span 
                      key={i} 
                      className={`px-3 py-1 rounded-full text-sm font-modern ${
                        isLight 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {desvantagem}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nenhuma desvantagem inicial
                </p>
              )}
            </RPGCard>
          </div>
        </div>

        {/* Sidebar com informações adicionais */}
        <div className="space-y-6">
          {/* Custo */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              💰 Custo
            </h3>
            <div className="text-center">
              <span className={`text-3xl font-bold ${getCustoColor(raca.custo)}`}>
                {raca.custo > 0 ? `+${raca.custo}` : raca.custo} pts
              </span>
              <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern mt-2`}>
                {raca.custo > 0 
                  ? 'Custa pontos para escolher' 
                  : raca.custo < 0 
                    ? 'Dá pontos extras ao escolher'
                    : 'Não afeta os pontos disponíveis'
                }
              </p>
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
                  {formatDate(raca.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Última atualização:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatDate(raca.updated_at)}
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
                onClick={() => navigate(`/editar-raca/${raca.id}`)}
                className="w-full"
              >
                ✏️ Editar Raça
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/racas')}
                className="w-full"
              >
                ← Voltar às Raças
              </Button>
            </div>
          </RPGCard>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className={`${isLight ? 'text-slate-800' : 'text-white'} text-sm`}>!</span>
            </div>
            <div>
              <div className="font-semibold text-red-400 font-modern">Aviso</div>
              <p className="text-red-300 text-sm font-modern mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerRacaView; 