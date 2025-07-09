import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { PersonagemService } from '../../../services/PersonagemService';
import { apiClient } from '../../../services/ApiClient';

const atributosIniciais = {
    forca: "",
    inteligencia: "",
    carisma: "",
    destreza: "",
    constituicao: "",
    sabedoria: "",
};

const backgroundsGuiados = [
    "Aventureiro",
    "Nobre",
    "Mercador",
    "Artesão",
    "Mago Aprendiz",
    "Outro",
];

function getRandomPontos() {
    return Math.floor(Math.random() * 11) + 20; // 20 a 30
}

function somaAtributos(atributos) {
    return Object.values(atributos)
        .map((v) => Number(v) || 0)
        .reduce((a, b) => a + b, 0);
}

export default function Personagem() {
    const [pontosTotais, setPontosTotais] = useState(getRandomPontos());
    const [form, setForm] = useState({
        nome: "",
        raca: "",
        classe: "",
        profissao: "",
        backgroundTipo: "guiado",
        background: "",
        atributos: { ...atributosIniciais },
        habilidades: "",
        equipamentos: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const personagemService = new PersonagemService(apiClient);
    const navigate = useNavigate();

    // Reset pontos totais e atributos ao montar
    useEffect(() => {
        setPontosTotais(getRandomPontos());
        setForm((f) => ({
            ...f,
            atributos: { ...atributosIniciais },
        }));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name in atributosIniciais) {
            // Não permitir que a soma ultrapasse pontosTotais
            const novoValor = Number(value) || 0;
            const outrosAtributos = { ...form.atributos, [name]: 0 };
            const somaSemAtual = somaAtributos(outrosAtributos);
            if (somaSemAtual + novoValor > pontosTotais) return;
            setForm((f) => ({
                ...f,
                atributos: { ...f.atributos, [name]: value },
            }));
        } else {
            setForm((f) => ({ ...f, [name]: value }));
        }
    };

    const pontosDistribuidos = somaAtributos(form.atributos);
    const pontosRestantes = pontosTotais - pontosDistribuidos;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (pontosRestantes !== 0) {
            setError('Distribua todos os pontos antes de salvar');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await personagemService.create({
                ...form,
                hp: 100,
                nivel: 1
            });
            navigate('/personagens');
        } catch (error) {
            setError(error.message || 'Erro ao criar personagem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl">⚔️</span>
                </div>
                <h1 className="text-3xl font-fantasy font-bold text-white mb-2">
                    Criar Novo Personagem
                </h1>
                <p className="text-slate-400 font-modern">
                    Dê vida a um novo herói épico
                </p>
            </div>

            <form onSubmit={handleSubmit} className="card-rpg space-y-6">
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

                {/* Pontos de atributos */}
                <div className="mb-4 p-4 glass rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-white font-modern">
                            Pontos para distribuir:
                        </span>
                        <span className={`font-bold text-lg ${pontosRestantes < 0 ? "text-red-400" : "text-cyan-400"}`}>
                            {pontosRestantes} / {pontosTotais}
                        </span>
                    </div>
                </div>

            {/* Nome */}
            <div>
                <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Nome do personagem</label>
                <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                    placeholder="Digite o nome"
                />
            </div>

            {/* Raça / Classe / Profissão */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Raça</label>
                    <input
                        type="text"
                        name="raca"
                        value={form.raca}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                        placeholder="Raça"
                    />
                </div>
                <div>
                    <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Classe</label>
                    <input
                        type="text"
                        name="classe"
                        value={form.classe}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                        placeholder="Classe"
                    />
                </div>
                <div>
                    <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Profissão</label>
                    <input
                        type="text"
                        name="profissao"
                        value={form.profissao}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                        placeholder="Profissão"
                    />
                </div>
            </div>

            {/* Background */}
            <div>
                <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Background</label>
                <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200">
                        <input
                            type="radio"
                            name="backgroundTipo"
                            value="guiado"
                            checked={form.backgroundTipo === "guiado"}
                            onChange={handleChange}
                        />
                        Guiado
                    </label>
                    <label className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200">
                        <input
                            type="radio"
                            name="backgroundTipo"
                            value="livre"
                            checked={form.backgroundTipo === "livre"}
                            onChange={handleChange}
                        />
                        Livre
                    </label>
                </div>
                {form.backgroundTipo === "guiado" ? (
                    <select
                        name="background"
                        value={form.background}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                    >
                        <option value="">Selecione um background</option>
                        {backgroundsGuiados.map((bg) => (
                            <option key={bg} value={bg}>
                                {bg}
                            </option>
                        ))}
                    </select>
                ) : (
                    <textarea
                        name="background"
                        value={form.background}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                        placeholder="Descreva o background livremente"
                        rows={3}
                    />
                )}
            </div>

            {/* Atributos */}
            <div>
                <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Atributos</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.keys(atributosIniciais).map((attr) => (
                        <div key={attr}>
                            <label className="block text-sm capitalize text-zinc-800 dark:text-zinc-200">{attr}</label>
                            <input
                                type="number"
                                name={attr}
                                value={form.atributos[attr]}
                                onChange={handleChange}
                                className="w-full border rounded px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                                min={0}
                                max={20}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Habilidades especiais */}
            <div>
                <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Habilidades especiais</label>
                <textarea
                    name="habilidades"
                    value={form.habilidades}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                    placeholder="Liste ou descreva as habilidades especiais"
                    rows={2}
                />
            </div>

            {/* Equipamentos iniciais */}
            <div>
                <label className="block font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Equipamentos iniciais</label>
                <textarea
                    name="equipamentos"
                    value={form.equipamentos}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                    placeholder="Liste os equipamentos iniciais"
                    rows={2}
                />
            </div>

                {/* Botões de ação */}
                <div className="flex space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/personagens')}
                        className="flex-1 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-white font-modern"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={pontosRestantes !== 0 || loading}
                        className="flex-1 btn-rpg disabled:opacity-50 disabled:cursor-not-allowed"
                        title={pontosRestantes !== 0 ? "Distribua todos os pontos antes de salvar" : ""}
                    >
                        {loading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Criando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <span>⚔️</span>
                                <span>Criar Personagem</span>
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}