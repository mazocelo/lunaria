import { body, param, query, validationResult } from 'express-validator';

export const validateRegistro = [
  body('nome').trim().notEmpty().withMessage('Nome e obrigatorio').isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('senha').isStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage('Senha deve ter no minimo 8 caracteres, com maiuscula, numero e caractere especial')
];

export const validateLogin = [
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('senha').notEmpty().withMessage('Senha e obrigatoria')
];

export const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('ID invalido').toInt()
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page deve ser inteiro positivo').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve ser entre 1 e 100').toInt()
];

export const validateMestreCriacao = [
  body('nome').trim().notEmpty().withMessage('Nome e obrigatorio').isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('tags').isArray({ min: 2, max: 6 }).withMessage('Tags devem ter entre 2 e 6 itens'),
  body('tags.*').isString().trim().isLength({ min: 2, max: 30 }).withMessage('Cada tag deve ter entre 2 e 30 caracteres')
];

export const validateMestreAtualizacao = [
  body('nome').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('tags').optional().isArray({ min: 2, max: 6 }).withMessage('Tags devem ter entre 2 e 6 itens'),
  body('tags.*').optional().isString().trim().isLength({ min: 2, max: 30 }).withMessage('Cada tag deve ter entre 2 e 30 caracteres')
];

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Erro de validacao nos dados enviados',
        details: errors.array()
      }
    });
  }
  next();
}
