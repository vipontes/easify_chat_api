const db = require("../../database/conn")();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const timeToExpire = 60 * 60 * 24; // Um dia

module.exports = (app) => {
  const userController = {};

  userController.getUser = (req, res) => {
    const { userId } = req.params;

    let sql = `SELECT 
    userId,
    userName,
    userPhone,
    '' AS userPass,
    userAccessGranted,
    userCreatedAt,
    userToken,
    userRefreshToken
    FROM user
    WHERE userId = ${userId}`;

    let query = db.query(sql, (err, result) => {
      if (err) {
        res.status(400).send({ message: "Unknown error" });
      } else {
        res.status(200).send(result[0]);
      }
    });
  };

  userController.getAllUsersExceptMe = (req, res) => {
    var token = req.headers["authorization"];
    token = token.replace("Bearer ", "");
    let secret = process.env.SECRET;
    jwt.verify(token, secret, function (err, decoded) {
      if (err) {
        return res
          .status(401)
          .send({ auth: false, message: "Token inválido." });
      } else {
        let userId = decoded.id;
        let sql = `SELECT 
          userId,
          userName,
          userPhone,
          '' AS userPass,
          userAccessGranted,
          userCreatedAt,
          '' AS userToken,
          '' AS userRefreshToken
          FROM user
          WHERE userId != ${userId}`;

        db.query(sql, (err, result) => {
          if (err) {
            res.status(400).send({ message: "Unknown error" });
          } else {
            res.status(200).send(result);
          }
        });
      }
    });
  };

  userController.login = (req, res, next) => {
    const phone = req.body.userPhone;
    const password = req.body.userPass;

    const secret = process.env.SECRET;
    const paswordHash = crypto
      .createHmac("sha512", secret)
      .update(password)
      .digest("hex");

    var sql = `SELECT userId, userAccessGranted FROM user WHERE userPhone = '${phone}' AND userPass = '${paswordHash}'`;

    db.query(sql, (err, result) => {
      if (err) {
        res.status(400).send({ message: "Unknown error" });
      } else if (result.length == 0) {
        res.status(401).send({ message: "Invalid credentials" });
      } else {
        var data = result[0];
        if (data.userAccessGranted == 0) {
          res.status(400).send({ message: "Access denied" });
        } else {
          const userId = data.userId;

          const tokenPayload = {
            id: userId * 1,
            expiresAt: Math.floor(Date.now() / 1000) + timeToExpire,
          };
          var token = jwt.sign(tokenPayload, secret);

          const refreshTokenPayload = {
            id: userId * 1,
            random: Math.floor(Math.random() * 100000000) + 1,
          };
          var refreshToken = jwt.sign(refreshTokenPayload, secret);

          sql = `UPDATE user SET userToken = '${token}', userRefreshToken = '${refreshToken}' WHERE userId = ${userId}`;
          query = db.query(sql, (err, result) => {
            if (err) {
              res.status(400).send({ message: "Unknown error" });
            } else {
              sql = `SELECT 
              userId,
              userName,
              userPhone,
              '' AS userPass,
              userAccessGranted,
              userCreatedAt,
              userToken,
              userRefreshToken
              FROM user
              WHERE userId = ${userId}`;

              query = db.query(sql, (err, result) => {
                if (err) {
                  res.status(400).send({ message: "Unknown error" });
                } else {
                  data = result[0];
                  res.status(200).send(data);
                }
              });
            }
          });
        }
      }
    });
  };

  userController.refreshToken = (req, res, next) => {
    const refreshToken = req.body.refreshToken;

    if (refreshToken == undefined) {
      res.status(400).send({ message: "refreshToken inválido." });
      return;
    }

    const secret = process.env.SECRET;

    jwt.verify(refreshToken, secret, function (err, decoded) {
      if (err) {
        return res
          .status(401)
          .send({ auth: false, message: "Token inválido." });
      } else {
        let userId = decoded.id * 1;

        const tokenPayload = {
          id: userId,
          expiresAt: Math.floor(Date.now() / 1000) + timeToExpire,
        };
        var token = jwt.sign(tokenPayload, secret);

        const refreshTokenPayload = {
          id: userId,
          random: Math.floor(Math.random() * 100000000) + 1,
        };
        var refreshToken = jwt.sign(refreshTokenPayload, secret);

        sql = `UPDATE user SET userToken = '${token}', userRefreshToken = '${refreshToken}' WHERE userId = ${userId}`;
        query = db.query(sql, (err, result) => {
          if (err) {
            res.status(400).send({ message: "Unknown error" });
          } else {
            sql = `SELECT 
            userId,
            userName,
            userPhone,
            '' AS userPass,
            userAccessGranted,
            userCreatedAt,
            userToken,
            userRefreshToken
            FROM user
            WHERE userId = ${userId}`;

            db.query(sql, (err, result) => {
              if (err) {
                res.status(400).send({ message: "Unknown error" });
              } else {
                data = result[0];
                res.status(200).send(data);
              }
            });
          }
        });
      }
    });
  };

  userController.postUser = (req, res, next) => {
    const userName = req.body.userName;
    const userPhone = req.body.userPhone;
    const userPass = req.body.userPass;

    if (userName == undefined) {
      res.status(400).send({
        message: "Invalid name.",
      });
      return;
    }

    if (userPhone == undefined) {
      res.status(400).send({
        message: "Invalid phone number.",
      });
      return;
    }

    if (userPass == undefined) {
      res.status(400).send({
        message: "Invalid password.",
      });
      return;
    }

    const secret = process.env.SECRET;
    const hashPass = crypto
      .createHmac("sha512", secret)
      .update(userPass)
      .digest("hex");

    var sql = `INSERT INTO user (
      userName, 
      userPhone, 
      userPass
      ) VALUES ('${userName}', '${userPhone}', '${hashPass}')`;

    db.query(sql, (err, result) => {
      if (err) {
        if (err.errno == 1062) {
          res.status(401).send({ message: "User already registered" });
        } else {
          res.status(401).send({ message: err.sqlMessage });
        }
      } else {
        data = { usuarioId: result.insertId };
        res.status(200).send(data);
      }
    });
  };

  userController.putUser = (req, res, next) => {
    const userName = req.body.userName;
    const userPhone = req.body.userPhone;
    const userPass = req.body.userPass;
    const userAccessGranted = req.body.userAccessGranted;
  };

  userController.deleteUser = (req, res, next) => {
    const { userId } = req.params;

    let sql = `DELETE FROM user WHERE userId = ${userId}`;

    db.query(sql, (err, result) => {
      if (err) {
        res.status(400).send({ message: "Unknown error" });
      } else {
        res.status(200).send(result[0]);
      }
    });
  };

  return userController;
};
