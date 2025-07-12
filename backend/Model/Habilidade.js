/**
 * Modelo de Habilidades para RPG
 */
export default (sequelize, DataTypes) => {
  const Habilidade = sequelize.define('Habilidade', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    custo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Custo em mana/energia para usar a habilidade'
    },
    tipo: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['ativa'],
      comment: 'Tipos da habilidade (ativa, passiva, reacao, ritual)'
    },
    bonus: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Bônus aplicado pela habilidade em formato JSON'
    },
    restricao: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Restrições para usar a habilidade em formato JSON'
    },
    dano_base: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Dano base da habilidade (ex: 1d8, 2d6)'
    },
    efeito: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Efeito especial da habilidade em formato JSON'
    },
    usar: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Como usar a habilidade (1=acao, 2=reacao, 3=movimento, etc.)'
    },
    elemento: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Elementos da habilidade (fogo, gelo, físico, etc.)'
    },
    nivel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 20
      },
      comment: 'Nível mínimo para aprender a habilidade'
    },
    requisitos: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Requisitos para aprender a habilidade em formato JSON'
    },
    criada_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    atualizada_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'habilidades',
    timestamps: true,
    createdAt: 'criada_em',
    updatedAt: 'atualizada_em',
    indexes: [
      {
        name: 'idx_habilidade_nivel',
        fields: ['nivel']
      },
      {
        name: 'idx_habilidade_usar',
        fields: ['usar']
      }
    ]
  });

  // Hooks
  Habilidade.beforeCreate((habilidade) => {
    if (!habilidade.requisitos) {
      habilidade.requisitos = {};
    }
    if (!habilidade.bonus) {
      habilidade.bonus = {};
    }
    if (!habilidade.restricao) {
      habilidade.restricao = {};
    }
    if (!habilidade.efeito) {
      habilidade.efeito = {};
    }
  });

  Habilidade.beforeUpdate((habilidade) => {
    habilidade.atualizada_em = new Date();
  });

  // Métodos de instância
  Habilidade.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Converter JSON strings de volta para objetos se necessário
    if (typeof values.requisitos === 'string') {
      try {
        values.requisitos = JSON.parse(values.requisitos);
      } catch (e) {
        values.requisitos = {};
      }
    }
    
    if (typeof values.bonus === 'string') {
      try {
        values.bonus = JSON.parse(values.bonus);
      } catch (e) {
        values.bonus = {};
      }
    }
    
    if (typeof values.restricao === 'string') {
      try {
        values.restricao = JSON.parse(values.restricao);
      } catch (e) {
        values.restricao = {};
      }
    }
    
    if (typeof values.efeito === 'string') {
      try {
        values.efeito = JSON.parse(values.efeito);
      } catch (e) {
        values.efeito = {};
      }
    }
    
    return values;
  };

  // Métodos de classe
  Habilidade.findByTipo = function(tipo) {
    return this.findAll({
      where: sequelize.literal(`'${tipo}' = ANY(tipo)`),
      order: [['nome', 'ASC']]
    });
  };

  Habilidade.findByElemento = function(elemento) {
    return this.findAll({
      where: sequelize.literal(`'${elemento}' = ANY(elemento)`),
      order: [['nome', 'ASC']]
    });
  };

  Habilidade.findByNivel = function(nivel) {
    return this.findAll({
      where: { nivel },
      order: [['nome', 'ASC']]
    });
  };

  Habilidade.findByUsar = function(usar) {
    return this.findAll({
      where: { usar },
      order: [['nome', 'ASC']]
    });
  };

  Habilidade.search = function(termo) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { nome: { [sequelize.Op.iLike]: `%${termo}%` } },
          { descricao: { [sequelize.Op.iLike]: `%${termo}%` } },
          sequelize.literal(`efeito::text ILIKE '%${termo}%'`)
        ]
      },
      order: [['nome', 'ASC']]
    });
  };

  return Habilidade;
}; 