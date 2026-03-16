const MOJIBAKE_MARKERS = /(?:Ã.|Â.|â.|ðŸ|ï¿½)/g;
const DECORATIVE_SYMBOLS = /[•▪▸▶►◆◇◦○●■□]/g;

function asText(value = '') {
  if (value === undefined || value === null) return '';
  return String(value);
}

function countMojibakeArtifacts(value = '') {
  return (asText(value).match(MOJIBAKE_MARKERS) || []).length;
}

function tryDecodeMojibake(value = '') {
  const text = asText(value);
  if (!text || !/[ÃÂâðï]/.test(text)) {
    return text;
  }

  try {
    const decoded = Buffer.from(text, 'latin1').toString('utf8');
    if (!decoded || decoded.includes('\u0000') || decoded.includes('\uFFFD')) {
      return text;
    }

    return countMojibakeArtifacts(decoded) < countMojibakeArtifacts(text)
      ? decoded
      : text;
  } catch {
    return text;
  }
}

export function sanitizeTextForSpeech(input = '') {
  let text = tryDecodeMojibake(asText(input));
  if (!text.trim()) return '';

  text = text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]*)\)/g, '$1')
    .replace(/```[\w-]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>+\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*[•▪▸▶►◆◇◦○●■□]+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\|\|([^|]+)\|\|/g, '$1')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(DECORATIVE_SYMBOLS, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, ' - ')
    .replace(/(^|\s)[*_~#>`]+(?=\s|$)/g, '$1');

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default {
  sanitizeTextForSpeech
};
