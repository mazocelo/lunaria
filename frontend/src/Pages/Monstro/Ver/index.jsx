import { useNavigate } from 'react-router-dom';
import { Heart, Swords, Shield, Star, BarChart3, Zap, Tag } from 'lucide-react';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useMonstroVerModel } from './monstro-ver.model';
import VerMonstroView from './monstro-ver.view';

/**
 * ViewModel: orquestracao + decisoes de conteudo.
 * Decide O QUE mostrar (quais badges, sections, stats).
 * Passa dados estruturados — sem JSX, sem CSS, sem tema.
 */
export default function MonstroVerPage() {
  const model = useMonstroVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.MONSTROS);
  const handleEdit = () => { if (model.monstro) navigate(generateRoute.editarMonstro(model.monstro.id)); };

  if (!model.monstro) {
    return (
      <VerMonstroView
        loading={model.loading}
        error={model.error || (!model.loading ? 'Monstro não encontrado' : undefined)}
        onBack={handleBack}
        onEdit={handleEdit}
      />
    );
  }

  const m = model.monstro;

  // Decide QUAIS badges mostrar
  const badges = [
    { key: 'rar', text: m.raridade, variant: 'rarity' },
    m.categoria && { key: 'cat', text: m.categoria, variant: 'info' },
    { key: 'nv', text: `Nv. ${m.nivelMin}-${m.nivelMax}`, variant: 'level' },
  ].filter(Boolean);

  // Decide QUAIS sections mostrar
  const sections = [
    m.descricao && { key: 'descricao', type: 'text', text: m.descricao },
    { key: 'atributos', type: 'atributos' },
    m.habilidades && { key: 'habilidades', type: 'habilidades' },
  ].filter(Boolean);

  // Decide QUAIS stats mostrar
  const stats = [
    { icon: Heart, label: 'HP Base', value: m.combate.hpBase, color: 'danger' },
    { icon: Swords, label: 'Ataque Base', value: m.combate.ataqueBase, color: 'warning' },
    { icon: Shield, label: 'Defesa Base', value: m.combate.defesaBase, color: 'info' },
    m.combate.danoBase && { icon: Swords, label: 'Dano Base', value: m.combate.danoBase, color: 'danger' },
    { icon: Star, label: 'XP Base', value: m.combate.xpBase, color: 'accent' },
    { icon: BarChart3, label: 'Nivel', value: `${m.nivelMin} - ${m.nivelMax}`, color: 'cyan' },
    m.tipos.length > 0 && { icon: Tag, label: 'Tipo', chips: m.tipos, chipColor: 'amber' },
    m.elementos.length > 0 && { icon: Zap, label: 'Elemento', chips: m.elementos, chipColor: 'purple' },
    m.temas.length > 0 && { icon: Tag, label: 'Temas', chips: m.temas, chipColor: 'indigo' },
  ].filter(Boolean);

  return (
    <VerMonstroView
      monstro={m}
      badges={badges}
      sections={sections}
      stats={stats}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
