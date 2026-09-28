const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const { NOTIFICATION_TYPES } = require('../enum');

const NotificationSchema = new Schema({
    notificationType    : { type: String, enum: [...Object.values(NOTIFICATION_TYPES)], default: NOTIFICATION_TYPES.NULL },
    eventTime           : { type: Date, default: null },
    user                : { type: ObjectId, ref:"user", default: null },
    isRead              : { type: Boolean, default: false },
    message             : { type: String, default: null },
  },
  {
    timestamps: true,
  });
  
  module.exports = mongoose.model('notification', NotificationSchema, 'notifications');
  