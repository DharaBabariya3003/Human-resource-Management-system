const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const xlsSheetSchema = new Schema({
  sNo                      :{ type: String,default:'00000'},
  bankAccountNo            :{ type: String,default:'00000'},
  ifscCode                 :{ type: String,default:'00000'},     
  employeeName             :{ type: String,default:'00000'}, 
  basicSalary              :{ type: String,default:'00000'},
  petrolAllowance          :{ type: String,default:'00000'}, 
  shiftAllowance           :{ type: String,default:'00000'},
  bonus                    :{ type: String,default:'00000'},
  tds                      :{ type: String,default:'00000'},
  leaveEncashment          :{ type: String,default:'00000'},
  leaveEncashmentAmount    :{ type: String,default:'00000'},
  overTime                 :{ type: String,default:'00000'},
  overTimeAmount           :{ type: String,default:'00000'},
  leaveMinutes             :{ type: String,default:'00000'},
  leaveAMTDeduct           :{ type: String,default:'00000'},
  net                      :{ type: String,default:'00000'},
  pay                      :{ type: String,default:'00000'},
  remark                   :{ type: String,default:'00000'},
  modeOfPayment            :{ type: String,default:'00000'},
  securityDeposit          :{ type: String,default:'00000'},
  professionalTax          :{ type: String,default:'00000'},
  totalEarnings            :{ type: String,default:'00000'},
  specialAllowane          :{ type: String,default:'00000'},
  payDate                  :{ type: Date, default:null},
  isMailSend               :{ type: Boolean, default:false},
  iv                       : { type: String },
  pf                       :{ type: String,default:'00000'},
  esic                     :{ type: String,default:'00000'},
},
{
  timestamps: true,
});



module.exports = mongoose.model('xlsSheet', xlsSheetSchema, 'xlsSheets');

