const Sequelize = require('sequelize');
const sequelize = require('./configDB'); // caminho para seu sequelize.js
const db = {};

db.Agent = require('./Historia')(sequelize, Sequelize.DataTypes);

// se tiver mais modelos, adicione aqui
// db.OutroModel = require('./OutroModel')(sequelize, Sequelize.DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
