const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const DesignationSchema = new Schema({
  
  departmentId               : { type: ObjectId, ref:"department", default: null },
  designationName            : { type: String},  
  
},
{
  timestamps: true,
});



module.exports = mongoose.model('designation', DesignationSchema, 'designations');