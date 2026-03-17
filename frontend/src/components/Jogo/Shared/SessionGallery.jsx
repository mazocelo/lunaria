import React, { useState } from 'react';
import { Images, X, ChevronRight, Map, User, Landmark, Film } from 'lucide-react';
import ImageLightbox from '../../ImageLightbox.jsx';

const TYPE_ICON = {
  local: Landmark,
  npc: User,
  mapa: Map,
  cena: Film,
};

const TYPE_LABEL = {
  local: 'Local',
  npc: 'NPC',
  mapa: 'Mapa',
  cena: 'Cena',
};

/**
 * SessionGallery — painel lateral com todas as imagens acumuladas na sessão.
 *
 * Props:
 *   images  Array<{ url, nome, tipo }> — imagens da sessão
 */
const SessionGallery = ({ images = [] }) => {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  if (images.length === 0) return null;

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-purple-700/80 hover:bg-purple-600/90 border border-purple-500/40 shadow-lg backdrop-blur-sm text-white text-xs font-modern transition-all"
        title="Galeria da sessão"
      >
        <Images size={14} />
        <span className="font-semibold">{images.length}</span>
      </button>

      {/* Painel lateral */}
      {open && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-72 h-full bg-slate-900/95 border-l border-purple-500/30 flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <Images size={16} className="text-purple-400" />
                <span className="text-white font-fantasy text-sm font-semibold">
                  Galeria da Sessão
                </span>
                <span className="text-xs text-purple-400 font-mono">({images.length})</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Grid de imagens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {images.map((img, i) => {
                const Icon = TYPE_ICON[img.tipo] || Film;
                return (
                  <button
                    key={i}
                    onClick={() => setLightbox(img)}
                    className="w-full text-left group rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-400/50 transition-all bg-slate-800/50"
                  >
                    <div className="relative h-32">
                      <img
                        src={img.url}
                        alt={img.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
                        <span className="p-1 rounded-full bg-black/40">
                          <Icon size={10} className="text-purple-300" />
                        </span>
                        <span className="text-white text-xs font-modern font-semibold truncate">
                          {img.nome}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-black/50 text-purple-300 font-mono">
                        {TYPE_LABEL[img.tipo] || img.tipo}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.url}
          alt={lightbox.nome}
          isOpen={true}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
};

export default SessionGallery;
