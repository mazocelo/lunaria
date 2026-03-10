import React from 'react';
import LoadingSpinner from '../../LoadingSpinner';
import { calcularMana } from '../../../utils/rpgHelpers';

const atributosPrincipais = [
  { key: 'forca', label: 'Força' },
  { key: 'destreza', label: 'Destreza' },
  { key: 'constituicao', label: 'Constituição' },
  { key: 'inteligencia', label: 'Inteligência' },
  { key: 'agilidade', label: 'Agilidade' },
  { key: 'carisma', label: 'Carisma' }
];

const FichaPersonagemModal = ({
  isOpen,
  onClose,
  personagem,
  loading = false,
  error = null,
  titulo = 'Ficha do Personagem'
}) => {
  if (!isOpen) {
    return null;
  }

  const renderLista = (tituloSecao, itens) => {
    if (!itens || itens.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-2">
          {tituloSecao}
        </h4>
        <div className="flex flex-wrap gap-2">
          {itens.map((item, index) => (
            <span
              key={`${tituloSecao}-${index}`}
              className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/20 text-purple-100 text-xs"
            >
              {item.nome || item.nome_vantagem || item.nome_desvantagem || item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderConteudo = () => {
    if (loading) {
      return (
        <div className="py-16 flex justify-center">
          <LoadingSpinner text="Carregando ficha..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8 text-center text-red-300">
          <p className="font-semibold mb-4">Não foi possível carregar a ficha.</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      );
    }

    if (!personagem) {
      return (
        <div className="py-8 text-center text-purple-200">
          <p>Selecione um personagem para visualizar a ficha.</p>
        </div>
      );
    }

    const vantagens = personagem.vantagens || [];
    const desvantagens = personagem.desvantagens || [];
    const equipamentos = Array.isArray(personagem.equipamentos)
      ? personagem.equipamentos
      : typeof personagem.equipamentos === 'string'
        ? personagem.equipamentos.split(',').map(item => item.trim()).filter(Boolean)
        : [];

    return (
      <div className="space-y-6">
        {/* Cabeçalho com informações básicas */}
        <div className="glass border border-cyan-500/30 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-200/70">Nome</p>
              <h3 className="text-2xl font-fantasy font-bold text-white">
                {personagem.nome || 'Personagem sem nome'}
              </h3>
              <p className="text-cyan-200 text-sm">
                {personagem.classe || 'Classe desconhecida'} • {personagem.raca || 'Raça desconhecida'}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-purple-200/70 uppercase tracking-wide">Nível</p>
                <p className="text-2xl font-bold text-white">{personagem.nivel || 1}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-purple-200/70 uppercase tracking-wide">HP</p>
                <p className="text-2xl font-bold text-red-300">
                  {personagem.hp ?? personagem.hp_atual ?? '???'} / {personagem.hp_max ?? personagem.hp_maximo ?? '?'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-purple-200/70 uppercase tracking-wide">MP</p>
                <p className="text-2xl font-bold text-blue-300">
                  {calcularMana(personagem)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Atributos */}
        <div className="glass border border-purple-500/20 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-4">
            Atributos Principais
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {atributosPrincipais.map(atributo => (
              <div
                key={atributo.key}
                className="p-3 rounded-xl bg-black/20 border border-purple-500/20 text-center"
              >
                <p className="text-xs text-purple-200/70 uppercase tracking-wide">{atributo.label}</p>
                <p className="text-2xl font-bold text-white">
                  {personagem[atributo.key] ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Background */}
        {personagem.background && (
          <div className="glass border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-2">
              História / Background
            </h4>
            <p className="text-sm text-purple-100 leading-relaxed whitespace-pre-line">
              {personagem.background}
            </p>
          </div>
        )}

        {/* Vantagens / Desvantagens / Equipamentos */}
        <div className="glass border border-purple-500/20 rounded-2xl p-4">
          {renderLista('Vantagens', vantagens)}
          {renderLista('Desvantagens', desvantagens)}
          {renderLista('Equipamentos', equipamentos)}

          {!vantagens.length && !desvantagens.length && !equipamentos.length && (
            <p className="text-sm text-purple-200">
              Nenhuma vantagem, desvantagem ou equipamento registrado.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-purple-500/30 bg-gradient-to-b from-gray-900/95 to-black/90 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70">Ficha</p>
            <h2 className="text-2xl font-fantasy text-white">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-white transition-all"
          >
            ✕
          </button>
        </div>

        {renderConteudo()}
      </div>
    </div>
  );
};

export default FichaPersonagemModal;

