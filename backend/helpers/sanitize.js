/**
 * Sanitiza input do usuario antes de injetar em prompts de IA.
 * Endurecimento de superficie — reduz superficie de prompt injection
 * sem garantir blindagem total.
 */
export function sanitizePromptInput(value, maxLength = 5000) {
  if (!value || typeof value !== 'string') return '';

  return value
    // Remover delimitadores de bloco e markup
    .replace(/[{}<>]/g, '')
    .replace(/###/g, '')
    // Injection headings (antes de remover keywords individuais)
    .replace(/^#{1,6}\s*(SYSTEM|INSTRUCTION|IGNORE|OVERRIDE|NEW RULE|FORGET)/gim, '')
    // LLM token residuals
    .replace(/\|(?:im_start|im_end|endoftext|end_of_text|end|system|user|assistant|pad)\|/gi, '')
    // Long separator lines
    .replace(/[-=_]{10,}/g, '')
    // Remover padroes de role injection (case-insensitive, com variantes de whitespace)
    .replace(/\b(SYSTEM|IGNORE|INSTRUC[TÇ][ÃAIOE]O?N?S?)\s*:/gi, '')
    .replace(/\b(Human|Assistant|User|AI)\s*:/gi, '')
    // Remover tentativas de override de contexto
    .replace(/\[?(INST|SYS|SYSTEM)\]?\s*:?/gi, '')
    // ChatML residual delimiters
    .replace(/\/?SYS\b/gi, '')
    // Remover caracteres de controle unicode (exceto newline e tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalizar whitespace excessivo (mais de 3 newlines consecutivas)
    .replace(/\n{4,}/g, '\n\n\n')
    .substring(0, maxLength)
    .trim();
}

/**
 * Sanitiza nome de personagem — permite apenas caracteres seguros.
 * Preserva letras unicode, numeros, espacos, apostrofos, hifens e pontos.
 * @param {string} value - Nome a sanitizar
 * @param {number} maxLength - Comprimento maximo (default 100)
 * @returns {string} Nome sanitizado
 */
export function sanitizeCharacterName(value, maxLength = 100) {
  if (!value || typeof value !== 'string') return '';

  let name = value
    // Permitir apenas: letras unicode, numeros, espacos, apostrofos (ambos), hifens, pontos
    .replace(/[^\p{L}\p{N}\s'\u2019.\-]/gu, '')
    // Colapsar espacos multiplos em um
    .replace(/\s{2,}/g, ' ')
    // Aplicar mesma remocao de keywords de role injection
    .replace(/\b(SYSTEM|IGNORE|INSTRUC[TÇ][ÃAIOE]O?N?S?)\s*:/gi, '')
    .replace(/\b(Human|Assistant|User|AI)\s*:/gi, '')
    .replace(/\[?(INST|SYS|SYSTEM)\]?\s*:?/gi, '')
    // LLM token residuals
    .replace(/\|(?:im_start|im_end|endoftext|end_of_text|end|system|user|assistant|pad)\|/gi, '')
    // ChatML residual delimiters
    .replace(/\/?SYS\b/gi, '')
    // Colapsar espacos novamente apos remocoes
    .replace(/\s{2,}/g, ' ')
    .substring(0, maxLength)
    .trim();

  return name;
}
