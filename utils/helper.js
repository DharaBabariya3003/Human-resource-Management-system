const jwt = require('jsonwebtoken')

const { secretKeys } = require('../config');
const { jwtSecret } = require("../config");


/**
 *
 * @param {*} json Convert json object to javascript object
 */
exports.toObject = (json) => JSON.parse(JSON.stringify(json));

/**
 *
 * @param {*} obj Pass object to generate jwt token
 */
exports.generateJwt = (obj) => jwt.sign(obj, secretKeys.jwt);

/**
 *
 * @param {*} string string who's first letter you want to capitalize
 */
exports.capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

/**
 *
 * @param {*} obj Source data object from which data needs to remove
 * @param {*} keys Keys that need to be delete
 * @param {*} defaultFields determine is default keys need to delete or not(Default: true)
 */
exports.removeFields = (obj, keys, defaultFields = true) => {
  var basicFields = ['createdAt', 'updatedAt', 'isDeleted', 'deletedBy', 'deletedAt', '__v'];
  keys = typeof keys == 'string' ? [keys] : keys || [];
  if (defaultFields) keys = keys.concat(basicFields);
  keys.forEach((key) => delete obj[key]);
  return obj;
};  


exports.verifyToken= (req, res, next) => {
    const token = req.header('authorization').split(' ')[1];
    if (!token) {
        return res.status(200);
    }
    try {
        const verified = jwt.verify(token, jwtSecret);
        req.user = verified.data;
        next();
    } catch (error) {
        return res.status(200);
    }
};