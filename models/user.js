const mongoose = require('mongoose');
const bcryptJs = require('bcryptjs');
const { bcrypt } = require('../config');
const { removeFields } = require('../utils/helper');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { getHttpContextValue,storeLog,updateLog } = require("../utils/log");
const { ORGANIZATION_TYPES } = require('../enum');


const UserSchema = new Schema({
  firstName                   : { type: String, max:40, require: true },
  middleName                  : { type: String, max:40 },
  lastName                    : { type: String, max:40, require: true },
  email                       : { type: String, required: true },
  birthDate                   : { type: Date },
  gender                      : { type: String, require: true },
  contactNumber               : { type: String },
  emergencyContactNumber      : { type: String, default: null },
  position                    : { type:String },
  correspondenceAddress       : { type:String },
  permanentAddress            : { type:String },
  department                  : { type: ObjectId, ref:"department", default: null },
  designation                 : { type: ObjectId, ref:"designation", default: null },
  vehicalNumber               : { type:String, default: null },
  status                      : { type:String },
  marriageDate                : { type:String, default: null },
  degree                      : { type:String, default: null },
  collegeName                 : { type:String, default: null },
  YearOfPassing               : { type:String, default: null },
  ifscCode                    : { type:String, default: null },
  accountHolderName           : { type:String, default: null },
  bankId                      : { type: ObjectId, ref:"bankName", default: null },
  accountNumber               : { type:String, default: null },
  resignationDate             : { type:String, default: null },
  noticePeriod                : { type:String, default: null },
  lastDate                    : { type:Date, default: null },
  attendanceCode              : { type:String },
  photo                       : { type: String, default: null },
  password                    : { type:String, default: null, require: true },
  officeStartTime             : { type: Date },
  officeEndTime               : { type: Date },
  totalMinutes                : { type: String },
  lateReasonMinute            : { type: Date },
  attendanceType              : { type: String },
  overtime                    : { type: Boolean },
  overTimeMinute              : { type: String },
  leaveCreditType             : { type: String },
  leaveTotalMinutes           : { type: String },
  backupLeaveTotalMinutes     : { type: String, default: null },
  resetPassword               :
  {
    resetPasswordToken        : { type:String, default: null },
    resetPasswordExpires      : { type:Date, default: null },
  },
  payrollID                   : { type:String, default: null },
  documentID                  : { type:String, default: null },
  role                        : { type: ObjectId, ref:"role", default: null },
  organizationType            : { type: String, enum: [...Object.values(ORGANIZATION_TYPES)], default: ORGANIZATION_TYPES.NULL },
  leftReason                  : { type: String, default: null },
  leftLetter                  : { type: String, default: null },
  resignDate                  : { type:Date, default: null },
  leftDate                    : { type:Date, default: null },
  isDeleted                   : { type: Boolean, default: false },
  isLeft                      : { type: Boolean, default: false },
},
{ 
  timestamps: true,
});

/**
*  Check email is unique or not
*/
UserSchema.pre(/^save$/, async function (next) {
  if (!this.isModified('password')) return next();
    const hash = await bcryptJs.hash(this.password, parseInt(bcrypt.salt));
    this.password = hash;
    next();
});

UserSchema.post(/^save$/, async function () {
  // Store Log of user registration.
  const sessionId = getHttpContextValue();
  await storeLog(sessionId,null,this,'user','CREATE');
});

let userId;
UserSchema.pre(/^findOneAndUpdate$/, true, async function (next, done) {
  const self = this;
  // Store Log of user update prev.
  const sessionId = getHttpContextValue();
  const oldRecord = await mongoose.model('user').findOne(self._conditions);
  const prevUpdate = await storeLog(sessionId,oldRecord,null,'user','UPDATE');
  userId = prevUpdate._id;

  if(self.op && self.op === 'findOneAndUpdate') {
    if(!self._update.$set.password){ done(); next(); }
    const hash = await bcryptJs.hash(self._update.$set.password, parseInt(bcrypt.salt));
    self._update.$set.password = hash;
    console.log(hash);
  }
  done();
  next();
});

UserSchema.post(/^findOneAndUpdate$/, async function () {
  // Store Log of user update post.
  const newRecord = await mongoose.model('user').findOne(this._conditions);
  await updateLog(userId,newRecord);
});

/**
*  Delete not required fields
*/
UserSchema.methods.deleteFields = function (keys, defaultFields = true) {
  return removeFields(this.toObject(), keys, defaultFields);
};

UserSchema.methods.isValidPassword = async function(password){
  return await bcryptJs.compare(password, this.password);
}

module.exports = mongoose.model('user', UserSchema, 'users');
