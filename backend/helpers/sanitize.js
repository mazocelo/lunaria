export function sanitizePromptInput(value, maxLength = 500) {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/[{}<>]/g, '')
    .replace(/###/g, '')
    .replace(/SYSTEM:/gi, '')
    .replace(/IGNORE/gi, '')
    .substring(0, maxLength)
    .trim();
}
