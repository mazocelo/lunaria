import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Role Chat Game API',
      version: '1.0.0',
      description: 'API para gerenciamento de histórias e sessões de RPG com IA',
      contact: {
        name: 'Suporte API',
        email: 'suporte@rolechatgame.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      schemas: {
        Historia: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único da história'
            },
            nome: {
              type: 'string',
              description: 'Nome da história'
            },
            tema: {
              type: 'string',
              description: 'Tema da história'
            },
            descricao: {
              type: 'string',
              description: 'Descrição da história'
            },
            genero: {
              type: 'string',
              description: 'Gênero da história (fantasia, sci-fi, etc.)'
            },
            maximo_de_participantes: {
              type: 'integer',
              description: 'Número máximo de participantes'
            },
            status: {
              type: 'string',
              enum: ['ativa', 'inativa', 'finalizada'],
              description: 'Status da história'
            },
            criada_em: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            atualizada_em: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        Sessao: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da sessão'
            },
            historia_id: {
              type: 'integer',
              description: 'ID da história associada'
            },
            status: {
              type: 'string',
              enum: ['ativa', 'finalizada'],
              description: 'Status da sessão'
            },
            criada_em: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação da sessão'
            }
          }
        },
        AcaoRPG: {
          type: 'object',
          properties: {
            mensagem: {
              type: 'string',
              description: 'Mensagem da ação do jogador'
            },
            jogadorId: {
              type: 'integer',
              description: 'ID do jogador'
            },
            salaId: {
              type: 'string',
              description: 'ID da sala'
            }
          },
          required: ['mensagem', 'jogadorId', 'salaId']
        },
        Rolagem: {
          type: 'object',
          properties: {
            resultado: {
              type: 'integer',
              description: 'Resultado da rolagem'
            },
            tipo: {
              type: 'string',
              description: 'Tipo de teste (ex: 1d20, 2d6)'
            },
            descricao: {
              type: 'string',
              description: 'Descrição da rolagem'
            }
          },
          required: ['resultado', 'tipo']
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/**/*.js']
};

export default swaggerJsdoc(options); 