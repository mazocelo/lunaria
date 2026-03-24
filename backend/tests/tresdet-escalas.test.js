import { describe, it, expect } from 'vitest';
import { calcularMultiplicadorEscala } from '../game-systems/tresdet/combatEngine.js';

describe('calcularMultiplicadorEscala', () => {
  it('same scale = 1', () => {
    expect(calcularMultiplicadorEscala('ningen', 'ningen')).toBe(1);
    expect(calcularMultiplicadorEscala('sugoi', 'sugoi')).toBe(1);
  });

  it('higher scale attacking = multiply', () => {
    expect(calcularMultiplicadorEscala('sugoi', 'ningen')).toBe(10);
    expect(calcularMultiplicadorEscala('kiodai', 'ningen')).toBe(100);
    expect(calcularMultiplicadorEscala('kami', 'ningen')).toBe(1000);
  });

  it('lower scale attacking = divide', () => {
    expect(calcularMultiplicadorEscala('ningen', 'sugoi')).toBe(0.1);
    expect(calcularMultiplicadorEscala('ningen', 'kiodai')).toBe(0.01);
  });

  it('handles null/undefined as ningen', () => {
    expect(calcularMultiplicadorEscala(null, 'ningen')).toBe(1);
    expect(calcularMultiplicadorEscala('sugoi', null)).toBe(10);
  });
});
