import Sequelize from 'sequelize';
import sequelize from './configDB.js';
import Historia from './Historia.js';
import Temas from './Temas.js';

const db = {};

db.Agent = Historia(sequelize, Sequelize.DataTypes);
db.Temas = Temas(sequelize, Sequelize.DataTypes);

// se tiver mais modelos, adicione aqui
// db.OutroModel = require('./OutroModel')(sequelize, Sequelize.DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
