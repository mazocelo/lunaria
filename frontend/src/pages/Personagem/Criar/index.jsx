import React, { useState, useEffect } from "react";

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

    return (
        <form className="max-w-xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded shadow space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Ficha de Personagem</h2>

            {/* Pontos de atributos */}
            <div className="mb-2">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Pontos para distribuir:{" "}
                    <span className={pontosRestantes < 0 ? "text-red-600" : "dark:text-zinc-100"}>
                        {pontosRestantes}
                    </span>{" "}
                    / {pontosTotais}
                </span>
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

            <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
                disabled={pontosRestantes !== 0}
                title={pontosRestantes !== 0 ? "Distribua todos os pontos antes de salvar" : ""}
            >
                Salvar Ficha
            </button>
        </form>
    );
}