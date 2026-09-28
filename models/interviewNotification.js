const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;


const InterviewNotificationSchema = new Schema({
  interviewUser     : { type: ObjectId, ref:"interview", default: null },
},
{
  timestamps: true,
});


module.exports = mongoose.model('interviewNotification', InterviewNotificationSchema, 'interviewNotifications');