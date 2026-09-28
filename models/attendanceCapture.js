const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const attendanceCaptureSchema = new Schema({
  attendanceLogId  : { type: ObjectId, ref:"attendanceLog", default: null },
  captureType      : { type: String, default: null},
  key              : { type: String, default: null},
  user             : { type: ObjectId, ref:"user", default: null },
  isS3Removed      : { type: Boolean, default: false },   
  isDeleted        : { type: Boolean, default: false },   
  deletedAt        : { type: Date, default: null },
},
{ 
  timestamps: true,
}); 
  
module.exports = mongoose.model('attendanceCapture', attendanceCaptureSchema, 'attendanceCaptures');
    
