import React, { useState } from 'react';
import { ImagePlus, Loader2, X, Link2 } from 'lucide-react';
import { imageGenerationService } from '../../services';
import ImageLightbox from '../ImageLightbox.jsx';

const ImageGenerator = ({ imageUrl, onImageGenerated, entityType, entityData, isLight, label = 'Imagem', imageOptions, imageClassName }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await imageGenerationService.generate({ entityType, entityData, options: imageOptions });
      const url = response.data?.url;
      if (url) {
        onImageGenerated(url);
      } else {
        setError('Nenhuma imagem retornada');
      }
    } catch (err) {
      setError(err.message || 'Erro ao gerar imagem');
    } finally {
      setGenerating(false);
    }
  };

  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (url) {
      onImageGenerated(url);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onImageGenerated('');
  };

  const bg = isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700';
  const textSecondary = isLight ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className="space-y-3">
      {label && (
        <label className={`block text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
          {label}
        </label>
      )}

      {imageUrl && (
        <div className="relative group">
          <img
            src={imageUrl}
            alt="Preview"
            className={`cursor-pointer select-none caret-transparent ${imageClassName || `w-full max-w-xs h-48 object-cover rounded-lg border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}`}
            draggable={false}
            onError={(e) => { e.target.style.display = 'none'; }}
            onClick={() => setLightboxOpen(true)}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity select-none caret-transparent"
            title="Remover imagem"
          >
            <X size={14} />
          </button>
          <ImageLightbox src={imageUrl} alt="Preview" isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${generating
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <ImagePlus size={16} />
              Gerar com IA
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
            ${isLight
              ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
              : 'border-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
        >
          <Link2 size={16} />
          URL manual
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://exemplo.com/imagem.png"
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${bg}`}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Aplicar
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {generating && (
        <p className={`text-sm ${textSecondary}`}>
          Gerando imagem com Leonardo AI... Isso pode levar até 60 segundos.
        </p>
      )}
    </div>
  );
};

export default ImageGenerator;
