const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;


const LetterheadType = new Schema({
  letterHeadNumber            : { type: String, max:40, require: true },
  issuerName                  : { type: String, max:40, require: true },
  issueTo                     : { type: String, max:40, require: true },

  issueDate                   : { type: Date, require: true },
  letterheadType              : { type: ObjectId, ref:"letterheadType", require: true },
  reason                      : { type: String, default: null },

  letterHeadDocument          : { type: String, require: true },
  note                        : { type: String, default: null },

  createdBy                   : { type: ObjectId, ref:"user", default: null },
  isDeleted                   : { type: Boolean, default: false },
},
{ 
  timestamps: true,
});

module.exports = mongoose.model('letterhead', LetterheadType, 'letterheads');
