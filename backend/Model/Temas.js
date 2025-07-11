import { DataTypes } from 'sequelize';

const Temas = (sequelize, DataTypes) => {
    return sequelize.define('Temas', {
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
};

export default Temas;
