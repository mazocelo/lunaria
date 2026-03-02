import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  // log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty'
});

// Models que suportam soft delete
const SOFT_DELETE_MODELS = ['personagens', 'historias', 'usuarios', 'mestres'];

// Middleware: auto-filtrar registros soft-deleted em queries de leitura
prisma.$use(async (params, next) => {
  if (!SOFT_DELETE_MODELS.includes(params.model)) {
    return next(params);
  }

  // findMany, findFirst, count: injetar deleted_at = null
  if (['findMany', 'findFirst', 'count'].includes(params.action)) {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};

    if (params.args.where.deleted_at === undefined) {
      params.args.where.deleted_at = null;
    }
  }

  // findUnique: converter para findFirst para suportar filtro deleted_at
  if (params.action === 'findUnique') {
    params.action = 'findFirst';
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};

    if (params.args.where.deleted_at === undefined) {
      params.args.where.deleted_at = null;
    }
  }

  return next(params);
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;


