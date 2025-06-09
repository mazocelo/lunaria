import { DataTypes } from 'sequelize';
import sequelize from './configDB.js'; // ajuste o caminho conforme sua configuração

//nome e id
const Temas = sequelize.define('Temas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'temas',
    timestamps: true,
});

export default Temas;
