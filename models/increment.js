const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { getHttpContextValue,storeLog,updateLog } = require("../utils/log");

const IncrementSchema = new Schema({

   previousSalary               : { type: String },
   incrementMethod              : { type: String },  
   salaryInPercentage           : { type: String },
   salaryInRupees               : { type: String },
   totalSalary                  : { type: String },
   lastUpdated                  : { type: String },
   iv                           : { type: String },
   effectiveFrom                : { type: String, default: null },
   user                         : { type: ObjectId, ref:"user", default: null },
   payrollID                    : { type: ObjectId, ref:"payroll", default: null },
   isDeleted                    : { type: Boolean, default: false },
},
{
  timestamps: true,
});

IncrementSchema.post(/^save$/, async function () {
  // Store Log of create IncrementSchema.
  const sessionId = getHttpContextValue();
  await storeLog(sessionId,null,this,'increment','CREATE');
});

let incrementId;
IncrementSchema.pre(/^findOneAndUpdate$/, true, async function (next, done) {
  const self = this;
  // Store Log of IncrementSchema update Prev.
  const sessionId = getHttpContextValue();
  const oldRecord = await mongoose.model('increment').findOne(self._conditions);
  const prevUpdate = await storeLog(sessionId,oldRecord,null,'increment','UPDATE');
  incrementId = prevUpdate._id;
  done();
  next();
});

IncrementSchema.post(/^findOneAndUpdate$/, async function () {
  // Store Log of increment update post.
  const newRecord = await mongoose.model('increment').findOne(this._conditions);
  await updateLog(incrementId,newRecord);
});

module.exports = mongoose.model('increment', IncrementSchema, 'increments');
