import React from 'react';
import { Skull } from 'lucide-react';
import { CatalogDetailLayout } from '../../../components/shared';

/**
 * View pura: recebe JSX pronto do ViewModel e repassa pro layout.
 * Zero logica, zero montagem, zero transformacao.
 */
const VerMonstroView = ({
  title,
  image,
  rarity,
  accentColor,
  badges,
  sections,
  stats,
  isLight,
  loading,
  error,
  onBack,
  onEdit,
}) => (
  <CatalogDetailLayout
    loading={loading}
    loadingText="Carregando monstro..."
    error={error}
    title={title || ''}
    image={image}
    icon={Skull}
    rarity={rarity}
    accentColor={accentColor}
    badges={badges}
    sections={sections}
    stats={stats}
    sidebarTitle="Ficha de Combate"
    onBack={onBack}
    onEdit={onEdit}
  />
);

export default VerMonstroView;
