const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { getHttpContextValue,storeLog,updateLog } = require("../utils/log");

const attendanceLogsSchema = new Schema({
  attendanceMode   : { type: String, default: null},
  startTime        : { type: Date, default: null},  
  endTime          : { type: Date, default: null},
  user             : { type: ObjectId, ref:"user", default: null },
  lateReason       : { type: String, default: null},
  leaveReason      : { type: String, default: null},
  overtimeReason   : { type: String, default: null},
  updateRecord     : [{ updateReason: String, updatedBy: String }],
  isDeleted        : { type: Boolean, default: false },   
  deletedAt        : { type: Date, default: null },
},
{ 
  timestamps: true,
}); 

attendanceLogsSchema.post(/^save$/, async function () {
  // Store Log of create attendanceLogsSchema.
  const sessionId = getHttpContextValue();
  await storeLog(sessionId,null,this,'attendanceLog','CREATE');
});

let attendanceLogId;
attendanceLogsSchema.pre(/^findOneAndUpdate$/, true, async function (next, done) {
  // Store Log of attendanceLogsSchema update Prev.
  const sessionId = getHttpContextValue();
  const oldRecord = await mongoose.model('attendanceLog').findOne(this._conditions);
  const prevUpdate = await storeLog(sessionId,oldRecord,null,'attendanceLog','UPDATE');
  attendanceLogId = prevUpdate._id;
  done();
  next();
});

attendanceLogsSchema.post(/^findOneAndUpdate$/, async function () {
  // Store Log of attendanceLog update post.
  const newRecord = await mongoose.model('attendanceLog').findOne(this._conditions);
  await updateLog(attendanceLogId,newRecord);
});

module.exports = mongoose.model('attendanceLog', attendanceLogsSchema, 'attendanceLogs');
    
