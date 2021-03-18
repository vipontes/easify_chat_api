module.exports = (app) => {
  const controller = require('../controllers/UserController')(app);
  const middleware = require('../middleware/auth')(app);

  app.route('/login').post(controller.login);
  app.route('/refreshtoken').post(controller.refreshToken);
  app.route('/user').post(controller.postUser);
  app.route('/user/:userId').all(middleware.authorization).get(controller.getUser);
  app.route('/user').all(middleware.authorization).put(controller.putUser);
  app.route('/user').all(middleware.authorization).delete(controller.deleteUser);
};
