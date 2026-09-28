const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { getHttpContextValue,storeLog,updateLog } = require("../utils/log");


const leaveSchema = new Schema({
    leaveReason       : { type: String, require: true },
    multiOrhalfDay    : { type: String, require: true },
    multiFromDate     : { type: Date, default: null },
    multiToDate       : { type: Date, default: null },
    halfDayDate       : { type: Date, default:null },
    halfDayFromTime   : { type:String, default: null },
    halfDayToTime     : { type:String, default: null },
    user              : { type: ObjectId, ref:"user", default: null },
    approve           : { type: Boolean, default: false },
    decline           : { type: Boolean, default: false },
    isDeleted         : { type: Boolean, default: false },
    deletedAt         : { type: Date, default: null },  
  },
  {
    timestamps: true,
  });
  
leaveSchema.post(/^save$/, async function () {
  // Store Log of create leave.
  const sessionId = getHttpContextValue();
  await storeLog(sessionId,null,this,'leave','CREATE');
});

let leaveId;
leaveSchema.pre(/^findOneAndUpdate$/, true, async function (next, done) {
  const self = this;
  // Store Log of leave update Prev.
  const sessionId = getHttpContextValue();
  const oldRecord = await mongoose.model('leave').findOne(self._conditions);
  const prevUpdate = await storeLog(sessionId,oldRecord,null,'leave','UPDATE');
  leaveId = prevUpdate._id;
  done();
  next();
});

leaveSchema.post(/^findOneAndUpdate$/, async function () {
  // Store Log of leave update post.
  const newRecord = await mongoose.model('leave').findOne(this._conditions);
  await updateLog(leaveId,newRecord);
});

module.exports = mongoose.model('leave', leaveSchema, 'leaves');
  