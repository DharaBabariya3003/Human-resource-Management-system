const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const HolidaySchema = new Schema({

    holidayDate                : { type: String, default: null },  
    holidayReason              : { type: String, default: null },
    status                     : { type: Number ,default:1 }
},
{
  timestamps: true,
});

module.exports = mongoose.model('holiday', HolidaySchema, 'holidays');
