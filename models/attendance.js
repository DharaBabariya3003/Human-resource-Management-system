const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { getHttpContextValue,storeLog,updateLog } = require("../utils/log");

const attendanceSchema = new Schema({
  startTime           : { type: Date, default: null},  
  endTime             : { type: Date, default: null},
  date                : { type: String, default:null},
  user                : { type: ObjectId, ref:"user", default: null },
  start               : { type: Boolean, default: false }, 
  end                 : { type: Boolean, default: false },
  overTime            : { type: Number, default: null},
  totalTime           : { type: String, default: null},
  overtimeCheckout    : { type: Boolean, default: false }, 
  attendanceType      : { type: String, default: null},  
  totalMinutes        : { type: Number, default: null },
  extraMinutes        : { type: Number, default: null },
  extraMinutesReason  : { type: String, default: null },
  isDeleted           : { type: Boolean, default: false },   
  deletedAt           : { type: Date, default: null },
},
{ 
  timestamps: true,
});

attendanceSchema.post(/^save$/, async function () {
  // Store Log of create attendanceSchema.
  const sessionId = getHttpContextValue();
  await storeLog(sessionId,null,this,'attendance','CREATE');
});
let attendanceId;
attendanceSchema.pre(/^findOneAndUpdate$/, true, async function (next, done) {
  const self = this;
  // Store Log of attendanceSchema update Prev.
  const sessionId = getHttpContextValue();
  const oldRecord = await mongoose.model('attendance').findOne(self._conditions);
  const prevUpdate = await storeLog(sessionId,oldRecord,null,'attendance','UPDATE');
  attendanceId = prevUpdate._id;
  done();
  next();
});

attendanceSchema.post(/^findOneAndUpdate$/, async function () {
  // Store Log of attendance update post.
  const newRecord = await mongoose.model('attendance').findOne(this._conditions);
  await updateLog(attendanceId,newRecord);
});
  
module.exports = mongoose.model('attendance', attendanceSchema, 'attendances');
    