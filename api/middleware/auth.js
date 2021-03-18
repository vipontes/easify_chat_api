const jwt = require('jsonwebtoken');
const moment = require('moment');
const db = require('../../database/conn')();

module.exports = (app) => {
  const auth = {};

  auth.authorization = (req, res, next) => {
    var token = req.headers['authorization'];
    if (!token) {
      return res
        .status(401)
        .send({ auth: false, message: 'Token não informado.' });
    }

    token = token.replace('Bearer ', '');

    let secret = process.env.SECRET;
    jwt.verify(token, secret, function (err, decoded) {
      if (err) {
        return res
          .status(401)
          .send({ auth: false, message: 'Token inválido.' });
      } else {
        const expiresAt = decoded.expiresAt;
        var currentDateTime = new Date();
        var expireDate = moment(expiresAt * 1000).toDate();
        if (currentDateTime > expireDate) {
          res.status(401).json({ message: 'Token expirado.' });
        } else {
          let usuarioId = decoded.id;
          let condominioId = decoded.condo;
          let sql = `SELECT userId FROM user WHERE userId = ${usuarioId} AND userToken = '${token}'`;
          let query = db.query(sql, (err, result) => {
            if (err) {
              res.status(400).json({ message: 'Unknown error' });
            } else {
              if (result.length > 0) {
                next();
              } else {
                res
                  .status(400)
                  .json({ message: 'Token inválido. Usuário não encontrado.' });
              }
            }
          });
        }
      }
    });
  };

  return auth;
};
