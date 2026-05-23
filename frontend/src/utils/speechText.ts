const MOJIBAKE_MARKERS = /(?:Ã.|Â.|â.|ðŸ|ï¿½)/g;
const DECORATIVE_SYMBOLS = /[•▪▸▶►◆◇◦○●■□]/g;

function countMojibakeArtifacts(value: string = ''): number {
  return (String(value).match(MOJIBAKE_MARKERS) || []).length;
}

function tryDecodeMojibake(value: string = ''): string {
  const text = String(value || '');
  if (!text || typeof TextDecoder === 'undefined' || !/[ÃÂâðï]/.test(text)) {
    return text;
  }

  try {
    const bytes = Uint8Array.from(Array.from(text).map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (!decoded || /\u0000/.test(decoded)) return text;
    if (decoded.includes('\uFFFD')) return text;

    return countMojibakeArtifacts(decoded) < countMojibakeArtifacts(text)
      ? decoded
      : text;
  } catch {
    return text;
  }
}

export function sanitizeTextForSpeech(input: string | null | undefined = ''): string {
  let text = tryDecodeMojibake(String(input || ''));
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

  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

export default sanitizeTextForSpeech;
