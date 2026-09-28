const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { getHttpContextValue,storeLog,updateLog } = require("../utils/log");

const InterviewSchema = new Schema({
  name                        : { type: String, max:30,require: true },
  address                     : { type: String, require: true },
  previousCompanyName         : { type: String, default: null },
  qualification               : { type: String, require: true },
  technology                  : { type: String, default: null },
  contactNumber               : { type: String, require: true },
  dateOfBirth                 : { type: Date, default: null },
  email                       : { type: String, default: null },
  interviewMode               : { type: String, require: true },
  yearOfExperience            : { type: String, default: null },
  currentSalary               : { type: String, default: null },
  expectedSalary              : { type: String, default: null },
  interviewTime               : { type: Date, require: true },
  callDate                    : { type: Date, default: null },
  remark                      : { type:String, default: null },
  interviewStatus             : { type: Boolean, default: false }, 
  technicalRoundUser          : { type: ObjectId, ref:"user", default: null },
  hrRoundUser                 : { type: ObjectId, ref:"user", default: null },
  referenceUser               : { type: ObjectId, ref:"user", default: null },
  practicalTestStatus         : { type: Boolean ,default: false },
  communicationSkill          : { type: String ,default: null },
  confidenceOrBodyLang        : { type: String ,default: null },
  logicalSkills               : { type: String ,default: null },
  isDeleted                   : { type: Boolean, default: false },
},
{
  timestamps: true,
});

InterviewSchema.post(/^save$/, async function () {
  // Store Log of create InterviewSchema.
  const sessionId = getHttpContextValue();
  await storeLog(sessionId,null,this,'interview','CREATE');
});

let interviewId;
InterviewSchema.pre(/^findOneAndUpdate$/, true, async function (next, done) {
  const self = this;
  // Store Log of InterviewSchema update Prev.
  const sessionId = getHttpContextValue();
  const oldRecord = await mongoose.model('interview').findOne(self._conditions);
  const prevUpdate = await storeLog(sessionId,oldRecord,null,'interview','UPDATE');
  interviewId = prevUpdate._id;
  done();
  next();
});

InterviewSchema.post(/^findOneAndUpdate$/, async function () {
  // Store Log of interview update post.
  const newRecord = await mongoose.model('interview').findOne(this._conditions);
  await updateLog(interviewId,newRecord);
});

module.exports = mongoose.model('interview', InterviewSchema, 'interviews');