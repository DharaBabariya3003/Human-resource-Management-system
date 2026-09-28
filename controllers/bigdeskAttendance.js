const USER = require("../models/user");
const ATTENDANCELOGS = require("../models/attendanceLogs");
const ATTENDANCE = require("../models/attendance");
const moment = require("moment");
const { setHttpContextValue } = require("../utils/log");

exports.bigdesk = async (req, res, next) => {
  try{
    const action = req.body.action;
    const email = req.user.email;
    

    const formatTime = moment(req.body.time).format('YYYY-MM-DD');
    let today;

    // After 12:pm of India.
    if(moment(req.body.time).isAfter(moment.tz(`${formatTime} ${"23:59:59"}`, true, "Asia/Kolkata").format())){
      let nextDate = moment(new Date(req.body.time)).add(1, 'day').format("YYYY-MM-DD");
      today = new Date(nextDate).toDateString();
    }else{
      today = new Date(req.body.time).toDateString();
    }
    
    
    const sessionDate = moment(new Date(today)).format("YYYY-MM-DD");
    const sessionPrevDate = moment(sessionDate).subtract(1, 'day').format("YYYY-MM-DD");
    const startTimeRange = `${sessionPrevDate}T18:29:59.000Z`;
    const endTimeRange = `${sessionDate}T18:29:59.000Z`;


    const user = await USER.findOne({ email: email, isDeleted: false, isLeft: false });

    if(user){
      setHttpContextValue(user._id);
      if(user.attendanceType == "Tracker"){
        const attendance = await ATTENDANCE.findOne({ user: user._id, date: today, isDeleted:false });
        if(action == "on"){
          if(!attendance){
            const attendanceEntry = new ATTENDANCE({
              startTime: req.body.time,
              date: today,
              user: user._id,
              start: true,    
              totalTime : "00:00",  
              attendanceType: "Tracker",
              totalMinutes: user.totalMinutes,
              createdAt: req.body.time
            });
            attendanceEntry.save(function (err, data) {});
          }

          const lastAttendanceLog = await ATTENDANCELOGS.findOne({ user: user._id ,startTime:{ $gte :startTimeRange ,$lte :endTimeRange},isDeleted: false}).sort({createdAt: -1});
	        if(lastAttendanceLog && !lastAttendanceLog.endTime && lastAttendanceLog.startTime){
            let querys = {
              $set: { 
                startTime: req.body.time,
              },
            };
            
            let updateLastAttendance = await ATTENDANCE.findOneAndUpdate(
                { user: user._id, date: today},
                querys,{ new: true }
            );
            updateLastAttendance.createdAt = req.body.time;
            await updateLastAttendance.save();

            let updateLastAttendanceLog = await ATTENDANCELOGS.findOneAndUpdate(
              {_id: lastAttendanceLog._id, user: user._id, isDeleted: false },
              querys ,{ new: true }
            );
            updateLastAttendanceLog.createdAt = req.body.time;
            await updateLastAttendanceLog.save();

          }else{

          const attendanceLogs = new ATTENDANCELOGS({ 
            attendanceMode : "Tracker",
            startTime: req.body.time,
            user: user._id,
            createdAt: req.body.time
          });
          attendanceLogs.save(function (err, data) {});
         }
          
          
          res.status(200).json({
            message : "Check-in entry done!",
          })
        }else if(action == "off"){
          //get last log.
          let attendanceLogs = await ATTENDANCELOGS.findOne({ user: user._id ,startTime:{ $gte :startTimeRange ,$lte :endTimeRange},isDeleted: false }).sort({createdAt: -1});
          if(attendanceLogs){
            let queryForUpdateLog = { $set: { endTime: req.body.time } };
            await ATTENDANCELOGS.findOneAndUpdate(
              {_id: attendanceLogs._id, user: user._id ,isDeleted: false },
              queryForUpdateLog ,{ new: true }
            );

            const allAttendanceLogs = await ATTENDANCELOGS.find({ user: user._id ,endTime: { $ne: null },startTime:{ $gte :startTimeRange ,$lte :endTimeRange},isDeleted: false });
            let totalMinutesOfAllLogs = 0;
            allAttendanceLogs.forEach(element=>{
              //Get difference between all logs.
              let endTime = moment(element.endTime);
              let startTime = moment(element.startTime);
              let minuteDiffBtnLastLog = endTime.diff(startTime, 'minutes');
              totalMinutesOfAllLogs = totalMinutesOfAllLogs + parseInt(minuteDiffBtnLastLog);
            });
            let workingMinutes = totalMinutesOfAllLogs;
            let overTime = null;

            if(workingMinutes > (parseInt(user.overTimeMinute) + parseInt(user.totalMinutes))){
              overTime = (workingMinutes - (parseInt(user.totalMinutes)));
            }
            const querys = {
              $set: { 
                end: true,
                endTime: req.body.time,
                totalTime: (Math.floor(workingMinutes / 60) + ':' + workingMinutes % 60),
                overTime: overTime,
              },
            };
            
            await ATTENDANCE.findOneAndUpdate(
              { user: user._id, date: today },
              querys, { new: true }
            );
            
            return res.status(200).json({
              message : "Tracker exit is done",
            });
         }else{
            console.log("On entry not exists");
            res.status(200).json({
            message : "On entry not exists",
            });
         }
          
        }
      }else{
        console.log("User attendance type is card");
        return res.status(200).json({
          message : "Tracker entry not allowed",
        })
      }
    }else{
      console.log("User not exists");
      return res.status(200).json({
        message : "User not exists",
      });
    }
    
  }catch(error){
  }
}