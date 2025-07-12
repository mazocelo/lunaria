import { DataTypes } from 'sequelize';

const Historia = (sequelize, DataTypes) => {
    return sequelize.define('Historia', {
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
        prologo: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        genero: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'ativa',
        },
        criada_em: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        atualizada_em: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'historias',
        timestamps: false,
    });
};

export default Historia;