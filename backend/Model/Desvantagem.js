/**
 * Modelo de Desvantagens para RPG
 */
export default (sequelize, DataTypes) => {
  const Desvantagem = sequelize.define('Desvantagem', {
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
      comment: 'Custo em mana/energia para usar a desvantagem'
    },
    tipo: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['ativa'],
      comment: 'Tipos da desvantagem (ativa, passiva, reacao, ritual)'
    },
    bonus: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Bônus aplicado pela desvantagem em formato JSON'
    },
    restricao: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Restrições para usar a desvantagem em formato JSON'
    },
    dano_base: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Dano base da desvantagem (ex: 1d8, 2d6)'
    },
    efeito: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Efeito especial da desvantagem em formato JSON'
    },
    usar: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Como usar a desvantagem (1=acao, 2=reacao, 3=movimento, etc.)'
    },
    elemento: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Elementos da desvantagem (fogo, gelo, físico, etc.)'
    },
    nivel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 20
      },
      comment: 'Nível mínimo para aprender a desvantagem'
    },
    requisitos: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Requisitos para aprender a desvantagem em formato JSON'
    },
    criada_em: {
      type: DataTypes.DATE,
      allowNull: true
    },
    atualizada_em: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'desvantagens',
    timestamps: true,
    createdAt: 'criada_em',
    updatedAt: 'atualizada_em',
    indexes: [
      {
        name: 'idx_desvantagem_nivel',
        fields: ['nivel']
      },
      {
        name: 'idx_desvantagem_usar',
        fields: ['usar']
      }
    ]
  });

  // Hooks
  Desvantagem.beforeCreate((desvantagem) => {
    if (!desvantagem.requisitos) {
      desvantagem.requisitos = {};
    }
    if (!desvantagem.bonus) {
      desvantagem.bonus = {};
    }
    if (!desvantagem.restricao) {
      desvantagem.restricao = {};
    }
    if (!desvantagem.efeito) {
      desvantagem.efeito = {};
    }
  });

  Desvantagem.beforeUpdate((desvantagem) => {
    desvantagem.atualizada_em = new Date();
  });

  // Métodos de instância
  Desvantagem.prototype.toJSON = function() {
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
  Desvantagem.findByTipo = function(tipo) {
    return this.findAll({
      where: sequelize.literal(`'${tipo}' = ANY(tipo)`),
      order: [['nome', 'ASC']]
    });
  };

  Desvantagem.findByElemento = function(elemento) {
    return this.findAll({
      where: sequelize.literal(`'${elemento}' = ANY(elemento)`),
      order: [['nome', 'ASC']]
    });
  };

  Desvantagem.findByNivel = function(nivel) {
    return this.findAll({
      where: { nivel },
      order: [['nome', 'ASC']]
    });
  };

  Desvantagem.findByUsar = function(usar) {
    return this.findAll({
      where: { usar },
      order: [['nome', 'ASC']]
    });
  };

  Desvantagem.search = function(termo) {
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

  return Desvantagem;
}; 