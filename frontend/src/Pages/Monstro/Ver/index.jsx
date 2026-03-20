import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skull, BookOpen, BarChart3, Zap, Heart, Swords, Shield, Star, Tag } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { getRaridadeConfig, formatJson, ChipGroup, AtributoBar } from '../../../components/shared';
import { useMonstroVerModel } from './monstro-ver.model';
import VerMonstroView from './monstro-ver.view';

/**
 * ViewModel: logica de negocio + transformacao de dados para exibicao.
 * O Model fornece dados crus, o ViewModel processa, a View so renderiza.
 */
export default function MonstroVerPage() {
  const model = useMonstroVerModel();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // --- Handlers ---
  const handleBack = () => navigate(ROUTES.MONSTROS);
  const handleEdit = () => {
    if (model.monstro) navigate(generateRoute.editarMonstro(model.monstro.id));
  };

  // Loading/Error: passar valores prontos
  if (model.loading || model.error || !model.monstro) {
    return (
      <VerMonstroView
        loading={model.loading}
        error={model.error || (!model.loading && !model.monstro ? 'Monstro não encontrado' : undefined)}
        onBack={handleBack}
        onEdit={handleEdit}
      />
    );
  }

  const m = model.monstro;

  // --- Transformacao de dados (logica de negocio) ---

  const raridade = m.raridade_rel?.nome || 'Comum';
  const config = getRaridadeConfig(raridade);
  const tipos = Array.isArray(m.tipo) ? m.tipo : [];
  const elementos = Array.isArray(m.elemento) ? m.elemento : [];
  const temas = Array.isArray(m.temas) ? m.temas : [];
  const habilidades = formatJson(m.habilidades);

  // --- Badges (valores prontos para exibicao) ---
  const badges = [
    {
      key: 'rar',
      text: raridade,
      className: isLight ? config.badgeLight : config.badge,
    },
    m.categoria_rel?.nome && {
      key: 'cat',
      text: m.categoria_rel.nome,
      className: isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400',
    },
    {
      key: 'nv',
      text: `Nv. ${m.nivel_min}-${m.nivel_max}`,
      className: isLight ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/15 text-cyan-400',
    },
  ].filter(Boolean);

  // --- Atributos (normalizados) ---
  const atributos = [
    { label: 'FOR', value: m.forca || 0, color: 'bg-red-500' },
    { label: 'INT', value: m.inteligencia || 0, color: 'bg-blue-500' },
    { label: 'DEX', value: m.destreza || 0, color: 'bg-green-500' },
    { label: 'CON', value: m.constituicao || 0, color: 'bg-amber-500' },
    { label: 'AGI', value: m.agilidade || 0, color: 'bg-cyan-500' },
    { label: 'CAR', value: m.carisma || 0, color: 'bg-pink-500' },
  ];

  // --- Habilidades (normalizadas) ---
  let habilidadesNormalizadas = null;
  if (habilidades) {
    if (Array.isArray(habilidades)) {
      habilidadesNormalizadas = habilidades.map(hab => {
        if (typeof hab === 'object') {
          return { nome: hab.nome || null, descricao: hab.descricao || null, dano: hab.dano || null };
        }
        return { nome: null, descricao: String(hab), dano: null };
      });
    } else if (typeof habilidades === 'object') {
      habilidadesNormalizadas = Object.entries(habilidades).map(([key, val]) => ({
        nome: key,
        descricao: typeof val === 'object' ? JSON.stringify(val) : String(val),
        dano: null,
      }));
    } else {
      habilidadesNormalizadas = [{ nome: null, descricao: String(habilidades), dano: null }];
    }
  }

  // --- Stats sidebar (valores prontos) ---
  const stats = [
    { icon: Heart, label: 'HP Base', value: m.hp_base, colorClass: isLight ? 'text-red-600' : 'text-red-400' },
    { icon: Swords, label: 'Ataque Base', value: m.ataque_base, colorClass: isLight ? 'text-orange-600' : 'text-orange-400' },
    { icon: Shield, label: 'Defesa Base', value: m.defesa_base, colorClass: isLight ? 'text-blue-600' : 'text-blue-400' },
    m.dano_base && { icon: Swords, label: 'Dano Base', value: m.dano_base, colorClass: isLight ? 'text-red-600' : 'text-red-400' },
    { icon: Star, label: 'XP Base', value: m.xp_base, colorClass: isLight ? 'text-amber-600' : 'text-amber-400' },
    { icon: BarChart3, label: 'Nivel', value: `${m.nivel_min} - ${m.nivel_max}`, colorClass: 'text-cyan-400' },
    tipos.length > 0 && { icon: Tag, label: 'Tipo', chips: tipos, chipClass: isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400' },
    elementos.length > 0 && { icon: Zap, label: 'Elemento', chips: elementos, chipClass: isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400' },
    temas.length > 0 && { icon: Tag, label: 'Temas', chips: temas, chipClass: isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/15 text-indigo-400' },
  ].filter(Boolean);

  // --- Passar valores PRONTOS para a View ---
  return (
    <VerMonstroView
      // Hero
      title={m.nome}
      image={m.imagem}
      rarity={raridade}
      accentColor={config.accent}
      badges={badges}
      // Conteudo
      descricao={m.descricao}
      atributos={atributos}
      habilidades={habilidadesNormalizadas}
      // Sidebar
      stats={stats}
      // UI
      isLight={isLight}
      // Handlers
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
