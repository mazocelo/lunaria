import { DataTypes } from 'sequelize';
import sequelize from './configDB.js';

/**
 * Modelo para Classes
 */
const Classe = sequelize.define('Classe', {
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
    comment: 'Custo em pontos para escolher esta classe'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição da classe'
  },
  bonus: {
    type: DataTypes.TEXT,
    allowNull: true,
          comment: 'Bônus e vantagens especiais em formato JSON'
  }
}, {
  tableName: 'classes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['nome']
    }
  ]
});

export default Classe; 