const Joi = require('joi');
const APIError = require('../utils/APIError');
const JoiObjectId = require('../utils/joi-objectid')(Joi);
const POST = require('../models/document');

exports.show = {
  params: Joi.object({
    id : JoiObjectId().required(),
  })
};

exports.validateDocument = {
  body: Joi.object({
    name                    :Joi.string().required().trim().replace(/\s\s+/g, ' '),
    offerLetter             :Joi.string().required(),
    appoinmentLetter        :Joi.string().required(),
    documentsTakenDate      :Joi.string().required(),
    marksheet10             :Joi.string().required(),
    marksheet12             :Joi.string().required(),
    bechelorCertificate     :Joi.string().required(),
    masterDegreeCertificate :Joi.string().required(),
    IDproof                 :Joi.string().required(),
    photo                   :Joi.string().required()
  })
}

exports.update = {
  params: Joi.object({
    id : JoiObjectId().required(),
  }),
  body: Joi.object({
    name                    :Joi.string().required().trim().replace(/\s\s+/g, ' '),
    offerLetter             :Joi.string().required(),
    appoinmentLetter        :Joi.string().required(),
    documentsTakenDate      :Joi.string().required(),
    marksheet10             :Joi.string().required(),
    marksheet12             :Joi.string().required(),
    bechelorCertificate     :Joi.string().required(),
    masterDegreeCertificate :Joi.string().required(),
    IDproof                 :Joi.string().required(),
    photo                   :Joi.string().required()
  }).required().not({})
}


exports.destroy = {
  params: Joi.object({
    id : JoiObjectId().required(),
  })
};
