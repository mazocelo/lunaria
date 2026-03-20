import { useState, useCallback } from 'react';
import { imageGenerationService } from '../../../../services/index.js';

export const useCharacterImage = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);

  const gerarImagem = useCallback(async ({ nome, racaNome, classeNome, background, vantagensNomes, desvantagensNomes }) => {
    setImageLoading(true);
    setImageError(null);
    try {
      const result = await imageGenerationService.generate({
        entityType: 'personagem',
        entityData: {
          nome,
          raca: racaNome,
          classe: classeNome,
          background,
          vantagens: vantagensNomes?.join(', '),
          desvantagens: desvantagensNomes?.join(', '),
        },
      });
      setImageUrl(result.data?.url || null);
      return result.data?.url;
    } catch (err) {
      setImageError(err.message);
      return null;
    } finally {
      setImageLoading(false);
    }
  }, []);

  const resetImage = useCallback(() => {
    setImageUrl(null);
    setImageError(null);
  }, []);

  return { imageUrl, imageLoading, imageError, gerarImagem, resetImage };
};
