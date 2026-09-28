const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceCodeSchema = new Schema({
  index          : { type: Number},
  code           : { type: Number }
},
{
  timestamps: true,
});

module.exports = mongoose.model('AttendanceCode', AttendanceCodeSchema, 'AttendanceCodes');
