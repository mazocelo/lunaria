import Sequelize from 'sequelize';
import sequelize from './configDB.js';
import Historia from './Historia.js';
import Temas from './Temas.js';
import Personagem from './Personagem.js';
import Habilidade from './Habilidade.js';

const db = {};

db.Historia = Historia(sequelize, Sequelize.DataTypes);
db.Temas = Temas(sequelize, Sequelize.DataTypes);
db.Personagem = Personagem(sequelize, Sequelize.DataTypes);
db.Habilidade = Habilidade(sequelize, Sequelize.DataTypes);

// se tiver mais modelos, adicione aqui
// db.OutroModel = require('./OutroModel')(sequelize, Sequelize.DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
