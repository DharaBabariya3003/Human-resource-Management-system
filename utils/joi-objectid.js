const assert = require('assert');
let defaultMessage = 'valid id';

/**
 * 
 * @param {*} Joi 
 * @param {*} message Custome message for invalid ID
 */
module.exports = function joiObjectId(Joi, message) {
  assert(Joi && Joi.object, 'You must pass Joi as an argument');
  if (message === undefined) message = defaultMessage;
  return function objectId() {
    return Joi.string().regex(/^[0-9a-fA-F]{24}$/, message);
  };
};