import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/StatCard.jsx';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { Sparkles, Eye, Pencil, Trash2, Sun, Moon, Flame } from 'lucide-react';

const escolaConfig = {
  branca: { variant: 'amber', icon: Sun, label: 'Branca' },
  negra: { variant: 'purple', icon: Moon, label: 'Negra' },
  elemental: { variant: 'red', icon: Flame, label: 'Elemental' },
};

const tipoVariant = {
  dano: 'red',
  cura: 'green',
  suporte: 'cyan',
  controle: 'amber',
  utilidade: 'slate',
};

const MagiaTresDetListaView = ({
  magias,
  filteredMagias,
  loading,
  error,
  total,
  stats,
  filtroEscola,
  filtroTipo,
  showDeleteModal,
  magiaToDelete,
  deleteLoading,
  setSearchTerm,
  setFiltroEscola,
  setFiltroTipo,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  clearError,
  onVerMagia,
  onEditarMagia,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const displayData = filteredMagias;

  useEffect(() => { setPage(1); }, [displayData]);

  if (loading && magias.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Magias 3D&T" subtitle="Grimorio de magias do sistema 3D&T Alpha" icon={Sparkles} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const paginatedData = displayData.slice((page - 1) * perPage, page * perPage);

  const selectCls = `px-4 py-2 rounded-lg font-modern text-sm ${
    isLight
      ? 'bg-white border border-slate-300 text-slate-800'
      : 'bg-slate-800 border border-slate-600 text-white'
  }`;

  return (
    <div className="animate-fade-in space-y-6">
      {error && <Notification message={error} type="error" onClose={clearError} />}

      <PageHeader
        title="Magias 3D&T"
        subtitle={`${total} magias no grimorio`}
        icon={Sparkles}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} icon={Sparkles} variant="primary" />
        <StatCard title="Branca" value={stats.escolas?.branca || 0} icon={Sun} variant="secondary" />
        <StatCard title="Negra" value={stats.escolas?.negra || 0} icon={Moon} variant="accent" />
        <StatCard title="Elemental" value={stats.escolas?.elemental || 0} icon={Flame} variant="warning" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Buscar magias por nome ou descricao..."
            onChange={(texto) => setSearchTerm(texto)}
          />
        </div>
        <select
          value={filtroEscola}
          onChange={(e) => setFiltroEscola(e.target.value)}
          className={selectCls}
        >
          <option value="">Todas as escolas</option>
          <option value="branca">Branca</option>
          <option value="negra">Negra</option>
          <option value="elemental">Elemental</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className={selectCls}
        >
          <option value="">Todos os tipos</option>
          <option value="dano">Dano</option>
          <option value="cura">Cura</option>
          <option value="suporte">Suporte</option>
          <option value="controle">Controle</option>
          <option value="utilidade">Utilidade</option>
        </select>
      </div>

      {displayData.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma magia encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedData.map((row, i) => {
            const escola = escolaConfig[row.escola] || { variant: 'slate', label: row.escola };

            return (
              <CatalogCard
                key={row.id}
                icon={Sparkles}
                title={row.nome}
                delay={i}
                onClick={() => onVerMagia(row.id)}
                headerBadge={
                  <Badge variant={escola.variant} className="shadow-sm backdrop-blur-sm">
                    {escola.label}
                  </Badge>
                }
                actions={[
                  { label: 'Ver', icon: Eye, onClick: () => onVerMagia(row.id) },
                  { label: 'Editar', icon: Pencil, onClick: () => onEditarMagia(row.id) },
                  { label: 'Deletar', icon: Trash2, onClick: () => handleDeleteClick(row) },
                ]}
              >
                <div className="flex flex-wrap gap-1 mt-1">
                  {row.tipo && <Badge variant={tipoVariant[row.tipo] || 'slate'}>{row.tipo}</Badge>}
                  {row.custo_pm && (
                    <Badge variant="blue">{row.custo_pm}</Badge>
                  )}
                </div>
                <div className={`flex items-center gap-3 mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="text-cyan-500 font-semibold">Nv {row.nivel_minimo || 1}</span>
                  <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>{row.alcance}</span>
                </div>
              </CatalogCard>
            );
          })}
        </div>
      )}

      <CatalogPagination
        currentPage={page}
        pageSize={perPage}
        totalCount={displayData.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPerPage(size); setPage(1); }}
        pageSizeOptions={[12, 24, 48]}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Magia"
        message={`Tem certeza de que deseja deletar "${magiaToDelete?.nome}"? Esta acao nao pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
};

export default MagiaTresDetListaView;
