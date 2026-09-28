const Joi = require('joi');

exports.validateAddLetterHead = {
  body: Joi.object({
    letterHeadNumber          : Joi.string().required().max(40).trim().label("Letterhead Number"),
    issuerName                : Joi.string().required().max(40).trim().label("Issuer Name"),
    issueTo                   : Joi.string().required().max(40).trim().label("Issue To"),
    issueDate                 : Joi.date().iso().required().label("Issue Date"),
    letterheadType            : Joi.string().required().trim().label("Letterhead Type"),
    reason                    : Joi.string().trim().allow(""),
    note                      : Joi.string().trim().allow(""),
  })
}

