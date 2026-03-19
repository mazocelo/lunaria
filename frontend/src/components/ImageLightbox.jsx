import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const ImageLightbox = ({ src, alt, isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all cursor-pointer z-10 select-none caret-transparent"
      >
        <X size={24} />
      </button>
      <img
        src={src}
        alt={alt || ''}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl select-none caret-transparent"
        draggable={false}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
};

export default ImageLightbox;
