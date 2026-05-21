import logger from '../helpers/logger.js';
import { generateImagePollinations } from './pollinationsService.js';
import { generateImageNanoBanana } from './nanoBananaService.js';

const log = logger.child({ module: 'imageGenerationService' });
const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER || 'nano_banana'; // 'nano_banana' | 'leonardo' | 'pollinations'
const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
const FALLBACK_MODEL_ID = process.env.LEONARDO_MODEL_ID || 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3'; // Phoenix/Lucid Origin family

// Hardcoded strategy por estilo para reduzir viés de "desenho" em estilos realistas.
// Observacao: env vars podem sobrescrever sem alterar codigo.
const STYLE_MODEL_IDS = {
  realistic: process.env.LEONARDO_REALISTIC_MODEL_ID || '05ce0082-2d80-4a2d-8653-4d1c85e2418e', // Lucid Realism
  anime: process.env.LEONARDO_ANIME_MODEL_ID || 'e71a1c2f-4f80-4800-934f-2c68979d8cc8', // Leonardo Anime XL
  fantasy_painting: process.env.LEONARDO_FANTASY_MODEL_ID || 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
  dark_gothic: process.env.LEONARDO_DARK_MODEL_ID || 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
  watercolor: process.env.LEONARDO_WATERCOLOR_MODEL_ID || 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
  pixel_art: process.env.LEONARDO_PIXEL_MODEL_ID || 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
  comic_book: process.env.LEONARDO_COMIC_MODEL_ID || 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
};
const BASE_NEGATIVE_PROMPT = 'blurry, low quality, distorted, deformed, ugly, bad anatomy';
const REALISTIC_NEGATIVE = 'cartoon, anime, manga, cel shading, hand-drawn, painterly, illustration style, comic style, stylized outlines, concept art, matte painting, digital painting brushstrokes, logo, watermark, text';

const STYLE_GENERATION_CONFIG = {
  realistic: {
    width: 1024,
    height: 1024,
    guidance_scale: 9,
    alchemy: true,
    enhancePrompt: true,
    contrast: 3,
    presetStyle: 'STOCK_PHOTO',
    negativeExtra: REALISTIC_NEGATIVE,
  },
  anime: {
    width: 1024,
    height: 1024,
    guidance_scale: 8,
    alchemy: true,
    enhancePrompt: true,
    presetStyle: 'ANIME',
  },
  fantasy_painting: {
    width: 1024,
    height: 1024,
    guidance_scale: 7.5,
    alchemy: true,
    enhancePrompt: true,
    contrast: 3,
    presetStyle: 'CINEMATIC',
  },
  dark_gothic: {
    width: 1024,
    height: 1024,
    guidance_scale: 7.5,
    alchemy: true,
    enhancePrompt: true,
    contrast: 4,
    presetStyle: 'MOODY',
  },
  watercolor: {
    width: 1024,
    height: 1024,
    guidance_scale: 7,
    alchemy: true,
    enhancePrompt: true,
    presetStyle: 'ILLUSTRATION',
  },
  pixel_art: {
    width: 1024,
    height: 1024,
    guidance_scale: 8.5,
    alchemy: false,
    enhancePrompt: false,
    presetStyle: 'DYNAMIC',
    negativeExtra: 'smooth gradients, anti-aliased edges, painterly textures, blurry pixels',
  },
  comic_book: {
    width: 1024,
    height: 1024,
    guidance_scale: 7.5,
    alchemy: true,
    enhancePrompt: true,
    contrast: 4,
    presetStyle: 'DYNAMIC',
  },
};

const POLL_INTERVAL = 2000;
const MAX_POLLS = 30;

async function requestGeneration(body) {
  const response = await fetch(`${LEONARDO_API_URL}/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEONARDO_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      ok: false,
      status: response.status,
      error,
    };
  }

  return {
    ok: true,
    data: await response.json(),
  };
}

async function generateImage(prompt, options = {}) {
  const provider = options.provider || IMAGE_PROVIDER;

  if (provider === 'pollinations') {
    return generateImagePollinations(prompt, {
      width: options.width || 1024,
      height: options.height || 1024,
      entityType: options.entityType,
      entityId: options.entityId,
    });
  }

  if (provider === 'nano_banana') {
    return generateImageNanoBanana(prompt, {
      entityType: options.entityType,
      entityId: options.entityId,
      aspectRatio: options.aspectRatio || '1:1',
      imageSize: options.imageSize || '1K',
    });
  }

  // --- Leonardo path (default) ---
  if (!LEONARDO_API_KEY) {
    throw new Error('LEONARDO_API_KEY não configurada');
  }

  const requestedStyle = options.estilo_imagem;
  const styleConfig = STYLE_GENERATION_CONFIG[requestedStyle] || STYLE_GENERATION_CONFIG.fantasy_painting;
  const styleModelId = STYLE_MODEL_IDS[requestedStyle] || FALLBACK_MODEL_ID;
  const modelId = options.modelId || styleModelId;
  const isRealisticPrompt = /photorealistic|real-world|satellite-like|physically plausible/i.test(prompt);

  const negativeParts = [BASE_NEGATIVE_PROMPT];
  if (styleConfig.negativeExtra) negativeParts.push(styleConfig.negativeExtra);
  if (isRealisticPrompt && !negativeParts.includes(REALISTIC_NEGATIVE)) negativeParts.push(REALISTIC_NEGATIVE);

  const body = {
    prompt,
    modelId,
    width: options.width || styleConfig.width || 1024,
    height: options.height || styleConfig.height || 1024,
    num_images: options.num_images || 1,
    guidance_scale: options.guidance_scale || styleConfig.guidance_scale || 7,
    negative_prompt: options.negative_prompt || negativeParts.join(', '),
    alchemy: options.alchemy ?? styleConfig.alchemy ?? true,
    enhancePrompt: options.enhancePrompt ?? styleConfig.enhancePrompt ?? true,
    contrast: options.contrast ?? styleConfig.contrast,
    presetStyle: options.presetStyle || styleConfig.presetStyle,
  };

  if (body.contrast == null) delete body.contrast;
  if (!body.presetStyle) delete body.presetStyle;

  let generationResponse = await requestGeneration(body);

  // Alguns modelos, como Kino 2.0, rejeitam alchemy mesmo quando o estilo pede.
  // Fazemos um retry automático sem alchemy para evitar erro 500 desnecessário.
  if (!generationResponse.ok) {
    const alchemyUnsupported = body.alchemy
      && generationResponse.status === 400
      && /alchemy is not enabled/i.test(generationResponse.error || '');

    if (alchemyUnsupported) {
      log.warn({ modelId }, 'Modelo rejeitou alchemy, tentando novamente com alchemy=false');
      generationResponse = await requestGeneration({
        ...body,
        alchemy: false,
      });
    }
  }

  if (!generationResponse.ok) {
    throw new Error(`Leonardo API error: ${generationResponse.status} - ${generationResponse.error}`);
  }

  const data = generationResponse.data;
  const generationId = data.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('Falha ao iniciar geração de imagem');
  }

  return pollGeneration(generationId);
}

async function pollGeneration(generationId) {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

    const response = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${LEONARDO_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) continue;

    const data = await response.json();
    const generation = data.generations_by_pk;

    if (generation?.status === 'COMPLETE' && generation.generated_images?.length > 0) {
      return generation.generated_images[0].url;
    }

    if (generation?.status === 'FAILED') {
      throw new Error('Geração de imagem falhou');
    }
  }

  throw new Error('Timeout aguardando geração de imagem');
}

const IMAGE_STYLES = {
  fantasy_painting: 'high fantasy RPG art style, detailed, vibrant colors, digital painting',
  anime: 'anime art style, cel shading, vivid colors, manga illustration, Japanese RPG aesthetic',
  realistic: 'photorealistic RAW photo look, ultra-detailed real-world textures, natural lighting, physically based rendering, high dynamic range',
  dark_gothic: 'dark fantasy art, gothic atmosphere, muted colors, dramatic shadows, grim and moody',
  watercolor: 'watercolor painting style, soft edges, ethereal, pastel tones, storybook illustration',
  pixel_art: 'pixel art style, retro 16-bit RPG aesthetic, detailed sprites, nostalgic',
  comic_book: 'comic book art style, bold ink outlines, dynamic poses, vibrant halftone colors, graphic novel',
};

function normalizeText(value, maxLen = 400) {
  if (value == null) return '';
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.slice(0, maxLen);
}

function toListText(value, maxItems = 8) {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) return '';
        if (typeof item === 'string' || typeof item === 'number') return String(item);
        return item.nome || item.name || item.label || item.id || '';
      })
      .filter(Boolean)
      .slice(0, maxItems)
      .join(', ');
  }
  return normalizeText(value, 400);
}

function addIf(parts, value) {
  const normalized = normalizeText(value, 500);
  if (normalized) parts.push(normalized);
}

function mapStyleDirectives(estiloImagem) {
  switch (estiloImagem) {
    case 'realistic':
      return 'realistic top-down world map, natural terrain textures, physically plausible geography, cinematic satellite-like rendering, no cartoon, no cel shading, no hand-drawn outlines';
    case 'anime':
      return 'anime-inspired top-down world map, cel-shaded stylization, vivid colors, clean stylized terrain';
    case 'dark_gothic':
      return 'dark gothic fantasy map, bleak palette, ominous atmosphere, dramatic shadows';
    case 'watercolor':
      return 'watercolor cartographic map, soft brush textures, painterly transitions';
    case 'pixel_art':
      return 'pixel art top-down world map, retro 16-bit RPG aesthetic';
    case 'comic_book':
      return 'comic-book cartographic map, bold inking, graphic stylization';
    case 'fantasy_painting':
    default:
      return 'high fantasy painted world map, top-down cartographic composition, rich detail';
  }
}

function stylePhrase(estiloImagem, kind = 'scene') {
  const isRealistic = estiloImagem === 'realistic';
  if (kind === 'personagem') {
    return isRealistic
      ? 'photorealistic character portrait, natural skin texture, realistic clothing materials, real-world lighting'
      : 'character portrait illustration';
  }
  if (kind === 'monstro') {
    return isRealistic
      ? 'photorealistic creature concept, realistic textures, plausible anatomy, cinematic lighting'
      : 'creature illustration';
  }
  if (kind === 'equipamento') {
    return isRealistic
      ? 'photorealistic object render, realistic material detail, studio lighting, no characters'
      : 'item illustration, no characters';
  }
  if (kind === 'historia') {
    return isRealistic
      ? 'photorealistic cinematic key art, dramatic framing, realistic materials and lighting'
      : 'epic book cover illustration';
  }
  if (kind === 'mestre') {
    return isRealistic
      ? 'photorealistic game master portrait, wise narrator, realistic lighting'
      : 'game master portrait, wise narrator';
  }
  if (kind === 'npc') {
    return isRealistic
      ? 'photorealistic character portrait, natural skin texture, real-world lighting'
      : 'RPG character portrait illustration';
  }
  if (kind === 'local') {
    return isRealistic
      ? 'photorealistic environment, natural terrain detail, real-world material textures, no illustration style'
      : 'landscape illustration, environment art, no characters';
  }
  if (kind === 'scene') {
    return isRealistic
      ? 'photorealistic cinematic still frame, natural lighting, physically plausible materials'
      : 'scene illustration, dramatic lighting, cinematic composition';
  }
  return isRealistic ? 'photorealistic render' : 'illustration';
}

function realismGuard(estiloImagem) {
  if (estiloImagem !== 'realistic') return '';
  return 'no cartoon, no cel shading, no hand-drawn lines, no painterly style, no comic style';
}

function extractMapaMundiContext(mapaMundi) {
  if (!mapaMundi) return '';
  if (typeof mapaMundi === 'string') return normalizeText(mapaMundi, 450);
  if (typeof mapaMundi !== 'object') return '';

  const descricao = normalizeText(mapaMundi.descricao_geral || mapaMundi.descricao || '', 260);
  const regioes = Array.isArray(mapaMundi.regioes)
    ? mapaMundi.regioes
        .map((r) => `${normalizeText(r.nome || '', 60)} ${normalizeText(r.descricao || '', 80)}`.trim())
        .filter(Boolean)
        .slice(0, 8)
        .join(' | ')
    : '';

  return [descricao, regioes].filter(Boolean).join(' | ');
}

function buildPrompt(entityType, entityData) {
  const style = IMAGE_STYLES[entityData.estilo_imagem] || IMAGE_STYLES.fantasy_painting;
  const temas = toListText(entityData.temas, 10);
  const contextoHistoria = normalizeText(entityData.contexto_historia || entityData.contexto || '', 500);

  switch (entityType) {
    case 'personagem': {
      const parts = [`${style}, ${stylePhrase(entityData.estilo_imagem, 'personagem')}`];
      if (entityData.raca) parts.push(entityData.raca);
      if (entityData.classe) parts.push(entityData.classe);
      if (entityData.nome) parts.push(`named ${entityData.nome}`);
      if (entityData.background) parts.push(entityData.background.slice(0, 200));
      if (temas) parts.push(`themes: ${temas}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'monstro': {
      const parts = [`${style}, ${stylePhrase(entityData.estilo_imagem, 'monstro')}`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 300));
      if (temas) parts.push(`themes: ${temas}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'equipamento': {
      const parts = [`${style}, ${stylePhrase(entityData.estilo_imagem, 'equipamento')}`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 250));
      if (entityData.raridade) parts.push(`${entityData.raridade} rarity`);
      if (temas) parts.push(`themes: ${temas}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'historia': {
      const parts = [
        `${style}, ${stylePhrase(entityData.estilo_imagem, 'historia')}`,
        'strictly follow the provided themes and story mood',
      ];
      if (entityData.nome) parts.push(`title: "${normalizeText(entityData.nome, 120)}"`);
      if (temas) parts.push(`themes: ${temas}`);
      if (entityData.sinopse) parts.push(`synopsis: ${normalizeText(entityData.sinopse, 350)}`);
      else if (entityData.prologo) parts.push(`prologue: ${normalizeText(entityData.prologo, 350)}`);
      else if (entityData.descricao) parts.push(`description: ${normalizeText(entityData.descricao, 350)}`);
      if (entityData.antagonista) parts.push(`main antagonist: ${normalizeText(entityData.antagonista, 120)}`);
      if (entityData.locais) parts.push(`key locations: ${toListText(entityData.locais, 8)}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'historia_mapa': {
      const mapVisualStyle = mapStyleDirectives(entityData.estilo_imagem);
      const parts = [
        `${style}, ${mapVisualStyle}`,
        'strictly follow the provided themes and world context',
        'no text labels, no logo, no watermark, no decorative frame unless explicitly requested',
      ];
      if (entityData.nome) parts.push(`world name: "${normalizeText(entityData.nome, 120)}"`);
      if (temas) parts.push(`themes: ${temas}`);
      if (entityData.locais) parts.push(`locations to include: ${toListText(entityData.locais, 12)}`);
      const mapaContext = extractMapaMundiContext(entityData.mapaMundi);
      if (mapaContext) parts.push(`world context: ${mapaContext}`);
      return parts.join(', ');
    }
    case 'mestre': {
      const parts = [`${style}, ${stylePhrase(entityData.estilo_imagem, 'mestre')}`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tom_narrativo) parts.push(`${entityData.tom_narrativo} atmosphere`);
      if (entityData.personalidade) parts.push(entityData.personalidade.slice(0, 200));
      if (temas) parts.push(`themes: ${temas}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'npc': {
      const parts = [
        `${style}, ${stylePhrase(entityData.estilo_imagem, 'npc')}`,
        'strictly follow the provided appearance/personality description',
      ];
      if (entityData.nome) parts.push(`named ${normalizeText(entityData.nome, 100)}`);
      if (entityData.papel) parts.push(`role: ${normalizeText(entityData.papel, 80)}`);
      if (entityData.local) parts.push(`location: ${normalizeText(entityData.local, 120)}`);
      if (temas) parts.push(`themes: ${temas}`);
      addIf(parts, `description: ${entityData.descricao}`);
      addIf(parts, `motivation: ${entityData.motivacao}`);
      addIf(parts, `secret: ${entityData.segredo}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'local': {
      const parts = [
        `${style}, ${stylePhrase(entityData.estilo_imagem, 'local')}`,
        'strictly follow the provided environment description',
      ];
      if (entityData.nome) parts.push(`location name: ${normalizeText(entityData.nome, 120)}`);
      if (entityData.tipo) parts.push(`location type: ${normalizeText(entityData.tipo, 80)}`);
      if (entityData.perigo) parts.push(`danger level: ${normalizeText(entityData.perigo, 50)}`);
      if (temas) parts.push(`themes: ${temas}`);
      addIf(parts, `description: ${entityData.descricao}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'raca': {
      const parts = [`${style}, fantasy race portrait, full body character showcase, RPG racial archetype`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 300));
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'classe': {
      const parts = [`${style}, RPG class archetype illustration, iconic pose with signature gear`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 300));
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'vantagem': {
      const parts = [`${style}, magical ability icon art, glowing arcane energy, RPG skill illustration`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 300));
      if (entityData.elemento?.length) parts.push(`elements: ${toListText(entityData.elemento, 4)}`);
      if (entityData.dano_base) parts.push(`power: ${entityData.dano_base}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'desvantagem': {
      const parts = [`${style}, dark curse icon art, ominous aura, RPG debuff illustration, foreboding atmosphere`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 300));
      if (entityData.elemento?.length) parts.push(`elements: ${toListText(entityData.elemento, 4)}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'habilidade': {
      const parts = [`${style}, epic spell or ability visualization, dynamic energy effects`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.escola_magia && entityData.escola_magia !== 'nenhuma') parts.push(`${entityData.escola_magia} magic school`);
      if (entityData.categoria) parts.push(`${entityData.categoria} ability`);
      if (entityData.elemento) parts.push(`${entityData.elemento} element`);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 300));
      if (entityData.dano_base) parts.push(`power: ${entityData.dano_base}`);
      if (entityData.alcance) parts.push(`range: ${entityData.alcance}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);
      return parts.join(', ');
    }
    case 'cena': {
      const parts = [
        `${style}, ${stylePhrase(entityData.estilo_imagem, 'scene')}`,
        'strictly follow the narrative and entity descriptions',
      ];
      if (temas) parts.push(`themes: ${temas}`);
      if (contextoHistoria) parts.push(`story context: ${contextoHistoria}`);
      if (entityData.narracao) parts.push(`scene narration: ${normalizeText(entityData.narracao, 700)}`);
      const guard = realismGuard(entityData.estilo_imagem);
      if (guard) parts.push(guard);

      const entidades = Array.isArray(entityData.entidades) ? entityData.entidades : [];
      if (entidades.length > 0) {
        const descricoesEntidades = entidades.slice(0, 8).map((e) => {
          const tipo = normalizeText(e.tipo || e.entityType || 'entidade', 30);
          const nome = normalizeText(e.nome || e.name || '', 80);
          const descricao = normalizeText(e.descricao || e.description || '', 220);
          const detalhes = [nome, descricao].filter(Boolean).join(' - ');
          return `${tipo}: ${detalhes}`.trim();
        }).filter(Boolean);

        if (descricoesEntidades.length > 0) {
          parts.push(`entities in scene: ${descricoesEntidades.join(' | ')}`);
        }
      }
      return parts.join(', ');
    }
    default:
      return `${style}, ${entityData.nome || 'mysterious scene'}`;
  }
}

export { generateImage, buildPrompt, IMAGE_STYLES, IMAGE_PROVIDER };



