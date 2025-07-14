import Sequelize from 'sequelize';
import sequelize from './configDB.js';
import Historia from './Historia.js';
import Temas from './Temas.js';
import Personagem from './Personagem.js';
import Vantagem from './Vantagem.js';
import Desvantagem from './Desvantagem.js';
import Raca from './Raca.js';
import Classe from './Classe.js';

const db = {};

db.Historia = Historia(sequelize, Sequelize.DataTypes);
db.Temas = Temas(sequelize, Sequelize.DataTypes);
db.Personagem = Personagem(sequelize, Sequelize.DataTypes);
  db.Vantagem = Vantagem(sequelize, Sequelize.DataTypes);
  db.Desvantagem = Desvantagem(sequelize, Sequelize.DataTypes);
db.Raca = Raca;
db.Classe = Classe;

// Definir relacionamentos
// Personagem pertence a uma Classe
db.Personagem.belongsTo(db.Classe, {
  foreignKey: 'classe_id',
  as: 'classe'
});

// Personagem pertence a uma Raça
db.Personagem.belongsTo(db.Raca, {
  foreignKey: 'raca_id',
  as: 'raca'
});

// Classe pode ter muitos Personagens
db.Classe.hasMany(db.Personagem, {
  foreignKey: 'classe_id',
  as: 'personagens'
});

// Raça pode ter muitos Personagens
db.Raca.hasMany(db.Personagem, {
  foreignKey: 'raca_id',
  as: 'personagens'
});

// se tiver mais modelos, adicione aqui
// db.OutroModel = require('./OutroModel')(sequelize, Sequelize.DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
