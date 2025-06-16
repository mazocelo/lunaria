import { DataTypes } from 'sequelize';
import sequelize from './configDB.js'; // ajuste o caminho conforme sua configuração

//nome e id
const Temas = sequelize.define('Temas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    tableName: 'temas',
    timestamps: false,
});

export default Temas;
