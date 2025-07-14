import { DataTypes } from 'sequelize';
import sequelize from './configDB.js';

/**
 * Modelo para Raças
 */
const Raca = sequelize.define('Raca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  custo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Custo em pontos para escolher esta raça'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição da raça'
  },
  bonus: {
    type: DataTypes.TEXT,
    allowNull: true,
          comment: 'Bônus e vantagens especiais em formato JSON'
  }
}, {
  tableName: 'racas',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['nome']
    }
  ]
});

export default Raca; 