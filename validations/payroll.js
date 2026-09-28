const Joi = require('joi');
const APIError = require('../utils/APIError');
const JoiObjectId = require('../utils/joi-objectid')(Joi);
const PAYROLL = require('../models/payroll');

exports.show = {
  params: Joi.object({
    id : JoiObjectId().required(),
  })
};

exports.validatePayroll = {
  body: Joi.object({
    user                : Joi.string(),
    stipend             : Joi.string().allow(""),
    salary              : Joi.string().allow(""),
    increment           : Joi.string().allow(""),
    trainingStartDate   : Joi.string().allow(""),
    trainingDuration    : Joi.string().allow(""),
    trainingEndDate     : Joi.string().allow(""),
    joiningDate         : Joi.string().allow(""),
    bond                : Joi.string().allow(""),
    bondDuration        : Joi.string().allow(""),
    bondCompletedDate   : Joi.string().allow(""),
    nda                 : Joi.string().allow(""),
    note                : Joi.string().trim().allow(""), 
   })
}

exports.validateUpdatePayroll = {
    body: Joi.object({
    stipend             : Joi.string().allow(""),
    salary              : Joi.string().allow(""),
    increment           : Joi.string().allow(""),
    trainingStartDate   : Joi.string().allow(""),
    trainingDuration    : Joi.string().allow(""),
    trainingEndDate     : Joi.string().allow(""),
    joiningDate         : Joi.string().allow(""),
    bond                : Joi.string().allow(""),
    bondDuration        : Joi.string().allow(""),
    bondCompletedDate   : Joi.string().allow(""),
    nda                 : Joi.string().allow(""),
    note                : Joi.string().trim().allow(""), 
  })
}

exports.destroy = {
  params: Joi.object({
    id : JoiObjectId().required(),
  })
};

exports.isExists = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const payroll = req.payroll;
    const record = await PAYROLL.findOne({_id, isDeleted: false});
    if(!record) throw new APIError({status: 404, message: `No record were found for given id`});    
    if(JSON.stringify(record.payroll)){
      throw new APIError({status: 403, message: "You don't have sufficient access permission!"});
    }
    next();
  }
  catch(err) {next( err);}
}