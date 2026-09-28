const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const leaveCreditSchema = new Schema({
    month            : { type: Number, require: true },
    year             : { type: Number, require: true },
    givenLeave       : { type: Number, default: 1 },
    fullleaveTaken   : { type: Number, default: 0 },
    halfleaveTaken   : { type: Number, default: 0 },
    halfDayAttend    : { type: Number, default: 0 },
    halfDayMinute    : { type: Number, default: 0 },
    dates            : [{ type: String, default: null }],
    user             : { type: ObjectId, ref:"user", default: null },
    isDeleted        : { type: Boolean, default: false },   
    deletedAt        : { type: Date, default: null },
  },
  {       
    timestamps: true,
  });
  
module.exports = mongoose.model('leaveCredit', leaveCreditSchema, 'leaveCredit');
  