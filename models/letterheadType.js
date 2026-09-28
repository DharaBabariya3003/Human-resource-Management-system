const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LetterheadTypeSchema = new Schema({
  letterheadType  : { type: String, default: null },  
  isDeleted       : { type: Boolean, default: false },
},
{
  timestamps: true,
});

module.exports = mongoose.model('letterheadType', LetterheadTypeSchema, 'letterheadTypes');
