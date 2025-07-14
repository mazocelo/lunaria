import { DataTypes } from 'sequelize';

const Personagem = (sequelize, DataTypes) => {
    return sequelize.define('Personagem', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nome: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        nivel: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
        },
        pontos_totais: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        pontos_iniciais: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        background: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        raca_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        classe_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        forca: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 10,
        },
        inteligencia: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 10,
        },
        carisma: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 10,
        },
        destreza: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 10,
        },
        constituicao: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 10,
        },
        agilidade: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 10,
        },
        // historia_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: 'historias',
        //         key: 'id'
        //     }
        // },
        // jogador_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        // },
       
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