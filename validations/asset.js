const Joi = require('joi');
const JoiObjectId = require('../utils/joi-objectid')(Joi);

exports.validateAsset = {
  body: Joi.object({
    assetType     :  JoiObjectId().required().messages({
      'string.empty': `select asset category`,
    }),
    assetName     :  JoiObjectId().required().messages({
      'string.empty': `select brand/model`,
    }),
    user          :  JoiObjectId().required().messages({
      'string.empty': `select user name from dropdown`,
    }),
    givenDate     : Joi.string().required(),
    remark        : Joi.string().allow(""),
  })
}

exports.validateSearchAsset = {
  query: Joi.object({
    assetType     :  JoiObjectId().required().messages({
      'string.empty': `select asset category`,
    }),
    assetName     :  JoiObjectId().allow("")
  })
}

exports.validateUserId = {
  query: Joi.object({
    user          :  JoiObjectId().required().messages({
      'string.empty': `select user name from dropdown`,
    }),    
  })
}

exports.validateUserAssetInfo = {
  params: Joi.object({
    assetType     :  JoiObjectId().required().messages({
      'string.empty': `select asset category`,
    }),    
    user          :  JoiObjectId().required().messages({
      'string.empty': `select user name from dropdown`,
    })    
  })
}