// src/components/shared/foco.ts
/**
 * Anel de foco do app (WCAG 2.2: indicador ≥ 3:1). Usar em todo controle novo.
 * O offset usa --card: --background é um gradiente e não vale como cor de box-shadow.
 */
export const FOCO = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]';
