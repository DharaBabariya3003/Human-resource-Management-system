const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const DocumentSchema = new Schema({
  name                          :{ type: String, default: null },
  documentsTakenDate            :{ type: String, default: null },
  photo                         :{ type: String, default: null },
  offerLetter                   :{ type: String, default: null },
  offerLetterRemark             :{ type: String, default: null },
  offerLetterDocument           :{ type: String, default: null },
  appoinmentLetter              :{ type: String, default: null },
  appoinmentLetterRemark        :{ type: String, default: null },
  appoinmentLetterDocument      :{ type: String, default: null },
  marksheet10                   :{ type: String, default: null },
  marksheet10Remark             :{ type: String, default: null },
  marksheet10Document           :{ type: String, default: null },
  marksheet12                   :{ type: String, default: null },
  marksheet12Remark             :{ type: String, default: null },
  marksheet12Document           :{ type: String, default: null },
  bachelorsCertificate          :{ type: String, default: null },
  bachelorsCertificateRemark    :{ type: String, default: null },
  bachelorsCertificateDocument  :{ type: String, default: null },
  mastersCertificate            :{ type: String, default: null },
  mastersCertificateRemark      :{ type: String, default: null },
  mastersCertificateDocument    :{ type: String, default: null },
  IDproof                       :{ type: String, default: null },
  IDproofRemark                 :{ type: String, default: null },
  IDproofDocument               :{ type: String, default: null },
  other                         :{ type: String, default: null },
  otherDocumentName             :[{ type: String,default: null  }],
  otherRemark                   :[{ type: String, default: null }],
  otherDocument                 :[{ type: String,default: null  }],
  user                          :{ type: ObjectId, ref:"user", default: null },
  isDeleted                     :{ type: Boolean, default: false },
  deletedBy                     :{ type: ObjectId, ref:'user', default: null },
  deletedAt                     :{ type: Date, default: null },
},
{
  timestamps: true,
});

module.exports = mongoose.model('document', DocumentSchema, 'documents');
