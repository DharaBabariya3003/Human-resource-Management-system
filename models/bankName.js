const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BankNameSchema = new Schema({
  bankName      : { type: String, default: null },
  isDeleted     : { type: Boolean, default: false },
},
{
  timestamps: true,
});

module.exports = mongoose.model('bankName', BankNameSchema, 'bankNames');
