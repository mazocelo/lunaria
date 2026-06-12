import { describe, it, expect, vi } from 'vitest';
import Raca from '../Model/Raca.js';
import Classe from '../Model/Classe.js';
import Equipamento from '../Model/Equipamento.js';

/**
 * Regressao do BUG-1: os factories de Model envolviam o delegate do Prisma com
 * `Object.assign(model, Methods)`, MUTANDO o delegate. Como os metodos custom
 * `create/update/delete` chamam de volta `prisma.<entidade>.create` (ou
 * `model.create`), o delegate mutado passava a apontar para o proprio metodo
 * custom -> recursao infinita (RangeError: Maximum call stack size exceeded).
 *
 * O fix usa `Object.assign({ ...model }, Methods)`: um objeto novo que nao
 * mexe no delegate original. Estes testes usam um delegate falso e garantem
 * que (1) create resolve sem estourar a pilha e (2) o delegate nao e mutado.
 */

function fakeDelegate() {
  return {
    create: vi.fn(async ({ data }) => ({ id: 1, ...data })),
    update: vi.fn(async ({ where, data }) => ({ ...where, ...data })),
    delete: vi.fn(async ({ where }) => ({ ...where })),
    findUnique: vi.fn(async () => null),
    findMany: vi.fn(async () => []),
    count: vi.fn(async () => 0),
  };
}

describe('Model wrapper (BUG-1)', () => {
  it('Raca.create delega ao delegate sem recursao e sem mutar o delegate', async () => {
    const racas = fakeDelegate();
    const originalCreate = racas.create;
    const model = Raca({ racas });

    const result = await model.create({ nome: 'Anao', sistema: 'lunaria' });

    expect(result).toEqual({ id: 1, nome: 'Anao', sistema: 'lunaria' });
    expect(racas.create).toHaveBeenCalledTimes(1);
    // delegate intacto: nada de metodo custom escrito por cima
    expect(racas.create).toBe(originalCreate);
    expect(model).not.toBe(racas);
  });

  it('Classe.create/update/delete nao estouram a pilha', async () => {
    const classes = fakeDelegate();
    const model = Classe({ classes });

    await expect(model.create({ nome: 'Mago' })).resolves.toMatchObject({ id: 1 });
    await expect(model.update(1, { custo: 2 })).resolves.toBeTruthy();
    await expect(model.delete(1)).resolves.toBeTruthy();
    expect(classes.create).toBe(classes.create);
  });

  it('Equipamento.create (que usa prisma.equipamentos.create) nao recorre', async () => {
    const equipamentos = fakeDelegate();
    const originalCreate = equipamentos.create;
    const model = Equipamento({ equipamentos });

    await expect(model.create({ nome: 'Espada' })).resolves.toMatchObject({ id: 1 });
    expect(equipamentos.create).toBe(originalCreate);
  });
});
