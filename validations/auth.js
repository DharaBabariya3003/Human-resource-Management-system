const Joi = require('joi');

exports.validateLogin = {
  body: Joi.object({
    email     : Joi.string().email().required().trim().lowercase(),
    password  : Joi.string().required().max(128).trim(),
  })
}

exports.validateForgotPassword = {
  body: Joi.object({
    email     : Joi.string().email().required().trim().lowercase(),
   })
}

exports.validateResetPassword = {
  body: Joi.object({
    password          : Joi.string().required().min(8).max(32).trim(),
    confirmPassword   : Joi.string().required().min(8).max(32).trim(),
  })
}

exports.validateChangePassword = {
  body: Joi.object({
    newPassword          : Joi.string().required().min(8).max(32).trim().label("new password"),
    newConfirmPassword   : Joi.string().required().min(8).max(32).trim().label("new confirm password"),
  })
}
