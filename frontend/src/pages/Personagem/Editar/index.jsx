import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Selector from '../../../components/form/Selector';
import InputSimples from '../../../components/form/inputSimples';
import { historyOptions } from '../../Historia/data';
import { PersonagemService } from '../../../services/PersonagemService';
import { apiClient } from '../../../services/ApiClient';
const EditarPersonagem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [nomePersonagem, setNomePersonagem] = useState('');
    const [optionSelected, setOptionSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const personagemService = new PersonagemService(apiClient);

    useEffect(() => {
        const carregarPersonagem = async () => {
            try {
                const personagem = await personagemService.getById(id);
                setNomePersonagem(personagem.nome || '');
                setOptionSelected(personagem.historias || []);
            } catch (error) {
                console.error("Erro ao carregar personagem:", error);
                setError("Erro ao carregar personagem");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            carregarPersonagem();
        }
    }, [id]);

    const handleNomeChange = (event) => {
        setNomePersonagem(event.target.value);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            await personagemService.update(id, {
                nome: nomePersonagem,
                historias: optionSelected
            });
            navigate('/personagens');
        } catch (error) {
            setError(error.message || 'Erro ao atualizar personagem');
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
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

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl">✏️</span>
                </div>
                <h1 className="text-3xl font-fantasy font-bold text-white mb-2">
                    Editar Personagem
                </h1>
                <p className="text-slate-400 font-modern">
                    Atualize os dados do seu herói
                </p>
            </div>

            <div className="card-rpg space-y-6">
                {/* Mensagem de erro */}
                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
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
                    label="Nome do Personagem" 
                    onChange={handleNomeChange} 
                    value={nomePersonagem} 
                />

                <Selector
                    onChange={setOptionSelected}
                    id="history-selector"
                    selected={optionSelected}
                    options={historyOptions}
                    type="multiple"
                    max={3}
                    label="Escolha suas opções"
                />

                {/* Botões de ação */}
                <div className="flex space-x-4 pt-4">
                    <button
                        onClick={() => navigate('/personagens')}
                        className="flex-1 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-white font-modern"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 btn-rpg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Salvando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <span>💾</span>
                                <span>Salvar Alterações</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default EditarPersonagem;
