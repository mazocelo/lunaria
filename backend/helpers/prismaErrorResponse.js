import { Prisma } from '@prisma/client';

/**
 * Traduz erros de escrita do Prisma em respostas 400 amigaveis nos controllers
 * de catalogo. Cobre:
 * - PrismaClientValidationError: payload com campo desconhecido / tipo errado.
 * - P2002 (unique constraint): rede de seguranca para duplicidade que escapou
 *   do pre-check (ex.: race condition).
 *
 * @param {unknown} error - erro capturado no catch
 * @param {import('express').Response} res
 * @returns {boolean} true se tratou (resposta ja enviada); false caso contrario
 */
export function handlePrismaWriteError(error, res) {
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, error: 'Dados invalidos: campo desconhecido ou tipo incorreto' });
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(400).json({ success: false, error: 'Ja existe um registro com este nome neste sistema' });
    return true;
  }
  return false;
}

export default handlePrismaWriteError;
