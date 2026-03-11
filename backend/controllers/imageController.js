import { generateImage, buildPrompt } from '../services/imageGenerationService.js';
import usageService from '../services/usageService.js';

const VALID_ENTITY_TYPES = ['personagem', 'monstro', 'equipamento', 'historia', 'historia_mapa', 'mestre'];

async function gerarImagem(req, res) {
  try {
    const { entityType, entityData } = req.body;

    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: `entityType inválido. Use: ${VALID_ENTITY_TYPES.join(', ')}`,
      });
    }

    if (!entityData || typeof entityData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'entityData é obrigatório e deve ser um objeto',
      });
    }

    const prompt = buildPrompt(entityType, entityData);
    const tImg = Date.now();
    const imageUrl = await generateImage(prompt);

    if (req.user?.id) usageService.track({ userId: req.user.id, provider: 'leonardo', tipo: 'image', duracao_ms: Date.now() - tImg, metadata: { entityType } });

    return res.json({ success: true, data: { url: imageUrl, prompt } });
  } catch (error) {
    console.error('[ImageController] Erro ao gerar imagem:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar imagem',
    });
  }
}

export { gerarImagem };
