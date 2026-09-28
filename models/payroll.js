const mongoose = require('mongoose');
const { removeFields } = require('../utils/helper');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { getHttpContextValue,storeLog,updateLog } = require("../utils/log");

const PayrollSchema = new Schema({
    stipend                  : { type: Number, default: 0 },
    salary                   : { type: Number, default: 0 },
    increment                : { type: String, default: null },
    trainingStartDate        : { type: String, default: null },
    trainingDuration         : { type: String, default: null },
    trainingEndDate          : { type: String, default: null },
    joiningDate              : { type: Date, default: null },
    bondDuration             : { type: String, default: null },
    bondCompletedDate        : { type: Date, default: null },
    nda                      : { type: String, default: null },
    bond                     : { type: String, default: null },
    note                     : { type: String, default: null },
    user                     : { type: ObjectId, ref:"user", default: null },
    isDeleted                : { type: Boolean, default: false },
},
{
  timestamps: true,
});

PayrollSchema.methods.deleteFields = function (keys, defaultFields = true) {
    return removeFields(this.toObject(), keys, defaultFields);
};

PayrollSchema.post(/^save$/, async function () {
  // Store Log of create payroll.
  const sessionId = getHttpContextValue();
  await storeLog(sessionId,null,this,'payroll','CREATE');
});

let payrollId;
PayrollSchema.pre(/^findOneAndUpdate$/, true, async function (next, done) {
  const self = this;
  // Store Log of payroll update Prev.
  const sessionId = getHttpContextValue();
  const oldRecord = await mongoose.model('payroll').findOne(self._conditions);
  const prevUpdate = await storeLog(sessionId,oldRecord,null,'payroll','UPDATE');
  payrollId = prevUpdate._id;
  done();
  next();
});

PayrollSchema.post(/^findOneAndUpdate$/, async function () {
  // Store Log of payroll update post.
  const newRecord = await mongoose.model('payroll').findOne(this._conditions);
  await updateLog(payrollId,newRecord);
});

module.exports = mongoose.model('payroll', PayrollSchema, 'payrolls');