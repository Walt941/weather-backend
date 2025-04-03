import { Sequelize, Dialect } from 'sequelize'; 
import { DB_USERNAME, DB_PASSWORD, DB_HOST, DB_DATABASE, DB_DIALECT } from '../../configs';

const config = {
  database: DB_DATABASE,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  host: DB_HOST,
  dialect: DB_DIALECT as Dialect, 
  port: 5432,
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: 5432,
});

export { Sequelize, sequelize };