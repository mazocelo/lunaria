import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import DesvantagemViewModel from '../../viewmodels/Desvantagens/DesvantagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import { RPGCard } from '../../components';
import Button from '../../components/form/button';
import InputSimples from '../../components/form/inputSimples';

const NovaDesvantagemView = () => {
  const vm = useViewModel(new DesvantagemViewModel());
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.reset();
    // Define custo inicial como negativo para desvantagem
    vm.setCusto(-1);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Garante que o custo seja negativo
    if (vm.custo >= 0) {
      vm.setCusto(-1);
    }
    
    await vm.criarVantagemDesvantagem((response) => {
      navigate('/desvantagens', { 
        state: { 
          message: 'Desvantagem criada com sucesso!',
          type: 'success'
        }
      });
    });
  };

  const handleCancel = () => {
    navigate('/desvantagens');
  };

  const handleTipoChange = (e) => {
    const value = e.target.value;
    if (value) {
      const tipos = vm.tipo.filter(t => t !== value);
      if (!vm.tipo.includes(value)) {
        vm.setTipo([...tipos, value]);
      }
    }
  };

  const handleElementoChange = (e) => {
    const value = e.target.value;
    if (value) {
      const elementos = vm.elemento.filter(e => e !== value);
      if (!vm.elemento.includes(value)) {
        vm.setElemento([...elementos, value]);
      }
    }
  };

  const removeTipo = (tipo) => {
    vm.setTipo(vm.tipo.filter(t => t !== tipo));
  };

  const removeElemento = (elemento) => {
    vm.setElemento(vm.elemento.filter(e => e !== elemento));
  };

  const getCustoColor = (custo) => {
    if (custo < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Criar Nova Desvantagem
        </h1>
        <p className="text-slate-400 font-modern">
          Defina as características e efeitos da nova desvantagem
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <RPGCard className="p-6">
          {/* Informações Básicas */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Nome *
                </label>
                <InputSimples
                  value={vm.nome}
                  onChange={(e) => vm.setNome(e.target.value)}
                  placeholder="Ex: Fragilidade, Medo de Altura..."
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Custo em Pontos *
                </label>
                <InputSimples
                  type="number"
                  value={Math.abs(vm.custo)}
                  onChange={(e) => {
                    const valor = parseInt(e.target.value);
                    vm.setCusto(valor > 0 ? -valor : -1);
                  }}
                  placeholder="1"
                  min="1"
                  max="20"
                  className="w-full"
                  required
                />
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                  <span className={getCustoColor(vm.custo)}>
                    Desvantagem - Custo negativo
                  </span> - Quanto mais alto, mais severa a desvantagem
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                Descrição
              </label>
              <textarea
                value={vm.descricao}
                onChange={(e) => vm.setDescricao(e.target.value)}
                placeholder="Descreva os efeitos e características desta desvantagem..."
                className={`w-full p-3 rounded-lg border resize-none h-24 font-modern ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500' 
                    : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                maxLength={1000}
              />
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                {vm.descricao.length}/1000 caracteres
              </p>
            </div>
          </div>

          {/* Categorias e Elementos */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Categorias e Elementos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Tipos/Categorias
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    onChange={handleTipoChange}
                    className={`px-3 py-2 rounded border text-sm font-modern ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-800' 
                        : 'bg-slate-700 border-slate-600 text-white'
                    }`}
                  >
                    <option value="">Adicionar tipo...</option>
                    <option value="combate">Combate</option>
                    <option value="magia">Magia</option>
                    <option value="físico">Físico</option>
                    <option value="psicológico">Psicológico</option>
                    <option value="social">Social</option>
                    <option value="arcano">Arcano</option>
                    <option value="precisão">Precisão</option>
                    <option value="defeito">Defeito</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vm.tipo.map((tipo, i) => (
                    <span 
                      key={i}
                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                        isLight 
                          ? 'bg-cyan-100 text-cyan-800' 
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {tipo}
                      <button
                        type="button"
                        onClick={() => removeTipo(tipo)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Elementos
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    onChange={handleElementoChange}
                    className={`px-3 py-2 rounded border text-sm font-modern ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-800' 
                        : 'bg-slate-700 border-slate-600 text-white'
                    }`}
                  >
                    <option value="">Adicionar elemento...</option>
                    <option value="fogo">Fogo</option>
                    <option value="água">Água</option>
                    <option value="terra">Terra</option>
                    <option value="ar">Ar</option>
                    <option value="luz">Luz</option>
                    <option value="sombra">Sombra</option>
                    <option value="arcano">Arcano</option>
                    <option value="sagrado">Sagrado</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vm.elemento.map((elemento, i) => (
                    <span 
                      key={i}
                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                        isLight 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {elemento}
                      <button
                        type="button"
                        onClick={() => removeElemento(elemento)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Configurações Avançadas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Nível
                </label>
                <InputSimples
                  type="number"
                  value={vm.nivel}
                  onChange={(e) => vm.setNivel(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="10"
                  className="w-full"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Usar (vezes por dia)
                </label>
                <InputSimples
                  type="number"
                  value={vm.usar}
                  onChange={(e) => vm.setUsar(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="10"
                  className="w-full"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Dano Base
                </label>
                <InputSimples
                  value={vm.dano_base}
                  onChange={(e) => vm.setDanoBase(e.target.value)}
                  placeholder="Ex: 1d6, 2d4..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Bônus e Restrições */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Penalidades e Restrições
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Penalidades (JSON)
                </label>
                <textarea
                  value={JSON.stringify(vm.bonus, null, 2)}
                  onChange={(e) => {
                    try {
                      vm.setBonus(JSON.parse(e.target.value));
                    } catch (error) {
                      // Ignora erros de JSON inválido
                    }
                  }}
                  placeholder='{"forca": -2, "constituicao": -1}'
                  className={`w-full p-3 rounded-lg border resize-none h-32 font-modern ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500' 
                      : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                  Penalidades de atributos ou outras características
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Restrições (JSON)
                </label>
                <textarea
                  value={JSON.stringify(vm.restricao, null, 2)}
                  onChange={(e) => {
                    try {
                      vm.setRestricao(JSON.parse(e.target.value));
                    } catch (error) {
                      // Ignora erros de JSON inválido
                    }
                  }}
                  placeholder='{"nivel_maximo": 5, "altura_minima": 3}'
                  className={`w-full p-3 rounded-lg border resize-none h-32 font-modern ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500' 
                      : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                  Limitações ou restrições impostas
                </p>
              </div>
            </div>
          </div>

          {/* Efeitos e Requisitos */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Efeitos e Requisitos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Efeitos (JSON)
                </label>
                <textarea
                  value={JSON.stringify(vm.efeito, null, 2)}
                  onChange={(e) => {
                    try {
                      vm.setEfeito(JSON.parse(e.target.value));
                    } catch (error) {
                      // Ignora erros de JSON inválido
                    }
                  }}
                  placeholder='{"dano_reduzido": -2, "impedir_magia": true}'
                  className={`w-full p-3 rounded-lg border resize-none h-32 font-modern ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500' 
                      : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                  Efeitos negativos da desvantagem
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-white'} font-modern`}>
                  Requisitos (JSON)
                </label>
                <textarea
                  value={JSON.stringify(vm.requisitos, null, 2)}
                  onChange={(e) => {
                    try {
                      vm.setRequisitos(JSON.parse(e.target.value));
                    } catch (error) {
                      // Ignora erros de JSON inválido
                    }
                  }}
                  placeholder='{"inteligencia": 8, "nivel": 1}'
                  className={`w-full p-3 rounded-lg border resize-none h-32 font-modern ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500' 
                      : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                  Atributos ou condições necessárias
                </p>
              </div>
            </div>
          </div>

          {/* Mensagem de erro */}
          {vm.error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className={`${isLight ? 'text-slate-800' : 'text-white'} text-sm`}>!</span>
                </div>
                <div>
                  <div className="font-semibold text-red-400 font-modern">Erro</div>
                  <p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={vm.loading}
              className="w-full sm:w-auto"
            >
              {vm.loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Criando...
                </>
              ) : (
                '⚠️ Criar Desvantagem'
              )}
            </Button>
          </div>
        </RPGCard>
      </form>
    </div>
  );
};

export default NovaDesvantagemView; 