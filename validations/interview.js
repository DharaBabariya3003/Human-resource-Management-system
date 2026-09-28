const Joi = require('joi');

exports.validateInterview = {
  body: Joi.object({
    name                      : Joi.string().required().max(70).trim().label("Full name"),
    address                   : Joi.string().required().trim(),
    previousCompanyName       : Joi.string().trim().allow(""),
    qualification             : Joi.string().required().trim(),
    technology                : Joi.string().trim().allow(""),
    contactNumber             : Joi.string().length(10).required().pattern(/^[0-9]+$/).label("Contact number"),
    dateOfBirth               : Joi.string().allow(""),
    email                     : Joi.string().email().trim().lowercase().allow(""),
    interviewMode             : Joi.string().required().label("Interview mode"),
    yearOfExperience          : Joi.string().allow(""),
    currentSalary             : Joi.string().pattern(/^[0-9]+$/).allow(""),
    expectedSalary            : Joi.string().pattern(/^[0-9]+$/).allow(""),
    interviewTime             : Joi.string().required().label("Interview date"),
    callDate                  : Joi.string().allow(""),
    technicalRoundUser        : Joi.string().required().trim().messages({
      'string.empty': `Please select technical round user name from dropdown.`,
    }),
    hrRoundUser               : Joi.string().required().trim().messages({
      'string.empty': `Please select HR round user name from dropdown.`,
    }),
    referenceUser             : Joi.string().trim().allow(""),
    remark                    : Joi.string().trim().allow(""),
})
}

exports.validateInterviewUpdate = {
  body: Joi.object({
    name                      : Joi.string().required().max(70).trim().label("Full name"),
    address                   : Joi.string().required().trim(),
    previousCompanyName       : Joi.string().trim().allow(""),
    qualification             : Joi.string().required().trim(),
    technology                : Joi.string().trim().allow(""),
    contactNumber             : Joi.string().length(10).required().pattern(/^[0-9]+$/).label("Contact number"),
    dateOfBirth               : Joi.string().allow(""),
    email                     : Joi.string().email().trim().lowercase().allow(""),
    interviewMode             : Joi.string().required().label("Interview mode"),
    yearOfExperience          : Joi.string().allow(""),
    currentSalary             : Joi.string().pattern(/^[0-9]+$/).allow(""),
    expectedSalary            : Joi.string().pattern(/^[0-9]+$/).allow(""),
    interviewTime             : Joi.string().required().label("Interview date"),
    callDate                  : Joi.string().allow(""),
    technicalRoundUser        : Joi.string().required().trim().messages({
      'string.empty': `Please select technical round user name from dropdown.`,
    }),
    hrRoundUser               : Joi.string().required().trim().messages({
      'string.empty': `Please select HR round user name from dropdown.`,
    }),
    referenceUser             : Joi.string().trim().allow(""),
    interviewStatus           : Joi.string().allow(""),
    practicalTestStatus       : Joi.string().allow(""),
    communicationSkill        : Joi.string().allow(""),
    confidenceOrBodyLang      : Joi.string().allow(""),
    logicalSkills             : Joi.string().allow(""),
    remark                    : Joi.string().trim().allow(""),
})
}







