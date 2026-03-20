import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightbox = ({ src, alt, title, isOpen, onClose, onPrev, onNext }) => {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && onPrev) onPrev();
    if (e.key === 'ArrowRight' && onNext) onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all cursor-pointer z-10 select-none"
      >
        <X size={24} />
      </button>

      {/* Title bar */}
      {title && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-5 py-2 rounded-full bg-black/50 backdrop-blur-sm select-none" onClick={(e) => e.stopPropagation()}>
          <span className="text-white font-fantasy text-sm font-semibold">{title}</span>
        </div>
      )}

      {/* Prev button */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next button */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Image */}
      <img
        src={src}
        alt={alt || ''}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none caret-transparent"
        draggable={false}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Keyboard hint */}
      {(onPrev || onNext) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 text-white/30 text-xs font-modern select-none" onClick={(e) => e.stopPropagation()}>
          <span>← →</span>
          <span>navegar</span>
          <span>ESC</span>
          <span>fechar</span>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;
