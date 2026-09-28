const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  name           : { type: String, require: true }
},
{
  timestamps: true,
});

module.exports = mongoose.model('role', RoleSchema, 'roles');
