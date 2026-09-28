const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Any = Schema.Types.Mixed;
const ObjectId = Schema.Types.ObjectId;


const LogSchema = new Schema({
  user                  : { type: ObjectId, ref:"user", default: null },
  oldRecord             : { type: Any, default: null },
  newRecord             : { type: Any, default: null },
  tableName             : { type: String, default: null },
  action                : { type: String, default: null },
  isDeleted             : { type: Boolean, default: false },
},
{ 
  timestamps: true,
});



module.exports = mongoose.model('log', LogSchema, 'logs');
