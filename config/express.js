const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const config = require('config');
const consign = require('consign');
const cors = require('cors');

require('dotenv-safe').config({ allowEmptyValues: true });

module.exports = () => {
  const app = express();
  app.use(cors());
  app.set('port', process.env.PORT || config.get('server.port'));

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
      parameterLimit: 50000,
    })
  );

  app.use(compression());

  consign({ cwd: './api' }).then('routes').into(app);

  return app;
};
