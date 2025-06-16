import { DataTypes } from 'sequelize';
import sequelize from './configDB.js'; // ajuste o caminho conforme sua configuração


const Historia = sequelize.define('Historia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    temas: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    maximo_de_participantes: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    participantes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
}, {
    tableName: 'historias',
    timestamps: false,
});

export default Historia;