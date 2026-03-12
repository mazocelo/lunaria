const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
const DEFAULT_MODEL_ID = process.env.LEONARDO_MODEL_ID || 'e71a1c2f-4f80-4800-934f-2c68979d8cc8';
const REALISTIC_MODEL_ID = process.env.LEONARDO_REALISTIC_MODEL_ID || DEFAULT_MODEL_ID;

const POLL_INTERVAL = 2000;
const MAX_POLLS = 30;

async function generateImage(prompt, options = {}) {
  if (!LEONARDO_API_KEY) {
    throw new Error('LEONARDO_API_KEY não configurada');
  }

  const isRealisticPrompt = /photorealistic|real-world|satellite-like|physically plausible/i.test(prompt);
  const defaultNegative = 'blurry, low quality, distorted, deformed, ugly, bad anatomy';
  const realisticNegative = 'cartoon, anime, manga, cel shading, hand-drawn, painterly, illustration style, comic style, stylized outlines, concept art, matte painting, digital painting brushstrokes, logo, watermark, text';

  const requestedStyle = options.estilo_imagem;
  const isRealisticStyle = requestedStyle === 'realistic';
  const modelId = options.modelId || (isRealisticStyle ? REALISTIC_MODEL_ID : DEFAULT_MODEL_ID);

  const body = {
    prompt,
    modelId,
    width: options.width || 512,
    height: options.height || 512,
    num_images: 1,
    guidance_scale: options.guidance_scale || (isRealisticStyle ? 8.5 : 7),
    negative_prompt: options.negative_prompt || (isRealisticPrompt ? `${defaultNegative}, ${realisticNegative}` : defaultNegative),
  };

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
    throw new Error(`Leonardo API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
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

export { generateImage, buildPrompt, IMAGE_STYLES };
