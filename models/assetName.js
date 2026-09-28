const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const AssetNameSchema = new Schema({
  assetType         : { type: ObjectId, ref:"assetType", default: null },
  assetName         : { type: String },  
},
{
  timestamps: true,
});

module.exports = mongoose.model('assetName', AssetNameSchema, 'assetNames');