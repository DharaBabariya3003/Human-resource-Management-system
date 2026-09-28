const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const AssetNameSchema = new Schema({
  assetType         : { type: ObjectId, ref:"assetType", default: null },
  assetName         : { type: ObjectId, ref:"assetName", default: null },
  user              : { type: ObjectId, ref:"user", default: null },
  givenDate         : { type: Date, default: null },
  remark            : { type: String, default: null },
  isDeleted         : { type: Boolean, default: false },
},
{
  timestamps: true,
});

module.exports = mongoose.model('asset', AssetNameSchema, 'assets');