const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId; 

const payslipSchema = new Schema({
  user                            : { type: ObjectId, ref:"user", default: null },
  monthYear                       :{ type: String,default:null},
  specialAllowance                :{ type: String,default:'0'},
  bonus                           :{ type: String,default:'0'},    
  petrolAllowance                 :{ type: String,default:'0'},
  shift                           :{ type: String,default:'0'},
  professionalTax                 :{ type: String,default:'0'},
  esic                            :{ type: String,default:'0'},
  securityDeposit                 :{ type: String,default:'0'},
  tds                             :{ type: String,default:'0'},
  pf                              :{ type: String,default:'0'},
  other                           :{ type: String,default:'0'},
},
{
  timestamps: true,
});



module.exports = mongoose.model('payslip', payslipSchema, 'payslips');

