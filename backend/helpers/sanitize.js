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
    // Remover padroes de role injection (case-insensitive, com variantes de whitespace)
    .replace(/\b(SYSTEM|IGNORE|INSTRUC[TÇ][ÃAIOE]O?N?S?)\s*:/gi, '')
    .replace(/\b(Human|Assistant|User|AI)\s*:/gi, '')
    // Remover tentativas de override de contexto
    .replace(/\[?(INST|SYS|SYSTEM)\]?\s*:?/gi, '')
    // Remover caracteres de controle unicode (exceto newline e tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalizar whitespace excessivo (mais de 3 newlines consecutivas)
    .replace(/\n{4,}/g, '\n\n\n')
    .substring(0, maxLength)
    .trim();
}
