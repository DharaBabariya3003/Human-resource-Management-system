const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DepartmentSchema = new Schema({
  
    departmentName             : { type: String, default: null },  
   
},
{
  timestamps: true,
});

module.exports = mongoose.model('department', DepartmentSchema, 'departments');
