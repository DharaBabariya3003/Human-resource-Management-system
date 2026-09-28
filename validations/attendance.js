const Joi = require('joi');
const JoiObjectId = require('../utils/joi-objectid')(Joi);

exports.validateAttendance = {
  body: Joi.object({  
    attendanceDate          : Joi.string().required().label("Attendance date"),
    attendanceUser          : Joi.string().required().messages({
      'string.empty': `Please select employee name from dropdown.`,
    }),
    attendanceInTime        : Joi.string().required().label("In time"),  
    attendanceOutTime       : Joi.string().required().label("Out time"),
    attendanceTotalMinutes  : Joi.string().required().label("Total minutes"),   
    })
} 