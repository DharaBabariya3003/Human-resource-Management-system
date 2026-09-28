const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssetTypeSchema = new Schema({
  assetType      : { type: String, default: null },  
},
{
  timestamps: true,
});

module.exports = mongoose.model('assetType', AssetTypeSchema, 'assetTypes');
