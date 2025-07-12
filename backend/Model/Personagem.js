import { DataTypes } from 'sequelize';

const Personagem = (sequelize, DataTypes) => {
    return sequelize.define('Personagem', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        classe: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        nivel: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
        },
        historia_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'historias',
                key: 'id'
            }
        },
        jogador_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'ativo',
        },
        criado_em: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        atualizado_em: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'personagens',
        timestamps: false,
    });
};

export default Personagem; 