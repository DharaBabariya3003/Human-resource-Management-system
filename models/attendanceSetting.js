const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const AttendanceSettingSchema = new Schema({
  officeStartTime           : { type: String },
  officeEndTime             : { type: String },
  totalMinutes              : { type: String },
  monthandYear              : { type: String },
  lateReasonMinute          : { type: String },
  overTimeMinute            : { type: String },
  lastUpdated               : { type: String },
  user                      : { type: ObjectId, ref:"user", default: null },
  isDeleted                 : { type: Boolean, default: false },
},
{
  timestamps: true,
});

module.exports = mongoose.model('AttendanceSetting', AttendanceSettingSchema, 'AttendanceSettings');
